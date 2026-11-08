"use client";

import { useEffect, useRef } from "react";
import { Html, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE1 } from "../assets/constants";
import {
  applyRopeElastic,
  buildRopeCurve,
  CARD_COLORS,
  constrainRopeLength,
  createSpringState,
  dampRopeVelocity,
  stepSpringToward,
} from "./springPhysics";

const CARD_SCALE = 0.9;
const CARD_W = 1.02 * CARD_SCALE;
const CARD_H = 1.62 * CARD_SCALE;
const CARD_D = 0.055 * CARD_SCALE;
const PHOTO_SIZE = 0.78 * CARD_SCALE;
const PHOTO_Y = 0.26 * CARD_SCALE;
const REST = new THREE.Vector3(-0.2, -0.04, 0.36);
const ANCHOR = new THREE.Vector3(-0.24, 2.18, 0.1);
const ROPE_REST_LENGTH = REST.distanceTo(ANCHOR);
const ROPE_MAX_STRETCH = ROPE_REST_LENGTH * 1.62;
const CARD_TILT = new THREE.Euler(0.08, -0.08, 0.03);

type DirectorBadgeProps = {
  onHookUpdate: (hook: THREE.Vector3) => void;
  onDragChange?: (dragging: boolean) => void;
};

function MetalClip({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.11 * CARD_SCALE, 0.045 * CARD_SCALE, 0.038 * CARD_SCALE]} />
        <meshStandardMaterial color="#8a8078" roughness={0.32} metalness={0.88} />
      </mesh>
      <mesh position={[0, -0.048 * CARD_SCALE, 0]} castShadow>
        <torusGeometry args={[0.032 * CARD_SCALE, 0.007 * CARD_SCALE, 10, 24]} />
        <meshStandardMaterial color="#6e6760" roughness={0.38} metalness={0.92} />
      </mesh>
    </group>
  );
}

function KeyLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light?.shadow) return;
    light.shadow.intensity = 0.52;
    light.shadow.radius = 2.5;
    light.shadow.bias = -0.0002;
  }, []);

  return (
    <directionalLight
      ref={lightRef}
      position={[3.8, 5.2, 4.2]}
      intensity={1.18}
      castShadow
      shadow-mapSize={[1024, 1024]}
    />
  );
}

