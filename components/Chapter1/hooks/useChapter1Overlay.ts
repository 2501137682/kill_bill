"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getActiveScene,
  type Chapter1Scene,
  type Chapter1WheelStep,
} from "../assets/constants";

export const OVERLAY_FADE = {
  1: { inMs: 900, outMs: 700, inDelayMs: 0 },
  2: { inMs: 2800, outMs: 1100, inDelayMs: 1100 },
  3: { inMs: 900, outMs: 700, inDelayMs: 0 },
} as const satisfies Record<
  Chapter1Scene,
  { inMs: number; outMs: number; inDelayMs: number }
>;

type SceneOpacity = Record<Chapter1Scene, number>;

const ZERO_OPACITY: SceneOpacity = { 1: 0, 2: 0, 3: 0 };

const RESTING_OPACITY: Record<Chapter1WheelStep, SceneOpacity> = {
  0: { 1: 0, 2: 0, 3: 0 },
  1: { 1: 1, 2: 0, 3: 0 },
  2: { 1: 0, 2: 1, 3: 0 },
  3: { 1: 0, 2: 0, 3: 1 },
};

function sceneForStep(step: Chapter1WheelStep): Chapter1Scene | null {
  if (step === 1) return 1;
  if (step === 2) return 2;
  if (step === 3) return 3;
  return null;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

type UseChapter1OverlayOptions = {
  currentTime: number;
  isReverseScrubbing: boolean;
  wheelStep: Chapter1WheelStep;
  isTweening: boolean;
};

export function useChapter1Overlay({
  currentTime,
  isReverseScrubbing,
  wheelStep,
  isTweening,
}: UseChapter1OverlayOptions) {
  const [opacity, setOpacity] = useState<SceneOpacity>(ZERO_OPACITY);
  const [isAnimating, setIsAnimating] = useState(false);
  const opacityRef = useRef<SceneOpacity>({ ...ZERO_OPACITY });
  const rafRef = useRef(0);
  const animsRef = useRef<
    Partial<
      Record<
        Chapter1Scene,
        { from: number; to: number; start: number; duration: number }
      >
    >
  >({});
  const activeSceneRef = useRef<Chapter1Scene>(1);
  const reverseFadeStartedRef = useRef(false);

  const applyOpacity = useCallback((next: SceneOpacity) => {
    opacityRef.current = next;
    setOpacity(next);
  }, []);

  const tickAnims = useCallback(
    (now: number) => {
      const anims = animsRef.current;
      const keys = Object.keys(anims) as unknown as Chapter1Scene[];
      if (keys.length === 0) {
        setIsAnimating(false);
        return;
      }

      let next = { ...opacityRef.current };
      let stillRunning = false;

      for (const scene of keys) {
        const anim = anims[scene];
        if (!anim) continue;

        const elapsed = now - anim.start;
        if (elapsed < 0) {
          stillRunning = true;
          continue;
        }

        const t = Math.min(1, elapsed / anim.duration);
        const eased = anim.to > anim.from ? easeOutCubic(t) : t;
        next[scene] = anim.from + (anim.to - anim.from) * eased;

        if (t < 1) {
          stillRunning = true;
        } else {
          delete anims[scene];
        }
      }

      applyOpacity(next);

      if (stillRunning) {
        setIsAnimating(true);
        rafRef.current = requestAnimationFrame(tickAnims);
      } else {
        setIsAnimating(false);
      }
    },
    [applyOpacity]
  );

  const startAnimLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tickAnims);
  }, [tickAnims]);

  const runOpacityAnim = useCallback(
    (scene: Chapter1Scene, to: number, durationMs: number, delayMs = 0) => {
      const from = opacityRef.current[scene];
      if (Math.abs(from - to) < 0.001) {
        applyOpacity({ ...opacityRef.current, [scene]: to });
        return;
      }

      animsRef.current[scene] = {
        from,
        to,
        start: performance.now() + delayMs,
        duration: durationMs,
      };
      setIsAnimating(true);
      startAnimLoop();
    },
    [applyOpacity, startAnimLoop]
  );

  const fadeIn = useCallback(
    (scene: Chapter1Scene) => {
      const cfg = OVERLAY_FADE[scene];
      runOpacityAnim(scene, 1, cfg.inMs, cfg.inDelayMs);
    },
    [runOpacityAnim]
  );

  const fadeOut = useCallback(
    (scene: Chapter1Scene) => {
      runOpacityAnim(scene, 0, OVERLAY_FADE[scene].outMs);
    },
    [runOpacityAnim]
  );

  const onForwardStep = useCallback(
    (nextStep: Chapter1WheelStep) => {
      reverseFadeStartedRef.current = false;
      const entering = sceneForStep(nextStep);
      if (!entering) return;

      fadeIn(entering);

      if (entering === 2) fadeOut(1);
      if (entering === 3) fadeOut(2);
    },
    [fadeIn, fadeOut]
  );

  const onReverseWheel = useCallback(
    (time: number) => {
      const scene = getActiveScene(time);
      if (!reverseFadeStartedRef.current) {
        fadeOut(scene);
        reverseFadeStartedRef.current = true;
      }
    },
    [fadeOut]
  );

  useEffect(() => {
    if (!isReverseScrubbing) {
      reverseFadeStartedRef.current = false;
      return;
    }

    const scene = getActiveScene(currentTime);
    if (scene !== activeSceneRef.current) {
      fadeIn(scene);
      fadeOut(activeSceneRef.current);
      activeSceneRef.current = scene;
    }
  }, [currentTime, fadeIn, fadeOut, isReverseScrubbing]);

  useEffect(() => {
    if (isTweening || isReverseScrubbing || isAnimating) return;
    applyOpacity(RESTING_OPACITY[wheelStep]);
  }, [applyOpacity, isAnimating, isReverseScrubbing, isTweening, wheelStep]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    opacity,
    onForwardStep,
    onReverseWheel,
  };
}
