"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { DURATION, GSAP_EASE } from "../animations/easing";

interface BackgroundHighlightProps {
  active: boolean;
  mouseX: number;
  mouseY: number;
}

export default function BackgroundHighlight({
  active,
  mouseX,
  mouseY,
}: BackgroundHighlightProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const strengthRef = useRef({ value: 0 });

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    el.style.setProperty("--light-x", `${mouseX}px`);
    el.style.setProperty("--light-y", `${mouseY}px`);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const tween = gsap.to(strengthRef.current, {
      value: active ? 1 : 0,
      duration: active ? 0.35 : DURATION.lightFade,
      ease: GSAP_EASE.cinematic,
      onUpdate() {
        el.style.setProperty("--spotlight-strength", String(strengthRef.current.value));
      },
    });

    return () => {
      tween.kill();
    };
  }, [active]);

  return <div ref={overlayRef} className="scene-b__overlay" aria-hidden />;
}
