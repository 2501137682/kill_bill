"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import DirectorBadge from "./DirectorBadge";
import { buildRopeCurve } from "./springPhysics";

const CARD_SCALE = 0.9;
const ANCHOR = new THREE.Vector3(-0.24, 2.18, 0.1);
const STRAP_TOP = 3.05;

type DirectorCardCanvasProps = {
  onWheelIntent?: (deltaY: number) => void;
};

function LanyardStrap() {
  const height = STRAP_TOP - ANCHOR.y;
  return (
    <mesh position={[ANCHOR.x, ANCHOR.y + height * 0.5, ANCHOR.z]} castShadow>
      <boxGeometry args={[0.1 * CARD_SCALE, height, 0.02]} />
      <meshStandardMaterial color="#111010" roughness={0.92} metalness={0.03} />
    </mesh>
  );
}

function SceneRig({ onDragChange }: { onDragChange?: (dragging: boolean) => void }) {
  const hookRef = useRef(new THREE.Vector3(0.08, 0.76, 0.36));
  const ropeMeshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const mesh = ropeMeshRef.current;
    if (!mesh) return;

    const stretch = hookRef.current.distanceTo(ANCHOR);
    const sag = 0.18 + stretch * 0.07;
    const curve = buildRopeCurve(ANCHOR, hookRef.current, sag);
    const nextGeometry = new THREE.TubeGeometry(curve, 64, 0.022, 12, false);
    mesh.geometry.dispose();
    mesh.geometry = nextGeometry;
  });

  return (
    <>
      <LanyardStrap />

      <mesh ref={ropeMeshRef} castShadow receiveShadow>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshStandardMaterial color="#241612" roughness={0.88} metalness={0.04} />
      </mesh>

      <DirectorBadge
        onHookUpdate={(hook) => {
          hookRef.current.copy(hook);
        }}
        onDragChange={onDragChange}
      />
    </>
  );
}

export default function DirectorCardCanvas({
  onWheelIntent,
}: DirectorCardCanvasProps) {
  const [cardDragging, setCardDragging] = useState(false);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onWheelIntent?.(event.deltaY);
  };

  return (
    <div
      className={`scene1__canvas-wrap${cardDragging ? " scene1__canvas-wrap--dragging" : ""}`}
      onWheel={handleWheel}
    >
      <Canvas
        className="scene1__canvas"
        camera={{ position: [0, 0.08, 4.25], fov: 31, near: 0.1, far: 100 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        shadows
      >
        <Suspense fallback={null}>
          <SceneRig onDragChange={setCardDragging} />
        </Suspense>
      </Canvas>
    </div>
  );
}
