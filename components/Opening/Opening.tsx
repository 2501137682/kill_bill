"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import dynamic from "next/dynamic";
import SceneA from "./SceneA/SceneA";
import SceneB from "./SceneB/SceneB";
import type { Chapter1WheelApi } from "../Chapter1/Chapter1";
import { DURATION, easeOutBack, GSAP_EASE } from "./animations/easing";
import {
  getTransitionBridgeOpacity,
  useOpeningTransition,
} from "./hooks/useOpeningTransition";

const Chapter1 = dynamic(() => import("../Chapter1/Chapter1"), {
  ssr: false,
  loading: () => null,
});

function getChapter1EntryStyle(progress: number): React.CSSProperties {
  const t = easeOutBack(Math.min(1, Math.max(0, progress)));
  return {
    transform: `translate3d(0, ${(1 - t) * 100}%, 0) scale(${0.93 + t * 0.07})`,
    opacity: Math.min(1, progress * 1.2),
  };
}

export default function Opening() {
  const [showSceneA, setShowSceneA] = useState(true);
  const [showSceneB, setShowSceneB] = useState(false);
  const [sceneBReady, setSceneBReady] = useState(false);
  const [mountChapter1, setMountChapter1] = useState(false);

  const blackRef = useRef<HTMLDivElement>(null);
  const chapter1ApiRef = useRef<Chapter1WheelApi>({
    handleWheel: () => {},
    canExitToOpening: () => false,
  });

  const { progress, running, complete, handleWheelDown, handleWheelUp } =
    useOpeningTransition();

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
          setMountChapter1(true);
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

  const handleSceneBIntroComplete = useCallback(() => {
    setSceneBReady(true);
  }, []);

  const handleChapter1WheelReady = useCallback((api: Chapter1WheelApi) => {
    chapter1ApiRef.current = api;
  }, []);

  useEffect(() => {
    if (!showSceneB) return;

    const onWheel = (event: WheelEvent) => {
      if (running) {
        event.preventDefault();
        return;
      }

      if (complete) {
        if (event.deltaY < 0 && chapter1ApiRef.current.canExitToOpening()) {
          event.preventDefault();
          handleWheelUp(event.deltaY);
          return;
        }

        event.preventDefault();
        chapter1ApiRef.current.handleWheel(event.deltaY);
        return;
      }

      if (!sceneBReady) return;

      if (event.deltaY > 0) {
        event.preventDefault();
        handleWheelDown(event.deltaY);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [
    complete,
    handleWheelDown,
    handleWheelUp,
    running,
    sceneBReady,
    showSceneB,
  ]);

  const bridgeOpacity = getTransitionBridgeOpacity(progress);
  const washOpacity = progress > 0 ? Math.max(0, (1 - progress) * 0.42) : 0;
  const sceneBInteractive = progress < 0.001 && !running && !complete;

  return (
    <section className="opening">
      {showSceneA && <SceneA onComplete={handleSceneAComplete} />}

      {showSceneB && (
        <>
          {mountChapter1 && (
            <div
              className="opening__chapter1-layer"
              style={getChapter1EntryStyle(progress)}
              aria-hidden={progress <= 0.001 && !complete}
            >
              <Chapter1
                embedded
                wheelEnabled={false}
                onWheelReady={handleChapter1WheelReady}
              />
              <div
                className="opening__chapter1-wash"
                style={{ opacity: washOpacity }}
                aria-hidden
              />
            </div>
          )}

          <div
            className="opening__scene-b-layer"
            style={{
              pointerEvents: sceneBInteractive ? "auto" : "none",
              visibility: complete && !running ? "hidden" : "visible",
            }}
          >
            <SceneB
              exitProgress={progress}
              onIntroComplete={handleSceneBIntroComplete}
            />
          </div>

          {bridgeOpacity > 0.001 && (
            <div
              className="opening__transition-bridge"
              style={{ opacity: bridgeOpacity }}
              aria-hidden
            />
          )}
        </>
      )}

      <div ref={blackRef} className="opening__black" aria-hidden />
    </section>
  );
}
