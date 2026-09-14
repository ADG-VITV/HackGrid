"use client";

import type { JudgeResources } from "./actions";
import { sourceLabel } from "./criteria";

function formatCredits(value: number) {
  return value.toLocaleString("en-US");
}

export function AuctionResources({
  resources,
}: {
  resources: JudgeResources | null;
}) {
  if (!resources) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
    );
  }

  const spentPercent = Math.min(
    100,
    Math.round(
      (resources.spent / Math.max(1, resources.startingBudget)) * 100,
    ),
  );

  return (
    <section className="rounded-2xl border border-[#42ff5a]/20 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#42ff5a]/80">
          What They Acquired
        </h3>
        <span className="size-1.5 rounded-full bg-[#42ff5a]/60" aria-hidden />
      </div>

      {/* Spend bar */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.6rem] uppercase tracking-[0.14em] text-zinc-500">
            Coins spent
          </span>
          <span className="font-mono text-sm font-semibold text-zinc-200">
            {formatCredits(resources.spent)} / {formatCredits(resources.startingBudget)}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
          role="img"
          aria-label={`${resources.spent} of ${resources.startingBudget} credits spent`}
        >
          <div
            className="h-full rounded-full bg-[#42ff5a]/60"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[0.55rem] text-zinc-600">
          {formatCredits(resources.remaining)} remaining
        </p>
      </div>

      {/* Items list */}
      {resources.items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-500">
          No auction resources acquired yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {resources.items.map((item, i) => (
            <li
              key={i}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[0.6rem] uppercase tracking-wide text-zinc-500">
                  Round {item.roundOrder} &middot; {item.roundName}
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold text-[#42ff5a]">
                  {formatCredits(item.pricePaid)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-200">
                {item.tierName}
              </p>
              <p className="mt-0.5 font-mono text-[0.55rem] text-zinc-600">
                {sourceLabel[item.priceSource] ?? item.priceSource}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[0.58rem] leading-4 text-zinc-700">
        View the resources this team acquired through the auction. Refer to these when evaluating
        Resource Utilization Strategy.
      </p>
    </section>
  );
}
