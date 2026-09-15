import type { Metadata } from "next";
import { connection } from "next/server";
import { EVENT_KEY } from "@/lib/auction-engine.mjs";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Evaluations | HackGrid",
  description: "Team-by-team HackGrid judging results.",
};

function scoreTotal(scores: Array<{ score: number }>) {
  return scores.reduce((total, score) => total + score.score, 0);
}

function submittedAt(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "Not submitted";
}

export default async function EvaluationsPage() {
  await connection();

  const event = await prisma.event.findUnique({
    where: { key: EVENT_KEY },
    select: {
      name: true,
      judgingCriteria: {
        where: { active: true },
        select: { maxScore: true },
      },
      evaluations: {
        where: { status: "SUBMITTED" },
        orderBy: { submittedAt: "desc" },
        include: {
          team: { select: { id: true, name: true, code: true } },
          judgeAssignment: { include: { judge: { select: { name: true } } } },
          scores: true,
        },
      },
    },
  });

  const teams = new Map<
    number,
    {
      name: string;
      code: string;
      evaluations: NonNullable<typeof event>["evaluations"];
    }
  >();

  for (const evaluation of event?.evaluations ?? []) {
    const existing = teams.get(evaluation.team.id);
    if (existing) existing.evaluations.push(evaluation);
    else {
      teams.set(evaluation.team.id, {
        name: evaluation.team.name,
        code: evaluation.team.code,
        evaluations: [evaluation],
      });
    }
  }

  const maxTotal = event?.judgingCriteria.reduce((total, criterion) => total + criterion.maxScore, 0) ?? 0;
  const teamResults = [...teams.values()].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="min-h-dvh bg-black px-4 py-16 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#42ff5a]">
              {event?.name ?? "HackGrid"}
            </p>
            <h1 className="font-pixel mt-2 text-3xl font-bold tracking-wider text-white sm:text-4xl">
              Team evaluations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              Submitted judge scores and written evaluations, grouped by team.
            </p>
          </header>

          {!event ? (
            <p className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5 text-sm text-amber-200">
              Evaluation results are not available because the event has not been prepared.
            </p>
          ) : teamResults.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-sm text-zinc-400">
              No submitted evaluations yet.
            </p>
          ) : (
            <div className="space-y-5">
              {teamResults.map((team) => {
                const totals = team.evaluations.map((evaluation) => scoreTotal(evaluation.scores));
                const average = totals.reduce((total, score) => total + score, 0) / totals.length;

                return (
                  <section key={team.code} className="rounded-2xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-[#42ff5a]">{team.code}</p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">{team.name}</h2>
                        <p className="mt-2 text-sm text-zinc-500">
                          {team.evaluations.length} submitted {team.evaluations.length === 1 ? "evaluation" : "evaluations"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#42ff5a]/30 bg-[#42ff5a]/[0.05] px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Average score</p>
                        <p className="mt-1 text-2xl font-semibold text-[#42ff5a]">
                          {average.toFixed(1)} <span className="text-sm text-zinc-500">/ {maxTotal}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      {team.evaluations.map((evaluation) => {
                        const total = scoreTotal(evaluation.scores);

                        return (
                          <article key={evaluation.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{evaluation.judgeAssignment.judge.name}</p>
                                <p className="mt-1 text-xs text-zinc-500">Submitted {submittedAt(evaluation.submittedAt)}</p>
                              </div>
                              <p className="font-mono text-lg font-semibold text-white">{total} / {maxTotal}</p>
                            </div>

                            {evaluation.review ? (
                              <div className="mt-4 border-l-2 border-[#42ff5a]/50 pl-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Judge feedback</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{evaluation.review}</p>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}
