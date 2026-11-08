"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ASSETS, METADATA, SCENE_B, TITLE_LETTERS } from "../assets/constants";
import { DURATION, easeInCubic, GSAP_EASE } from "../animations/easing";
import { useFitTitle } from "../hooks/useFitTitle";
import TitleLetter from "./TitleLetter";
import BackgroundHighlight from "./BackgroundHighlight";

const TITLE_BASE_SCALE_Y = 1.32;
const TITLE_SCALE = SCENE_B.titleScale;
const TITLE_REST_SCALE_X = TITLE_SCALE;
const TITLE_REST_SCALE_Y = TITLE_BASE_SCALE_Y * TITLE_SCALE;

type SceneBProps = {
  exitProgress?: number;
  onIntroComplete?: () => void;
};

export default function SceneB({ exitProgress = 0, onIntroComplete }: SceneBProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleTrackRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const creditRef = useRef<HTMLParagraphElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lettersResetRef = useRef(false);

  const refitTitle = useFitTitle(titleRef, titleTrackRef, SCENE_B.titleFit);

  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const introDoneRef = useRef(false);
  const isExiting = exitProgress > 0.001;
  const interactionEnabled = hoverEnabled && exitProgress < 0.001;

  useEffect(() => {
    const bg = bgRef.current;
    const title = titleRef.current;
    const meta = metaRef.current;
    const credit = creditRef.current;
    if (!bg || !title || !meta || !credit) return;

    let ctx: gsap.Context | undefined;

    const initAnimation = () => {
      const letterEls = letterRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null
      );
      if (letterEls.length !== TITLE_LETTERS.length) {
        requestAnimationFrame(initAnimation);
        return;
      }

      refitTitle();

      ctx?.revert();
      ctx = gsap.context(() => {
        gsap.set(bg, { opacity: 0 });
        gsap.set(title, { opacity: 1 });
        gsap.set(meta, { opacity: 0 });
        gsap.set(credit, { opacity: 1, clipPath: "inset(0 100% 0 0)" });
        gsap.set(titleTrackRef.current, {
          y: 0,
          scaleX: TITLE_REST_SCALE_X,
          scaleY: TITLE_REST_SCALE_Y,
          opacity: 1,
          transformOrigin: "50% 0%",
        });
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

        const creditStart =
          waveEnd + (TITLE_LETTERS.length - 1) * DURATION.letterColorStagger;

        tl.to(
          credit,
          {
            clipPath: "inset(0 0% 0 0)",
            duration: DURATION.creditReveal,
            ease: GSAP_EASE.smooth,
          },
          creditStart
        );

        tl.call(
          () => {
            setHoverEnabled(true);
            if (!introDoneRef.current) {
              introDoneRef.current = true;
              onIntroComplete?.();
            }
          },
          undefined,
          colorEnd
        );
      });
    };

    initAnimation();

    return () => {
      ctx?.revert();
    };
  }, [onIntroComplete, refitTitle]);

  useLayoutEffect(() => {
    const track = titleTrackRef.current;
    const bg = bgRef.current;
    const meta = metaRef.current;
    const credit = creditRef.current;
    if (!track || !bg || !meta || !credit) return;

    if (exitProgress > 0.001) {
      if (!lettersResetRef.current) {
        lettersResetRef.current = true;
        const letterEls = letterRefs.current.filter(
          (el): el is HTMLSpanElement => el !== null
        );
        gsap.set(letterEls, { y: 0, scaleY: 1, clearProps: "transform" });
      }

      const e = easeInCubic(exitProgress);

      gsap.set(track, {
        transformOrigin: "50% 0%",
        y: `${-e * 46}vh`,
        scaleX: TITLE_REST_SCALE_X + e * 0.36,
        scaleY: Math.max(0.05, TITLE_REST_SCALE_Y * (1 - e * 0.96)),
        opacity: 1 - e,
        filter: `blur(${e * 9}px)`,
      });
      gsap.set(bg, { opacity: 1 - e });
      gsap.set(meta, { opacity: 1 - e });
      gsap.set(credit, { opacity: 1 - e });
      return;
    }

    if (lettersResetRef.current) {
      lettersResetRef.current = false;
      gsap.set(track, {
        y: 0,
        scaleX: TITLE_REST_SCALE_X,
        scaleY: TITLE_REST_SCALE_Y,
        opacity: 1,
        filter: "none",
        transformOrigin: "50% 0%",
      });
      gsap.set(bg, { opacity: 1 });
      gsap.set(meta, { opacity: 1 });
      gsap.set(credit, { opacity: 1 });
    }
  }, [exitProgress]);

  useEffect(() => {
    if (!isExiting) return;
    setHighlightActive(false);
  }, [isExiting]);

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
      className={`scene-b${isExiting ? " scene-b--exiting" : ""}`}
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
          active={highlightActive && !isExiting}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
        />
      </div>

      <div ref={metaRef} className="scene-b__metadata">
        {METADATA.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>

      <h1
        ref={titleRef}
        className="scene-b__title"
        aria-label="Kill Bill"
        style={{ transform: `translateY(${SCENE_B.titleOffsetY})` }}
      >
        <span ref={titleTrackRef} className="scene-b__title-track">
          {TITLE_LETTERS.map((letter, index) => (
            <TitleLetter
              key={`${letter.char}-${index}`}
              ref={(el) => {
                letterRefs.current[index] = el;
              }}
              char={letter.char}
              backgroundImage={letter.image}
              imagePosition={letter.imagePosition}
              enabled={interactionEnabled}
              onHoverStart={handleHoverStart}
              onHoverMove={handleHoverMove}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </span>
      </h1>

      <p ref={creditRef} className="scene-b__credit" aria-label={SCENE_B.credit}>
        {SCENE_B.credit.split(" ").map((word) => (
          <span key={word}>{word}</span>
        ))}
      </p>
    </div>
  );
}
