"use client";

import { useState } from "react";
import { Navbar } from "../components/navbar";
import { ChevronIcon } from "./auction-icon";
import { ExpandedWorkspace } from "./expanded-workspace";
import {
  AUTO_INCREMENT_FALLBACK,
  STARTING_BALANCE,
  auctionTiles,
  formatCredits,
  type AuctionTile,
} from "./auction-data";
import { useTimers, getSubcapsuleInfo, SUBCAPSULE_SECONDS } from "./use-timers";

function formatTimerDisplay(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BiddingClient() {
  const [openTile, setOpenTile] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<Record<string, number>>({});
  const [bids, setBids] = useState<Record<string, number>>({});

  const {
    capsuleTimers,
    startCapsuleTimer,
    totalForCapsule,
    markSold,
    isSold,
    bidTimeLeft,
    activeBidTile,
    resetBidTimer,
    clearBidTimer,
  } = useTimers();

  const balance = STARTING_BALANCE;

  function toggleTile(id: string) {
    setOpenTile((current) => {
      const next = current === id ? null : id;
      if (next) {
        const tile = auctionTiles.find((t) => t.id === next);
        if (tile) startCapsuleTimer(tile.id, tile.items.length);
      }
      return next;
    });
  }

  function selectItem(tile: AuctionTile, index: number) {
    setActiveIndex((prev) => ({ ...prev, [tile.id]: index }));
    setBids((prev) => ({ ...prev, [tile.id]: tile.items[index].price }));
  }

  function changeBid(tile: AuctionTile, delta: -1 | 1) {
    const index = activeIndex[tile.id] ?? 0;
    const item = tile.items[index];
    const increment = item.minIncrement ?? AUTO_INCREMENT_FALLBACK;

    setBids((prev) => {
      const current = prev[tile.id] ?? item.price;
      const next = Math.max(item.price, Math.min(STARTING_BALANCE, current + delta * increment));
      return { ...prev, [tile.id]: next };
    });
  }

  function placeBid(tile: AuctionTile) {
    const state = capsuleTimers[tile.id];
    if (!state || state.expired) return;
    resetBidTimer(tile.id);
  }

  function getTimerState(tile: AuctionTile) {
    const state = capsuleTimers[tile.id];
    if (!state) {
      const total = totalForCapsule(tile.items.length);
      return {
        capsuleExpired: false,
        subcapsuleTimeLeft: SUBCAPSULE_SECONDS,
        locked: false,
      };
    }
    const { subRemaining } = getSubcapsuleInfo(state.totalSeconds, state.remainingSeconds);
    return {
      capsuleExpired: state.expired,
      subcapsuleTimeLeft: Math.max(0, Math.ceil(subRemaining)),
      locked: state.expired,
    };
  }

  function handleAutoSoldCheck(tile: AuctionTile) {
    const state = capsuleTimers[tile.id];
    if (state && state.expired) {
      for (let i = 0; i < tile.items.length; i++) {
        markSold(`${tile.id}-${i}`);
      }
    }
  }

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-black p-4 text-zinc-100 sm:p-[3%]">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5">
        <Navbar />

        <section className="flex min-h-0 flex-1 flex-col gap-[2.5%] lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col gap-[2%] self-start rounded-[2.5rem] border border-neon/20 bg-black p-[1.5%] shadow-[0_0_80px_rgba(66,255,90,0.06)] lg:w-[74%]">
            <section className="flex min-h-0 flex-1 flex-col gap-[2%] rounded-3xl border border-neon/20 bg-zinc-950/60 p-[2%]">
              {auctionTiles.map((tile) => {
                const isOpen = openTile === tile.id;
                const index = activeIndex[tile.id] ?? 0;
                const bid = bids[tile.id] ?? tile.items[index].price;
                const timer = getTimerState(tile);
                const timerState = capsuleTimers[tile.id];
                const total = totalForCapsule(tile.items.length);
                const bidActive = activeBidTile === tile.id && bidTimeLeft !== null && bidTimeLeft > 0;

                if (timer.capsuleExpired) handleAutoSoldCheck(tile);

                const isLowTime = timer.subcapsuleTimeLeft <= 60 && timer.subcapsuleTimeLeft > 0;

                return (
                  <div key={tile.id} className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => toggleTile(tile.id)}
                      aria-expanded={isOpen}
                      aria-controls={`${tile.id}-workspace`}
                      className={`flex h-[68px] w-full shrink-0 items-center justify-between rounded-[20px] border px-6 font-medium transition ${
                        timer.capsuleExpired
                          ? "border-red-500/40 bg-red-500/[0.06] text-red-400"
                          : isOpen
                            ? "border-neon/70 bg-neon/[0.08] text-neon shadow-[0_0_24px_rgba(66,255,90,0.15)]"
                            : "border-neon/20 bg-black text-zinc-200 hover:border-neon/50 hover:bg-neon/[0.04]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-sm tracking-wide uppercase">{tile.label}</span>
                        {timer.capsuleExpired ? (
                          <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-red-400">
                            EXPIRED
                          </span>
                        ) : timerState ? (
                          <span className="flex items-center gap-1.5 rounded-md bg-neon/[0.08] px-2 py-0.5 font-mono text-[0.65rem] text-neon">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatTimerDisplay(timer.subcapsuleTimeLeft)}
                          </span>
                        ) : (
                          <span className="rounded-md bg-neon/[0.06] px-2 py-0.5 font-mono text-[0.65rem] text-zinc-500">
                            {formatTimerDisplay(total)}
                          </span>
                        )}
                      </span>
                      <span className={timer.capsuleExpired ? "text-red-400" : isOpen ? "text-neon" : "text-zinc-500"}>
                        <ChevronIcon open={isOpen} />
                      </span>
                    </button>

                    <div
                      id={`${tile.id}-workspace`}
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "mt-[1%] grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="w-[96%] mx-auto">
                          <ExpandedWorkspace
                            tile={tile}
                            activeIndex={index}
                            bid={bid}
                            onSelectItem={(next) => selectItem(tile, next)}
                            onChangeBid={(delta) => changeBid(tile, delta)}
                            onBid={() => placeBid(tile)}
                            subcapsuleTimeLeft={timer.subcapsuleTimeLeft}
                            capsuleExpired={timer.capsuleExpired}
                            bidTimeLeft={activeBidTile === tile.id ? bidTimeLeft : null}
                            bidActive={bidActive}
                            isSold={isSold(`${tile.id}-${index}`)}
                            locked={timer.locked}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          <aside className="flex w-full flex-col self-start lg:w-[23%]">
            <div className="flex h-20 shrink-0 items-center rounded-2xl border border-neon/20 bg-zinc-950/60 px-6 lg:px-[9%]">
              <span className="text-sm font-medium text-zinc-300">
                Balance:{" "}
                <span className="font-mono text-base font-semibold text-neon">
                  {formatCredits(balance)} credits
                </span>
              </span>
            </div>

            <div className="my-[3%] hidden lg:block" />

            <div className="flex min-h-[320px] flex-1 flex-col rounded-3xl border border-neon/25 bg-zinc-950/60 p-5">
              <h4 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
                Bid Status
              </h4>

              {activeBidTile && bidTimeLeft !== null ? (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full border-2 font-mono text-2xl font-bold ${
                      bidTimeLeft <= 3
                        ? "border-red-500/60 bg-red-500/10 text-red-400 animate-pulse"
                        : bidTimeLeft <= 5
                          ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                          : "border-neon/60 bg-neon/10 text-neon"
                    }`}
                  >
                    {bidTimeLeft}
                  </div>
                  <p className="text-center text-xs text-zinc-400">
                    {bidTimeLeft <= 3
                      ? "Almost sold!"
                      : "Next bid must be within this time"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Capsule:{" "}
                    <span className="text-zinc-300">
                      {auctionTiles.find((t) => t.id === activeBidTile)?.label}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                  <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p className="text-xs text-zinc-500">
                    Place a bid to start the 10s countdown
                  </p>
                </div>
              )}

              <div className="mt-auto border-t border-neon/10 pt-4">
                <h5 className="mb-2 text-[0.65rem] font-semibold tracking-wider text-zinc-500 uppercase">
                  Capsule Timers
                </h5>
                <div className="space-y-2">
                  {auctionTiles.map((tile) => {
                    const state = capsuleTimers[tile.id];
                    const total = totalForCapsule(tile.items.length);
                    const running = state && !state.expired;
                    const { subRemaining } = state
                      ? getSubcapsuleInfo(state.totalSeconds, state.remainingSeconds)
                      : { subRemaining: total };
                    return (
                      <div
                        key={tile.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                          state?.expired
                            ? "bg-red-500/[0.06] text-red-400"
                            : running
                              ? "bg-neon/[0.04] text-zinc-300"
                              : "text-zinc-500"
                        }`}
                      >
                        <span className="truncate">{tile.label}</span>
                        <span className="shrink-0 pl-2 font-mono text-[0.65rem]">
                          {state?.expired
                            ? "DONE"
                            : state
                              ? formatTimerDisplay(Math.ceil(subRemaining))
                              : formatTimerDisplay(total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
