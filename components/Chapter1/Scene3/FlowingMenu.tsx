"use client";

import { SCENE3 } from "../assets/constants";

type FlowingMenuProps = {
  progress: number;
};

export default function FlowingMenu({ progress }: FlowingMenuProps) {
  const enterStyle = {
    opacity: progress,
    ["--menu-enter-scale" as string]: 0.95 + progress * 0.05,
  } as React.CSSProperties;

  return (
    <div className="scene3__menu-wrap" style={enterStyle}>
      <nav className="scene3__menu" aria-label="Influences">
        {SCENE3.menuItems.map((label) => (
          <div key={label} className="scene3__menu-row">
            <div className="scene3__menu-row-inner">
              <span className="scene3__menu-label">{label}</span>
              <span className="scene3__menu-marquee" aria-hidden>
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i}>{label}</span>
                ))}
              </span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
