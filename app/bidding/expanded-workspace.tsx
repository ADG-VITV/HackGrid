"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "./auction-icon";
import { compactIncrement, formatCredits, incrementLabel } from "./auction-data";
import { secondsUntil, type BidFeedback, type ConnectionState } from "./use-auction-socket";
import type { LotView, RoomState } from "@/lib/socket-events";

function formatTimer(seconds: number | null) {
  if (seconds === null) return "—:—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type WorkspaceProps = {
  capsuleName: string;
  room: RoomState | null;
  connection: ConnectionState;
  clockSkew: number;
  feedback: BidFeedback;
  notStartedMessage: string | null;
  onBid: (lotId: string, amount: number) => void;
};

export function ExpandedWorkspace({
  capsuleName,
  room,
  connection,
  clockSkew,
  feedback,
  notStartedMessage,
  onBid,
}: WorkspaceProps) {
  const activeLot = room?.lots.find((lot) => lot.status === "OPEN") ?? null;

  // The typed amount is derived, not synced. A draft only survives while it
  // belongs to the open lot and still clears the server's current minimum, so
  // when someone outbids you the box snaps to the new minimum on its own.
  const [draft, setDraft] = useState<{ lotId: string; amount: number } | null>(null);
  const amount =
    activeLot && draft && draft.lotId === activeLot.id && draft.amount >= activeLot.nextMin
      ? draft.amount
      : (activeLot?.nextMin ?? 0);

  const setAmount = (next: number) => {
    if (activeLot) setDraft({ lotId: activeLot.id, amount: next });
  };

  if (notStartedMessage) {
    return (
      <Shell capsuleName={capsuleName} right={<Badge>Not started</Badge>}>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
          <p className="max-w-md text-sm leading-6 text-zinc-500">{notStartedMessage}</p>
        </div>
      </Shell>
    );
  }

  if (!room) {
    return (
      <Shell capsuleName={capsuleName} right={<Badge>{connection}</Badge>}>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {connection === "connecting" ? "Joining your pod room…" : "Waiting for the room state."}
          </p>
        </div>
      </Shell>
    );
  }

  // The tier this team ended up with, however it got there. A team that was
  // last standing never bid at all, so without this their screen would only
  // say "no tier is open" (rulebook 6.6).
  const yourResult = room.you.wonLotId
    ? (room.lots.find((lot) => lot.id === room.you.wonLotId) ?? null)
    : null;

  const youHoldTop = activeLot?.top?.teamId === room.you.teamId;
  const secondsLeft = secondsUntil(activeLot?.closesAt ?? null, clockSkew);
  const urgent = secondsLeft !== null && secondsLeft <= 10;
  const increment = activeLot?.minIncrement ?? 0;
  const canAfford = amount <= room.you.remainingBalance;
  const alreadyWon = room.you.wonLotId !== null;

  const canBid =
    Boolean(activeLot) &&
    !activeLot?.awaitingQuorum &&
    connection === "open" &&
    !youHoldTop &&
    !alreadyWon &&
    canAfford &&
    amount >= (activeLot?.nextMin ?? 0) &&
    (secondsLeft ?? 0) > 0;

  return (
    <Shell
      capsuleName={capsuleName}
      right={
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-semibold ${
            !activeLot || activeLot.awaitingQuorum
              ? "border-zinc-700 bg-zinc-900 text-zinc-400"
              : urgent
                ? "animate-pulse border-red-500/50 bg-red-500/10 text-red-400"
                : "border-neon/40 bg-neon/[0.08] text-neon"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {!activeLot ? "CLOSED" : activeLot.awaitingQuorum ? "ON HOLD" : formatTimer(secondsLeft)}
        </div>
      }
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-[4%] pt-6 pb-6 lg:flex-row lg:gap-[3%]">
        {/* -------------------------------------------------- bidding column */}
        <section className="flex min-w-0 flex-col lg:w-[58%]">
          {activeLot ? (
            <>
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">Now bidding:</span>{" "}
                <span className="text-zinc-100">{activeLot.name}</span>
              </p>

              <p className="mt-4 text-[0.65rem] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                {activeLot.top ? "Top bid" : "Starting bid"}
              </p>
              <p className="mt-1 font-mono text-4xl font-semibold text-neon lg:text-5xl">
                {formatCredits(activeLot.top ? activeLot.top.amount : activeLot.startingBid)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {activeLot.top ? (
                  youHoldTop ? (
                    <span className="font-medium text-neon">held by you</span>
                  ) : (
                    <>held by <span className="text-zinc-300">{activeLot.top.teamName}</span></>
                  )
                ) : (
                  "no bids yet"
                )}
              </p>

              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  activeLot.awaitingQuorum
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    : alreadyWon
                    ? "border-zinc-700 bg-zinc-900/60 text-zinc-400"
                    : youHoldTop
                      ? "border-neon/50 bg-neon/[0.08] text-neon"
                      : activeLot.top
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-zinc-700 bg-zinc-900/60 text-zinc-400"
                }`}
              >
                {activeLot.awaitingQuorum ? (
                  <>
                    <strong className="font-semibold">Waiting for the pod.</strong> The clock starts
                    once {room.pod.quorum} of {room.pod.podSize} teams are here —{" "}
                    <span className="font-mono font-semibold">{room.pod.onlineCount}</span> so far. No
                    time is running and no bids are accepted yet.
                  </>
                ) : alreadyWon ? (
                  <>You already won a tier in this capsule — you are out of the bidding for this round.</>
                ) : youHoldTop ? (
                  <>
                    <strong className="font-semibold">Your bid is on top.</strong> It sells to you if nobody
                    raises before the timer runs out.
                  </>
                ) : activeLot.top ? (
                  <>
                    <strong className="font-semibold">You have been outbid</strong> by {activeLot.top.teamName}.
                    Next valid bid is{" "}
                    <span className="font-mono font-semibold">{formatCredits(activeLot.nextMin)}</span>.
                  </>
                ) : (
                  <>
                    Open at <span className="font-mono font-semibold">{formatCredits(activeLot.nextMin)}</span>{" "}
                    credits. Minimum increment {incrementLabel(activeLot.minIncrement)}.
                  </>
                )}
              </div>

              {feedback && feedback.lotId === activeLot.id && feedback.kind === "rejected" ? (
                <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {feedback.message}
                </p>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease bid"
                  onClick={() => setAmount(Math.max(activeLot.nextMin, amount - (increment || 1)))}
                  disabled={amount <= activeLot.nextMin}
                  className="grid size-10 place-items-center rounded-xl border border-neon/40 bg-neon/[0.08] text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <MinusIcon />
                </button>
                <span className="min-w-28 text-center font-mono text-2xl font-semibold text-white lg:text-3xl">
                  {formatCredits(amount)}
                </span>
                <button
                  type="button"
                  aria-label="Increase bid"
                  onClick={() => setAmount(amount + (increment || 1))}
                  disabled={amount + (increment || 1) > room.you.remainingBalance}
                  className="grid size-10 place-items-center rounded-xl border border-neon/40 bg-neon/[0.08] text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <PlusIcon />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onBid(activeLot.id, amount)}
                disabled={!canBid}
                className={`mt-4 w-full rounded-xl border px-6 py-3 text-sm font-semibold transition ${
                  canBid
                    ? "border-neon/60 bg-neon/10 text-neon hover:bg-neon/20"
                    : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500"
                }`}
              >
                {activeLot.awaitingQuorum
                  ? `Waiting for ${room.pod.quorum} of ${room.pod.podSize} teams`
                  : youHoldTop
                  ? "You hold the top bid"
                  : alreadyWon
                    ? "Already won this capsule"
                    : !canAfford
                      ? "Over your remaining balance"
                      : `Bid ${formatCredits(amount)} credits`}
              </button>
              <p className="mt-2 text-[0.65rem] text-zinc-600">
                Every bid is validated and recorded on the server. This panel only shows what the server
                accepted.
              </p>
            </>
          ) : yourResult ? (
            <YourOutcome lot={yourResult} podLabel={room.pod.label} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="text-sm text-zinc-500">
                No tier is open in {room.pod.label}. All lots are settled or waiting to open.
              </p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------ side column */}
        <section className="flex min-w-0 flex-col gap-4 lg:w-[39%]">
          <div className="rounded-[20px] border border-neon/20 bg-zinc-950/60 p-4">
            <h4 className="text-[0.65rem] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
              {room.pod.label} · {room.members.length} of {room.pod.podSize} seats
            </h4>
            <ul className="mt-3 space-y-1.5">
              {room.members.map((member) => (
                <li
                  key={member.teamId}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    member.teamId === room.you.teamId ? "bg-neon/[0.07] text-neon" : "text-zinc-300"
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      member.online ? "bg-neon" : "bg-zinc-700"
                    }`}
                    aria-label={member.online ? "online" : "offline"}
                  />
                  <span className="min-w-0 flex-1 truncate">{member.teamName}</span>
                  <span className="shrink-0 truncate font-mono text-[0.6rem] text-zinc-500">
                    {member.leadName}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-neon/20 bg-zinc-950/60">
            <h4 className="shrink-0 px-4 pt-4 pb-2 text-[0.65rem] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
              Tiers in this pod
            </h4>
            <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
              {room.lots.map((lot) => (
                <LotRow key={lot.id} lot={lot} youTeamId={room.you.teamId} />
              ))}
            </ul>
          </div>
        </section>
      </div>
    </Shell>
  );
}

/** How a team ended up with the tier it owns, in the words of the rulebook. */
const outcomeCopy: Record<string, { headline: string; detail: string }> = {
  COMPETITIVE: {
    headline: "You won this tier at auction.",
    detail: "You held the top bid when the timer ran out.",
  },
  AUTO_ASSIGNED: {
    headline: "This tier was assigned to you.",
    detail:
      "You were the last team left in the pod, so it went to you at its listed price with no bidding — you never needed to place a bid.",
  },
  POD_AVERAGE: {
    headline: "You claimed this tier.",
    detail:
      "Remainder pods buy rather than bid: you paid the average price the main pods set for this tier.",
  },
  STARTING_BID_FALLBACK: {
    headline: "You claimed this tier.",
    detail:
      "No main pod sold this tier, so the listed starting price stood in as the fixed price.",
  },
};

function YourOutcome({ lot, podLabel }: { lot: LotView; podLabel: string }) {
  const copy = outcomeCopy[lot.result?.priceSource ?? ""] ?? {
    headline: "You own this tier.",
    detail: "",
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-neon uppercase">
        {podLabel} · your result
      </p>
      <h4 className="mt-3 text-2xl font-semibold text-white lg:text-3xl">{lot.name}</h4>

      <p className="mt-4 text-[0.65rem] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
        You paid
      </p>
      <p className="mt-1 font-mono text-4xl font-semibold text-neon lg:text-5xl">
        {formatCredits(lot.result?.pricePaid ?? 0)}
      </p>

      <div className="mt-5 max-w-md rounded-xl border border-neon/50 bg-neon/[0.08] px-4 py-3 text-sm text-neon">
        <strong className="font-semibold">{copy.headline}</strong>
        {copy.detail ? <span className="mt-1 block text-zinc-300">{copy.detail}</span> : null}
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        You are done for this round. The next round opens once every pod has finished.
      </p>
    </div>
  );
}

function LotRow({ lot, youTeamId }: { lot: LotView; youTeamId: number }) {
  const wonByYou = lot.result?.teamId === youTeamId;

  return (
    <li
      className={`rounded-xl border px-3 py-2 ${
        lot.status === "OPEN"
          ? "border-neon/50 bg-neon/[0.06]"
          : lot.status === "CLOSED"
            ? "border-transparent bg-black/40"
            : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{lot.name}</span>
        <span className="shrink-0 font-mono text-sm text-neon">{formatCredits(lot.startingBid)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[0.62rem]">
        <span className="text-zinc-500">Min increment: {compactIncrement(lot.minIncrement)}</span>
        {lot.status === "CLOSED" && lot.result ? (
          <span className={wonByYou ? "font-semibold text-neon" : "text-zinc-400"}>
            {wonByYou ? "Won by you" : `Won by ${lot.result.teamName}`} · {formatCredits(lot.result.pricePaid)}
          </span>
        ) : lot.status === "OPEN" ? (
          <span className="font-semibold text-neon">Live · {lot.bidCount} bid(s)</span>
        ) : lot.isAutoAssigned ? (
          <span className="text-zinc-600">Auto-assigned</span>
        ) : (
          <span className="text-zinc-600">Queued</span>
        )}
      </div>
    </li>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs tracking-wide text-zinc-400 uppercase">
      {children}
    </span>
  );
}

function Shell({
  capsuleName,
  right,
  children,
}: {
  capsuleName: string;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[25px] border border-neon/40 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.6)] lg:min-h-[420px]">
      <div className="flex shrink-0 items-center justify-between px-[4%] pt-6">
        <h3 className="text-xl font-semibold tracking-wide text-white lg:text-2xl">{capsuleName}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}
