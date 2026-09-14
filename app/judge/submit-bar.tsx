"use client";

import type { JudgeSubmitReport } from "./actions";

export function SubmitBar({
  total,
  complete,
  isUpdate,
  pending,
  granted,
  feedback,
  onFindTeam,
  onSubmit,
}: {
  total: number;
  complete: boolean;
  isUpdate: boolean;
  pending: boolean;
  granted: boolean;
  feedback: JudgeSubmitReport | null;
  onFindTeam: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-zinc-500">
                Total
              </span>
              <span
                className="font-mono text-2xl font-bold"
                style={{
                  color: "#42ff5a",
                  textShadow: "0 0 12px rgba(66,255,90,0.35)",
                }}
              >
                {total}
              </span>
              <span className="font-mono text-sm text-zinc-600">
                / 100
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFindTeam}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-[#42ff5a]/40 hover:text-[#42ff5a]"
              >
                Find Another Team
              </button>

              {!granted ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-xs font-semibold text-amber-300">
                  Enter your judge name and passcode to submit
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!complete || pending}
                  className="rounded-xl border border-[#42ff5a]/50 bg-[#42ff5a]/10 px-6 py-2.5 text-sm font-semibold text-[#42ff5a] transition hover:bg-[#42ff5a]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  {pending
                    ? "Saving..."
                    : isUpdate
                      ? "Update Evaluation"
                      : "Submit Evaluation"}
                </button>
              )}
            </div>
          </div>

          {feedback ? (
            <div
              className={`mt-3 rounded-xl border px-4 py-2.5 text-xs ${
                feedback.status === "success"
                  ? "border-[#42ff5a]/30 bg-[#42ff5a]/[0.06] text-[#42ff5a]"
                  : feedback.status === "invalid"
                    ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-200"
                    : "border-red-500/30 bg-red-500/[0.06] text-red-200"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
