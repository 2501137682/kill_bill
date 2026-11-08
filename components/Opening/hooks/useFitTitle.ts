"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseFitTitleOptions {
  maxWidthRatio?: number;
  maxHeightRatio?: number;
  minSize?: number;
  maxSize?: number;
}

async function waitForLayoutReady(container: HTMLElement, track: HTMLElement) {
  await document.fonts.ready;

  if (document.fonts?.load) {
    const style = getComputedStyle(track);
    const family = style.fontFamily.split(",")[0]?.trim() || style.fontFamily;
    const probe = `${style.fontWeight} 100px ${family}`;
    try {
      await document.fonts.load(probe);
    } catch {
      // Ignore font load failures and fall back to ready state.
    }
  }

  // Wait until the container has a real layout width (avoids cold-start size = minSize).
  for (let i = 0; i < 60; i++) {
    if (container.clientWidth >= 50) break;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  // Two extra frames so glyph metrics settle after the font swap.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export function useFitTitle(
  containerRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
  options: UseFitTitleOptions = {}
) {
  const {
    maxWidthRatio = 0.998,
    maxHeightRatio = 0.97,
    minSize = 48,
    maxSize = 960,
  } = options;

  const fits = useCallback(
    (track: HTMLElement, maxWidth: number, maxHeight: number) => {
      // Width: scrollWidth reflects full text width (ignores max-width clipping).
      // Height: getBoundingClientRect includes the scaleY(1.32) transform on the track.
      const { height } = track.getBoundingClientRect();
      return track.scrollWidth <= maxWidth && height <= maxHeight;
    },
    []
  );

  const fit = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return false;

    const containerWidth = container.clientWidth;
    if (containerWidth < 50) return false;

    const maxWidth = containerWidth * maxWidthRatio;
    const maxHeight = window.innerHeight * maxHeightRatio;

    let size = minSize;
    track.style.fontSize = `${size}px`;

    while (size < maxSize) {
      const next = size + 2;
      track.style.fontSize = `${next}px`;
      if (!fits(track, maxWidth, maxHeight)) break;
      size = next;
    }

    while (size > minSize && !fits(track, maxWidth, maxHeight)) {
      size -= 1;
      track.style.fontSize = `${size}px`;
    }

    return true;
  }, [containerRef, trackRef, maxWidthRatio, maxHeightRatio, minSize, maxSize, fits]);

  const fitGeneration = useRef(0);

  const scheduleFit = useCallback(() => {
    const generation = ++fitGeneration.current;

    void (async () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      await waitForLayoutReady(container, track);
      if (generation !== fitGeneration.current) return;

      fit();
    })();
  }, [containerRef, trackRef, fit]);

  useEffect(() => {
    scheduleFit();

    const observer = new ResizeObserver(scheduleFit);
    const container = containerRef.current;
    const track = trackRef.current;
    if (container) observer.observe(container);
    if (track) observer.observe(track);

    window.addEventListener("resize", scheduleFit);
    return () => {
      fitGeneration.current += 1;
      observer.disconnect();
      window.removeEventListener("resize", scheduleFit);
    };
  }, [scheduleFit, containerRef, trackRef]);

  return scheduleFit;
}
