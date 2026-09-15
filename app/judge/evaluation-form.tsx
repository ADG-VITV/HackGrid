"use client";

import type { JudgeCriterionView, JudgeEvaluationView } from "./actions";

function ScoreInput({
  criterion,
  value,
  onChange,
}: {
  criterion: JudgeCriterionView;
  value: number | undefined;
  onChange: (criterionId: string, value: number) => void;
}) {
  const min = criterion.minScore;
  const max = criterion.maxScore;
  const currentValue = value ?? min;
  const isTouched = value !== undefined;
  const fillPercent = isTouched
    ? ((currentValue - min) / Math.max(1, max - min)) * 100
    : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-zinc-100">
            {criterion.name}
          </h4>
          <p className="mt-0.5 text-[0.68rem] leading-5 text-zinc-500">
            {criterion.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-zinc-400">
          {max} pts
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${criterion.name}`}
          disabled={currentValue <= min}
          onClick={() => onChange(criterion.id, Math.max(min, currentValue - 1))}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-xl font-light text-zinc-300 transition active:scale-95 hover:border-[#42ff5a]/50 hover:text-[#42ff5a] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true">&#8722;</span>
        </button>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={currentValue}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(v)) onChange(criterion.id, v);
          }}
          className="hg-range h-8 w-full cursor-pointer"
          style={
            {
              "--fill": `${fillPercent}%`,
            } as React.CSSProperties
          }
          aria-label={criterion.name}
        />

        <button
          type="button"
          aria-label={`Increase ${criterion.name}`}
          disabled={currentValue >= max}
          onClick={() => onChange(criterion.id, Math.min(max, currentValue + 1))}
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
  criteria,
  scores,
  review,
  evaluation,
  maxTotal,
  onChange,
  onReviewChange,
}: {
  criteria: JudgeCriterionView[];
  scores: Record<string, number> | null;
  review: string;
  evaluation: JudgeEvaluationView | null;
  maxTotal: number;
  onChange: (criterionId: string, value: number) => void;
  onReviewChange: (review: string) => void;
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
          {maxTotal} pts total
        </span>
      </div>

      {evaluation ? (
        <div className="rounded-xl border border-[#42ff5a]/30 bg-[#42ff5a]/[0.04] px-4 py-2.5">
          <p className="text-[0.6rem] text-zinc-400">
            You previously scored this team{" "}
            <span className="font-mono font-semibold text-[#42ff5a]">
              {evaluation.total}/{maxTotal}
            </span>
            {evaluation.status === "SUBMITTED"
              ? " and submitted it"
              : " (draft)"}
            {" "}
            &mdash; modify the scores below and resubmit to update.
          </p>
        </div>
      ) : null}

      {/* Score inputs */}
      {criteria.map((c) => (
        <ScoreInput
          key={c.id}
          criterion={c}
          value={scores?.[c.id]}
          onChange={onChange}
        />
      ))}

      {/* Review notes */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
        <h4 className="text-sm font-semibold text-zinc-100">Review notes</h4>
        <p className="mt-0.5 text-[0.68rem] leading-5 text-zinc-500">
          Optional. A short justification shared with the results desk.
        </p>
        <textarea
          value={review}
          onChange={(e) => onReviewChange(e.target.value)}
          rows={4}
          placeholder="What stood out about this team's build and resource usage?"
          className="mt-3 h-auto w-full resize-none rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#42ff5a]/60"
        />
      </div>
    </section>
  );
}