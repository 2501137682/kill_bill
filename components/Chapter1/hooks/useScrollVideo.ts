"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canAdvanceForward,
  CHAPTER1_SEGMENTS,
  getTimeDeltaFromWheel,
  getTweenMsForStep,
  PAUSE_EPS,
  SCENE1,
  SCENE3,
  syncStepFromTime,
  type Chapter1Scene,
  type Chapter1WheelStep,
} from "../assets/constants";

type UseScrollVideoOptions = {
  wheelEnabled?: boolean;
  onForwardStep?: (nextStep: Chapter1WheelStep) => void;
  onReverseWheel?: (time: number) => void;
  onWheelReady?: (api: {
    handleWheel: (deltaY: number) => void;
    canExitToOpening: () => boolean;
  }) => void;
};

type UseScrollVideoResult = {
  videoRef: React.RefObject<HTMLVideoElement>;
  scrollRootRef: React.RefObject<HTMLDivElement>;
  currentTime: number;
  wheelStep: Chapter1WheelStep;
  activeScene: Chapter1Scene;
  isReady: boolean;
  isTweening: boolean;
  isReverseScrubbing: boolean;
  handleWheelIntent: (deltaY: number) => void;
};

function getActiveSceneFromTime(time: number): Chapter1Scene {
  if (time < SCENE1.revealAt + 0.05) return 1;
  if (time < SCENE3.enterAt + 0.05) return 2;
  return 3;
}

function scheduleFrame(video: HTMLVideoElement, cb: () => void): number {
  if ("requestVideoFrameCallback" in video) {
    return video.requestVideoFrameCallback(() => cb()) as unknown as number;
  }
  return requestAnimationFrame(cb);
}

