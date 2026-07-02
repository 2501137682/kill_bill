"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { SCENE_A } from "../assets/constants";

interface PressState {
  scale: number;
  shineOpacity: number;
  grainOpacity: number;
}

const RESET: PressState = {
  scale: 1,
  shineOpacity: 0,
  grainOpacity: 0,
};

function addFineDistortionNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  amount: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const radiusSq = radius * radius;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;

      const falloff = 1 - Math.sqrt(distSq) / radius;
      const influence = falloff * falloff * amount;
      const idx = (y * width + x) * 4;

      data[idx] = Math.min(255, Math.max(0, data[idx] + (Math.random() - 0.5) * influence));
      data[idx + 1] = Math.min(
        255,
        Math.max(0, data[idx + 1] + (Math.random() - 0.5) * influence)
      );
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function usePosterWrinkle(
  containerRef: React.RefObject<HTMLElement | null>,
  shineRef: React.RefObject<HTMLElement | null>,
  grainRef: React.RefObject<HTMLElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  filterImageRef: React.RefObject<SVGFEImageElement | null>,
  enabled: boolean
) {
  const stateRef = useRef<PressState>({ ...RESET });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const drawDisplacementMap = useCallback(
    (localX: number, localY: number, width: number, height: number, strength: number) => {
      const canvas = canvasRef.current;
      const filterImage = filterImageRef.current;
      if (!canvas || !filterImage) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const prev = prevMouseRef.current;
      const velocityX = localX - prev.x;
      const velocityY = localY - prev.y;
      prevMouseRef.current = { x: localX, y: localY };

      const dirX = Math.abs(velocityX) > 0.5 ? velocityX : localX - width * 0.5;
      const dirY = Math.abs(velocityY) > 0.5 ? velocityY : localY - height * 0.5;
      const dirLen = Math.hypot(dirX, dirY) || 1;
      const pushX = (dirX / dirLen) * SCENE_A.displaceAmount * strength;
      const pushY = (dirY / dirLen) * SCENE_A.displaceAmount * strength;

      ctx.fillStyle = "rgb(128, 128, 128)";
      ctx.fillRect(0, 0, width, height);

      const radius = SCENE_A.displaceRadius;
      const gradient = ctx.createRadialGradient(localX, localY, 0, localX, localY, radius);
      gradient.addColorStop(0, `rgb(${128 + pushX}, ${128 + pushY}, 128)`);
      gradient.addColorStop(0.22, `rgb(${128 + pushX * 0.55}, ${128 + pushY * 0.55}, 128)`);
      gradient.addColorStop(0.48, `rgb(${128 + pushX * 0.16}, ${128 + pushY * 0.16}, 128)`);
      gradient.addColorStop(1, "rgb(128, 128, 128)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      addFineDistortionNoise(
        ctx,
        width,
        height,
        localX,
        localY,
        radius * 0.72,
        SCENE_A.distortNoise
      );

      filterImage.setAttribute("href", canvas.toDataURL("image/png"));
    },
    [canvasRef, filterImageRef]
  );

  const applyTransform = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scale } = stateRef.current;
    el.style.transform = `scale(${scale})`;
  }, [containerRef]);

  const applyShine = useCallback(() => {
    const shine = shineRef.current;
    if (!shine) return;
    shine.style.opacity = String(stateRef.current.shineOpacity);
  }, [shineRef]);

  const applyGrain = useCallback(() => {
    const grain = grainRef.current;
    if (!grain) return;
    grain.style.opacity = String(stateRef.current.grainOpacity);
  }, [grainRef]);

  const applyFilter = useCallback(
    (active: boolean) => {
      const el = containerRef.current;
      if (!el) return;
      el.style.filter = active ? "url(#poster-hover-filter)" : "none";
    },
    [containerRef]
  );

  const scheduleDisplacement = useCallback(
    (localX: number, localY: number, width: number, height: number, strength: number) => {
      if (rafRef.current !== null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        drawDisplacementMap(localX, localY, width, height, strength);
      });
    },
    [drawDisplacementMap]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const originX = ((e.clientX - rect.left) / rect.width) * 100;
      const originY = ((e.clientY - rect.top) / rect.height) * 100;
      containerRef.current.style.transformOrigin = `${originX}% ${originY}%`;

      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const edgeDistance = Math.min(
        localX,
        rect.width - localX,
        localY,
        rect.height - localY
      );
      const edgeInfluence = Math.min(1, edgeDistance / SCENE_A.pressEdgeFalloff);
      const pressStrength = 0.55 + edgeInfluence * 0.45;

      if (shineRef.current) {
        shineRef.current.style.setProperty("--press-x", `${localX}px`);
        shineRef.current.style.setProperty("--press-y", `${localY}px`);
      }

      if (grainRef.current) {
        grainRef.current.style.setProperty("--press-x", `${localX}px`);
        grainRef.current.style.setProperty("--press-y", `${localY}px`);
      }

      applyFilter(true);
      scheduleDisplacement(localX, localY, rect.width, rect.height, pressStrength);

      tweenRef.current?.kill();

      stateRef.current = {
        scale: 1 + SCENE_A.pressScale * pressStrength,
        shineOpacity: SCENE_A.pressShineOpacity * pressStrength,
        grainOpacity: SCENE_A.grainOpacity * pressStrength,
      };

      applyTransform();
      applyShine();
      applyGrain();
    },
    [
      enabled,
      containerRef,
      shineRef,
      grainRef,
      applyTransform,
      applyShine,
      applyGrain,
      applyFilter,
      scheduleDisplacement,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(stateRef.current, {
      ...RESET,
      duration: 0.75,
      ease: "power2.inOut",
      onUpdate: () => {
        applyTransform();
        applyShine();
        applyGrain();
      },
      onComplete: () => {
        applyFilter(false);
      },
    });
  }, [enabled, applyTransform, applyShine, applyGrain, applyFilter]);

  return { handleMouseMove, handleMouseLeave };
}
