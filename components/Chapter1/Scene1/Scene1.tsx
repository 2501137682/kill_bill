"use client";

import dynamic from "next/dynamic";

const DirectorCardCanvas = dynamic(() => import("./DirectorCardCanvas"), {
  ssr: false,
  loading: () => null,
});

type Scene1Props = {
  overlayOpacity: number;
  onWheelIntent: (deltaY: number) => void;
  suspendCanvas?: boolean;
};

export default function Scene1({
  overlayOpacity,
  onWheelIntent,
  suspendCanvas = false,
}: Scene1Props) {
  const progress = overlayOpacity;
  const mounted = progress > 0.001;

  if (!mounted) return null;

  const enterStyle = {
    opacity: progress,
    transform: `translateY(${-20 * (1 - progress)}px)`,
  } as const;

  return (
    <section
      className="chapter1-scene chapter1-scene--1 scene1"
      aria-label="Scene 1"
      data-enter={progress.toFixed(3)}
    >
      <header className="scene1__header" style={enterStyle}>
        <h2 className="scene1__chapter">Chapter1_001</h2>
        <div className="scene1__rule" />
        <p className="scene1__quote">
          I love movies so much,
          <br />
          I decided to make a few of my own.
        </p>
      </header>

      <p
        className="scene1__drag-hint"
        style={{
          opacity: progress,
          transform: `translateY(${-16 * (1 - progress)}px)`,
        }}
      >
        Drag Me!
      </p>

      <div className="scene1__card-stage" style={{ opacity: progress }}>
        {progress > 0.05 && !suspendCanvas && (
          <DirectorCardCanvas onWheelIntent={onWheelIntent} />
        )}
      </div>
    </section>
  );
}
