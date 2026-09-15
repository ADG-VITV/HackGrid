import type { ReactNode } from "react";

/* Shared shell for the "About ADG" / "About HackGrid" sections: a full-height,
   centred, bordered glass card with neon corner brackets and an oversized
   watermark. Everything inside is Geist Mono (the `font-mono` theme token). */

const NEON_GLOW =
  "[text-shadow:0_0_14px_rgba(66,255,90,0.75),0_0_30px_rgba(66,255,90,0.45),0_0_60px_rgba(66,255,90,0.3)]";

export function GlowSection({
  id,
  watermark,
  children,
}: {
  id: string;
  watermark: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="flex min-h-screen w-full items-center justify-center bg-transparent p-5 text-white sm:p-10"
    >
      <div className="relative mx-auto flex min-h-[clamp(460px,55vh,600px)] w-full max-w-[1200px] flex-col justify-center overflow-hidden border border-neon/30 bg-[linear-gradient(135deg,rgba(6,12,7,0.4)_0%,rgba(2,5,3,0.5)_100%)] p-[clamp(36px,5vw,90px)_clamp(18px,4.5vw,60px)] font-mono shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(66,255,90,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[14px] before:pointer-events-none before:absolute before:top-[11px] before:left-[11px] before:z-[2] before:h-[18px] before:w-[18px] before:border-2 before:border-r-0 before:border-b-0 before:border-neon before:content-[''] after:pointer-events-none after:absolute after:right-[11px] after:bottom-[11px] after:z-[2] after:h-[18px] after:w-[18px] after:border-2 after:border-t-0 after:border-l-0 after:border-neon after:content-[''] sm:p-[clamp(60px,7vw,90px)_clamp(30px,4.5vw,60px)]">
        <div
          className="pointer-events-none absolute top-1 right-[4%] z-0 font-mono text-[clamp(56px,10vw,140px)] leading-none font-bold tracking-[-4px] whitespace-nowrap text-neon/5 select-none"
          aria-hidden="true"
        >
          {watermark}
        </div>

        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(280px,auto)_1fr] lg:gap-[clamp(28px,4vw,52px)]">
          {children}
        </div>
      </div>
    </section>
  );
}

/* Left column: eyebrow + two-line display heading (+ optional tagline). */
export function SectionTitle({
  eyebrow,
  tagline,
  children,
}: {
  eyebrow: string;
  tagline?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center">
      <span className="mb-1.5 block text-xs tracking-[3.5px] text-white uppercase">
        {eyebrow}
      </span>
      <h2 className="m-0 text-[clamp(40px,12vw,58px)] leading-[0.95] font-bold tracking-tight text-white uppercase lg:text-[clamp(48px,6.2vw,84px)]">
        {children}
      </h2>
      {tagline && (
        <p className="mt-6 mb-0 text-[10px] tracking-[1.8px] text-neon">
          {tagline}
        </p>
      )}
    </div>
  );
}

/* A heading line rendered in glowing neon. */
export function NeonLine({ children }: { children: ReactNode }) {
  return <span className={`block text-neon ${NEON_GLOW}`}>{children}</span>;
}

/* Right column: description paragraphs + stat row. */
export function SectionBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3.5">{children}</div>;
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-[clamp(15px,1.4vw,18px)] leading-snug font-medium tracking-[0.2px] text-white">
      {children}
    </p>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-[clamp(12px,1vw,13.5px)] leading-relaxed tracking-[0.15px] text-[#a8c0ad]">
      {children}
    </p>
  );
}

export type StatItem = {
  /* Small grey ordinal above the value, e.g. "01". Optional. */
  index?: string;
  /* Neon headline of the cell, e.g. "LEARN" or "36". */
  value: string;
  /* Grey caption under the value, e.g. "Explore emerging tech" or "Hours". */
  label: string;
};

/* Three-up stat strip. Stacks on mobile with row dividers; on sm+ sits on a
   single line with column dividers. */
export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-2.5 border-t border-neon/20 p-0 pt-3.5 pb-3 sm:grid-cols-3 sm:gap-0 sm:border-b sm:border-b-neon/10">
      {items.map((item) => (
        <li
          key={item.value}
          className="flex flex-col gap-0.5 border-b border-neon/10 pb-2 last:border-b-0 last:pb-0 sm:border-r sm:border-r-neon/20 sm:border-b-0 sm:px-3 sm:pb-0 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
        >
          {item.index && (
            <span className="text-[9px] tracking-[1.2px] text-[#8ba892]">
              {item.index}
            </span>
          )}
          <span className="text-[clamp(15px,1.4vw,18px)] leading-tight font-bold tracking-[0.6px] text-neon">
            {item.value}
          </span>
          <span className="text-[10px] tracking-[1.2px] text-[#8ba892] uppercase">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
