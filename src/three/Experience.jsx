import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useMallow } from "../store";
import { KEYS } from "../data";
import { DeskScene } from "./DeskScene";
import { Keyboard } from "./Keyboard";

function ResponsiveCamera() {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const mobile = size.width < 680;
    if (mobile) {
      camera.position.set(17, 26, 27);
      camera.fov = 50;
      controls?.target.set(0, 0.8, 0);
    } else if (size.width < 1020) {
      camera.position.set(15.5, 12.6, 20.4);
      camera.fov = 42;
      controls?.target.set(0, 0.5, 0);
    } else {
      camera.position.set(13.1, 10.8, 17.6);
      camera.fov = 36;
      controls?.target.set(0, 0.55, 0);
    }
    camera.updateProjectionMatrix();
    controls?.update();
  }, [camera, controls, size.width, size.height]);

  useEffect(() => {
    const reset = () => {
      const mobile = size.width < 680;
      if (mobile) {
        camera.position.set(17, 26, 27);
        camera.fov = 50;
        controls?.target.set(0, 0.8, 0);
      } else if (size.width < 1020) {
        camera.position.set(15.5, 12.6, 20.4);
        camera.fov = 42;
        controls?.target.set(0, 0.5, 0);
      } else {
        camera.position.set(13.1, 10.8, 17.6);
        camera.fov = 36;
        controls?.target.set(0, 0.55, 0);
      }
      camera.updateProjectionMatrix();
      controls?.update();
    };
    document.addEventListener("mallow:reset-view", reset);
    return () => document.removeEventListener("mallow:reset-view", reset);
  }, [camera, controls, size.width]);

  return null;
}

function SwitchHoverDetector() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const origin = new THREE.Vector3();
    const layer = scene.getObjectByName("layer-switches");
    if (!layer) return undefined;

    const clear = () => {
      const state = useMallow.getState();
      if (state.hoveredSwitch != null) state.setHoveredSwitch(null);
      if (state.hoveredLayer != null) state.setHoveredLayer(null);
    };

    const onMove = (event) => {
      if (event.pointerType === "touch") return;
      const state = useMallow.getState();
      const peekAllowed =
        state.selectedLayer === "switches" ||
        (!state.selectedLayer && state.explode >= 0.3);
      if (!peekAllowed) {
        clear();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);

      layer.getWorldPosition(origin);
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, origin.y + 0.32, 0)
      );
      if (!raycaster.ray.intersectPlane(plane, hit)) {
        clear();
        return;
      }
      layer.worldToLocal(hit);
      let found = null;
      for (let i = 0; i < KEYS.length; i += 1) {
        const key = KEYS[i];
        if (Math.abs(hit.x - key.x) <= key.w / 2 && Math.abs(hit.z - key.z) <= 0.53) {
          found = i;
          break;
        }
      }
      if (found == null) {
        clear();
        return;
      }
      state.setHoveredSwitch(found);
    };

    const onLeave = () => clear();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    const unsubscribe = useMallow.subscribe((state) => {
      const allowed =
        state.selectedLayer === "switches" ||
        (!state.selectedLayer && state.explode >= 0.3);
      if (!allowed && state.hoveredSwitch != null) {
        state.setHoveredSwitch(null);
      }
    });
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      unsubscribe();
      clear();
    };
  }, [camera, gl, scene]);

  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#fff5ed", "#c9aeb4", 0.72]} />
      <ambientLight intensity={0.28} color="#fff1e9" />
      <directionalLight
        position={[10, 16, 11]}
        intensity={1.85}
        color="#fff4e8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-radius={5}
      />
      <directionalLight position={[-10, 10, -8]} intensity={0.58} color="#e9d7ff" />
      <pointLight position={[-9, 5, 7]} intensity={7} distance={32} decay={2} color="#ffd6de" />
      <pointLight position={[8, 4, -6]} intensity={5} distance={28} decay={2} color="#d8e9ff" />
    </>
  );
}

export function Experience() {
  const clearLayer = useMallow((state) => state.clearLayer);
  const setHoveredSwitch = useMallow((state) => state.setHoveredSwitch);

  return (
    <Canvas
      className="mallow-canvas"
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [13.1, 10.8, 17.6], fov: 36, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.86,
      }}
      onPointerMissed={() => {
        clearLayer();
        setHoveredSwitch(null);
      }}
      onCreated={({ gl, scene, camera, ...rest }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.setClearColor(0x000000, 0);
        if (import.meta.env.DEV) {
          window.__mallowScene = scene;
          window.__mallowCamera = camera;
          window.__mallowRoot = rest;
        }
      }}
    >
      <ResponsiveCamera />
      <SwitchHoverDetector />
      <Lights />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.15} color="#fff8ef" position={[0, 7, 5]} scale={[14, 7, 1]} />
        <Lightformer form="rect" intensity={0.45} color="#f6d8e0" position={[-8, 3, 4]} scale={[6, 5, 1]} />
        <Lightformer form="circle" intensity={0.55} color="#e5e1ff" position={[8, 5, -4]} scale={[4, 4, 1]} />
      </Environment>

      <DeskScene />
      <Keyboard />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.55}
        zoomSpeed={0.65}
        minDistance={9}
        maxDistance={57}
        minPolarAngle={0.5}
        maxPolarAngle={1.35}
        minAzimuthAngle={-1.05}
        maxAzimuthAngle={1.05}
      />
    </Canvas>
  );
}
