"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronIcon } from "./auction-icon";
import { ExpandedWorkspace } from "./expanded-workspace";
import { ActAsBar } from "./act-as-bar";
import { DevConsole } from "./dev-console";
import { ResourceManager } from "./resource-manager";
import { SecondView } from "./second-view";
import { auctionTiles } from "./auction-data";
import {
  getBiddingContextAction,
  listTeamsAction,
  resetEventAction,
  startCapsuleAction,
  startEventAction,
  type BiddingContext,
  type TeamOption,
} from "./actions";
import {
  secondsUntil,
  useAuctionSocket,
  useSecondTick,
  type ConsoleEntry,
} from "./use-auction-socket";

const IS_DEV = process.env.NODE_ENV === "development";
const ACT_AS_KEY = "hackgrid:actAsTeamId";
const EMAIL_KEYS = ["hackgrid:gmail", "hackgrid:userEmail", "email"];

function formatTimerDisplay(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function readStoredEmail() {
  for (const key of EMAIL_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.includes("@")) return value;
  }
  return "";
}

const emptyContext: BiddingContext = {
  status: "success",
  message: "",
  team: null,
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

export function BiddingClient() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [context, setContext] = useState<BiddingContext>(emptyContext);
  const [localLog, setLocalLog] = useState<ConsoleEntry[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [pending, startTransition] = useTransition();

  useSecondTick();

  const pushLocal = useCallback((level: ConsoleEntry["level"], message: string) => {
    setLocalLog((previous) =>
      [
        ...previous,
        { id: Date.now() + Math.random(), at: new Date().toISOString(), level, message },
      ].slice(-100),
    );
  }, []);

  // ---------------------------------------------------------------- identity

  // Pod seats change every round, so the dev roster is re-read whenever pods
  // are (re)drawn, not just on first load.
  const refreshTeams = useCallback(() => {
    if (!IS_DEV) return;
    listTeamsAction().then(setTeams).catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams]);

  useEffect(() => {
    let cancelled = false;

    async function resolveIdentity() {
      const stored = IS_DEV ? window.localStorage.getItem(ACT_AS_KEY) : null;
      if (stored) {
        if (!cancelled) setTeamId(stored);
        return;
      }
      const email = readStoredEmail();
      if (!email) return;
      const result = await getBiddingContextAction(email).catch(() => null);
      if (!cancelled && result?.team) setTeamId(String(result.team.id));
    }

    void resolveIdentity();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshContext = useCallback((id: string | null) => {
    getBiddingContextAction(id ?? "")
      .then(setContext)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshContext(teamId);
  }, [teamId, refreshContext]);

  function selectTeam(next: string) {
    setTeamId(next || null);
    if (IS_DEV) {
      if (next) window.localStorage.setItem(ACT_AS_KEY, next);
      else window.localStorage.removeItem(ACT_AS_KEY);
    }
  }

  // ------------------------------------------------------------------ socket

  // Exactly one capsule runs at a time, so there is exactly one room to be in.
  // The server keeps exactly one capsule live; if it ever reports more, the
  // one furthest along the running order is the current round.
  const liveCapsule = context.capsules.findLast((capsule) => capsule.status === "LIVE") ?? null;
  const activePodId = liveCapsule?.podId ?? null;

  const { connection, state: room, entries, feedback, clockSkew, placeBid, clearEntries, lastEvent } =
    useAuctionSocket(activePodId, teamId);

  // A round ending, or the next one opening, changes which room this client
  // belongs to — so re-read the context whenever the server says so.
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "CAPSULE_OPENED" ||
      lastEvent.type === "CAPSULE_CLOSED" ||
      lastEvent.type === "EVENT_COMPLETE"
    ) {
      refreshContext(teamId);
      refreshTeams();
    }
  }, [lastEvent, teamId, refreshContext, refreshTeams]);

  // Settlements land in the Resource Manager, so refresh it when a lot closes.
  useEffect(() => {
    if (lastEvent?.type === "LOT_CLOSED") refreshContext(teamId);
  }, [lastEvent, teamId, refreshContext]);

  // Between rounds there is no room to be in, so no push can arrive — a team
  // sitting on the page would never see the next round open. Poll gently, and
  // only while disconnected; once the room is live the socket does the work.
  useEffect(() => {
    if (connection === "open") return;
    const id = setInterval(() => refreshContext(teamId), 10_000);
    return () => clearInterval(id);
  }, [connection, teamId, refreshContext]);

  const consoleEntries = useMemo(
    () => [...localLog, ...entries].sort((a, b) => a.at.localeCompare(b.at)),
    [localLog, entries],
  );

  // ------------------------------------------------------------- dev actions

  function runDevAction(label: string, fn: () => Promise<{ status: string; message: string }>) {
    startTransition(async () => {
      const report = await fn();
      pushLocal(report.status === "error" ? "error" : "success", `${label}: ${report.message}`);
      refreshContext(teamId);
      refreshTeams();
    });
  }

  // --------------------------------------------------------------------- ui

  const eventStarted = context.capsules.some((capsule) => capsule.status !== "PENDING");
  const eventComplete =
    eventStarted && context.capsules.every((capsule) => capsule.status === "CLOSED");

  const activeLot = room?.lots.find((lot) => lot.status === "OPEN") ?? null;
  const secondsLeft = secondsUntil(activeLot?.closesAt ?? null, clockSkew);

  function workspaceMessage(): string | null {
    if (!teamId) return "Pick a team above to join its pod room.";
    if (!liveCapsule) {
      return eventComplete
        ? "Every round is finished. Your final product spec is in the Resource Manager."
        : IS_DEV
          ? "No round is live. Hit Force on a capsule to draw its pods. Nothing opens on its own — every capsule waits for Force."
          : "The auction has not started yet. This page will come alive when the first round opens.";
    }
    if (!liveCapsule.podId) {
      return `${liveCapsule.name} is running, but your team was not seated in a pod for it.`;
    }
    return null;
  }

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-black p-4 pt-20 text-zinc-100 sm:p-[3%] sm:pt-24">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <ActAsBar
          isDev={IS_DEV}
          teams={teams}
          activeTeamId={teamId}
          onSelectTeam={selectTeam}
          teamLabel={context.team ? `${context.team.name} · ${context.team.code}` : null}
          podLabel={room?.pod.label ?? liveCapsule?.podLabel ?? null}
          connection={connection}
          balance={context.resources?.remaining ?? null}
        />

        {IS_DEV ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] px-4 py-2.5">
            <span className="font-mono text-[0.6rem] tracking-[0.14em] text-amber-500/80 uppercase">
              Organiser
            </span>
            <button
              type="button"
              onClick={() => runDevAction("Start event", startEventAction)}
              disabled={pending || Boolean(liveCapsule)}
              className="rounded-lg border border-neon/50 bg-neon/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-neon uppercase transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Start event
            </button>
            <button
              type="button"
              onClick={() => runDevAction("Reset", resetEventAction)}
              disabled={pending}
              className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-red-400 uppercase transition hover:bg-red-500/10 disabled:opacity-30"
            >
              Reset event
            </button>
            <span className="text-[0.62rem] text-zinc-600">
              Start event opens round 1 only. Each of the {auctionTiles.length} capsules opens on its own Force, with pods reshuffled every time.
            </span>
          </div>
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

                      {IS_DEV && !isLive ? (
                        <button
                          type="button"
                          onClick={() =>
                            runDevAction(`Force ${capsule.name}`, () =>
                              startCapsuleAction(capsule.key),
                            )
                          }
                          disabled={pending}
                          className="shrink-0 rounded-lg border border-amber-500/40 px-3 py-1.5 text-[0.6rem] font-semibold tracking-wide text-amber-400/90 uppercase transition hover:bg-amber-500/10 disabled:opacity-30"
                        >
                          Force
                        </button>
                      ) : null}

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
              identityHint={
                teamId ? null : "Pick a team above to see what it owns."
              }
            />

            {IS_DEV ? <SecondView teams={teams} /> : null}

            {IS_DEV ? (
              <DevConsole
                entries={consoleEntries}
                onClear={() => {
                  clearEntries();
                  setLocalLog([]);
                }}
              />
            ) : null}
          </aside>
        </section>

        <p className="pb-2 text-center text-[0.62rem] text-zinc-700">
          Rounds run one at a time in order · pods are drawn when a round opens · all bids validated
          and recorded server-side
        </p>
      </div>
    </main>
  );
}
