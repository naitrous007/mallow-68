import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createArchShape, createLeafGeometry, createRoundedBox, createStarGeometry } from "./geometry";
import { getDeskMatTexture } from "./textures";
import { useMallow } from "../store";

function softShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
  g.addColorStop(0, "rgba(96, 62, 70, 0.34)");
  g.addColorStop(0.4, "rgba(96, 62, 70, 0.19)");
  g.addColorStop(0.72, "rgba(96, 62, 70, 0.05)");
  g.addColorStop(1, "rgba(96, 62, 70, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Mug() {
  const steamRefs = useRef([]);
  const steamData = useMemo(
    () => [
      { phase: 0.05, x: -0.16, z: 0.02, size: 0.15 },
      { phase: 0.38, x: 0.08, z: 0.08, size: 0.11 },
      { phase: 0.7, x: 0.2, z: -0.04, size: 0.13 },
    ],
    []
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    steamRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const data = steamData[index];
      const t = (time * 0.17 + data.phase) % 1;
      mesh.position.set(
        data.x + Math.sin(t * Math.PI * 2 + index) * 0.11,
        0.92 + t * 1.3,
        data.z + Math.cos(t * Math.PI * 2) * 0.05
      );
      const fade = Math.sin(t * Math.PI);
      mesh.scale.setScalar((0.55 + t * 1.4) * data.size);
      mesh.material.opacity = fade * 0.26;
    });
  });

  return (
    <group position={[-10.35, -0.64, -1.85]} rotation={[0, 0.28, 0]}>
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.78, 0.8, 0.06, 40]} />
        <meshStandardMaterial color="#efd8c9" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.54, 1.04, 48]} />
        <meshStandardMaterial color="#f5e8db" roughness={0.42} metalness={0.02} />
      </mesh>
      <mesh position={[0.61, 0.64, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.31, 0.075, 12, 28]} />
        <meshStandardMaterial color="#f0ded1" roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.51, 40]} />
        <meshStandardMaterial color="#9b6b5f" roughness={0.75} />
      </mesh>
      <mesh position={[-0.18, 0.67, 0.535]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#5b3c37" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 0.69, 0.545]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#5b3c37" roughness={0.5} />
      </mesh>
      <mesh position={[-0.03, 0.59, 0.56]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.075, 0.012, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#8b625c" roughness={0.6} />
      </mesh>
      {steamData.map((data, index) => (
        <mesh
          key={index}
          ref={(node) => {
            steamRefs.current[index] = node;
          }}
          raycast={() => null}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#fff8f1" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Plant() {
  const swayRef = useRef(null);
  const leafGeometry = useMemo(() => createLeafGeometry(), []);

  useFrame((state) => {
    if (!swayRef.current) return;
    const t = state.clock.elapsedTime;
    swayRef.current.rotation.z = Math.sin(t * 0.7) * 0.025;
    swayRef.current.rotation.x = Math.cos(t * 0.53) * 0.015;
  });

  const leaves = [
    { angle: 0.1, tilt: 0.42, x: 0, y: 1.35, z: 0.06, scale: 0.72 },
    { angle: 1.15, tilt: 0.7, x: 0.06, y: 1.31, z: 0.03, scale: 0.58 },
    { angle: 2.3, tilt: 0.62, x: -0.04, y: 1.38, z: -0.02, scale: 0.66 },
    { angle: 3.35, tilt: 0.8, x: -0.08, y: 1.28, z: 0.02, scale: 0.52 },
    { angle: 4.4, tilt: 0.5, x: 0.03, y: 1.42, z: -0.04, scale: 0.62 },
    { angle: 5.45, tilt: 0.72, x: 0.09, y: 1.3, z: 0.04, scale: 0.54 },
  ];

  return (
    <group position={[10.3, -0.64, -2.25]}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.66, 0.52, 0.76, 32]} />
        <meshStandardMaterial color="#e9b9ae" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.77, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.09, 32]} />
        <meshStandardMaterial color="#f0c9bd" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.03, 28]} />
        <meshStandardMaterial color="#947761" roughness={1} />
      </mesh>
      <group ref={swayRef}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.038, 1.05, 8]} />
          <meshStandardMaterial color="#7c9a70" roughness={0.75} />
        </mesh>
        {leaves.map((leaf, index) => (
          <mesh
            key={index}
            geometry={leafGeometry}
            position={[leaf.x, leaf.y, leaf.z]}
            rotation={[0.08, leaf.angle, leaf.tilt]}
            scale={[leaf.scale, leaf.scale, 1]}
            castShadow
          >
            <meshStandardMaterial color={index % 2 ? "#91ac80" : "#a8bf93"} roughness={0.72} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4].map((index) => {
          const angle = (index / 5) * Math.PI * 2;
          return (
            <mesh
              key={`petal-${index}`}
              position={[Math.cos(angle) * 0.16, 1.99 + Math.sin(index) * 0.02, Math.sin(angle) * 0.16]}
              scale={[0.17, 0.09, 0.17]}
              castShadow
            >
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color={index % 2 ? "#f3c1c7" : "#eeb4bd"} roughness={0.58} />
            </mesh>
          );
        })}
        <mesh position={[0, 2.02, 0]}>
          <sphereGeometry args={[0.09, 14, 12]} />
          <meshStandardMaterial color="#e9cf87" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Notebook() {
  return (
    <group position={[-10.55, -0.64, 2.5]} rotation={[0, 0.32, 0]}>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.08, 4.15]} />
        <meshStandardMaterial color="#b9a9cb" roughness={0.62} />
      </mesh>
      <mesh position={[0.02, 0.11, 0]} castShadow>
        <boxGeometry args={[2.86, 0.1, 3.98]} />
        <meshStandardMaterial color="#fff7ea" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow>
        <boxGeometry args={[3.02, 0.045, 4.16]} />
        <meshStandardMaterial color="#b3a1c6" roughness={0.58} />
      </mesh>
      <mesh position={[0.65, 0.235, 0]} castShadow>
        <boxGeometry args={[0.75, 0.015, 4.1]} />
        <meshStandardMaterial color="#e7d7e9" roughness={0.75} />
      </mesh>
      <mesh position={[-0.5, 0.27, 0.35]} rotation={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.2, 0.015, 0.75]} />
        <meshStandardMaterial color="#f5c7c1" roughness={0.82} />
      </mesh>
      <group position={[1.4, 0.27, -0.2]} rotation={[0, 0.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 2.65, 18]} />
          <meshStandardMaterial color="#dba58f" roughness={0.35} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0, 1.33]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.06, 0.22, 16]} />
          <meshStandardMaterial color="#c7a56d" metalness={0.65} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Cable() {
  const geometry = useMemo(() => {
    const points = [
      [1.7, -0.08, -3.32],
      [2.1, -0.36, -3.72],
      [3.15, -0.57, -4.06],
      [4.5, -0.58, -3.95],
      [5.55, -0.57, -3.54],
      [6.35, -0.56, -3.72],
      [6.9, -0.57, -4.16],
      [7.8, -0.58, -4.16],
      [8.6, -0.58, -3.9],
      [9.15, -0.58, -4.25],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 110, 0.062, 8, false);
  }, []);

  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#f2dfc6" roughness={0.62} />
      </mesh>
      <mesh position={[9.32, -0.58, -4.28]} rotation={[0, -0.7, 0]} castShadow>
        <boxGeometry args={[0.42, 0.16, 0.22]} />
        <meshStandardMaterial color="#c5b3a0" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Arch({ width, height, color, position, rotationY = 0 }) {
  const geometry = useMemo(() => {
    const shape = createArchShape(width, height);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.08,
      bevelThickness: 0.07,
      curveSegments: 24,
    });
    geo.translate(0, 0, -0.14);
    return geo;
  }, [width, height]);

  return (
    <mesh geometry={geometry} position={position} rotation={[0, rotationY, 0]} receiveShadow castShadow>
      <meshStandardMaterial color={color} roughness={0.93} />
    </mesh>
  );
}

