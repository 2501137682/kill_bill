import * as THREE from "three";

export type SpringState = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
};

export type SpringConfig = {
  stiffness: number;
  damping: number;
  mass: number;
};

const DEFAULT_CONFIG: SpringConfig = {
  stiffness: 42,
  damping: 9,
  mass: 1,
};

export function createSpringState(position: THREE.Vector3): SpringState {
  return {
    position: position.clone(),
    velocity: new THREE.Vector3(),
  };
}

/** Semi-implicit Euler spring toward a target. */
export function stepSpringToward(
  state: SpringState,
  target: THREE.Vector3,
  delta: number,
  config: Partial<SpringConfig> = {}
): void {
  const { stiffness, damping, mass } = { ...DEFAULT_CONFIG, ...config };
  const acceleration = target
    .clone()
    .sub(state.position)
    .multiplyScalar(stiffness / mass);
  acceleration.addScaledVector(state.velocity, -damping / mass);

  state.velocity.addScaledVector(acceleration, delta);
}

/** Rubber-band constraint: keep position within max distance from anchor. */
export function constrainRopeLength(
  position: THREE.Vector3,
  anchor: THREE.Vector3,
  maxLength: number
): void {
  const offset = position.clone().sub(anchor);
  const distance = offset.length();
  if (distance <= maxLength || distance === 0) return;
  position.copy(anchor).add(offset.multiplyScalar(maxLength / distance));
}

/** Remove velocity component that pushes beyond the rope sphere. */
export function dampRopeVelocity(
  state: SpringState,
  anchor: THREE.Vector3,
  maxLength: number
): void {
  const offset = state.position.clone().sub(anchor);
  const distance = offset.length();
  if (distance <= maxLength || distance === 0) return;

  const normal = offset.normalize();
  const radialSpeed = state.velocity.dot(normal);
  if (radialSpeed > 0) {
    state.velocity.addScaledVector(normal, -radialSpeed);
  }
}

/** Elastic rope tension when stretched beyond natural rest length. */
export function applyRopeElastic(
  state: SpringState,
  anchor: THREE.Vector3,
  restLength: number,
  delta: number,
  stiffness = 52
): void {
  const offset = state.position.clone().sub(anchor);
  const distance = offset.length();
  if (distance <= restLength || distance === 0) return;

  const stretch = distance - restLength;
  const direction = offset.normalize();
  state.velocity.addScaledVector(direction, -stretch * stiffness * delta);
}

/** Build a sagging rope curve between anchor and card hook. */
export function buildRopeCurve(
  anchor: THREE.Vector3,
  hook: THREE.Vector3,
  sag = 0.35
): THREE.CatmullRomCurve3 {
  const mid = anchor.clone().lerp(hook, 0.5);
  mid.y -= sag;
  const quarter = anchor.clone().lerp(hook, 0.25);
  quarter.y -= sag * 0.45;
  const threeQuarter = anchor.clone().lerp(hook, 0.75);
  threeQuarter.y -= sag * 0.25;

  return new THREE.CatmullRomCurve3(
    [anchor.clone(), quarter, mid, threeQuarter, hook.clone()],
    false,
    "catmullrom",
    0.35
  );
}

export const CARD_COLORS = {
  body: "#FFFFF0",
  face: "#FFFFF0",
  back: "#f3ede4",
} as const;
