"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoGlowRef = useRef<HTMLDivElement | null>(null);

  const glitchRedRef = useRef<HTMLDivElement | null>(null);
  const glitchCyanRef = useRef<HTMLDivElement | null>(null);
  const glitchWhiteRef = useRef<HTMLDivElement | null>(null);

  const noiseBar1Ref = useRef<HTMLDivElement | null>(null);
  const noiseBar2Ref = useRef<HTMLDivElement | null>(null);
  const noiseBar3Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      !canvasRef.current ||
      !cursorRef.current ||
      !logoWrapperRef.current ||
      !logoImgRef.current ||
      !logoGlowRef.current ||
      !glitchRedRef.current ||
      !glitchCyanRef.current ||
      !glitchWhiteRef.current ||
      !noiseBar1Ref.current ||
      !noiseBar2Ref.current ||
      !noiseBar3Ref.current
    ) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./three").then(({ initHero }) => {
      if (cancelled) return;

      cleanup = initHero({
        canvas: canvasRef.current!,
        cursor: cursorRef.current!,
        logoWrapper: logoWrapperRef.current!,
        logoImg: logoImgRef.current!,
        logoGlow: logoGlowRef.current!,
        glitchLayers: [
          glitchRedRef.current!,
          glitchCyanRef.current!,
          glitchWhiteRef.current!,
        ],
        noiseBars: [
          noiseBar1Ref.current!,
          noiseBar2Ref.current!,
          noiseBar3Ref.current!,
        ],
      });
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main className="relative z-10 flex min-h-dvh w-screen flex-col items-center justify-center">
      <div
        ref={cursorRef}
        className="fixed h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(66,255,90,0.08)_0%,rgba(66,255,90,0.025)_35%,transparent_70%)] max-[768px]:hidden"
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[1] pointer-events-none"
        aria-hidden="true"
      />

      <div
        ref={logoWrapperRef}
        className="relative z-10 w-[85vw] max-w-[950px] [transform-style:preserve-3d] will-change-transform transition-transform duration-100 ease-out pointer-events-auto [@media(orientation:landscape)]:[@media(max-height:600px)]:w-[70vw] [@media(orientation:landscape)]:[@media(max-height:600px)]:max-w-[800px]"
      >
        <div
          ref={logoGlowRef}
          className="absolute -inset-[30%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(66,255,90,0.28),transparent_65%)] opacity-0 pointer-events-none blur-[30px] transition-[opacity,transform] duration-200 ease-in-out"
          aria-hidden="true"
        />

        <img
          ref={logoImgRef}
          className="relative z-[2] block h-auto w-full select-none [-webkit-user-drag:none] [filter:drop-shadow(0_0_20px_rgba(66,255,90,0.1))]"
          src="/logo.png"
          alt="HACKGRID 2026"
          draggable={false}
        />

        <div
          ref={glitchRedRef}
          className="absolute inset-0 z-[3] opacity-0 overflow-hidden pointer-events-none [&>img]:absolute [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:hue-rotate-90"
          aria-hidden="true"
        >
          <img src="/logo.png" alt="" />
        </div>

        <div
          ref={glitchCyanRef}
          className="absolute inset-0 z-[3] opacity-0 overflow-hidden pointer-events-none [&>img]:absolute [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:hue-rotate-180"
          aria-hidden="true"
        >
          <img src="/logo.png" alt="" />
        </div>

        <div
          ref={glitchWhiteRef}
          className="absolute inset-0 z-[3] opacity-0 overflow-hidden pointer-events-none [&>img]:absolute [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:brightness-200"
          aria-hidden="true"
        >
          <img src="/logo.png" alt="" />
        </div>

        <div
          ref={noiseBar1Ref}
          className="absolute left-0 z-[5] h-[2px] w-full opacity-0 pointer-events-none bg-[var(--neon)]"
          aria-hidden="true"
        />

        <div
          ref={noiseBar2Ref}
          className="absolute left-0 z-[5] h-[2px] w-full opacity-0 pointer-events-none bg-[var(--neon)]"
          aria-hidden="true"
        />

        <div
          ref={noiseBar3Ref}
          className="absolute left-0 z-[5] h-[2px] w-full opacity-0 pointer-events-none bg-[var(--neon)]"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 z-[4] pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </main>
  );
}