import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useMallow } from "../store";
import { LAYER_BY_ID, layerProgress } from "../data";

function baseMaterials(group) {
  const materials = new Map();
  group.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.forEach((material) => {
      if (!material || materials.has(material)) return;
      if (material.userData.baseOpacity == null) {
        material.userData.baseOpacity = material.opacity ?? 1;
      }
      if (material.userData.baseTransparent == null) {
        material.userData.baseTransparent = material.transparent;
      }
      if (material.userData.baseDepthWrite == null) {
        material.userData.baseDepthWrite = material.depthWrite ?? true;
      }
      materials.set(material, {
        baseOpacity: material.userData.baseOpacity,
        baseTransparent: material.userData.baseTransparent,
        baseDepthWrite: material.userData.baseDepthWrite,
      });
    });
  });
  return materials;
}

/**
 * A spring-driven, clickable, fadeable keyboard layer.
 */
export function Layer({ id, children }) {
  const groupRef = useRef(null);
  const velocity = useRef(0);
  const current = useRef(0);
  const leaveTimer = useRef(null);
  const selectedLayer = useMallow((state) => state.selectedLayer);
  const setLayer = useMallow((state) => state.setLayer);
  const setHoveredLayer = useMallow((state) => state.setHoveredLayer);
  const meta = LAYER_BY_ID[id];

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const explode = useMallow.getState().explode;
    const target = layerProgress(meta, explode);
    const dt = Math.min(delta, 1 / 30);
    const steps = 2;
    const h = dt / steps;
    const stiffness = 168;
    const damping = 18;
    for (let i = 0; i < steps; i += 1) {
      const force = (target - current.current) * stiffness - velocity.current * damping;
      velocity.current += force * h;
      current.current += velocity.current * h;
    }
    if (Math.abs(target - current.current) < 0.0002 && Math.abs(velocity.current) < 0.0002) {
      current.current = target;
      velocity.current = 0;
    }
    const float =
      id === "keycaps" || id === "switches"
        ? Math.sin(state.clock.elapsedTime * 1.25 + (id === "keycaps" ? 1.4 : 0.2)) *
          0.012 *
          target
        : 0;
    group.position.y = current.current * meta.lift + float;
    group.position.x = current.current * (meta.drift || 0);
    group.position.z = current.current * (meta.slide || 0);
  });

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return undefined;
    const materials = baseMaterials(group);
    const isDimmed = Boolean(selectedLayer) && selectedLayer !== id;
    const fade = isDimmed ? 0.15 : 1;
    const tweens = [];

    materials.forEach(({ baseOpacity, baseTransparent, baseDepthWrite }, material) => {
      const wasDimmed = Boolean(material.userData.mallowDimmed);
      material.userData.mallowDimmed = isDimmed;

      // When the stack is at rest, leave materials exactly as the renderer
      // intended. This is important: opaque layers must keep writing depth.
      if (!isDimmed && !wasDimmed) {
        material.opacity = baseOpacity;
        material.transparent = baseTransparent;
        material.depthWrite = baseDepthWrite;
        material.needsUpdate = true;
        return;
      }

      if (material.userData.mallowDimmed) {
        material.transparent = true;
        material.depthWrite = false;
        material.needsUpdate = true;
      }

      const tween = gsap.to(material, {
        opacity: baseOpacity * fade,
        duration: isDimmed ? 0.36 : 0.52,
        ease: isDimmed ? "power2.out" : "back.out(1.7)",
        overwrite: true,
        onComplete: () => {
          if (!isDimmed) {
            material.transparent = baseTransparent;
            material.depthWrite = baseDepthWrite;
            material.needsUpdate = true;
          }
        },
      });
      tweens.push(tween);
    });

    group.traverse((object) => {
      if (object.isMesh) {
        if (object.userData.baseCastShadow == null) {
          object.userData.baseCastShadow = object.castShadow;
        }
        object.castShadow = isDimmed ? false : object.userData.baseCastShadow;
      }
    });

    return () => {
      tweens.forEach((tween) => tween.kill());
    };
  }, [selectedLayer, id]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, []);

  const handleEnter = (event) => {
    event.stopPropagation();
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    document.body.style.cursor = "pointer";
    setHoveredLayer(id);
  };

  const handleLeave = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      if (useMallow.getState().hoveredLayer === id) {
        document.body.style.cursor = "auto";
        setHoveredLayer(null);
      }
    }, 70);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    setLayer(id);
  };

  return (
    <group
      ref={groupRef}
      name={`layer-${id}`}
      onClick={handleClick}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onPointerOver={handleEnter}
      onPointerOut={handleLeave}
    >
      {children}
    </group>
  );
}
