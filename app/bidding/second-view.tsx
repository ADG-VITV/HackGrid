"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCredits } from "./auction-data";
import { getBiddingContextAction, type TeamOption } from "./actions";
import { secondsUntil, useAuctionSocket } from "./use-auction-socket";

/**
 * A second live room, seen as somebody else.
 *
 * Development only. Some seats are hard to reach from your own screen — the
 * team sitting in the Remainder Pod, or the last team standing that is handed
 * a tier without ever bidding — so this mirrors another team's room beside
 * yours, with its own socket, and can bid as them.
 */
export function SecondView({ teams }: { teams: TeamOption[] }) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [podId, setPodId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // Remainder Pod first: that is the seat you can't otherwise get to.
  const suggested = useMemo(() => {
    const remainder = teams.find((team) => team.podKind === "REMAINDER");
    return remainder ?? teams.find((team) => team.podLabel) ?? null;
  }, [teams]);

  // Nothing chosen yet means "the suggested seat", derived rather than written
  // into state, so the picker has a value without an effect setting one.
  const watchedTeamId = teamId ?? (suggested ? String(suggested.id) : null);

  // The pod changes every round, so it is looked up rather than remembered.
  useEffect(() => {
    let cancelled = false;

    async function resolvePod() {
      if (!watchedTeamId) {
        if (!cancelled) setPodId(null);
        return;
      }
      setResolving(true);
      const context = await getBiddingContextAction(watchedTeamId).catch(() => null);
      if (cancelled) return;
      const live = context?.capsules.find((capsule) => capsule.status === "LIVE") ?? null;
      setPodId(live?.podId ?? null);
      setResolving(false);
    }

    void resolvePod();
    return () => {
      cancelled = true;
    };
  }, [watchedTeamId]);

  const { connection, state: room, clockSkew, placeBid, lastEvent } = useAuctionSocket(podId, watchedTeamId);

  // A round turning over moves this team to a different pod.
  useEffect(() => {
    if (!lastEvent || !watchedTeamId) return;
    if (lastEvent.type === "CAPSULE_OPENED" || lastEvent.type === "CAPSULE_CLOSED") {
      getBiddingContextAction(watchedTeamId)
        .then((context) => {
          const live = context.capsules.find((capsule) => capsule.status === "LIVE") ?? null;
          setPodId(live?.podId ?? null);
        })
        .catch(() => undefined);
    }
  }, [lastEvent, watchedTeamId]);

  const activeLot = room?.lots.find((lot) => lot.status === "OPEN") ?? null;
  const secondsLeft = secondsUntil(activeLot?.closesAt ?? null, clockSkew);
  const yourResult = room?.you.wonLotId
    ? (room.lots.find((lot) => lot.id === room.you.wonLotId) ?? null)
    : null;
  const holdsTop = activeLot?.top?.teamId === room?.you.teamId;

  const bid = useCallback(() => {
    if (activeLot) placeBid(activeLot.id, activeLot.nextMin);
  }, [activeLot, placeBid]);

  return (
    <section className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.65rem] font-semibold tracking-[0.16em] text-sky-400/80 uppercase">
          Second view
        </h3>
        <span className="font-mono text-[0.55rem] tracking-wide text-zinc-600 uppercase">
          dev only
        </span>
      </div>

      <select
        value={watchedTeamId ?? ""}
        onChange={(event) => setTeamId(event.target.value || null)}
        className="mt-3 h-9 w-full rounded-lg border border-sky-500/30 bg-black px-2 text-xs text-zinc-100 outline-none transition focus:border-sky-400/70"
      >
        <option value="">Watch another team…</option>
        {teams.map((team) => (
          <option key={team.id} value={String(team.id)}>
            {team.name}
            {team.podLabel ? ` — ${team.podLabel}` : " — not seated"}
          </option>
        ))}
      </select>

      {!watchedTeamId ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Pick a team to watch their room beside yours. Handy for the Remainder Pod, and for the
          last team standing who is handed a tier without bidding.
        </p>
      ) : resolving ? (
        <p className="mt-3 text-xs text-zinc-500">Finding their pod…</p>
      ) : !podId ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          That team has no seat in the live round yet.
        </p>
      ) : !room ? (
        <p className="mt-3 text-xs text-zinc-500">
          {connection === "connecting" ? "Joining their room…" : "Waiting for their room state."}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-[0.58rem] tracking-wide uppercase ${
                room.pod.kind === "REMAINDER"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
            >
              {room.pod.label}
            </span>
            <span className="font-mono text-[0.6rem] text-zinc-500">
              {formatCredits(room.you.remainingBalance)} left
            </span>
          </div>

          <p className="truncate text-xs text-zinc-300">{room.you.teamName}</p>

          {yourResult ? (
            <div className="rounded-lg border border-neon/40 bg-neon/[0.06] px-2.5 py-2">
              <p className="text-[0.58rem] tracking-wide text-neon uppercase">
                {yourResult.result?.priceSource === "AUTO_ASSIGNED"
                  ? "assigned, no bidding"
                  : yourResult.result?.priceSource === "COMPETITIVE"
                    ? "won at auction"
                    : "claimed at the fixed price"}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-200">{yourResult.name}</p>
              <p className="font-mono text-sm font-semibold text-neon">
                {formatCredits(yourResult.result?.pricePaid ?? 0)}
              </p>
            </div>
          ) : activeLot ? (
            <div className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 truncate text-xs text-zinc-200">{activeLot.name}</p>
                <span
                  className={`shrink-0 font-mono text-[0.6rem] ${
                    activeLot.awaitingQuorum
                      ? "text-sky-300"
                      : secondsLeft !== null && secondsLeft <= 10
                        ? "text-red-400"
                        : "text-zinc-500"
                  }`}
                >
                  {activeLot.awaitingQuorum
                    ? `${room.pod.onlineCount}/${room.pod.quorum} here`
                    : secondsLeft === null
                      ? "—"
                      : `${secondsLeft}s`}
                </span>
              </div>

              <p className="mt-1 font-mono text-lg font-semibold text-neon">
                {formatCredits(activeLot.top ? activeLot.top.amount : activeLot.startingBid)}
                {activeLot.frozenPrice !== null ? (
                  <span className="ml-1 text-[0.55rem] tracking-wide text-amber-400 uppercase">
                    frozen
                  </span>
                ) : null}
              </p>
              <p className="text-[0.6rem] text-zinc-500">
                {activeLot.top
                  ? holdsTop
                    ? "their bid is on top"
                    : `held by ${activeLot.top.teamName}`
                  : "no bids yet"}
              </p>

              <button
                type="button"
                onClick={bid}
                disabled={
                  connection !== "open" ||
                  holdsTop ||
                  activeLot.awaitingQuorum ||
                  (secondsLeft ?? 0) <= 0
                }
                className="mt-2 w-full rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-1.5 text-[0.62rem] font-semibold tracking-wide text-sky-300 uppercase transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {activeLot.awaitingQuorum
                  ? "clock on hold — pod not full"
                  : holdsTop
                    ? "they hold the top bid"
                    : `bid ${formatCredits(activeLot.nextMin)} as them`}
              </button>
            </div>
          ) : (
            <p className="text-xs leading-5 text-zinc-500">
              {room.pod.kind === "REMAINDER"
                ? "Their pod is waiting for the main pods to finish and set its prices."
                : "Nothing open in their pod right now."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
