"use client";

import Link from "next/link";
import type { BiddingContext } from "./actions";
import { ResourceManager } from "./resource-manager";
import { secondsUntil } from "./use-auction-socket";
import { Chip, CornerMarks, Eyebrow, Panel, ghostButton } from "@/components/ui/panel";
import { AUCTION_START_LABEL } from "@/lib/event-schedule";

function formatTimer(seconds: number | null) {
  if (seconds === null) return "—:—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * What a team member sees on the bidding page.
 *
 * Members never enter a pod room — only the lead's account is let in, and a
 * second socket would count towards quorum. So this view is fed by the same
 * database read the ledger uses, polled while a round is live. It shows the
 * tier the lead is bidding on right now and, in the Resource Manager, every
 * round the lead has already finished.
 */
export function MemberView({ context, polling }: { context: BiddingContext; polling: boolean }) {
  const team = context.team!;
  const live = context.capsules.findLast((capsule) => capsule.status === "LIVE") ?? null;
  const started = context.capsules.some((capsule) => capsule.status !== "PENDING");
  const complete = started && context.capsules.every((capsule) => capsule.status === "CLOSED");
  const lot = context.currentLot;
  const secondsLeft = secondsUntil(lot?.closesAt ?? null, 0);

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-black p-4 pt-20 text-zinc-100 sm:p-[3%] sm:pt-24">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neon/20 bg-zinc-950/60 px-4 py-3">
          <Chip tone={live ? "neon" : "muted"}>{live ? (polling ? "Following" : "Live") : "Standby"}</Chip>
          <span className="text-sm text-zinc-300">
            {team.name} · {team.code}
          </span>
          <Chip tone="muted">Member</Chip>
          <span className="ml-auto text-xs text-zinc-500">
            Lead <span className="text-zinc-200">{team.leadName}</span> bids for you
          </span>
        </div>

        <section className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-[2.5%]">
          <div className="flex min-w-0 flex-col gap-4 lg:w-[74%]">
            <Panel className="relative flex min-h-[380px] flex-col p-6 sm:p-8">
              <CornerMarks />

              {live ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Eyebrow tone="neon">
                      Round {live.sequenceOrder} · {live.name}
                      {live.podLabel ? ` · ${live.podLabel}` : ""}
                    </Eyebrow>
                    <span
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-semibold ${
                        lot?.closesAt
                          ? secondsLeft !== null && secondsLeft <= 10
                            ? "animate-pulse border-red-500/50 bg-red-500/10 text-red-400"
                            : "border-neon/40 bg-neon/[0.08] text-neon"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {lot ? (lot.closesAt ? formatTimer(secondsLeft) : "ON HOLD") : "—:—"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-center py-8">
                    <Eyebrow>On the block now</Eyebrow>
                    {lot ? (
                      <>
                        <h2 className="mt-3 text-3xl font-semibold tracking-wide text-white sm:text-5xl">
                          {lot.name}
                        </h2>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">
                          Tier {lot.tierRank} of {live.tierCount}. Your lead{" "}
                          <span className="text-zinc-200">{team.leadName}</span> is in the room. What
                          the team ends up with shows in the ledger once this round closes.
                        </p>
                      </>
                    ) : live.podId ? (
                      <>
                        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                          Between tiers.
                        </h2>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">
                          Nothing is open in {live.podLabel} this second — the next tier opens on its own,
                          or the pod is done and waiting on the others.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                          Not in a pod this round.
                        </h2>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">
                          Your team was not drawn into a pod for {live.name}.
                        </p>
                      </>
                    )}
                  </div>
                </>
              ) : complete ? (
                <div className="flex flex-1 flex-col justify-center">
                  <Eyebrow tone="neon">Auction finished</Eyebrow>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Every round is settled.</h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">
                    Your team&apos;s final product spec is in the Resource Manager.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col justify-center">
                  <Eyebrow>Not started</Eyebrow>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Round one opens soon.</h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">
                    {AUCTION_START_LABEL}. This page changes on its own the moment your lead is placed
                    in a pod.
                  </p>
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-neon/10 pt-4">
                <p className="text-[0.62rem] text-zinc-600">
                  Only the lead&apos;s account can enter the bidding room.
                </p>
                <Link href="/teams" className={`${ghostButton} h-9 px-4 text-xs`}>
                  Team dashboard
                </Link>
              </div>
            </Panel>

            <ol className="grid gap-2 sm:grid-cols-4">
              {context.capsules.map((capsule) => {
                const isLive = capsule.status === "LIVE";
                const isClosed = capsule.status === "CLOSED";
                return (
                  <li
                    key={capsule.key}
                    className={`rounded-xl border px-3 py-2.5 ${
                      isLive
                        ? "border-neon/60 bg-neon/[0.06]"
                        : isClosed
                          ? "border-white/10 bg-black/60"
                          : "border-white/5 bg-black/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded font-mono text-[0.55rem] ${
                          isLive
                            ? "bg-neon/20 text-neon"
                            : isClosed
                              ? "bg-zinc-800 text-zinc-500"
                              : "bg-zinc-900 text-zinc-700"
                        }`}
                      >
                        {capsule.sequenceOrder}
                      </span>
                      <span
                        className={`truncate text-xs tracking-wide uppercase ${
                          isLive ? "text-neon" : isClosed ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        {capsule.name}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[0.55rem] tracking-[0.12em] text-zinc-600 uppercase">
                      {isClosed ? "settled" : isLive ? "live" : "locked"}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          <aside className="flex w-full flex-col gap-4 self-start lg:w-[23%]">
            <ResourceManager
              resources={context.resources}
              capsules={context.capsules}
              identityHint={null}
              revealLive={false}
              showBidCap={false}
            />
          </aside>
        </section>

        <p className="pb-2 text-center text-[0.62rem] text-zinc-700">
          Rounds run one at a time in order · your lead is the only bidder · the ledger updates when a
          round closes
        </p>
      </div>
    </main>
  );
}
