"use client";

import type { JudgeTeamView, JudgeEvaluationView } from "./actions";

function statusLabel(evaluation: JudgeEvaluationView | null) {
  if (!evaluation) return null;
  return evaluation.status === "SUBMITTED" ? "Submitted" : "Draft";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TeamOverview({
  team,
  evaluation,
  maxTotal,
}: {
  team: JudgeTeamView | null;
  evaluation: JudgeEvaluationView | null;
  maxTotal: number;
}) {
  if (!team) {
    return (
      <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
    );
  }

  const status = statusLabel(evaluation);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Now Evaluating
          </p>
          <h2 className="mt-1.5 truncate text-xl font-semibold text-white">
            {team.name}
          </h2>
          <p className="mt-1 font-mono text-[0.7rem] text-zinc-500">
            {team.code}
          </p>
        </div>
        {status ? (
          <span className="shrink-0 rounded-full border border-[#42ff5a]/40 bg-[#42ff5a]/[0.08] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[#42ff5a]">
            {status}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/[0.08] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-amber-300">
            Not Reviewed
          </span>
        )}
      </div>

      {evaluation ? (
        <p className="mt-2 font-mono text-[0.6rem] text-zinc-600">
          {evaluation.total}/{maxTotal} &middot; updated{" "}
          {timeAgo(evaluation.updatedAt)}
          {evaluation.review ? " \u00B7 notes included" : ""}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {team.members.map((member) => (
          <li
            key={member.email}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">
                {member.name}
              </p>
              <p className="truncate text-[0.65rem] text-zinc-600">
                {member.email}
              </p>
            </div>
            {member.isLeader ? (
              <span className="shrink-0 rounded-full bg-[#42ff5a]/10 px-2.5 py-0.5 text-[0.6rem] font-semibold text-[#42ff5a] uppercase">
                Leader
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}