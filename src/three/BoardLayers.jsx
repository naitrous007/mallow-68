import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BOARD_Y,
  CASE_BY_ID,
  CASE_SIZE,
  KEYS,
  THEME_BY_ID,
  shade,
} from "../data";
import { useMallow } from "../store";
import { createCaseFrameGeometry, createFoamGeometry, createPlateGeometry, createRoundedBox } from "./geometry";
import { getCaseBadgeTexture, getPcbTexture } from "./textures";

/* ------------------------------------------------------------------ Plate */

export function Plate() {
  const themeId = useMallow((state) => state.themeId);
  const theme = THEME_BY_ID[themeId] || THEME_BY_ID.strawberry;
  const cutoutsRef = useRef(null);
  const geometry = useMemo(() => createPlateGeometry(16.4, 5.86), []);
  const cutoutGeometry = useMemo(() => createRoundedBox(0.76, 0.018, 0.7, 0.055, 2), []);
  const gasketGeometry = useMemo(() => createRoundedBox(0.27, 0.06, 0.58, 0.06, 2), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const gasketZ = [-1.7, 0, 1.7];

  useLayoutEffect(() => {
    const cutouts = cutoutsRef.current;
    if (!cutouts) return;
    KEYS.forEach((key, index) => {
      dummy.position.set(key.x, BOARD_Y.plate + 0.041, key.z);
      dummy.updateMatrix();
      cutouts.setMatrixAt(index, dummy.matrix);
    });
    cutouts.instanceMatrix.needsUpdate = true;
    cutouts.frustumCulled = false;
  }, [dummy]);

  return (
    <group>
      <mesh geometry={geometry} position={[0, BOARD_Y.plate, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#c7beb2"
          roughness={0.3}
          metalness={0.62}
          envMapIntensity={0.8}
        />
      </mesh>
      <instancedMesh
        ref={cutoutsRef}
        args={[cutoutGeometry, undefined, KEYS.length]}
        raycast={() => null}
        receiveShadow
      >
        <meshStandardMaterial color="#5c564f" roughness={0.5} metalness={0.32} />
      </instancedMesh>
      {[-1, 1].map((side) =>
        gasketZ.map((z, index) => (
          <mesh
            key={`${side}-${index}`}
            geometry={gasketGeometry}
            position={[side * 8.12, BOARD_Y.plate, z]}
            castShadow
          >
            <meshStandardMaterial color={theme.glow} roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ------------------------------------------------------------------- Foam */

export function Foam() {
  const cutoutsRef = useRef(null);
  const geometry = useMemo(() => createFoamGeometry(16.1, 5.74), []);
  const cutoutGeometry = useMemo(() => createRoundedBox(0.54, 0.016, 0.5, 0.1, 2), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const cutouts = cutoutsRef.current;
    if (!cutouts) return;
    KEYS.forEach((key, index) => {
      dummy.position.set(key.x, BOARD_Y.foam + 0.036, key.z);
      dummy.updateMatrix();
      cutouts.setMatrixAt(index, dummy.matrix);
    });
    cutouts.instanceMatrix.needsUpdate = true;
    cutouts.frustumCulled = false;
  }, [dummy]);

  return (
    <group>
      <mesh geometry={geometry} position={[0, BOARD_Y.foam, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#eee4d2" roughness={0.95} metalness={0} />
      </mesh>
      <instancedMesh
        ref={cutoutsRef}
        args={[cutoutGeometry, undefined, KEYS.length]}
        raycast={() => null}
      >
        <meshStandardMaterial color="#cebca0" roughness={0.92} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------- PCB */

export function PCB() {
  const themeId = useMallow((state) => state.themeId);
  const theme = THEME_BY_ID[themeId] || THEME_BY_ID.strawberry;
  const socketsRef = useRef(null);
  const pcbTexture = useMemo(() => getPcbTexture(), []);
  const boardGeometry = useMemo(() => createRoundedBox(16.0, 0.074, 5.72, 0.16, 3), []);
  const socketGeometry = useMemo(() => createRoundedBox(0.22, 0.032, 0.32, 0.03, 2), []);
  const chipGeometry = useMemo(() => createRoundedBox(0.72, 0.12, 0.52, 0.03, 2), []);
  const chipSmallGeometry = useMemo(() => createRoundedBox(0.34, 0.09, 0.28, 0.02, 2), []);
  const standoffGeometry = useMemo(() => new THREE.CylinderGeometry(0.095, 0.095, 0.17, 16), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const topY = BOARD_Y.pcb + 0.037;

  useLayoutEffect(() => {
    const sockets = socketsRef.current;
    if (!sockets) return;
    sockets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    KEYS.forEach((key, index) => {
      dummy.position.set(key.x + 0.23, topY + 0.016, key.z + 0.2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      sockets.setMatrixAt(index, dummy.matrix);
    });
    sockets.instanceMatrix.needsUpdate = true;
    sockets.frustumCulled = false;
  }, [dummy, topY]);

  return (
    <group>
      <mesh geometry={boardGeometry} position={[0, BOARD_Y.pcb, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#779a7d" roughness={0.58} metalness={0.08} />
      </mesh>

      <mesh
        position={[0, topY + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <planeGeometry args={[15.35, 5.14]} />
        <meshStandardMaterial
          map={pcbTexture}
          transparent
          depthWrite={false}
          roughness={0.6}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>

      <instancedMesh ref={socketsRef} args={[socketGeometry, undefined, KEYS.length]} raycast={() => null}>
        <meshStandardMaterial color="#4f6e57" roughness={0.7} />
      </instancedMesh>

      <mesh geometry={chipGeometry} position={[-4.8, topY + 0.062, -1.32]} castShadow>
        <meshStandardMaterial color="#494846" roughness={0.55} metalness={0.18} />
      </mesh>
      <mesh geometry={chipSmallGeometry} position={[-3.75, topY + 0.045, -1.45]} castShadow>
        <meshStandardMaterial color="#5b5956" roughness={0.6} />
      </mesh>
      <mesh geometry={chipSmallGeometry} position={[-2.82, topY + 0.045, -1.4]} castShadow>
        <meshStandardMaterial color="#5b5956" roughness={0.6} />
      </mesh>

      <mesh position={[0, topY + 0.005, -2.63]}>
        <boxGeometry args={[0.72, 0.22, 0.2]} />
        <meshStandardMaterial color="#b8b4ab" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, topY + 0.005, -2.55]}>
        <boxGeometry args={[0.5, 0.1, 0.12]} />
        <meshStandardMaterial color="#6a655e" roughness={0.7} />
      </mesh>

      {[
        [-7.2, -2.2],
        [7.2, -2.2],
        [-7.2, 2.2],
        [7.2, 2.2],
      ].map(([x, z], index) => (
        <mesh key={index} geometry={standoffGeometry} position={[x, BOARD_Y.pcb, z]} castShadow>
          <meshStandardMaterial color="#c7a76b" metalness={0.78} roughness={0.26} />
        </mesh>
      ))}

      <mesh position={[6.9, topY + 0.012, 1.95]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[0.055, 16]} />
        <meshBasicMaterial color={theme.glow} toneMapped={false} />
      </mesh>
      <mesh position={[7.16, topY + 0.012, 1.95]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[0.055, 16]} />
        <meshBasicMaterial color={shade(theme.glow, 0.25)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------- Bottom case */

export function BottomCase() {
  const caseColorId = useMallow((state) => state.caseColorId);
  const caseColor = CASE_BY_ID[caseColorId] || CASE_BY_ID.blush;
  const badge = useMemo(() => getCaseBadgeTexture(), []);

  const frameGeometry = useMemo(
    () =>
      createCaseFrameGeometry(
        CASE_SIZE.width,
        CASE_SIZE.depth,
        CASE_SIZE.wallThickness,
        CASE_SIZE.wallHeight
      ),
    []
  );
  const trimGeometry = useMemo(
    () =>
      createCaseFrameGeometry(
        CASE_SIZE.width + 0.015,
        CASE_SIZE.depth + 0.015,
        CASE_SIZE.wallThickness,
        0.045
      ),
    []
  );
  const floorGeometry = useMemo(
    () => createRoundedBox(CASE_SIZE.width - 0.22, 0.2, CASE_SIZE.depth - 0.22, 0.32, 4),
    []
  );
  const footGeometry = useMemo(() => new THREE.CylinderGeometry(0.27, 0.23, 0.15, 24), []);
  const screwGeometry = useMemo(() => new THREE.CylinderGeometry(0.068, 0.068, 0.022, 18), []);

  const base = caseColor.color;
  const light = shade(base, 0.16);
  const dark = shade(base, -0.16);
  const inner = shade(base, -0.32);

  return (
    <group>
      <mesh
        geometry={frameGeometry}
        position={[0, CASE_SIZE.floorY + CASE_SIZE.wallHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={base}
          roughness={0.44}
          metalness={0.09}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh geometry={trimGeometry} position={[0, CASE_SIZE.floorY + CASE_SIZE.wallHeight - 0.015, 0]}>
        <meshStandardMaterial color={light} roughness={0.36} metalness={0.14} />
      </mesh>
      <mesh geometry={floorGeometry} position={[0, CASE_SIZE.floorY - 0.1, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={inner} roughness={0.62} metalness={0.03} />
      </mesh>

      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            geometry={footGeometry}
            position={[sx * 6.8, -0.565, sz * 2.28]}
            castShadow
          >
            <meshStandardMaterial color={shade(base, -0.45)} roughness={0.9} />
          </mesh>
        ))
      )}

      {[
        [-8.44, -2.62],
        [8.44, -2.62],
        [-8.44, 2.62],
        [8.44, 2.62],
      ].map(([x, z], index) => (
        <mesh
          key={index}
          geometry={screwGeometry}
          position={[x, CASE_SIZE.floorY + CASE_SIZE.wallHeight + 0.001, z]}
          castShadow
        >
          <meshStandardMaterial color={shade(dark, 0.22)} metalness={0.7} roughness={0.25} />
        </mesh>
      ))}

      <mesh position={[0, -0.055, CASE_SIZE.depth / 2 + 0.002]} raycast={() => null}>
        <planeGeometry args={[2.55, 0.64]} />
        <meshBasicMaterial
          map={badge}
          transparent
          depthWrite={false}
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>

      <group position={[0, -0.02, -CASE_SIZE.depth / 2 - 0.002]}>
        <mesh>
          <boxGeometry args={[0.62, 0.22, 0.07]} />
          <meshStandardMaterial color={shade(dark, -0.1)} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[0.42, 0.1, 0.06]} />
          <meshStandardMaterial color="#5a514d" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
