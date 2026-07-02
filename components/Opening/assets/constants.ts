export const ASSETS = {
  video: {
    openingPoster: "/video/opening-poster.mp4",
    tearAnimation: "/video/tear-animation.mp4",
  },
  images: {
    sceneBBackground: "/images/imagessceneB-background.jpg",
  },
} as const;

export const TITLE_LETTERS = [
  { char: "K", image: "/images/letter-k.jpg" },
  { char: "I", image: "/images/letter-i_1.jpg" },
  { char: "L", image: "/images/letter-l.jpg" },
  { char: "L", image: "/images/letter-l_2.jpg" },
  { char: "B", image: "/images/letter-b.jpg" },
  { char: "I", image: "/images/letter-i_2.jpg" },
  { char: "L", image: "/images/letter-l_3.jpg" },
  { char: "L", image: "/images/letter-l_4.jpg" },
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
  letterYellow: "#f4e791",
} as const;
