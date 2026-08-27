"use client";

import Link from "next/link";
import { useState } from "react";

type ResourceItem = {
  name: string;
  price: string;
};

type AuctionTile = {
  id: string;
  label: string;
  items: ResourceItem[];
};

const auctionTiles: AuctionTile[] = [
  {
    id: "track-auction",
    label: "Track Auction",
    items: [
      { name: "GPU Cluster — A1", price: "2,400" },
      { name: "Compute Node — B3", price: "1,850" },
      { name: "Edge Unit — C2", price: "980" },
    ],
  },
  {
    id: "ai-rights",
    label: "AI Rights",
    items: [
      { name: "Model Fine-Tune Rights", price: "3,200" },
      { name: "Inference API License", price: "2,100" },
    ],
  },
  {
    id: "ai-capability",
    label: "AI capability",
    items: [
      { name: "Vision Engine Access", price: "4,500" },
      { name: "NLP Microkit", price: "2,750" },
      { name: "Realtime Speech Pack", price: "3,050" },
    ],
  },
  {
    id: "dataset-tier",
    label: "Dataset Tier",
    items: [
      { name: "Tier 1 — Core Data", price: "6,000" },
      { name: "Tier 2 — Extended", price: "4,200" },
      { name: "Tier 3 — Starter", price: "1,500" },
    ],
  },
  {
    id: "integration-rights",
    label: "Integration Rights",
    items: [
      { name: "Webhook Integration", price: "1,200" },
      { name: "OAuth Connector", price: "1,900" },
    ],
  },
];

const wonResources = [
  {
    track: "AI Rights",
    resource: "Neural Engine",
    price: "2,400",
  },
  {
    track: "Dataset Tier",
    resource: "Vision v2",
    price: "4,800",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function BiddingClient() {
  const [openTile, setOpenTile] = useState<string | null>(null);

  function toggleTile(id: string) {
    setOpenTile((current) => (current === id ? null : id));
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-4 text-zinc-100 sm:p-[3%]">
      <div className="flex h-[92dvh] w-full flex-col gap-[2%] rounded-[2.5rem] border border-neon/20 bg-black p-[2.5%] shadow-[0_0_80px_rgba(66,255,90,0.06)] sm:w-[90%]">
        <header className="flex h-[9%] shrink-0 items-center justify-between rounded-2xl border border-neon/20 bg-zinc-950/80 px-6">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-white transition hover:text-neon"
          >
            HackGrid<span className="text-neon">.</span>
          </Link>

          <nav className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="text-sm text-zinc-400 transition hover:text-neon">
              Home
            </Link>
            <Link href="/#about" className="text-sm text-zinc-400 transition hover:text-neon">
              About
            </Link>
            <Link
              href="/auction#team-details"
              className="text-sm text-zinc-400 transition hover:text-neon"
            >
              TeamDetails
            </Link>
            <div className="grid size-8 place-items-center rounded-full border border-neon/50 text-sm font-semibold text-neon lg:size-9">
              G
            </div>
          </nav>
        </header>

        <section className="flex min-h-0 flex-1 flex-col gap-[2.5%] lg:flex-row">
          <section className="flex min-h-[420px] w-full flex-col gap-[2.5%] rounded-3xl border border-neon/20 bg-zinc-950/60 p-[3%] lg:min-h-0 lg:w-[68%]">
            {auctionTiles.map((tile) => {
              const isOpen = openTile === tile.id;

              return (
                <div key={tile.id} className="relative flex flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTile(tile.id)}
                    aria-expanded={isOpen}
                    aria-controls={`${tile.id}-menu`}
                    className={`flex w-full items-center justify-between rounded-2xl border px-6 font-medium transition ${
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

                  {isOpen ? (
                    <div
                      id={`${tile.id}-menu`}
                      role="menu"
                      className="absolute right-0 left-0 top-full z-10 mt-[1%] max-h-48 overflow-y-auto rounded-2xl border border-neon/40 bg-zinc-950 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                    >
                      {tile.items.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-neon/10"
                        >
                          <span className="text-sm text-zinc-200">{item.name}</span>
                          <span className="font-mono text-sm text-neon">{item.price} credits</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <aside className="flex min-h-0 w-full flex-col lg:w-[30%]">
            <div className="flex h-20 shrink-0 items-center rounded-2xl border border-neon/20 bg-zinc-950/60 px-6 lg:h-[13%] lg:px-[9%]">
              <span className="text-sm font-medium text-zinc-300">
                Balance:{" "}
                <span className="font-mono text-base font-semibold text-neon">12,500 credits</span>
              </span>
            </div>

            <div className="my-[3%] hidden lg:block" />

            <section className="relative flex min-h-0 flex-1 flex-col rounded-3xl border border-neon/25 bg-zinc-950/60 p-[4%]">
              <span className="absolute top-0 left-[12%] -translate-y-1/2 rounded-full border border-neon/40 bg-black px-5 py-1.5 text-sm font-semibold tracking-wide text-neon">
                Resource Manger
              </span>

              <div className="mt-[4%] flex min-h-0 flex-1 flex-col gap-[4%]">
                {wonResources.map((entry) => (
                  <div
                    key={entry.resource}
                    className="flex flex-1 flex-col justify-center rounded-2xl border border-neon/20 bg-black px-[10%]"
                  >
                    <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-neon/90 uppercase">
                      Track: {entry.track}
                    </p>
                    <p className="mt-[4%] text-sm text-zinc-300">
                      <span className="text-zinc-500">resource won — </span>
                      <span className="text-zinc-100">{entry.resource}</span>
                      <span className="text-neon"> · </span>
                      <span className="font-mono text-neon">{entry.price}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}