function Stars() {
  const geometry = useMemo(() => createStarGeometry(0.46, 0.2, 0.055), []);
  const refs = useRef([]);
  const data = useMemo(
    () => [
      [-6.2, 3.15, -3.5, 0.66, 0.7],
      [6.35, 4.05, -4.1, 0.46, 1.7],
      [0.3, 5.25, -5.2, 0.34, 2.4],
    ],
    []
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const [x, y, z, scale, phase] = data[index];
      mesh.position.set(
        x + Math.sin(time * 0.36 + phase) * 0.22,
        y + Math.sin(time * 0.6 + phase) * 0.16,
        z
      );
      mesh.rotation.set(time * 0.18 + phase, time * 0.27 + phase, Math.sin(time * 0.4 + phase) * 0.2);
      mesh.scale.setScalar(scale);
    });
  });

  return data.map((star, index) => (
    <mesh
      key={index}
      ref={(node) => {
        refs.current[index] = node;
      }}
      geometry={geometry}
      castShadow
      raycast={() => null}
    >
      <meshStandardMaterial
        color={index === 1 ? "#f3d5a4" : index === 2 ? "#d8c5e5" : "#f4c6c6"}
        roughness={0.45}
        emissive={index === 1 ? "#f3d5a4" : "#e7c9cf"}
        emissiveIntensity={0.1}
      />
    </mesh>
  ));
}

