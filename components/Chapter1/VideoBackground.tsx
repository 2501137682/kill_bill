"use client";

import { forwardRef } from "react";
import { CHAPTER1_VIDEO_SRC } from "./assets/constants";

const VideoBackground = forwardRef<HTMLVideoElement>(function VideoBackground(_, ref) {
  return (
    <video
      ref={ref}
      className="chapter1__video"
      src={CHAPTER1_VIDEO_SRC}
      preload="auto"
      muted
      playsInline
      disablePictureInPicture
    />
  );
});

export default VideoBackground;
