import { SCENE2 } from "../assets/constants";

let preloadPromise: Promise<void> | null = null;

export function preloadScene2Images(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = Promise.all(
      SCENE2.images.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          })
      )
    ).then(() => undefined);
  }
  return preloadPromise;
}
