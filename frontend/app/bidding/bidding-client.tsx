"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronIcon } from "./auction-icon";
import { ExpandedWorkspace } from "./expanded-workspace";
import { IdentityBar } from "./identity-bar";
import { MemberView } from "./member-view";
import { ResourceManager } from "./resource-manager";
import { auctionTiles } from "./auction-data";
import { useViewer } from "@/lib/use-viewer";
import { getBiddingContextAction, type BiddingContext } from "./actions";
import { secondsUntil, useAuctionSocket, useSecondTick } from "./use-auction-socket";

/** How often a member's watch view re-reads the database while a round is live. */
const MEMBER_LIVE_POLL_MS = 4_000;
/** Polling between rounds, for everyone who has no room to sit in. */
const IDLE_POLL_MS = 10_000;
const NO_TEAM_MESSAGE = "Join or create a team first to view the bidding page.";

function formatTimerDisplay(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const emptyContext: BiddingContext = {
  status: "success",
  message: "",
  team: null,
  viewerRole: null,
  currentLot: null,
  resources: null,
  capsules: auctionTiles.map((tile, index) => ({
    key: tile.id,
    name: tile.label,
    sequenceOrder: index + 1,
    capsuleId: null,
    status: "PENDING" as const,
    tierCount: tile.items.length,
    podId: null,
    podLabel: null,
    podKind: null,
  })),
};

/**
 * The auction as a team sees it. Organiser controls — starting the event,
 * forcing a round, resetting — live on /admin; nothing here can change the
 * event's state, only bid in it.
 */
export function BiddingClient() {
  const [fetched, setFetched] = useState<{ identity: string; context: BiddingContext }>({
    identity: "",
    context: emptyContext,
  });
  const [expanded, setExpanded] = useState(true);

  useSecondTick();

  // ---------------------------------------------------------------- identity

  // The viewer is whoever signed in with Google; the server works out from
  // that email whether they lead their team or merely belong to it.
  const viewer = useViewer();
  const identity = viewer.email || null;

  const refreshContext = useCallback(() => {
    if (!identity) return;
    getBiddingContextAction(identity)
      .then((context) => setFetched({ identity, context }))
      .catch(() => undefined);
  }, [identity]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  // A context fetched for one identity must not linger once it changes — a
  // sign-out drops straight back to the empty shell.
  const context = identity && fetched.identity === identity ? fetched.context : emptyContext;
  const lookupPending = Boolean(identity && fetched.identity !== identity);
  const needsTeam = Boolean(
    identity &&
      fetched.identity === identity &&
      !context.team &&
      context.message === "No team found for that identity.",
  );

  const teamId = context.team ? String(context.team.id) : null;
  // Only the lead bids (rulebook 8). A member gets the read-only view and
  // never opens a socket — a second seat in the room would count for quorum.
  const isMember = context.viewerRole === "MEMBER";

  // ------------------------------------------------------------------ socket

  // Exactly one capsule runs at a time, so there is exactly one room to be in.
  // The server keeps exactly one capsule live; if it ever reports more, the
  // one furthest along the running order is the current round.
  const liveCapsule = context.capsules.findLast((capsule) => capsule.status === "LIVE") ?? null;
  const activePodId = isMember ? null : (liveCapsule?.podId ?? null);

  // The hub seats the lead's email only.
  const socketEmail = isMember ? null : identity;

  const { connection, state: room, feedback, clockSkew, placeBid, lastEvent } = useAuctionSocket(
    activePodId,
    teamId,
    socketEmail,
  );

  // A round ending, or the next one opening, changes which room this client
  // belongs to — so re-read the context whenever the server says so.
  // Settlements land in the Resource Manager, so a closing lot refreshes too.
  useEffect(() => {
    if (!lastEvent) return;
    refreshContext();
  }, [lastEvent, refreshContext]);

  // With no socket there is no push: between rounds nobody has a room, and a
  // member never does. Poll instead — quickly while a member is following a
  // live round, gently otherwise. Once a lead's room is open the socket does
  // the work.
  const isLive = Boolean(liveCapsule);
  useEffect(() => {
    if (!isMember && connection === "open") return;
    const ms = isMember && isLive ? MEMBER_LIVE_POLL_MS : IDLE_POLL_MS;
    const id = setInterval(refreshContext, ms);
    return () => clearInterval(id);
  }, [isMember, isLive, connection, refreshContext]);

  // --------------------------------------------------------------------- ui

  if (isMember) {
    return <MemberView context={context} polling={isLive} />;
  }

  const eventStarted = context.capsules.some((capsule) => capsule.status !== "PENDING");
  const eventComplete =
    eventStarted && context.capsules.every((capsule) => capsule.status === "CLOSED");

  const activeLot = room?.lots.find((lot) => lot.status === "OPEN") ?? null;
  const secondsLeft = secondsUntil(activeLot?.closesAt ?? null, clockSkew);

  function workspaceMessage(): string | null {
    if (viewer.loading || lookupPending) {
      return "Loading your team...";
    }
    if (needsTeam) {
      return NO_TEAM_MESSAGE;
    }
    if (!teamId) {
      return "Sign in with your team's email to join its pod room.";
    }
    if (!liveCapsule) {
      return eventComplete
        ? "Every round is finished. Your final product spec is in the Resource Manager."
        : "The auction has not started yet. This page will come alive when the first round opens.";
    }
    if (!liveCapsule.podId) {
      return `${liveCapsule.name} is running, but your team was not placed in a pod for it.`;
    }
    return null;
  }

  const identityLabel = context.team
    ? `${context.team.name} · ${context.team.code}`
    : viewer.loading || lookupPending
      ? "Loading your team..."
      : needsTeam
        ? "Join or create a team first"
        : identity
          ? (context.message || "Team lookup failed")
          : "Not signed in";

  const emptyResourceHint = needsTeam
    ? NO_TEAM_MESSAGE
    : teamId
      ? null
      : "Sign in with your roster email to see what your team owns.";

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-black p-4 pt-20 text-zinc-100 sm:p-[3%] sm:pt-24">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <IdentityBar
          teamLabel={identityLabel}
          podLabel={room?.pod.label ?? liveCapsule?.podLabel ?? null}
          connection={connection}
          balance={context.resources?.remaining ?? null}
        />

        {needsTeam ? (
          <section className="rounded-2xl border border-neon/25 bg-neon/[0.04] px-4 py-4 shadow-[0_0_40px_rgba(66,255,90,0.08)] sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Team required</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{NO_TEAM_MESSAGE}</p>
            </div>
            <Link
              href="/teams"
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-neon/40 px-4 font-mono text-[0.62rem] tracking-[0.14em] text-neon uppercase transition hover:bg-neon/10 sm:mt-0"
            >
              Open Teams
            </Link>
          </section>
        ) : null}

        <section className="flex min-h-0 flex-1 flex-col gap-[2.5%] lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col gap-[2%] self-start rounded-[2.5rem] border border-neon/20 bg-black p-[1.5%] shadow-[0_0_80px_rgba(66,255,90,0.06)] lg:w-[74%]">
            <section className="flex min-h-0 flex-1 flex-col gap-[2%] rounded-3xl border border-neon/20 bg-zinc-950/60 p-[2%]">
              {context.capsules.map((capsule) => {
                const isLive = capsule.status === "LIVE";
                const isClosed = capsule.status === "CLOSED";
                // The pod room belongs to the current round only, never to a
                // tile that merely shares its status.
                const isOpen = capsule.key === liveCapsule?.key && expanded;
                const tile = auctionTiles.find((t) => t.id === capsule.key);
                const biddable =
                  tile?.items.filter((item) => item.minIncrement !== null).length ?? 0;

                return (
                  <div key={capsule.key} className="flex shrink-0 flex-col">
                    <div
                      className={`flex h-[68px] w-full shrink-0 items-center gap-3 rounded-[20px] border pr-3 pl-5 transition ${
                        isLive
                          ? "border-neon/70 bg-neon/[0.08] shadow-[0_0_24px_rgba(66,255,90,0.15)]"
                          : isClosed
                            ? "border-white/10 bg-black/60"
                            : "border-white/5 bg-black/40"
                      }`}
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-md font-mono text-[0.6rem] ${
                          isLive
                            ? "bg-neon/20 text-neon"
                            : isClosed
                              ? "bg-zinc-800 text-zinc-500"
                              : "bg-zinc-900 text-zinc-700"
                        }`}
                      >
                        {capsule.sequenceOrder}
                      </span>

                      <button
                        type="button"
                        onClick={() => isLive && setExpanded((value) => !value)}
                        disabled={!isLive}
                        aria-expanded={isOpen}
                        className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left font-medium disabled:cursor-default"
                      >
                        <span
                          className={`text-sm tracking-wide uppercase ${
                            isLive ? "text-neon" : isClosed ? "text-zinc-400" : "text-zinc-600"
                          }`}
                        >
                          {capsule.name}
                        </span>

                        {isLive && activeLot ? (
                          <span
                            className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[0.65rem] ${
                              activeLot.awaitingQuorum
                                ? "bg-sky-500/10 text-sky-300"
                                : secondsLeft !== null && secondsLeft <= 10
                                  ? "animate-pulse bg-red-500/15 text-red-400"
                                  : "bg-neon/[0.08] text-neon"
                            }`}
                          >
                            {activeLot.awaitingQuorum
                              ? `waiting ${room?.pod.onlineCount ?? 0}/${room?.pod.quorum ?? 0}`
                              : formatTimerDisplay(secondsLeft ?? 0)}
                          </span>
                        ) : null}

                        <span className="font-mono text-[0.58rem] tracking-[0.14em] text-zinc-600 uppercase">
                          {isClosed
                            ? "settled"
                            : isLive
                              ? `live · pods of ${capsule.tierCount}`
                              : `locked · ${biddable} bid rounds`}
                        </span>
                      </button>

                      {isLive ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((value) => !value)}
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          className="shrink-0 px-2 text-neon"
                        >
                          <ChevronIcon open={isOpen} />
                        </button>
                      ) : (
                        <span className="w-9 shrink-0" />
                      )}
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "mt-[1%] grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="mx-auto w-[96%]">
                          {isOpen ? (
                            <ExpandedWorkspace
                              capsuleName={capsule.name}
                              room={room}
                              connection={connection}
                              clockSkew={clockSkew}
                              feedback={feedback}
                              notStartedMessage={workspaceMessage()}
                              onBid={placeBid}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!liveCapsule ? (
                <p className="px-2 py-4 text-center text-xs leading-5 text-zinc-600">
                  {workspaceMessage()}
                </p>
              ) : null}
            </section>
          </div>

          <aside className="flex w-full flex-col gap-4 self-start lg:w-[23%]">
            <ResourceManager
              resources={context.resources}
              capsules={context.capsules}
              identityHint={emptyResourceHint}
            />
          </aside>
        </section>

        <p className="pb-2 text-center text-[0.62rem] text-zinc-700">
          Rounds run one at a time in order · pods are prepared at event start · all bids validated
          and recorded server-side
        </p>
      </div>
    </main>
  );
}