export function DeskScene() {
  const matTexture = useMemo(() => getDeskMatTexture(), []);
  const slabGeometry = useMemo(() => createRoundedBox(35, 0.82, 22, 1.1, 4), []);
  const matGeometry = useMemo(() => createRoundedBox(23.2, 0.06, 12.2, 0.55, 4), []);
  const shadowTexture = useMemo(() => softShadowTexture(), []);
  const starGeometry = useMemo(() => createStarGeometry(0.52, 0.22, 0.06), []);

  const clearSelection = (event) => {
    event.stopPropagation();
    useMallow.getState().clearLayer();
    useMallow.getState().setHoveredSwitch(null);
  };

  return (
    <group>
      <mesh
        geometry={slabGeometry}
        position={[0, -1.11, -0.5]}
        receiveShadow
        onClick={clearSelection}
      >
        <meshStandardMaterial color="#efd3cf" roughness={0.93} metalness={0} />
      </mesh>

      <mesh geometry={matGeometry} position={[0, -0.67, 0]} receiveShadow onClick={clearSelection}>
        <meshStandardMaterial map={matTexture} roughness={0.95} metalness={0} />
      </mesh>

      <mesh
        position={[0, -0.636, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
        renderOrder={1}
      >
        <planeGeometry args={[25, 12]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          depthWrite={false}
          opacity={0.62}
          toneMapped={false}
        />
      </mesh>

      <Arch width={4.2} height={7.4} color="#eac7bf" position={[-4.4, -0.68, -7.1]} />
      <Arch width={2.9} height={5.8} color="#d6c5e4" position={[3.7, -0.68, -7.8]} rotationY={0.2} />
      <Arch width={1.7} height={4.1} color="#c6d9c2" position={[7.9, -0.68, -7.3]} rotationY={-0.12} />

      <mesh position={[-8.2, 1.55, -5.7]} castShadow>
        <sphereGeometry args={[0.64, 32, 24]} />
        <meshStandardMaterial color="#efc7c4" roughness={0.55} />
      </mesh>
      <mesh position={[9.1, 1.15, -5.4]} castShadow>
        <sphereGeometry args={[0.46, 28, 22]} />
        <meshStandardMaterial color="#d9cfe4" roughness={0.6} />
      </mesh>

      <Mug />
      <Plant />
      <Notebook />
      <Cable />
      <Stars />

      <mesh position={[8.9, 1.25, 3.55]} castShadow>
        <sphereGeometry args={[0.3, 24, 18]} />
        <meshStandardMaterial color="#f3cf8e" roughness={0.62} />
      </mesh>
      <mesh position={[8.9, 0.98, 3.55]} rotation={[0, 0.4, 0]} castShadow>
        <torusGeometry args={[0.34, 0.06, 8, 24]} />
        <meshStandardMaterial color="#e5b86c" roughness={0.55} />
      </mesh>
      <mesh geometry={starGeometry} position={[9.6, 0.72, 3.1]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <meshStandardMaterial color="#f6dfb8" roughness={0.65} />
      </mesh>
    </group>
  );
}
