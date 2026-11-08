"use client";

import Image from "next/image";
import { SCENE3 } from "../assets/constants";
import FlowingMenu from "./FlowingMenu";

type Scene3Props = {
  overlayOpacity: number;
};

export default function Scene3({ overlayOpacity }: Scene3Props) {
  const progress = overlayOpacity;
  const mounted = progress > 0.001;

  if (!mounted) return null;

  const cardStyle = {
    opacity: progress,
    transform: `translate3d(-38%, ${20 * (1 - progress)}px, 0) scale(${0.96 + progress * 0.04})`,
  } as const;

  const cornerStyle = {
    opacity: progress,
    transform: `scale(${0.95 + progress * 0.05})`,
  } as const;

  return (
    <section className="chapter1-scene chapter1-scene--3 scene3" aria-label="Scene 3">
      <article className="scene3__card" style={cardStyle}>
        <h2 className="scene3__card-title">Chapter1_003</h2>
        <p className="scene3__card-quote">
          borrowed from
          <br />
          so many
          <br />
          films
        </p>
      </article>

      <FlowingMenu progress={progress} />

      <div className="scene3__corner-image" style={cornerStyle}>
        <Image
          src={SCENE3.cornerImage}
          alt=""
          fill
          sizes="(max-width: 768px) 48vw, 36vw"
          className="scene3__corner-img"
        />
      </div>
    </section>
  );
}
