"use client";

import { useEffect, useRef, useState } from "react";

const COUNTDOWN_TARGET = new Date("2026-09-16T08:00:00");

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, COUNTDOWN_TARGET.getTime() - Date.now());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

const FLIP_DURATION_MS = 880;

function DigitCard({ digit }: { digit: string }) {
  const [displayValue, setDisplayValue] = useState(digit);
  const isFlipping = displayValue !== digit;

  const numberClassName =
    "absolute inset-x-0 top-0 flex h-[76px] items-center justify-center font-sans text-4xl font-bold tracking-tight text-[var(--neon)] [text-shadow:0_0_12px_rgba(66,255,90,0.65),0_0_28px_rgba(66,255,90,0.35)] sm:h-[104px] sm:text-6xl";
  const bottomNumberStyle = { transform: "translateY(-50%)" };

  return (
    <div
      className="relative h-[76px] w-[30px] overflow-hidden rounded-2xl bg-[#4a4947] shadow-[0_10px_30px_rgba(0,0,0,0.55),0_0_16px_rgba(66,255,90,0.18)] sm:h-[104px] sm:w-[42px] sm:rounded-3xl"
      style={{ perspective: "260px" }}
    >
      {/* Top half */}
      <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden bg-gradient-to-b from-[#4a4947] to-[#43463f]">
        <span className={numberClassName}>{displayValue}</span>
      </div>

      {/* Bottom half */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden bg-gradient-to-b from-[#40403e] to-[#333432]">
        <span className={numberClassName} style={bottomNumberStyle}>
          {displayValue}
        </span>
      </div>

      {isFlipping && (
        <div
          className="absolute inset-x-0 top-0 z-10 h-1/2 overflow-hidden bg-gradient-to-b from-[#4a4947] to-[#43463f]"
          onAnimationEnd={() => setDisplayValue(digit)}
          style={{
            animation: `flip-unit-down ${FLIP_DURATION_MS}ms ease-in-out both`,
            transformOrigin: "bottom",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
        >
          <span className={numberClassName}>{displayValue}</span>
        </div>
      )}

      {/* Center crease */}
      <span
        className="pointer-events-none absolute left-0 top-1/2 z-20 h-[2px] w-full -translate-y-1/2 bg-black/60 shadow-[0_1px_0_rgba(66,255,90,0.1)]"
        aria-hidden="true"
      />

      {/* Hinge pins */}
      <span
        className="pointer-events-none absolute left-[-2px] top-1/2 z-30 h-[8px] w-[5px] -translate-y-1/2 rounded-[2px] bg-[#2a2a28] shadow-[inset_0_0_2px_rgba(0,0,0,0.6)] sm:left-[-3px] sm:h-[12px] sm:w-[7px]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-[-2px] top-1/2 z-30 h-[8px] w-[5px] -translate-y-1/2 rounded-[2px] bg-[#2a2a28] shadow-[inset_0_0_2px_rgba(0,0,0,0.6)] sm:right-[-3px] sm:h-[12px] sm:w-[7px]"
        aria-hidden="true"
      />
    </div>
  );
}

function FlipSeparator() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pb-6 sm:gap-3">
      <span className="h-[6px] w-[6px] rounded-[1px] bg-[var(--neon)] [box-shadow:0_0_6px_rgba(66,255,90,0.8)] sm:h-[8px] sm:w-[8px]" />
      <span className="h-[6px] w-[6px] rounded-[1px] bg-[var(--neon)] [box-shadow:0_0_6px_rgba(66,255,90,0.8)] sm:h-[8px] sm:w-[8px]" />
    </div>
  );
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const padded = value.toString().padStart(2, "0");
  const [tens, ones] = padded.split("");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-[3px] sm:gap-1">
        <DigitCard digit={tens} />
        <DigitCard digit={ones} />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--neon)]/60 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function CountdownClock() {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 mt-10 flex items-center justify-center gap-3 sm:gap-5">
      <FlipUnit value={time.days} label="Days" />
      <FlipSeparator />
      <FlipUnit value={time.hours} label="Hours" />
      <FlipSeparator />
      <FlipUnit value={time.minutes} label="Minutes" />
      <FlipSeparator />
      <FlipUnit value={time.seconds} label="Seconds" />
    </div>
  );
}

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
    <section className="relative flex min-h-dvh w-screen flex-col items-center justify-center">
      <div
        ref={cursorRef}
        className="fixed h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(66,255,90,0.08)_0%,rgba(66,255,90,0.025)_35%,transparent_70%)] max-[768px]:hidden"
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1] pointer-events-none bg-transparent [mix-blend-mode:screen]"
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

      <CountdownClock />
    </section>
  );
}