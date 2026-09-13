"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getAdminContextAction,
  resetCapsuleAction,
  resetEventAdminAction,
  resetSubCapsuleAction,
  startEventAdminAction,
  startRoundAction,
  type AdminContext,
  type AdminReport,
} from "./actions";

function statusTone(status: string) {
  return status === "LIVE"
    ? "border-neon/50 text-neon"
    : status === "CLOSED"
      ? "border-zinc-700 text-zinc-400"
      : "border-amber-500/40 text-amber-300";
}

export function AdminClient() {
  const [context, setContext] = useState<AdminContext | null>(null);
  const [message, setMessage] = useState<AdminReport | null>(null);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(() => {
    void getAdminContextAction()
      .then(setContext)
      .catch(() => setMessage({ status: "error", message: "Could not load organiser state." }));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function run(action: () => Promise<AdminReport>) {
    startTransition(async () => {
      const report = await action();
      setMessage(report);
      reload();
    });
  }

  const liveCapsule = context?.event.liveCapsuleName ?? null;
  const eventPrepared = context?.event.isPrepared ?? false;
  const canStartEvent = Boolean(context) && !eventPrepared && !liveCapsule;

  return (
    <main className="min-h-dvh bg-black px-4 pt-24 pb-12 text-zinc-100 sm:px-[6%]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
              Organiser portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Event control</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Start Event prepares every round and locks in pods for the full event. From there,
              each round can be opened individually and reset without changing the schema.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={pending}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 hover:border-neon/50 hover:text-neon disabled:opacity-40"
          >
            Refresh
          </button>
        </div>

        {message ? (
          <p
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              message.status === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-neon/35 bg-neon/10 text-neon"
            }`}
          >
            {message.message}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Teams onboarded</p>
            <p className="mt-2 text-3xl font-semibold text-white">{context?.teamCount ?? "-"}</p>
            <p className="mt-2 text-xs text-zinc-500">All prepared rounds reuse this roster.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Rounds prepared</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {context ? `${context.event.preparedCapsules}/${context.capsules.length}` : "-"}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Starting the event locks pod assignments for every round.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Live round</p>
            <p className="mt-2 text-sm font-medium text-white">{liveCapsule ?? "No round live"}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {context
                ? `${context.event.completedCapsules} completed · starting budget ${context.event.startingBudget}`
                : "Waiting for event context."}
            </p>
          </article>
        </section>

        <section className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
          <button
            type="button"
            onClick={() => run(startEventAdminAction)}
            disabled={pending || !canStartEvent}
            className="rounded-lg border border-neon/60 bg-neon/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neon hover:bg-neon/20 disabled:opacity-40"
          >
            Start event
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset the whole event? All bids and settlements will be removed.")) {
                run(resetEventAdminAction);
              }
            }}
            disabled={pending}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-300 hover:bg-red-500/10 disabled:opacity-40"
          >
            Reset event
          </button>
        </section>

        <section className="mt-8 space-y-4">
          {context?.capsules.map((capsule) => (
            <article key={capsule.key} className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-zinc-500">ROUND {capsule.sequenceOrder}</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{capsule.name}</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {capsule.podCount} prepared pods · {capsule.memberCount} seats ·{" "}
                    {capsule.settlementCount} settled lots
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(capsule.status)}`}>
                    {capsule.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => run(() => startRoundAction(capsule.key))}
                    disabled={
                      pending ||
                      capsule.status !== "PENDING" ||
                      !eventPrepared ||
                      Boolean(liveCapsule)
                    }
                    className="rounded-lg border border-neon/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neon hover:bg-neon/10 disabled:opacity-40"
                  >
                    Start round
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Reset ${capsule.name}? Its bids and results will be removed, but its prepared pods remain.`,
                        )
                      ) {
                        run(() => resetCapsuleAction(capsule.key));
                      }
                    }}
                    disabled={pending || capsule.podCount === 0}
                    className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Reset round
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                {capsule.subCapsules.map((subCapsule) => (
                  <button
                    key={subCapsule.key}
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Reset ${subCapsule.name}? Earlier tiers stay settled and this tier reopens cleanly.`,
                        )
                      ) {
                        run(() => resetSubCapsuleAction(capsule.key, subCapsule.key));
                      }
                    }}
                    disabled={pending || capsule.podCount === 0}
                    className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-amber-400/60 hover:text-amber-200 disabled:opacity-40"
                  >
                    Reset tier {subCapsule.tierRank}: {subCapsule.name}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
