export const ASSETS = {
  video: {
    openingPoster: "/kill_bill/video/opening-poster.mp4",
    tearAnimation: "/kill_bill/video/tear-animation.mp4",
  },
  images: {
    sceneBBackground: "/kill_bill/images/imagessceneB-background.jpg",
  },
} as const;

export const TITLE_LETTERS = [
  { char: "K", image: "/kill_bill/images/letter-k.jpg", imagePosition: "center 38%" },
  { char: "I", image: "/kill_bill/images/letter-i_1.jpg", imagePosition: "center 32%" },
  { char: "L", image: "/kill_bill/images/letter-l.jpg", imagePosition: "center 38%" },
  { char: "L", image: "/kill_bill/images/letter-l_2.jpg", imagePosition: "center 38%" },
  { char: "B", image: "/kill_bill/images/letter-b.jpg", imagePosition: "center 28%" },
  { char: "I", image: "/kill_bill/images/letter-i_2.jpg", imagePosition: "center 32%" },
  { char: "L", image: "/kill_bill/images/letter-l_3.jpg", imagePosition: "center 38%" },
  { char: "L", image: "/kill_bill/images/letter-l_4.jpg", imagePosition: "center 38%" },
] as const;

export const METADATA = [
  "VOL.1 / VOL.2",
  "2003 / 2004",
  "1080P",
  "COLOR",
  "ENG",
] as const;

export const SCENE_A = {
  pressScale: 0.022,
  pressShineOpacity: 0.14,
  pressEdgeFalloff: 120,
  displaceAmount: 3.5,
  displaceRadius: 190,
  distortNoise: 5.5,
  grainOpacity: 0.22,
} as const;

export const SCENE_B = {
  overlayOpacity: 0.55,
  spotlightRadius: 420,
  letterRed: "#e63312",
  letterYellow: "#f7e6d0",
  creditColor: "#ffecc6",
  credit: "BY QUENTIN TARANTINO",
  /** Visual nudge for the fitted title block. */
  titleOffsetY: "-2.8vh",
  /** Uniform scale applied after title fit (0.95 = 95%). */
  titleScale: 0.95,
  titleFit: {
    maxWidthRatio: 0.998,
    maxHeightRatio: 0.90,
    minSize: 48,
    maxSize: 960,
  },
} as const;

/** SceneB → Chapter1 — one wheel down triggers a fixed-duration handoff. */
export const OPENING_TRANSITION = {
  durationMs: 1000,
} as const;
