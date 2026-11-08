"use client";

import { useEffect, useState } from "react";
import { preloadScene2Images } from "./preloadScene2Images";

export function useScene2ImagesReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void preloadScene2Images().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
