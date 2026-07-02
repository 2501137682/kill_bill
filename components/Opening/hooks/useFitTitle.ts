"use client";

import { useEffect, useCallback } from "react";

interface UseFitTitleOptions {
  maxWidthRatio?: number;
  maxHeightRatio?: number;
  minSize?: number;
  maxSize?: number;
  heightScale?: number;
}

export function useFitTitle(
  containerRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
  options: UseFitTitleOptions = {}
) {
  const {
    maxWidthRatio = 0.96,
    maxHeightRatio = 0.72,
    minSize = 48,
    maxSize = 600,
    heightScale = 1,
  } = options;

  const fit = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const maxWidth = container.clientWidth * maxWidthRatio;
    const maxHeight = window.innerHeight * maxHeightRatio;

    let size = minSize;
    track.style.fontSize = `${size}px`;

    while (
      track.scrollWidth < maxWidth &&
      track.scrollHeight * heightScale < maxHeight &&
      size < maxSize
    ) {
      size += 2;
      track.style.fontSize = `${size}px`;
    }

    while (
      (track.scrollWidth > maxWidth || track.scrollHeight * heightScale > maxHeight) &&
      size > minSize
    ) {
      size -= 1;
      track.style.fontSize = `${size}px`;
    }
  }, [containerRef, trackRef, maxWidthRatio, maxHeightRatio, minSize, maxSize, heightScale]);

  useEffect(() => {
    let cancelled = false;

    const runFit = () => {
      if (!cancelled) fit();
    };

    runFit();
    document.fonts?.ready.then(runFit);

    const observer = new ResizeObserver(runFit);
    if (containerRef.current) observer.observe(containerRef.current);

    window.addEventListener("resize", runFit);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", runFit);
    };
  }, [fit, containerRef]);
}
