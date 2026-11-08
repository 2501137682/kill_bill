"use client";

import { useMemo } from "react";
import { getScene1Progress } from "../assets/constants";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useScene1Reveal(currentTime: number, isReverseScrubbing: boolean) {
  const raw = getScene1Progress(currentTime);
  const progress = useMemo(() => {
    if (isReverseScrubbing) return raw;
    return easeOutCubic(raw);
  }, [isReverseScrubbing, raw]);

  const mounted = progress > 0.001;

  return { progress, mounted };
}
