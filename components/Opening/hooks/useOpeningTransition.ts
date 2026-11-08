"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OPENING_TRANSITION } from "../assets/constants";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useOpeningTransition(durationMs = OPENING_TRANSITION.durationMs) {
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const fromRef = useRef(0);
  const runningRef = useRef(false);
  const progressRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);

  const applyProgress = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    progressRef.current = clamped;
    setProgress(clamped);
  }, []);

  const cancel = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    runningRef.current = false;
    setRunning(false);
  }, []);

  const runAnimation = useCallback(
    (from: number, to: number, onDone: () => void) => {
      cancel();
      runningRef.current = true;
      setRunning(true);
      fromRef.current = from;
      startRef.current = performance.now();

      const tick = (now: number) => {
        const raw = Math.min(1, (now - startRef.current) / durationMs);
        const eased = easeInOutCubic(raw);
        applyProgress(fromRef.current + (to - fromRef.current) * eased);

        if (raw < 1) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        runningRef.current = false;
        setRunning(false);
        applyProgress(to);
        onDone();
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [applyProgress, cancel, durationMs]
  );

  const triggerForward = useCallback(() => {
    if (runningRef.current || complete) return false;
    runAnimation(0, 1, () => setComplete(true));
    return true;
  }, [complete, runAnimation]);

  const triggerReverse = useCallback(() => {
    if (runningRef.current || !complete) return false;
    setComplete(false);
    runAnimation(progressRef.current, 0, () => setComplete(false));
    return true;
  }, [complete, runAnimation]);

  const handleWheelDown = useCallback(
    (deltaY: number) => {
      if (deltaY < 1) return false;
      return triggerForward();
    },
    [triggerForward]
  );

  const handleWheelUp = useCallback(
    (deltaY: number) => {
      if (deltaY > -1) return false;
      return triggerReverse();
    },
    [triggerReverse]
  );

  useEffect(() => cancel, [cancel]);

  return {
    progress,
    running,
    complete,
    triggerForward,
    triggerReverse,
    handleWheelDown,
    handleWheelUp,
  };
}

/** Black bridge peaks mid-transition — zero at rest. */
export function getTransitionBridgeOpacity(progress: number): number {
  if (progress <= 0) return 0;
  return Math.sin(Math.min(1, progress) * Math.PI) * 0.52;
}
