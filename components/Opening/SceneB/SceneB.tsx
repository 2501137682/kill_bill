"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ASSETS, METADATA, SCENE_B, TITLE_LETTERS } from "../assets/constants";
import { DURATION, GSAP_EASE } from "../animations/easing";
import { useFitTitle } from "../hooks/useFitTitle";
import TitleLetter from "./TitleLetter";
import BackgroundHighlight from "./BackgroundHighlight";

export default function SceneB() {
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleTrackRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useFitTitle(titleRef, titleTrackRef, {
    maxWidthRatio: 0.998,
    maxHeightRatio: 0.97,
    maxSize: 960,
    heightScale: 1.32,
  });

  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const bg = bgRef.current;
    const title = titleRef.current;
    const meta = metaRef.current;
    if (!bg || !title || !meta) return;

    const letterEls = letterRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    if (letterEls.length !== TITLE_LETTERS.length) return;

    const ctx = gsap.context(() => {
      gsap.set(bg, { opacity: 0 });
      gsap.set(title, { opacity: 1 });
      gsap.set(meta, { opacity: 0 });
      gsap.set(letterEls, {
        opacity: 0,
        y: 140,
        scaleY: 0.35,
        transformOrigin: "50% 100%",
        "--letter-color": SCENE_B.letterRed,
      });

      const tl = gsap.timeline();

      tl.to(bg, {
        opacity: 1,
        duration: DURATION.backgroundReveal,
        ease: GSAP_EASE.cinematic,
      }).to(
        meta,
        {
          opacity: 1,
          duration: DURATION.metadataFade,
          ease: GSAP_EASE.smooth,
        },
        0
      );

      letterEls.forEach((el, index) => {
        const waveStart = index * DURATION.letterWaveStagger;

        tl.to(
          el,
          {
            opacity: 1,
            y: -42,
            scaleY: 1.1,
            duration: DURATION.letterWaveRise,
            ease: "power3.out",
          },
          waveStart
        )
          .to(
            el,
            {
              y: 16,
              scaleY: 0.94,
              duration: DURATION.letterWaveRise * 0.55,
              ease: "power2.inOut",
            },
            waveStart + DURATION.letterWaveRise * 0.72
          )
          .to(
            el,
            {
              y: 0,
              scaleY: 1,
              duration: DURATION.letterWaveSettle,
              ease: "power2.out",
            },
            waveStart + DURATION.letterWaveRise * 1.15
          );
      });

      const waveEnd =
        (TITLE_LETTERS.length - 1) * DURATION.letterWaveStagger +
        DURATION.letterWaveRise * 1.15 +
        DURATION.letterWaveSettle;

      letterEls.forEach((el, index) => {
        tl.to(
          el,
          {
            "--letter-color": SCENE_B.letterYellow,
            duration: DURATION.letterColorShift,
            ease: "none",
          },
          waveEnd + index * DURATION.letterColorStagger
        );
      });

      const colorEnd =
        waveEnd +
        (TITLE_LETTERS.length - 1) * DURATION.letterColorStagger +
        DURATION.letterColorShift;

      tl.call(() => setHoverEnabled(true), undefined, colorEnd);
    });

    return () => ctx.revert();
  }, []);

  const handleHoverStart = (x: number, y: number) => {
    setMousePos({ x, y });
    setHighlightActive(true);
  };

  const handleHoverMove = (x: number, y: number) => {
    setMousePos({ x, y });
  };

  const handleHoverEnd = () => {
    setHighlightActive(false);
  };

  return (
    <div
      className="scene-b"
      style={
        {
          "--spotlight-radius": `${SCENE_B.spotlightRadius}px`,
        } as React.CSSProperties
      }
    >
      <div
        ref={bgRef}
        className="scene-b__background"
        style={{ backgroundImage: `url(${ASSETS.images.sceneBBackground})` }}
      >
        <BackgroundHighlight
          active={highlightActive}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
        />
      </div>

      <div ref={metaRef} className="scene-b__metadata">
        {METADATA.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>

      <h1 ref={titleRef} className="scene-b__title" aria-label="Kill Bill">
        <span ref={titleTrackRef} className="scene-b__title-track">
          {TITLE_LETTERS.map((letter, index) => (
            <TitleLetter
              key={`${letter.char}-${index}`}
              ref={(el) => {
                letterRefs.current[index] = el;
              }}
              char={letter.char}
              backgroundImage={letter.image}
              enabled={hoverEnabled}
              onHoverStart={handleHoverStart}
              onHoverMove={handleHoverMove}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </span>
      </h1>
    </div>
  );
}
