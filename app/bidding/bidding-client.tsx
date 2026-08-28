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

export function BiddingClient() {
  const [openTile, setOpenTile] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<Record<string, number>>({});
  const [bids, setBids] = useState<Record<string, number>>({});

  const balance = STARTING_BALANCE;

  function toggleTile(id: string) {
    setOpenTile((current) => (current === id ? null : id));
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

                return (
                  <div key={tile.id} className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => toggleTile(tile.id)}
                      aria-expanded={isOpen}
                      aria-controls={`${tile.id}-workspace`}
                      className={`flex h-[68px] w-full shrink-0 items-center justify-between rounded-[20px] border px-6 font-medium transition ${
                        isOpen
                          ? "border-neon/70 bg-neon/[0.08] text-neon shadow-[0_0_24px_rgba(66,255,90,0.15)]"
                          : "border-neon/20 bg-black text-zinc-200 hover:border-neon/50 hover:bg-neon/[0.04]"
                      }`}
                    >
                      <span className="text-sm tracking-wide uppercase">{tile.label}</span>
                      <span className={isOpen ? "text-neon" : "text-zinc-500"}>
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

            <div className="flex min-h-[320px] flex-1 flex-col rounded-3xl border border-neon/25 bg-zinc-950/60" />
          </aside>
        </section>
      </div>
    </main>
  );
}
