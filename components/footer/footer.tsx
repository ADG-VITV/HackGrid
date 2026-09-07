"use client";

import { useEffect, useRef } from "react";
import BulgeGrid from "@/components/BulgeGrid";

const LOGO_BOTTOM_PADDING_RATIO = 0.22;
const LOGO_SHIFT_DOWN_PX = 90;

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const coinZoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const getAreaTop = () => {
      if (!logoRef.current || !coinZoneRef.current) return -1;

      const logoRect = logoRef.current.getBoundingClientRect();
      const zoneRect = coinZoneRef.current.getBoundingClientRect();

      const visualLogoBottom =
        logoRect.bottom - logoRect.height * LOGO_BOTTOM_PADDING_RATIO;
      return visualLogoBottom - zoneRect.top - LOGO_SHIFT_DOWN_PX;
    };

    import("./footer_three").then(({ initFooterCoins }) => {
      if (cancelled || !canvasRef.current) return;

      cleanup = initFooterCoins({
        canvas: canvasRef.current,
        coinSrc: "/coin.png",
        getAreaTop,
      });
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <footer className="relative w-full overflow-hidden bg-black overscroll-none">
      <div className="absolute inset-0 z-0">
        <BulgeGrid />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(to_bottom,_rgba(0,0,0,1)_0%,_rgba(2,18,8,0.96)_18%,_rgba(4,32,14,0.85)_38%,_rgba(8,60,24,0.65)_58%,_rgba(18,120,48,0.55)_76%,_rgba(34,200,84,0.55)_92%,_rgba(46,255,110,0.5)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen [background:radial-gradient(120%_60%_at_50%_100%,_rgba(60,255,120,0.45)_0%,_rgba(40,220,100,0.2)_35%,_rgba(0,0,0,0)_70%)]"
        aria-hidden="true"
      />

      <div ref={coinZoneRef} className="relative z-10 h-[720px] w-full">
        <div
          className="absolute inset-0 flex items-start justify-center pt-40"
          style={{ transform: `translateY(${LOGO_SHIFT_DOWN_PX}px)` }}
        >
          <img
            ref={logoRef}
            src="/logo.png"
            alt="HackGrid"
            draggable={false}
            className="h-auto w-[95vw] max-w-[1400px] select-none object-contain [filter:drop-shadow(0_0_35px_rgba(66,255,90,0.4))]"
          />
        </div>

        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
      </div>
    </footer>
  );
}