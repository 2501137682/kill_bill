"use client";

import { forwardRef, useCallback, useState } from "react";

interface TitleLetterProps {
  char: string;
  backgroundImage: string;
  enabled: boolean;
  onHoverStart: (x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverEnd: () => void;
}

const TitleLetter = forwardRef<HTMLSpanElement, TitleLetterProps>(
  function TitleLetter(
    {
      char,
      backgroundImage,
      enabled,
      onHoverStart,
      onHoverMove,
      onHoverEnd,
    },
    ref
  ) {
    const [hovered, setHovered] = useState(false);
    const showImage = enabled && hovered;

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (!enabled) return;
        setHovered(true);
        onHoverStart(e.clientX, e.clientY);
      },
      [enabled, onHoverStart]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (!enabled) return;
        onHoverMove(e.clientX, e.clientY);
      },
      [enabled, onHoverMove]
    );

    const handleMouseLeave = useCallback(() => {
      if (!enabled) return;
      setHovered(false);
      onHoverEnd();
    }, [enabled, onHoverEnd]);

    return (
      <span
        ref={ref}
        className={`scene-b__letter${showImage ? " scene-b__letter--hovered" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <span
          className="scene-b__letter-glyph"
          style={
            showImage
              ? { backgroundImage: `url(${backgroundImage})` }
              : undefined
          }
          aria-hidden
        >
          {char}
        </span>
        <span className="sr-only">{char}</span>
      </span>
    );
  }
);

export default TitleLetter;
