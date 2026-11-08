"use client";

import { useEffect, useRef } from "react";
import VideoBackground from "./VideoBackground";
import Scene1 from "./Scene1/Scene1";
import Scene2 from "./Scene2/Scene2";
import Scene3 from "./Scene3/Scene3";
import { preloadScene2Images } from "./Scene2/preloadScene2Images";
import { useChapter1Overlay } from "./hooks/useChapter1Overlay";
import { useScrollVideo } from "./hooks/useScrollVideo";

export type Chapter1WheelApi = {
  handleWheel: (deltaY: number) => void;
  canExitToOpening: () => boolean;
};

type Chapter1Props = {
  embedded?: boolean;
  wheelEnabled?: boolean;
  onWheelReady?: (api: Chapter1WheelApi) => void;
};

export default function Chapter1({
  embedded = false,
  wheelEnabled = true,
  onWheelReady,
}: Chapter1Props) {
  const overlayBridgeRef = useRef({
    onForwardStep: (_step: 0 | 1 | 2 | 3) => {},
    onReverseWheel: (_time: number) => {},
  });

  const {
    videoRef,
    scrollRootRef,
    activeScene,
    isReady,
    currentTime,
    wheelStep,
    isTweening,
    isReverseScrubbing,
    handleWheelIntent,
  } = useScrollVideo({
    wheelEnabled,
    onWheelReady,
    onForwardStep: (step) => overlayBridgeRef.current.onForwardStep(step),
    onReverseWheel: (time) => overlayBridgeRef.current.onReverseWheel(time),
  });

  const { opacity, onForwardStep, onReverseWheel } = useChapter1Overlay({
    currentTime,
    isReverseScrubbing,
    wheelStep,
    isTweening,
  });

  overlayBridgeRef.current = { onForwardStep, onReverseWheel };

  useEffect(() => {
    void preloadScene2Images();
  }, []);

  return (
    <div
      className={`chapter1 scene-${activeScene}${isReady ? " chapter1--ready" : ""}${
        embedded ? " chapter1--embedded" : ""
      }`}
      data-scene={activeScene}
      data-time={currentTime.toFixed(2)}
    >
      <div ref={scrollRootRef} className="chapter1__scroll-root chapter1__scroll-root--wheel">
        <div className="chapter1__pin">
          <VideoBackground ref={videoRef} />

          <div className="chapter1__overlay" aria-hidden={false}>
            <Scene1
              overlayOpacity={opacity[1]}
              onWheelIntent={handleWheelIntent}
              suspendCanvas={isTweening && wheelStep >= 2}
            />
            <Scene2 overlayOpacity={opacity[2]} suspendScroll={isTweening} />
            <Scene3 overlayOpacity={opacity[3]} />
          </div>
        </div>
      </div>
    </div>
  );
}
