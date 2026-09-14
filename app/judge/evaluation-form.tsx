"use client";

import { CRITERIA, TOTAL_MAX } from "./criteria";
import type { JudgeEvaluationView } from "./actions";

function ScoreInput({
  criterionKey,
  criterionName,
  max,
  description,
  value,
  onChange,
}: {
  criterionKey: string;
  criterionName: string;
  max: number;
  description: string;
  value: number | undefined;
  onChange: (field: string, value: number) => void;
}) {
  const currentValue = value ?? 0;
  const isTouched = value !== undefined;
  const fillPercent = isTouched ? (currentValue / max) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-zinc-100">
            {criterionName}
          </h4>
          <p className="mt-0.5 text-[0.68rem] leading-5 text-zinc-500">
            {description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-zinc-400">
          {max} pts
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${criterionName}`}
          disabled={currentValue <= 0}
          onClick={() => onChange(criterionKey, Math.max(0, currentValue - 1))}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-xl font-light text-zinc-300 transition active:scale-95 hover:border-[#42ff5a]/50 hover:text-[#42ff5a] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true">&#8722;</span>
        </button>

        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={currentValue}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(v)) onChange(criterionKey, v);
          }}
          className="hg-range h-8 w-full cursor-pointer"
          style={
            {
              "--fill": `${fillPercent}%`,
            } as React.CSSProperties
          }
          aria-label={criterionName}
        />

        <button
          type="button"
          aria-label={`Increase ${criterionName}`}
          disabled={currentValue >= max}
          onClick={() => onChange(criterionKey, Math.min(max, currentValue + 1))}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-xl font-light text-zinc-300 transition active:scale-95 hover:border-[#42ff5a]/50 hover:text-[#42ff5a] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <span className="text-[0.6rem] uppercase tracking-wide text-zinc-600">
          Score
        </span>
        <span className="font-mono text-xl font-semibold">
          <span className={isTouched ? "text-[#42ff5a]" : "text-zinc-500"}>
            {isTouched ? currentValue : "\u2013"}
          </span>
          <span className="ml-1 text-xs text-zinc-600"> / {max}</span>
        </span>
      </div>
    </div>
  );
}

export function EvaluationForm({
  scores,
  evaluation,
  onChange,
}: {
  scores: Record<string, number | undefined> | null;
  evaluation: JudgeEvaluationView | null;
  onChange: (field: string, value: number) => void;
}) {
  return (
    <section className="space-y-4">
      {/* Judging principle */}
      <details className="group rounded-2xl border border-white/10 bg-zinc-950 p-4">
        <summary className="cursor-pointer list-none marker:hidden">
          <span className="flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              How to evaluate
            </span>
            <span className="text-neon transition-transform group-open:rotate-90 text-sm">
              &#8250;
            </span>
          </span>
        </summary>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-6 text-zinc-400">
          <p className="font-medium text-zinc-200">Core judging question:</p>
          <p className="mt-1 italic">
            &ldquo;Given the resources this team acquired, did they build the
            strongest startup they reasonably could have?&rdquo;
          </p>
          <p className="mt-3 text-zinc-500">
            Teams are judged relative to what they acquired, not against a fixed
            standard. A team that spends heavily should show a correspondingly
            stronger product. A team that spends conservatively should show
            smart, efficient use of limited resources. Spending the most is not,
            by itself, rewarded.
          </p>
        </div>
      </details>

      {/* Criteria header */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Evaluation Criteria
        </h3>
        <span className="font-mono text-[0.6rem] font-semibold text-zinc-500">
          {TOTAL_MAX} pts total
        </span>
      </div>

      {evaluation ? (
        <div className="rounded-xl border border-[#42ff5a]/30 bg-[#42ff5a]/[0.04] px-4 py-2.5">
          <p className="text-[0.6rem] text-zinc-400">
            You previously scored this team{" "}
            <span className="font-mono font-semibold text-[#42ff5a]">
              {evaluation.totalScore}/{TOTAL_MAX}
            </span>{" "}
            &mdash; modify the scores below and resubmit to update.
          </p>
        </div>
      ) : null}

      {/* Score inputs */}
      {CRITERIA.map((c) => (
        <ScoreInput
          key={c.key}
          criterionKey={c.key}
          criterionName={c.name}
          max={c.max}
          description={c.description}
          value={scores?.[c.key]}
          onChange={onChange}
        />
      ))}
    </section>
  );
}
