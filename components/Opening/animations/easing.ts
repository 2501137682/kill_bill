export const EASE = {
  cinematic: "cubic-bezier(0.45, 0, 0.15, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  confident: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

export const GSAP_EASE = {
  cinematic: "power2.inOut",
  smooth: "power1.inOut",
  confident: "power3.inOut",
} as const;

export const DURATION = {
  fadeBlack: 0.5,
  backgroundReveal: 0.9,
  titleEntrance: 1,
  metadataFade: 0.8,
  hoverPause: 0.5,
  clickDelay: 0.08,
  inkReveal: 0.55,
  inkHide: 0.45,
  lightFade: 0.6,
  letterWaveStagger: 0.085,
  letterWaveRise: 0.34,
  letterWaveSettle: 0.48,
  letterColorStagger: 0.075,
  letterColorShift: 0.14,
  creditReveal: 0.7,
} as const;

/** Slight overshoot for Chapter1 spring entry. */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInCubic(t: number): number {
  return t * t * t;
}
