"use client";

import { useEffect, useRef } from "react";
import { SCENE2 } from "../assets/constants";

const SCROLL_SPEED = 44;
const ITEM_GAP = 14;
const STRIP_COUNT = 48;
const STRIP_OVERLAP = 1.25;

type CorridorGeom = {
  outerLeft: number;
  outerRight: number;
  innerLeft: number;
  innerRight: number;
  topLine: number;
  bottomLine: number;
  centerWidth: number;
};

type ImageScrollColumnProps = {
  active: boolean;
};

function computeCorridorGeometry(columnWidth: number, columnHeight: number): CorridorGeom {
  const innerLeft = 0.07;
  const innerRight = 0.93;
  const outerLeft = 0.025;
  const outerRight = 0.975;
  const centerWidth = (innerRight - innerLeft) * columnWidth;
  const centerHeightFrac = Math.min(0.78, centerWidth / columnHeight);
  const topLine = (1 - centerHeightFrac) * 0.5;
  const bottomLine = 1 - topLine;

  return {
    outerLeft,
    outerRight,
    innerLeft,
    innerRight,
    topLine,
    bottomLine,
    centerWidth,
  };
}

function corridorBounds(yFrac: number, geom: CorridorGeom): { left: number; right: number } {
  const { outerLeft, outerRight, innerLeft, innerRight, topLine, bottomLine } = geom;

  if (yFrac <= topLine) {
    const t = topLine > 0 ? yFrac / topLine : 0;
    return {
      left: outerLeft + (innerLeft - outerLeft) * t,
      right: outerRight + (innerRight - outerRight) * t,
    };
  }

  if (yFrac >= bottomLine) {
    const t = (yFrac - bottomLine) / (1 - bottomLine);
    return {
      left: innerLeft + (outerLeft - innerLeft) * t,
      right: innerRight + (outerRight - innerRight) * t,
    };
  }

  return { left: innerLeft, right: innerRight };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function applyCorridorFrame(
  viewport: HTMLElement,
  polygon: SVGPolygonElement | null,
  topLineEl: SVGLineElement | null,
  bottomLineEl: SVGLineElement | null,
  diagEls: SVGLineElement[],
  geom: CorridorGeom
) {
  const {
    outerLeft,
    outerRight,
    innerLeft,
    innerRight,
    topLine,
    bottomLine,
  } = geom;

  viewport.style.clipPath = `polygon(
    ${pct(outerLeft)} 0%,
    ${pct(outerRight)} 0%,
    ${pct(innerRight)} ${pct(topLine)},
    ${pct(innerRight)} ${pct(bottomLine)},
    ${pct(outerRight)} 100%,
    ${pct(outerLeft)} 100%,
    ${pct(innerLeft)} ${pct(bottomLine)},
    ${pct(innerLeft)} ${pct(topLine)}
  )`;

  if (!polygon) return;

  const points = [
    [outerLeft, 0],
    [outerRight, 0],
    [innerRight, topLine],
    [innerRight, bottomLine],
    [outerRight, 1],
    [outerLeft, 1],
    [innerLeft, bottomLine],
    [innerLeft, topLine],
  ]
    .map(([x, y]) => `${x * 100},${y * 100}`)
    .join(" ");

  polygon.setAttribute("points", points);

  if (topLineEl) {
    topLineEl.setAttribute("x1", String(innerLeft * 100));
    topLineEl.setAttribute("x2", String(innerRight * 100));
    topLineEl.setAttribute("y1", String(topLine * 100));
    topLineEl.setAttribute("y2", String(topLine * 100));
  }

  if (bottomLineEl) {
    bottomLineEl.setAttribute("x1", String(innerLeft * 100));
    bottomLineEl.setAttribute("x2", String(innerRight * 100));
    bottomLineEl.setAttribute("y1", String(bottomLine * 100));
    bottomLineEl.setAttribute("y2", String(bottomLine * 100));
  }

  const diags = [
    [outerLeft, 0, innerLeft, topLine],
    [outerRight, 0, innerRight, topLine],
    [outerLeft, 1, innerLeft, bottomLine],
    [outerRight, 1, innerRight, bottomLine],
  ];

  diags.forEach(([x1, y1, x2, y2], index) => {
    const line = diagEls[index];
    if (!line) return;
    line.setAttribute("x1", String(x1 * 100));
    line.setAttribute("y1", String(y1 * 100));
    line.setAttribute("x2", String(x2 * 100));
    line.setAttribute("y2", String(y2 * 100));
  });
}

function applyItemStrips(
  el: HTMLDivElement,
  itemRelTop: number,
  itemSize: number,
  columnWidth: number,
  columnHeight: number,
  geom: CorridorGeom
) {
  const centerWidth = geom.centerWidth;
  const stripH = itemSize / STRIP_COUNT;
  const strips = el.querySelectorAll<HTMLElement>(".scene2__scroll-strip");

  strips.forEach((strip, index) => {
    const overlap = index > 0 ? STRIP_OVERLAP : 0;
    const stripTopInItem = index * stripH - overlap;
    const stripHeight = stripH + overlap;
    const stripCenterY = itemRelTop + stripTopInItem + stripHeight * 0.5;
    const yFrac = Math.min(1, Math.max(0, stripCenterY / columnHeight));
    const bounds = corridorBounds(yFrac, geom);

    const corridorW = (bounds.right - bounds.left) * columnWidth;
    const corridorL = bounds.left * columnWidth;
    const scaleX = corridorW / centerWidth;

    strip.style.top = `${stripTopInItem}px`;
    strip.style.left = `${corridorL}px`;
    strip.style.width = `${corridorW}px`;
    strip.style.height = `${stripHeight}px`;

    const media = strip.querySelector<HTMLElement>(".scene2__scroll-strip-media");
    if (!media) return;

    media.style.width = `${centerWidth}px`;
    media.style.height = `${itemSize}px`;
    media.style.top = `${-stripTopInItem}px`;
    media.style.left = `${(corridorW - centerWidth) * 0.5}px`;
    media.style.backgroundSize = `${centerWidth}px ${itemSize}px`;
    media.style.transform = `scaleX(${scaleX}) translateZ(0)`;
  });
}

function ScrollImageItem({
  src,
  itemRef,
}: {
  src: string;
  itemRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={itemRef} className="scene2__scroll-item">
      <div className="scene2__scroll-item-strips">
        {Array.from({ length: STRIP_COUNT }, (_, index) => (
          <div key={index} className="scene2__scroll-strip">
            <div
              className="scene2__scroll-strip-media"
              style={{ backgroundImage: `url("${src}")` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ImageScrollColumn({ active }: ImageScrollColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<SVGPolygonElement>(null);
  const topLineRef = useRef<SVGLineElement>(null);
  const bottomLineRef = useRef<SVGLineElement>(null);
  const diagRefs = useRef<(SVGLineElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const paintedRef = useRef(false);

  const images = [...SCENE2.images, ...SCENE2.images, ...SCENE2.images];

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      paintedRef.current = false;
      viewportRef.current?.classList.remove("scene2__scroll-viewport--painted");
      return;
    }

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const column = columnRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!column || !viewport || !track) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const columnWidth = column.clientWidth;
      const columnHeight = column.clientHeight;
      const geom = computeCorridorGeometry(columnWidth, columnHeight);
      const itemSize = geom.centerWidth;
      const itemStride = itemSize + ITEM_GAP;
      const setHeight = SCENE2.images.length * itemStride;

      applyCorridorFrame(
        viewport,
        polygonRef.current,
        topLineRef.current,
        bottomLineRef.current,
        diagRefs.current.filter(Boolean) as SVGLineElement[],
        geom
      );
      track.style.setProperty("--item-size", `${itemSize}px`);
      track.style.setProperty("--item-gap", `${ITEM_GAP}px`);

      offsetRef.current -= SCROLL_SPEED * dt;
      if (offsetRef.current <= -setHeight) {
        offsetRef.current += setHeight;
      }

      track.style.transform = `translate3d(0, ${offsetRef.current}px, 0)`;

      const columnTop = column.getBoundingClientRect().top;

      itemRefs.current.forEach((el) => {
        if (!el) return;
        el.style.height = `${itemSize}px`;
        el.style.width = `${columnWidth}px`;
        el.style.marginBottom = `${ITEM_GAP}px`;

        const itemRelTop = el.getBoundingClientRect().top - columnTop;
        applyItemStrips(el, itemRelTop, itemSize, columnWidth, columnHeight, geom);
      });

      if (!paintedRef.current) {
        paintedRef.current = true;
        viewport.classList.add("scene2__scroll-viewport--painted");
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <div ref={columnRef} className="scene2__scroll-column">
      <div className="scene2__pillar scene2__pillar--left" aria-hidden />
      <div className="scene2__pillar scene2__pillar--right" aria-hidden />

      <svg
        className="scene2__perspective-frame"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          ref={polygonRef}
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          ref={topLineRef}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          ref={bottomLineRef}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {Array.from({ length: 4 }, (_, index) => (
          <line
            key={index}
            ref={(el) => {
              diagRefs.current[index] = el;
            }}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div ref={viewportRef} className="scene2__scroll-viewport">
        <div ref={trackRef} className="scene2__scroll-track">
          {images.map((src, index) => (
            <ScrollImageItem
              key={`${src}-${index}`}
              src={src}
              itemRef={(el) => {
                itemRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
