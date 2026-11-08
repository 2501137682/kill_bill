/** Public path to the chapter scroll-scrub video. */
export const CHAPTER1_VIDEO_SRC = "/kill_bill/images/scrolling.mp4";

/** Viewport heights consumed per second of video (5s video → 500vh scroll). */
export const SCROLL_VH_PER_SECOND = 100;

/** Pause-point tolerance (seconds) for wheel advance / step sync. */
export const PAUSE_EPS = 0.12;

/** Scene time boundaries in seconds (must match video edit). */
export const SCENE_TIMES = {
  scene1Start: 0,
  scene1End: 2,
  scene2Start: 2,
  scene2End: 4.3,
  scene3Start: 4.3,
  scene3End: 5,
} as const;

/** Scene1 interactive overlay — reveal at revealAt. */
export const SCENE1 = {
  revealAt: 0.8,
  revealOff: 0.65,
  freezeAt: 2,
  wheelTweenMs: 900,
  cardPhotoSrc: "/kill_bill/images/chapter1/photo_on_card.png",
} as const;

export const SCENE2 = {
  enterAt: SCENE1.revealAt,
  /** Scene2 UI fully enters when video reaches this time. */
  freezeAt: 4.3,
  wheelTweenMs: 1800,
  images: [
    "/kill_bill/images/chapter1/2_1.png",
    "/kill_bill/images/chapter1/2_2.png",
    "/kill_bill/images/chapter1/2_3.png",
    "/kill_bill/images/chapter1/2_4.png",
    "/kill_bill/images/chapter1/2_5.png",
    "/kill_bill/images/chapter1/2_6.png",
  ],
} as const;

export const SCENE3 = {
  enterAt: SCENE2.freezeAt,
  freezeAt: SCENE_TIMES.scene3End,
  wheelTweenMs: 900,
  cornerImage: "/kill_bill/images/chapter1/2_右下角小图.png",
  menuItems: ["Samurai", "Katana", "Bruce Lee", "Yakuza"] as const,
} as const;

export type Chapter1Scene = 1 | 2 | 3;

export type Chapter1WheelStep = 0 | 1 | 2 | 3;

export const CHAPTER1_SEGMENTS: ReadonlyArray<{ step: Chapter1WheelStep; time: number }> = [
  { step: 0, time: 0 },
  { step: 1, time: SCENE1.revealAt },
  { step: 2, time: SCENE2.freezeAt },
  { step: 3, time: SCENE3.freezeAt },
];

export function getTweenMsForStep(step: Chapter1WheelStep): number {
  if (step === 0) return SCENE1.wheelTweenMs;
  if (step === 1) return SCENE2.wheelTweenMs;
  return SCENE3.wheelTweenMs;
}

export function syncStepFromTime(time: number): Chapter1WheelStep {
  if (time < CHAPTER1_SEGMENTS[1].time - PAUSE_EPS) return 0;
  if (time < CHAPTER1_SEGMENTS[2].time - PAUSE_EPS) return 1;
  if (time < CHAPTER1_SEGMENTS[3].time - PAUSE_EPS) return 2;
  return 3;
}

export function canAdvanceForward(time: number, step: Chapter1WheelStep): boolean {
  if (step >= 3) return false;
  const target = CHAPTER1_SEGMENTS[step + 1].time;
  return time < target - PAUSE_EPS;
}

/** @deprecated Use canAdvanceForward — kept for callers that gate on pause proximity. */
export function canAdvanceFromPause(time: number, step: Chapter1WheelStep): boolean {
  return canAdvanceForward(time, step);
}

export function getActiveScene(currentTime: number): Chapter1Scene {
  if (currentTime < SCENE2.enterAt + 0.05) return 1;
  if (currentTime < SCENE3.enterAt + 0.05) return 2;
  return 3;
}

export function getScene1Progress(currentTime: number): number {
  if (currentTime <= 0) return 0;
  if (currentTime > SCENE2.enterAt + 0.22) return 0;
  if (currentTime <= SCENE1.revealAt) return Math.min(1, currentTime / SCENE1.revealAt);
  return Math.max(0, 1 - (currentTime - SCENE1.revealAt) / 0.22);
}

export function getScene2Progress(currentTime: number): number {
  if (currentTime < SCENE2.enterAt - 0.02) return 0;
  if (currentTime > SCENE3.enterAt + 0.05) return 0;
  if (currentTime >= SCENE2.freezeAt - 0.02) return 1;
  const span = SCENE2.freezeAt - SCENE2.enterAt;
  return Math.max(0, Math.min(1, (currentTime - SCENE2.enterAt) / span));
}

export function getScene3Progress(currentTime: number): number {
  if (currentTime < SCENE3.enterAt - 0.02) return 0;
  if (currentTime >= SCENE3.freezeAt - 0.02) return 1;
  return (currentTime - SCENE3.enterAt) / (SCENE3.freezeAt - SCENE3.enterAt);
}

export function getScrollHeightPx(duration: number, viewportHeight: number): number {
  return (duration * SCROLL_VH_PER_SECOND * viewportHeight) / 100;
}

/** Map wheel delta (px) to video seconds — 100vh scroll ≈ 1s of video. */
export function getTimeDeltaFromWheel(deltaY: number, viewportHeight: number): number {
  return (deltaY / viewportHeight) * (100 / SCROLL_VH_PER_SECOND);
}
