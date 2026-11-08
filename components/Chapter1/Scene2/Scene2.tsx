"use client";

import ImageScrollColumn from "./ImageScrollColumn";
import { useScene2ImagesReady } from "./useScene2ImagesReady";

type Scene2Props = {
  overlayOpacity: number;
  suspendScroll?: boolean;
};

export default function Scene2({ overlayOpacity, suspendScroll = false }: Scene2Props) {
  const progress = overlayOpacity;
  const mounted = progress > 0.001;
  const imagesReady = useScene2ImagesReady();
  const active = progress > 0.35 && imagesReady && !suspendScroll;
  const scrollReveal = imagesReady && progress > 0.08;

  if (!mounted) return null;

  const headerStyle = {
    opacity: progress,
    transform: `translate3d(calc(-50% - 16vw), ${-18 * (1 - progress)}px, 0)`,
  } as const;

  const columnStyle = {
    opacity: scrollReveal ? progress : 0,
    visibility: scrollReveal ? ("visible" as const) : ("hidden" as const),
    transform: `translate3d(${22 * (1 - progress)}px, 0, 0)`,
  } as const;

  return (
    <section className="chapter1-scene chapter1-scene--2 scene2" aria-label="Scene 2">
      <header className="scene2__header" style={headerStyle}>
        <h2 className="scene2__chapter">
          <span className="scene2__chapter-paren">(</span>
          Chapter1_002
          <span className="scene2__chapter-paren">)</span>
        </h2>
        <p className="scene2__intro">
          Always
          <br />
          on
          <br />
          the set
        </p>
      </header>

      <div className="scene2__scroll-stage" style={columnStyle}>
        <ImageScrollColumn active={active} />
      </div>
    </section>
  );
}
