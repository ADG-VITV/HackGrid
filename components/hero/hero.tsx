"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const COUNTDOWN_TARGET = new Date("2026-09-16T08:00:00");

/* ========================================
   POSITION / SIZE CONTROLS
   Tweak these to reposition or resize the countdown clock and the logo.
   Everything below imports from this one block. */
const CLOCK_OFFSET_X = -40; // px, + moves right
const CLOCK_OFFSET_Y = 50; // px, + moves down
const CLOCK_SCALE = 0.85; // 1 = 100% size

const LOGO_OFFSET_X = 0; // px, + moves right
const LOGO_OFFSET_Y = 80; // px, + moves down
const LOGO_SCALE = 0.75; // 1 = 100% size
/* ======================================== */

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

/* The panel face is now the actual reference photo (digit removed, hinge
   pin and crease baked in) rather than a CSS gradient. One asset per hinge
   side — flip-panel-right.png is a mirror of flip-panel-left.png — so the
   flip animation's transform isn't fighting a CSS mirror on the same
   element. Each half shows one slice of the image via background-size
   "100% 200%" + background-position top/bottom. */
const PANEL_IMAGE: Record<"left" | "right", string> = {
  left: "/flip-panel-left.png",
  right: "/flip-panel-right.png",
};

function panelHalfStyle(hinge: "left" | "right", half: "top" | "bottom"): CSSProperties {
  return {
    backgroundImage: `url(${PANEL_IMAGE[hinge]})`,
    backgroundSize: "100% 200%",
    backgroundPosition: half === "top" ? "top" : "bottom",
    backgroundRepeat: "no-repeat",
  };
}

function DigitCard({
  digit,
  hinge,
}: {
  digit: string;
  hinge: "left" | "right";
}) {
  const [displayValue, setDisplayValue] = useState(digit);
  const isFlipping = displayValue !== digit;
  const topStyle = panelHalfStyle(hinge, "top");
  const bottomStyle = panelHalfStyle(hinge, "bottom");

  const numberClassName =
    "absolute inset-x-0 top-0 flex h-[76px] items-center justify-center font-sans text-4xl font-bold tracking-tight text-[#42ff5a] sm:h-[104px] sm:text-6xl";
  const numberStyle: CSSProperties = {
    textShadow:
      "0 0 6px rgba(66,255,90,0.85), 0 0 16px rgba(66,255,90,0.55), 0 0 32px rgba(66,255,90,0.25)",
  };
  const bottomNumberStyle: CSSProperties = {
    ...numberStyle,
    transform: "translateY(-50%)",
  };

  return (
    <div className="relative">
      <div
        className="relative h-[76px] w-[42px] overflow-hidden rounded-md bg-[#3a4039] shadow-[0_10px_30px_rgba(0,0,0,0.55),0_0_16px_rgba(66,255,90,0.18)] sm:h-[104px] sm:w-[57px] sm:rounded-lg"
        style={{ perspective: "260px" }}
      >
        {/* Top half */}
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden" style={topStyle}>
          <span className={numberClassName} style={numberStyle}>{displayValue}</span>
        </div>

        {/* Bottom half */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden" style={bottomStyle}>
          <span className={numberClassName} style={bottomNumberStyle}>
            {displayValue}
          </span>
        </div>

        {isFlipping && (
          <div
            className="absolute inset-x-0 top-0 z-10 h-1/2 overflow-hidden"
            onAnimationEnd={() => setDisplayValue(digit)}
            style={{
              ...topStyle,
              animation: `flip-unit-down ${FLIP_DURATION_MS}ms ease-in-out both`,
              transformOrigin: "bottom",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              willChange: "transform",
            }}
          >
            <span className={numberClassName} style={numberStyle}>{displayValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FlipSeparator() {
  return (
    <div className="flex items-center justify-center pb-6 sm:pb-7">
      <span
        className="select-none font-sans text-3xl font-bold leading-none text-[#42ff5a] sm:text-5xl"
        style={{
          textShadow:
            "0 0 6px rgba(66,255,90,0.85), 0 0 16px rgba(66,255,90,0.55), 0 0 32px rgba(66,255,90,0.25)",
        }}
        aria-hidden="true"
      >
        :
      </span>
    </div>
  );
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const padded = value.toString().padStart(2, "0");
  const [tens, ones] = padded.split("");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-[2px]">
        <DigitCard digit={tens} hinge="left" />
        <DigitCard digit={ones} hinge="right" />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#42ff5a]/70 sm:text-xs">
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
    <div
      style={{
        transform: `translate(${CLOCK_OFFSET_X}px, ${CLOCK_OFFSET_Y}px) scale(${CLOCK_SCALE})`,
      }}
    >
      <div className="relative z-10 mt-10 flex items-center justify-center gap-2 sm:gap-3">
        <FlipUnit value={time.days} label="Days" />
        <FlipSeparator />
        <FlipUnit value={time.hours} label="Hours" />
        <FlipSeparator />
        <FlipUnit value={time.minutes} label="Minutes" />
        <FlipSeparator />
        <FlipUnit value={time.seconds} label="Seconds" />
      </div>
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
        style={{
          transform: `translate(${LOGO_OFFSET_X}px, ${LOGO_OFFSET_Y}px) scale(${LOGO_SCALE})`,
        }}
      >
        <div
          ref={logoGlowRef}
          className="absolute -inset-[30%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(66,255,90,0.28),transparent_65%)] opacity-0 pointer-events-none blur-[30px] transition-[opacity,transform] duration-200 ease-in-out"
          aria-hidden="true"
        />

        <img
          ref={logoImgRef}
          className="relative z-[2] block h-auto w-full select-none [-webkit-user-drag:none] [filter:drop-shadow(0_0_20px_rgba(66,255,90,0.1))]"
          src="/NewLogo.png"
          alt="HACKGRID 2026"
          draggable={false}
        />

        <div
          ref={glitchRedRef}
          className="absolute inset-0 z-[3] opacity-0 overflow-hidden pointer-events-none [&>img]:absolute [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:hue-rotate-90"
          aria-hidden="true"
        >
          <img src="/NewLogo.png" alt="" />
        </div>

        <div
          ref={glitchCyanRef}
          className="absolute inset-0 z-[3] opacity-0 overflow-hidden pointer-events-none [&>img]:absolute [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:hue-rotate-180"
          aria-hidden="true"
        >
          <img src="/NewLogo.png" alt="" />
        </div>

        <div
          ref={glitchWhiteRef}
          className="absolute inset-0 z-[3] opacity-0 overflow-hidden pointer-events-none [&>img]:absolute [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:brightness-200"
          aria-hidden="true"
        >
          <img src="/NewLogo.png" alt="" />
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