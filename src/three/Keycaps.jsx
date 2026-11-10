import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEYS, KEY_BY_CODE, KEY_GAP, BOARD_Y, THEME_BY_ID, keyColor } from "../data";
import { useMallow } from "../store";
import { playKey, unlockAudio } from "../audio";
import { createKeycapGeometry } from "./geometry";
import { getKeyLabelAtlas, makeLabelPlaneGeometry } from "./textures";

const tempColor = new THREE.Color();

function emitKey(key) {
  document.dispatchEvent(
    new CustomEvent("mallow:key", {
      detail: { id: key.id, label: key.label },
    })
  );
}

export function Keycaps() {
  const capsRef = useRef(null);
  const labelRefs = useRef([]);
  const capMaterialRef = useRef(null);
  const themeId = useMallow((state) => state.themeId);
  const theme = THEME_BY_ID[themeId] || THEME_BY_ID.strawberry;
  const targetPress = useRef(new Uint8Array(KEYS.length));
  const press = useRef(new Float32Array(KEYS.length));
  const velocity = useRef(new Float32Array(KEYS.length));
  const hoverLift = useRef(new Float32Array(KEYS.length));
  const hoverVelocity = useRef(new Float32Array(KEYS.length));
  const clickTimers = useRef(new Map());
  const initialized = useRef(false);

  const keycapGeometry = useMemo(() => createKeycapGeometry(), []);
  const labelAtlas = useMemo(() => getKeyLabelAtlas(KEYS.map((key) => key.label)), []);
  const labelGeometries = useMemo(
    () => KEYS.map((_, index) => makeLabelPlaneGeometry(labelAtlas.uvAt(index))),
    [labelAtlas]
  );
  const labelMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: labelAtlas.texture,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.02,
        toneMapped: false,
      }),
    [labelAtlas]
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentColors = useMemo(() => new Float32Array(KEYS.length * 3), []);
  const targetColors = useMemo(() => new Float32Array(KEYS.length * 3), []);

  useLayoutEffect(() => {
    const caps = capsRef.current;
    if (!caps) return;
    caps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    caps.frustumCulled = false;

    const writeColors = (updateCurrent) => {
      KEYS.forEach((key, index) => {
        tempColor.set(keyColor(key, theme));
        targetColors[index * 3] = tempColor.r;
        targetColors[index * 3 + 1] = tempColor.g;
        targetColors[index * 3 + 2] = tempColor.b;
        if (updateCurrent) {
          currentColors[index * 3] = tempColor.r;
          currentColors[index * 3 + 1] = tempColor.g;
          currentColors[index * 3 + 2] = tempColor.b;
          caps.setColorAt(index, tempColor);
        }
      });
      if (updateCurrent) {
        caps.instanceColor.needsUpdate = true;
        initialized.current = true;
      }
    };
    writeColors(!initialized.current);
    labelMaterial.color.set(theme.legend);
    labelMaterial.needsUpdate = true;
  }, [theme, targetColors, currentColors, labelMaterial]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === "TEXTAREA" || tag === "SELECT" || active?.isContentEditable) return;
      if (tag === "INPUT" && active.type !== "range") return;
      if (
        tag === "INPUT" &&
        active.type === "range" &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(
          event.code
        )
      ) {
        return;
      }
      if (tag === "BUTTON" && (event.code === "Space" || event.code === "Enter")) return;
      const key = KEY_BY_CODE[event.code];
      if (!key) return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
      const index = KEYS.indexOf(key);
      if (index < 0) return;
      targetPress.current[index] = 1;
      const state = useMallow.getState();
      state.markInteracted();
      unlockAudio();
      if (state.soundEnabled) playKey(state.soundMode);
      emitKey(key);
    };

    const onKeyUp = (event) => {
      const key = KEY_BY_CODE[event.code];
      if (!key) return;
      const index = KEYS.indexOf(key);
      if (index >= 0) targetPress.current[index] = 0;
    };

    const clearAll = () => {
      targetPress.current.fill(0);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearAll);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearAll);
    };
  }, []);

  useEffect(() => {
    const timers = clickTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const handleKeyClick = (event) => {
    event.stopPropagation();
    if (event.delta > 5) return;
    const index = event.instanceId;
    if (index == null) return;
    const key = KEYS[index];
    if (!key) return;
    targetPress.current[index] = 1;
    const existing = clickTimers.current.get(index);
    if (existing) window.clearTimeout(existing);
    clickTimers.current.set(
      index,
      window.setTimeout(() => {
        targetPress.current[index] = 0;
      }, 120)
    );
    const state = useMallow.getState();
    state.setLayer("keycaps");
    state.markInteracted();
    unlockAudio();
    if (state.soundEnabled) playKey(state.soundMode, 0.95);
    emitKey(key);
  };

  useFrame((state, delta) => {
    const caps = capsRef.current;
    if (!caps) return;
    const dt = Math.min(delta, 1 / 30);
    const explode = useMallow.getState().explode;
    const selectedLayer = useMallow.getState().selectedLayer;
    const hoveredSwitch = useMallow.getState().hoveredSwitch;
    const labels = labelRefs.current;

    for (let i = 0; i < KEYS.length; i += 1) {
      const key = KEYS[i];
      const target = targetPress.current[i] ? -0.074 : 0;
      for (let step = 0; step < 2; step += 1) {
        const h = dt / 2;
        const force = (target - press.current[i]) * 620 - velocity.current[i] * 30;
        velocity.current[i] += force * h;
        press.current[i] += velocity.current[i] * h;
      }
      if (Math.abs(target - press.current[i]) < 0.00015 && Math.abs(velocity.current[i]) < 0.001) {
        press.current[i] = target;
        velocity.current[i] = 0;
      }

      // When a switch is being peeked inside, its keycap politely floats away.
      const hoverLiftTarget =
        hoveredSwitch === i ? (selectedLayer === "switches" ? 0.85 : 1.2) : 0;
      for (let step = 0; step < 2; step += 1) {
        const h = dt / 2;
        const force =
          (hoverLiftTarget - hoverLift.current[i]) * 150 - hoverVelocity.current[i] * 17;
        hoverVelocity.current[i] += force * h;
        hoverLift.current[i] += hoverVelocity.current[i] * h;
      }
      if (
        Math.abs(hoverLiftTarget - hoverLift.current[i]) < 0.0002 &&
        Math.abs(hoverVelocity.current[i]) < 0.002
      ) {
        hoverLift.current[i] = hoverLiftTarget;
        hoverVelocity.current[i] = 0;
      }
      const lift = hoverLift.current[i];
      const float =
        Math.sin(state.clock.elapsedTime * 1.4 + i * 0.37) * 0.011 * Math.max(0, explode - 0.12);
      const y = BOARD_Y.keycap + press.current[i] + lift + float;
      dummy.position.set(
        key.x + lift * 1.55,
        y,
        key.z + lift * 0.38
      );
      dummy.rotation.set(lift * 0.16, lift * 0.1, press.current[i] * 0.35 + lift * 0.2);
      dummy.scale.set((key.w - KEY_GAP) * (1 - lift * 0.06), 1, (1 - KEY_GAP) * (1 - lift * 0.06));
      dummy.updateMatrix();
      caps.setMatrixAt(i, dummy.matrix);
      const label = labels[i];
      if (label) {
        label.position.set(key.x + lift * 1.55, y + 0.153, key.z + lift * 0.38);
      }
    }
    caps.instanceMatrix.needsUpdate = true;

    // Live, spring-free but soft color chase for theme changes.
    const colorAttr = caps.instanceColor;
    if (colorAttr) {
      const amount = 1 - Math.exp(-delta * 9);
      let changed = false;
      for (let i = 0; i < currentColors.length; i += 1) {
        const diff = targetColors[i] - currentColors[i];
        if (Math.abs(diff) > 0.0005) {
          currentColors[i] += diff * amount;
          changed = true;
        } else {
          currentColors[i] = targetColors[i];
        }
        colorAttr.array[i] = currentColors[i];
      }
      if (changed) colorAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={capsRef}
        args={[keycapGeometry, undefined, KEYS.length]}
        castShadow
        receiveShadow
        onClick={handleKeyClick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          ref={capMaterialRef}
          color="#ffffff"
          roughness={0.42}
          metalness={0.015}
          envMapIntensity={0.28}
        />
      </instancedMesh>

      {KEYS.map((key, index) => (
        <mesh
          key={key.id}
          ref={(node) => {
            labelRefs.current[index] = node;
          }}
          geometry={labelGeometries[index]}
          material={labelMaterial}
          position={[key.x, BOARD_Y.keycap + 0.153, key.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[Math.min(0.8, 0.56 + key.w * 0.045), 0.68, 1]}
          raycast={() => null}
          renderOrder={2}
        />
      ))}
    </group>
  );
}
