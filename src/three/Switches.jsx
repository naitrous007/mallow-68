import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEYS, BOARD_Y, THEME_BY_ID, shade } from "../data";
import { useMallow } from "../store";
import {
  createCrossGeometry,
  createHelixGeometry,
  createRoundedBox,
  createSwitchTopGeometry,
} from "./geometry";

export function Switches() {
  const housingRef = useRef(null);
  const topRef = useRef(null);
  const stemRef = useRef(null);
  const detailRef = useRef(null);
  const displayIndexRef = useRef(null);
  const [, setDisplayIndex] = useState(null);
  const progress = useRef(0);
  const progressVelocity = useRef(0);
  const clearTimer = useRef(null);
  const themeId = useMallow((state) => state.themeId);
  const theme = THEME_BY_ID[themeId] || THEME_BY_ID.strawberry;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const housingGeometry = useMemo(() => createRoundedBox(0.78, 0.27, 0.78, 0.09, 3), []);
  const topGeometry = useMemo(() => createRoundedBox(0.7, 0.045, 0.7, 0.07, 2), []);
  const stemGeometry = useMemo(() => createCrossGeometry(0.55, 0.17, 0.05), []);
  const springGeometry = useMemo(() => createHelixGeometry(0.095, 0.22, 6, 0.0115), []);
  const detailTopGeometry = useMemo(() => createSwitchTopGeometry(), []);
  const stemBlockGeometry = useMemo(() => createRoundedBox(0.24, 0.14, 0.24, 0.045, 2), []);
  const pinGeometry = useMemo(() => new THREE.CylinderGeometry(0.018, 0.018, 0.09, 8), []);
  const poleGeometry = useMemo(() => new THREE.CylinderGeometry(0.07, 0.1, 0.12, 12), []);

  useEffect(() => {
    const unsubscribe = useMallow.subscribe((state, previous) => {
      if (state.hoveredSwitch !== previous.hoveredSwitch) {
        if (state.hoveredSwitch != null) {
          displayIndexRef.current = state.hoveredSwitch;
          setDisplayIndex(state.hoveredSwitch);
        }
      }
      if (state.selectedLayer !== previous.selectedLayer) {
        if (state.selectedLayer && state.selectedLayer !== "switches") {
          useMallow.getState().setHoveredSwitch(null);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    [housingRef.current, topRef.current, stemRef.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
    });
  }, []);

  const scheduleClear = (event) => {
    if (event?.nativeEvent?.pointerType === "touch") return;
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => {
      useMallow.getState().setHoveredSwitch(null);
    }, 55);
  };

  const handleMove = (event) => {
    event.stopPropagation();
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    if (event.instanceId == null) return;
    const state = useMallow.getState();
    if (state.selectedLayer && state.selectedLayer !== "switches") return;
    state.setHoveredLayer("switches");
    state.setHoveredSwitch(event.instanceId);
    document.body.style.cursor = "pointer";
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (event.delta > 5) return;
    if (event.instanceId == null) return;
    const state = useMallow.getState();
    state.setLayer("switches");
    state.setHoveredSwitch(event.instanceId);
    state.markInteracted();
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const hovered = useMallow.getState().hoveredSwitch;
    const target = hovered != null ? 1 : 0;
    for (let step = 0; step < 2; step += 1) {
      const h = dt / 2;
      const force = (target - progress.current) * 190 - progressVelocity.current * 19;
      progressVelocity.current += force * h;
      progress.current += progressVelocity.current * h;
    }
    if (Math.abs(target - progress.current) < 0.0003 && Math.abs(progressVelocity.current) < 0.002) {
      progress.current = target;
      progressVelocity.current = 0;
    }

    // Assembled switch bodies stay put. Only the single hovered stem disappears.
    if (housingRef.current && topRef.current && stemRef.current) {
      for (let i = 0; i < KEYS.length; i += 1) {
        const key = KEYS[i];
        dummy.position.set(key.x, BOARD_Y.switchBase, key.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        housingRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(key.x, BOARD_Y.switchBase + 0.12, key.z);
        dummy.updateMatrix();
        topRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(key.x, BOARD_Y.stem + 0.018, key.z);
        dummy.rotation.set(0, i % 2 === 0 ? 0 : Math.PI / 2, 0);
        dummy.scale.setScalar(hovered === i ? 0.0001 : 1);
        dummy.updateMatrix();
        stemRef.current.setMatrixAt(i, dummy.matrix);
      }
      housingRef.current.instanceMatrix.needsUpdate = true;
      topRef.current.instanceMatrix.needsUpdate = true;
      stemRef.current.instanceMatrix.needsUpdate = true;
    }

    const detail = detailRef.current;
    if (!detail) return;
    const index = displayIndexRef.current;
    if (index == null) {
      detail.visible = false;
      return;
    }
    const key = KEYS[index];
    if (!key) return;
    if (progress.current < 0.003 && target === 0) {
      detail.visible = false;
      return;
    }
    const p = Math.min(1.08, Math.max(0, progress.current));
    detail.visible = true;
    detail.position.set(key.x, 0, key.z);
    detail.scale.setScalar(1 + p * 0.3);
    const ring = detail.children[0];
    const spring = detail.children[1];
    const stem = detail.children[2];
    const top = detail.children[3];
    const pole = detail.children[4];
    const pinA = detail.children[5];
    const pinB = detail.children[6];

    ring.position.y = 0.135 + p * 0.015;
    ring.scale.setScalar(0.65 + p * 0.55);
    spring.position.y = 0.41 + p * 0.26;
    spring.position.x = -p * 0.02;
    spring.rotation.y = p * 2.4;
    stem.position.y = 0.43 + p * 0.43;
    stem.position.x = -p * 0.09;
    stem.rotation.y = p * 0.45;
    stem.rotation.z = p * 0.16;
    top.position.y = 0.41 + p * 0.68;
    top.position.x = -p * 0.22;
    top.rotation.x = p * 0.2;
    top.rotation.z = p * 0.15;
    pole.position.y = 0.228 + p * 0.13;
    pole.position.x = 0;
    pole.rotation.y = p * 1.6;
    pinA.position.set(-0.17, 0.08, 0.08);
    pinB.position.set(0.17, 0.08, 0.08);
  });

  return (
    <group>
      <instancedMesh
        ref={housingRef}
        args={[housingGeometry, undefined, KEYS.length]}
        castShadow
        receiveShadow
        onPointerMove={handleMove}
        onPointerOut={scheduleClear}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
      >
        <meshStandardMaterial
          color="#eadfd5"
          roughness={0.38}
          metalness={0.03}
          envMapIntensity={0.24}
        />
      </instancedMesh>

      <instancedMesh ref={topRef} args={[topGeometry, undefined, KEYS.length]} raycast={() => null}>
        <meshStandardMaterial
          color="#f8f0e7"
          roughness={0.24}
          metalness={0.06}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      <instancedMesh
        ref={stemRef}
        args={[stemGeometry, undefined, KEYS.length]}
        castShadow
        raycast={() => null}
      >
        <meshStandardMaterial
          color={theme.accent}
          roughness={0.32}
          metalness={0.02}
          envMapIntensity={0.2}
        />
      </instancedMesh>

      <group ref={detailRef} visible={false}>
        {/* 0: highlight ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
          <ringGeometry args={[0.44, 0.55, 42]} />
          <meshBasicMaterial
            color={theme.glow}
            transparent
            opacity={0.56}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* 1: spring */}
        <mesh geometry={springGeometry} castShadow>
          <meshStandardMaterial
            color="#d9b76e"
            metalness={0.82}
            roughness={0.24}
            envMapIntensity={0.45}
          />
        </mesh>

        {/* 2: stem + cross */}
        <group>
          <mesh geometry={stemBlockGeometry} castShadow position={[0, -0.04, 0]}>
            <meshStandardMaterial color={shade(theme.accent, 0.1)} roughness={0.3} />
          </mesh>
          <mesh geometry={stemGeometry} castShadow position={[0, 0.045, 0]}>
            <meshStandardMaterial color={theme.accent} roughness={0.3} />
          </mesh>
        </group>

        {/* 3: top housing, kept glassy so the stem reads through it */}
        <mesh geometry={detailTopGeometry} castShadow>
          <meshStandardMaterial
            color="#fff6eb"
            roughness={0.16}
            metalness={0.08}
            transparent
            opacity={0.63}
            depthWrite={false}
            envMapIntensity={0.5}
          />
        </mesh>

        {/* 4: visible spring seat / center pole */}
        <mesh geometry={poleGeometry}>
          <meshStandardMaterial color="#d8c9bb" roughness={0.4} />
        </mesh>

        {/* 5/6: metal contact pins, a little visual treat from below */}
        <mesh geometry={pinGeometry}>
          <meshStandardMaterial color="#b9a178" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh geometry={pinGeometry}>
          <meshStandardMaterial color="#b9a178" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
