"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../components/navbar";
import type { AuctionTeamState } from "./actions";
import { TeamDetails } from "./team-details";

const auctionStartAt = new Date("2026-09-16T13:00:00+05:30").getTime();

function getTimeLeft() {
  const distance = Math.max(0, auctionStartAt - Date.now());

  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000) / 60_000),
    seconds: Math.floor((distance % 60_000) / 1000),
  };
}

function CountdownValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-4 text-center">
      <div className="font-mono text-3xl font-semibold text-emerald-300 sm:text-5xl">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function AuctionPlaceholder() {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-amber-500/25 bg-black p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
        Dev Placeholder
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
        Auction Component
      </h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">
        This is a placeholder for the real auction UI. Replace this component
        with the actual implementation when ready.
      </p>
    </section>
  );
}

export function AuctionDashboard({ state }: { state: AuctionTeamState }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [auctionSkipped, setAuctionSkipped] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (auctionSkipped) return;

    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [auctionSkipped]);

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Navbar />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          {auctionSkipped ? (
            <AuctionPlaceholder />
          ) : (
            <section className="flex min-h-[360px] flex-col justify-center rounded-lg border border-emerald-500/25 bg-black p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Auction starts in
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">
                September 16, 2026 at 1:00 PM
              </h1>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CountdownValue label="Days" value={timeLeft.days} />
                <CountdownValue label="Hours" value={timeLeft.hours} />
                <CountdownValue label="Mins" value={timeLeft.minutes} />
                <CountdownValue label="Secs" value={timeLeft.seconds} />
              </div>
            </section>
          )}

          <div id="team-details">
            <TeamDetails state={state} />
          </div>
        </section>
      </div>

      {isDev && !auctionSkipped && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5">
          <button
            type="button"
            onClick={() => setAuctionSkipped(true)}
            className="rounded-full border border-amber-500/50 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-300 backdrop-blur transition hover:bg-amber-500/20"
          >
            Skip Countdown
          </button>
        </div>
      )}
    </main>
  );
}