export default function DirectorBadge({
  onHookUpdate,
  onDragChange,
}: DirectorBadgeProps) {
  const photoMap = useTexture(SCENE1.cardPhotoSrc);
  const groupRef = useRef<THREE.Group>(null);
  const spring = useRef(createSpringState(REST));
  const pointerHit = useRef(new THREE.Vector3());
  const grabOffset = useRef(new THREE.Vector3());
  const dragPlane = useRef(new THREE.Plane());
  const planeNormal = useRef(new THREE.Vector3());
  const isDragging = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const hookWorld = useRef(new THREE.Vector3());
  const prevPos = useRef(REST.clone());
  const lastDragPos = useRef(REST.clone());
  const dragVelocity = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const { camera, gl } = useThree();

  photoMap.colorSpace = THREE.SRGBColorSpace;
  photoMap.anisotropy = 8;

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(REST);
    spring.current.position.copy(REST);
    initialized.current = true;
  }, []);

  const alignDragPlane = (point: THREE.Vector3) => {
    camera.getWorldDirection(planeNormal.current);
    dragPlane.current.setFromNormalAndCoplanarPoint(planeNormal.current, point);
  };

  const projectPointer = (clientX: number, clientY: number): boolean => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(pointer.current, camera);
    return !!raycaster.current.ray.intersectPlane(dragPlane.current, pointerHit.current);
  };

  const applyDragPosition = (dt: number) => {
    const state = spring.current;
    const next = pointerHit.current.clone().add(grabOffset.current);
    constrainRopeLength(next, ANCHOR, ROPE_MAX_STRETCH);

    if (dt > 0) {
      dragVelocity.current.copy(next).sub(lastDragPos.current).multiplyScalar(1 / dt);
    }
    lastDragPos.current.copy(next);

    state.position.copy(next);
    state.velocity.set(0, 0, 0);
    groupRef.current?.position.copy(next);
  };

  const setDragging = (next: boolean) => {
    if (isDragging.current === next) return;
    isDragging.current = next;
    onDragChange?.(next);
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.028);
    const card = groupRef.current;
    if (!card || !initialized.current) return;

    const state = spring.current;

    if (isDragging.current) {
      const dragTiltX = THREE.MathUtils.clamp(
        (state.position.x - REST.x) * 0.48,
        -0.22,
        0.22
      );
      const dragTiltY = THREE.MathUtils.clamp(
        -(state.position.y - REST.y) * 0.38,
        -0.18,
        0.18
      );
      card.rotation.set(
        CARD_TILT.x + dragTiltY,
        CARD_TILT.y + dragTiltX,
        CARD_TILT.z
      );

      prevPos.current.copy(state.position);
      card.getWorldPosition(hookWorld.current);
      hookWorld.current.y += CARD_H * 0.5 + 0.055 * CARD_SCALE;
      onHookUpdate(hookWorld.current);
      return;
    }

    stepSpringToward(state, REST, dt, {
      stiffness: 36,
      damping: 4.6,
      mass: 1,
    });
    applyRopeElastic(state, ANCHOR, ROPE_REST_LENGTH, dt, 68);
    state.position.addScaledVector(state.velocity, dt);
    constrainRopeLength(state.position, ANCHOR, ROPE_MAX_STRETCH);
    dampRopeVelocity(state, ANCHOR, ROPE_MAX_STRETCH);
    state.velocity.multiplyScalar(1 - 1.8 * dt);

    card.position.copy(state.position);

    const velocity = state.position.distanceTo(prevPos.current) / Math.max(dt, 0.001);
    prevPos.current.copy(state.position);

    const dragTiltX = THREE.MathUtils.clamp(
      (state.position.x - REST.x) * 0.48,
      -0.22,
      0.22
    );
    const dragTiltY = THREE.MathUtils.clamp(
      -(state.position.y - REST.y) * 0.38,
      -0.18,
      0.18
    );
    const swayZ = velocity * 0.028;

    card.rotation.set(
      CARD_TILT.x + dragTiltY,
      CARD_TILT.y + dragTiltX,
      CARD_TILT.z + swayZ
    );

    card.getWorldPosition(hookWorld.current);
    hookWorld.current.y += CARD_H * 0.5 + 0.055 * CARD_SCALE;
    onHookUpdate(hookWorld.current);
  });

  return (
    <>
      <ambientLight intensity={0.68} />
      <KeyLight />
      <directionalLight position={[-2.5, 2.2, -3.2]} intensity={0.36} color="#fff8ee" />
      <pointLight position={[0.8, 1.6, 2.2]} intensity={0.34} color="#fffdf5" />

      <group
        ref={groupRef}
        rotation={CARD_TILT}
        onPointerDown={(event) => {
          event.stopPropagation();
          alignDragPlane(spring.current.position);
          if (!projectPointer(event.clientX, event.clientY)) return;

          grabOffset.current.copy(spring.current.position).sub(pointerHit.current);
          lastDragPos.current.copy(spring.current.position);
          dragVelocity.current.set(0, 0, 0);
          setDragging(true);
          applyDragPosition(0);
          gl.domElement.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!isDragging.current) return;
          event.stopPropagation();
          if (projectPointer(event.clientX, event.clientY)) {
            applyDragPosition(0.016);
          }
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          spring.current.velocity.copy(dragVelocity.current).multiplyScalar(0.95);
          setDragging(false);
          gl.domElement.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          event.stopPropagation();
          setDragging(false);
          gl.domElement.releasePointerCapture(event.pointerId);
        }}
      >
        <MetalClip position={[0, CARD_H * 0.5 + 0.018, 0.02]} />

        <RoundedBox
          args={[CARD_W, CARD_H, CARD_D]}
          radius={0.045 * CARD_SCALE}
          smoothness={6}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={CARD_COLORS.body}
            roughness={0.52}
            metalness={0}
          />
        </RoundedBox>

        <mesh position={[0, 0, CARD_D * 0.5 + 0.001]} receiveShadow>
          <planeGeometry args={[CARD_W * 0.9, CARD_H * 0.9]} />
          <meshStandardMaterial
            color={CARD_COLORS.face}
            roughness={0.5}
            metalness={0}
          />
        </mesh>

        <mesh position={[0, PHOTO_Y, CARD_D * 0.5 + 0.002]}>
          <planeGeometry args={[PHOTO_SIZE, PHOTO_SIZE]} />
          <meshStandardMaterial
            map={photoMap}
            roughness={0.48}
            metalness={0.03}
            toneMapped
          />
        </mesh>

        <mesh position={[0, 0, -(CARD_D * 0.5 + 0.001)]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_W * 0.9, CARD_H * 0.9]} />
          <meshStandardMaterial
            color={CARD_COLORS.back}
            roughness={0.78}
            metalness={0.005}
          />
        </mesh>

        <Html
          transform
          occlude={false}
          position={[0, -0.48 * CARD_SCALE, CARD_D * 0.5 + 0.004]}
          center
          distanceFactor={1.08}
          style={{ pointerEvents: "none" }}
        >
          <p className="scene1-card__title">The Director.</p>
        </Html>
      </group>
    </>
  );
}
