"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ASSETS } from "../assets/constants";
import { DURATION } from "../animations/easing";
import { usePosterWrinkle } from "../hooks/usePosterWrinkle";

type SceneAState = "intro" | "paused" | "tear" | "done";

interface SceneAProps {
  onComplete: () => void;
}

export default function SceneA({ onComplete }: SceneAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterImageRef = useRef<SVGFEImageElement>(null);
  const introRef = useRef<HTMLVideoElement>(null);
  const tearRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<SceneAState>("intro");
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [showTear, setShowTear] = useState(false);
  const [tearVisible, setTearVisible] = useState(false);
  const clickedRef = useRef(false);

  const { handleMouseMove, handleMouseLeave } = usePosterWrinkle(
    containerRef,
    shineRef,
    grainRef,
    canvasRef,
    filterImageRef,
    hoverEnabled && state !== "tear" && state !== "done"
  );

  useEffect(() => {
    const video = introRef.current;
    const tearVideo = tearRef.current;
    if (!video) return;

    tearVideo?.load();

    const playIntro = async () => {
      try {
        await video.play();
      } catch {
        video.muted = true;
        await video.play();
      }
    };

    playIntro();

    const onEnded = () => {
      video.pause();
      setState("paused");
    };

    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, []);

  const handleClick = useCallback(() => {
    if (clickedRef.current || state !== "paused") return;
    clickedRef.current = true;
    setHoverEnabled(false);
    setState("tear");

    window.setTimeout(() => {
      setShowTear(true);
      const tearVideo = tearRef.current;
      if (!tearVideo) return;

      const onTearPlaying = () => {
        setTearVisible(true);
        tearVideo.removeEventListener("playing", onTearPlaying);
      };

      tearVideo.addEventListener("playing", onTearPlaying);
      tearVideo.currentTime = 0;
      tearVideo.play().catch(() => {});

      const onTearEnded = () => {
        setState("done");
        onComplete();
        tearVideo.removeEventListener("ended", onTearEnded);
      };

      tearVideo.addEventListener("ended", onTearEnded);
    }, DURATION.clickDelay * 1000);
  }, [state, onComplete]);

  return (
    <div
      className="scene-a"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="scene-a__filter-defs" aria-hidden="true">
        <defs>
          <filter
            id="poster-hover-filter"
            x="-4%"
            y="-4%"
            width="108%"
            height="108%"
            colorInterpolationFilters="sRGB"
          >
            <feImage ref={filterImageRef} result="dispMap" preserveAspectRatio="none" />
            <feGaussianBlur in="dispMap" stdDeviation="18" result="dispMapSoft" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMapSoft"
              scale="1"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <canvas ref={canvasRef} className="scene-a__disp-canvas" aria-hidden="true" />

      <div ref={containerRef} className="scene-a__poster">
        <video
          ref={introRef}
          className="scene-a__video"
          src={ASSETS.video.openingPoster}
          muted
          playsInline
          autoPlay
          preload="auto"
          style={{ opacity: tearVisible ? 0 : 1 }}
        />
        <video
          ref={tearRef}
          className="scene-a__video scene-a__video--tear"
          src={ASSETS.video.tearAnimation}
          muted
          playsInline
          preload="auto"
          style={{ opacity: tearVisible ? 1 : 0, visibility: showTear ? "visible" : "hidden" }}
        />
        <div ref={grainRef} className="scene-a__film-grain" aria-hidden="true" />
        <div ref={shineRef} className="scene-a__press-shine" aria-hidden="true" />
      </div>
    </div>
  );
}
