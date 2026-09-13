import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The building blocks every product page is drawn with, lifted from what the
 * home page and navbar already do: black ground, neon (#42ff5a) hairlines at
 * low opacity, mono uppercase eyebrows, and the targeting-bracket corners the
 * cursor draws.
 */

/** A rounded card on the black ground. `tone` picks the hairline colour. */
export function Panel({
  tone = "neon",
  className,
  children,
  ...props
}: {
  tone?: "neon" | "amber" | "muted";
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const border =
    tone === "amber"
      ? "border-amber-500/25 bg-amber-500/[0.03]"
      : tone === "muted"
        ? "border-white/10 bg-black/40"
        : "border-neon/20 bg-zinc-950/60";

  return (
    <section className={cn("rounded-2xl border", border, className)} {...props}>
      {children}
    </section>
  );
}

/** Mono, uppercase, letter-spaced label — the site's section heading style. */
export function Eyebrow({
  tone = "muted",
  className,
  children,
}: {
  tone?: "neon" | "amber" | "muted";
  className?: string;
  children: ReactNode;
}) {
  const color =
    tone === "neon" ? "text-neon" : tone === "amber" ? "text-amber-400/90" : "text-zinc-500";
  return (
    <p
      className={cn(
        "font-mono text-[0.62rem] font-semibold tracking-[0.18em] uppercase",
        color,
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * The four targeting brackets from the cursor, drawn on a card's corners.
 * Absolute; the parent needs `relative`.
 */
export function CornerMarks({ className }: { className?: string }) {
  const arm = "absolute size-3 border-neon/60";
  return (
    <span aria-hidden className={cn("pointer-events-none", className)}>
      <span className={cn(arm, "top-2 left-2 rounded-tl-[3px] border-t border-l")} />
      <span className={cn(arm, "top-2 right-2 rounded-tr-[3px] border-t border-r")} />
      <span className={cn(arm, "bottom-2 left-2 rounded-bl-[3px] border-b border-l")} />
      <span className={cn(arm, "bottom-2 right-2 rounded-br-[3px] border-b border-r")} />
    </span>
  );
}

/** Small rounded status chip, coloured like the navbar's active link. */
export function Chip({
  tone = "neon",
  className,
  children,
}: {
  tone?: "neon" | "amber" | "muted" | "red" | "sky";
  className?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    neon: "border-neon/50 bg-neon/10 text-neon",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    muted: "border-zinc-700 bg-zinc-900 text-zinc-400",
    red: "border-red-500/40 bg-red-500/10 text-red-400",
    sky: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[0.6rem] tracking-[0.14em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The site's primary button: neon hairline, neon tint, uppercase mono. */
export const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neon/60 bg-neon/10 px-5 text-sm font-semibold text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-40";

export const ghostButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 text-sm font-medium text-zinc-300 transition hover:border-neon/40 hover:text-neon disabled:cursor-not-allowed disabled:opacity-40";

/** Text inputs on forms, matching the "Acting as" select on the bidding page. */
export const inputField =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-neon/70 disabled:text-zinc-500";