function cancelFrame(video: HTMLVideoElement, id: number) {
  if ("cancelVideoFrameCallback" in video) {
    (video as HTMLVideoElement & { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(id);
    return;
  }
  cancelAnimationFrame(id);
}

export function useScrollVideo(options: UseScrollVideoOptions = {}): UseScrollVideoResult {
  const wheelEnabled = options.wheelEnabled ?? true;
  const onWheelReady = options.onWheelReady;
  const onForwardStep = options.onForwardStep;
  const onReverseWheel = options.onReverseWheel;

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const wheelStepRef = useRef<Chapter1WheelStep>(0);
  const highestStepRef = useRef<Chapter1WheelStep>(0);
  const scrubTimeRef = useRef(0);
  const isTweeningRef = useRef(false);
  const isReverseScrubbingRef = useRef(false);
  const tweenFrameRef = useRef(0);
  const tweenTargetRef = useRef(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [wheelStep, setWheelStep] = useState<Chapter1WheelStep>(0);
  const [activeScene, setActiveScene] = useState<Chapter1Scene>(1);
  const [isReady, setIsReady] = useState(false);
  const [isTweening, setIsTweening] = useState(false);
  const [isReverseScrubbing, setIsReverseScrubbing] = useState(false);

  const stopTweenMotion = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      cancelFrame(video, tweenFrameRef.current);
      video.pause();
      video.playbackRate = 1;
    }
  }, []);

  const applyStepState = useCallback((time: number, step: Chapter1WheelStep) => {
    wheelStepRef.current = step;
    setWheelStep(step);
    if (step > highestStepRef.current) {
      highestStepRef.current = step;
    }
    scrubTimeRef.current = time;
    setCurrentTime(time);
    setActiveScene(getActiveSceneFromTime(time));
  }, []);

  const commitVideoTime = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      const clamped = Math.max(0, time);
      video.pause();
      video.playbackRate = 1;
      video.currentTime = clamped;

      const step = syncStepFromTime(clamped);
      applyStepState(clamped, step);
    },
    [applyStepState]
  );

  const applyScrubTime = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      const maxTime = CHAPTER1_SEGMENTS[highestStepRef.current].time;
      const clamped = Math.max(0, Math.min(maxTime, time));

      video.pause();
      video.playbackRate = 1;
      video.currentTime = clamped;

      const step = syncStepFromTime(clamped);
      applyStepState(clamped, step);

      if (clamped <= 0.001) {
        isReverseScrubbingRef.current = false;
        setIsReverseScrubbing(false);
      }
    },
    [applyStepState]
  );

  const finishTween = useCallback(
    (time: number) => {
      isTweeningRef.current = false;
      setIsTweening(false);
      isReverseScrubbingRef.current = false;
      setIsReverseScrubbing(false);
      commitVideoTime(time);
    },
    [commitVideoTime]
  );

  const runSeekTween = useCallback(
    (from: number, to: number, durationMs: number, onDone: (time: number) => void) => {
      const video = videoRef.current;
      if (!video) return;

      stopTweenMotion();
      video.pause();
      video.playbackRate = 1;
      video.currentTime = from;
      scrubTimeRef.current = from;
      tweenTargetRef.current = to;

      const start = performance.now();

      const tick = () => {
        if (!isTweeningRef.current) return;

        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        const nextTime = from + (to - from) * t;

        if (Math.abs(video.currentTime - nextTime) > 0.01) {
          video.currentTime = nextTime;
        }
        scrubTimeRef.current = nextTime;

        if (t < 1) {
          tweenFrameRef.current = scheduleFrame(video, tick);
          return;
        }

        video.currentTime = to;
        scrubTimeRef.current = to;
        onDone(to);
      };

      tweenFrameRef.current = scheduleFrame(video, tick);
    },
    [stopTweenMotion]
  );

  const runForwardPlayback = useCallback(
    (from: number, to: number, durationMs: number, nextStep: Chapter1WheelStep) => {
      const video = videoRef.current;
      if (!video) return;

      stopTweenMotion();
      isReverseScrubbingRef.current = false;
      setIsReverseScrubbing(false);
      isTweeningRef.current = true;
      setIsTweening(true);

      highestStepRef.current = Math.max(highestStepRef.current, nextStep) as Chapter1WheelStep;
      wheelStepRef.current = nextStep;
      setWheelStep(nextStep);

      const span = Math.max(0.001, to - from);
      const rate = Math.min(2.5, span / (durationMs / 1000));

      video.currentTime = from;
      scrubTimeRef.current = from;
      tweenTargetRef.current = to;
      video.playbackRate = rate;

      let stallCount = 0;
      let lastTime = from;

      const watch = () => {
        if (!isTweeningRef.current) return;

        const t = video.currentTime;
        scrubTimeRef.current = t;

        if (t >= tweenTargetRef.current - 0.03) {
          finishTween(tweenTargetRef.current);
          return;
        }

        if (Math.abs(t - lastTime) < 0.004) {
          stallCount += 1;
        } else {
          stallCount = 0;
        }
        lastTime = t;

        if (video.paused || stallCount > 8) {
          const remaining = Math.max(0.001, tweenTargetRef.current - t);
          const remainingMs = Math.max(
            180,
            Math.round(durationMs * (remaining / span))
          );
          runSeekTween(t, tweenTargetRef.current, remainingMs, finishTween);
          return;
        }

        tweenFrameRef.current = scheduleFrame(video, watch);
      };

      const startSeekFallback = () => {
        runSeekTween(from, to, durationMs, finishTween);
      };

      void video
        .play()
        .then(() => {
          tweenFrameRef.current = scheduleFrame(video, watch);
        })
        .catch(startSeekFallback);
    },
    [finishTween, runSeekTween, stopTweenMotion]
  );

  const handleReverseScrub = useCallback(
    (deltaY: number) => {
      if (!videoRef.current) return;

      stopTweenMotion();
      isTweeningRef.current = false;
      setIsTweening(false);
      isReverseScrubbingRef.current = true;
      setIsReverseScrubbing(true);

      const vh = window.innerHeight || 800;
      const nextTime = scrubTimeRef.current + getTimeDeltaFromWheel(deltaY, vh);
      applyScrubTime(nextTime);
    },
    [applyScrubTime, stopTweenMotion]
  );

  const handleWheelIntent = useCallback(
    (deltaY: number) => {
      if (!isReady || Math.abs(deltaY) < 1) return;
      if (isTweeningRef.current) return;

      const scrollingDown = deltaY > 0;
      const time = scrubTimeRef.current;
      const step = syncStepFromTime(time);

      wheelStepRef.current = step;
      setWheelStep(step);

      if (scrollingDown && step < 3) {
        if (!canAdvanceForward(time, step)) return;

        const nextStep = (step + 1) as Chapter1WheelStep;
        const from = time;
        const to = CHAPTER1_SEGMENTS[nextStep].time;
        const segmentStart = CHAPTER1_SEGMENTS[step].time;
        const fullSpan = Math.max(PAUSE_EPS, to - segmentStart);
        const remainingSpan = Math.max(0.001, to - from);
        const durationMs = Math.max(
          120,
          Math.round(getTweenMsForStep(step) * (remainingSpan / fullSpan))
        );

        onForwardStep?.(nextStep);
        runForwardPlayback(from, to, durationMs, nextStep);
        return;
      }

      if (!scrollingDown && highestStepRef.current > 0 && time > 0.001) {
        onReverseWheel?.(time);
        handleReverseScrub(deltaY);
      }
    },
    [handleReverseScrub, isReady, onForwardStep, onReverseWheel, runForwardPlayback]
  );

  const canExitToOpening = useCallback(() => {
    return (
      isReady &&
      syncStepFromTime(scrubTimeRef.current) === 0 &&
      !isTweeningRef.current &&
      !isReverseScrubbingRef.current &&
      scrubTimeRef.current <= 0.001
    );
  }, [isReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlayThrough = () => {
      highestStepRef.current = 0;
      commitVideoTime(0);
      wheelStepRef.current = 0;
      setWheelStep(0);
      setIsReady(true);
    };

    video.addEventListener("canplaythrough", handleCanPlayThrough, { once: true });
    if (video.readyState >= 4) {
      handleCanPlayThrough();
    }

    return () => {
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      stopTweenMotion();
    };
  }, [commitVideoTime, stopTweenMotion]);

  useEffect(() => {
    onWheelReady?.({
      handleWheel: handleWheelIntent,
      canExitToOpening,
    });
  }, [canExitToOpening, handleWheelIntent, onWheelReady]);

  useEffect(() => {
    const scrollRoot = scrollRootRef.current;
    if (!scrollRoot || !isReady || !wheelEnabled) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      handleWheelIntent(event.deltaY);
    };

    scrollRoot.addEventListener("wheel", onWheel, { passive: false });
    return () => scrollRoot.removeEventListener("wheel", onWheel);
  }, [handleWheelIntent, isReady, wheelEnabled]);

  return {
    videoRef,
    scrollRootRef,
    currentTime,
    wheelStep,
    activeScene,
    isReady,
    isTweening,
    isReverseScrubbing,
    handleWheelIntent,
  };
}
