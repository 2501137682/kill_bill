"use client";

import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import SceneA from "./SceneA/SceneA";
import SceneB from "./SceneB/SceneB";
import { DURATION, GSAP_EASE } from "./animations/easing";

export default function Opening() {
  const [showSceneA, setShowSceneA] = useState(true);
  const [showSceneB, setShowSceneB] = useState(false);
  const blackRef = useRef<HTMLDivElement>(null);

  const handleSceneAComplete = useCallback(() => {
    const overlay = blackRef.current;
    if (!overlay) return;

    gsap.fromTo(
      overlay,
      { opacity: 0 },
      {
        opacity: 1,
        duration: DURATION.fadeBlack,
        ease: GSAP_EASE.cinematic,
        onComplete: () => {
          setShowSceneA(false);
          setShowSceneB(true);
          gsap.to(overlay, {
            opacity: 0,
            duration: DURATION.backgroundReveal,
            ease: GSAP_EASE.cinematic,
            delay: 0.05,
          });
        },
      }
    );
  }, []);

  return (
    <section className="opening">
      {showSceneA && <SceneA onComplete={handleSceneAComplete} />}
      {showSceneB && <SceneB />}
      <div ref={blackRef} className="opening__black" aria-hidden />
    </section>
  );
}
