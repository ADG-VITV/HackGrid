"use client";

import { formatCredits } from "./auction-data";
import { Credits } from "./credits";
import type { CapsuleContext, TeamResources } from "./actions";

const sourceLabel: Record<string, string> = {
  COMPETITIVE: "won at auction",
  AUTO_ASSIGNED: "last team standing",
  NO_BIDS_ASSIGNED: "assigned, nobody bid",
  POD_AVERAGE: "remainder pod, average price",
  STARTING_BID_FALLBACK: "remainder pod, listed price",
};

/**
 * What the team owns. Reads straight from the settlements the auction records,
 * so any member of the team can open the site and see what their lead has
 * bought, what it cost, and what is left to spend.
 *
 * Present in development and in production — this is the team's real ledger,
 * not a debugging aid.
 */
export function ResourceManager({
  resources,
  capsules,
  identityHint,
}: {
  resources: TeamResources | null;
  capsules: CapsuleContext[];
  identityHint: string | null;
}) {
  if (!resources) {
    return (
      <section className="rounded-2xl border border-neon/25 bg-zinc-950/60 p-4">
        <Header />
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          {identityHint ?? "Sign in with the email on your team roster to see what your team owns."}
        </p>
      </section>
    );
  }

  const ownedByCapsule = new Map(resources.owned.map((row) => [row.capsuleKey, row]));
  const spentPercent = Math.min(
    100,
    Math.round((resources.spent / Math.max(1, resources.startingBudget)) * 100),
  );

  return (
    <section className="rounded-2xl border border-neon/25 bg-zinc-950/60 p-4">
      <Header />

      <div className="mt-3 border-b border-neon/10 pb-3">
        <p className="truncate text-sm font-semibold text-zinc-100">{resources.teamName}</p>
        <p className="truncate font-mono text-[0.6rem] text-zinc-500">
          {resources.teamCode} · lead {resources.leadName}
        </p>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.6rem] tracking-[0.14em] text-zinc-500 uppercase">Coins left</span>
          <span className="font-mono text-xl font-semibold text-neon">
            <Credits value={resources.remaining} />
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
          role="img"
          aria-label={`${resources.spent} of ${resources.startingBudget} credits spent`}
        >
          <div className="h-full rounded-full bg-neon/70" style={{ width: `${spentPercent}%` }} />
        </div>
        <p className="mt-1.5 font-mono text-[0.6rem] text-zinc-600">
          <Credits value={resources.spent} /> of {formatCredits(resources.startingBudget)} spent
        </p>
        <div className="mt-2 flex items-baseline justify-between rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5">
          <span className="text-[0.58rem] tracking-[0.12em] text-zinc-500 uppercase">
            Bid cap · {capsules.find((c) => c.key === resources.reserveCapsuleKey)?.name ?? "this round"}
          </span>
          <span className="font-mono text-sm font-semibold text-zinc-200">
            <Credits value={resources.spendingCap} />
          </span>
        </div>
        <p className="mt-1 font-mono text-[0.56rem] text-zinc-600">
          {resources.reserve > 0 ? (
            <>
              <Credits value={resources.reserve} /> held back to cover the capsules still to come
            </>
          ) : (
            "last capsule — nothing held back"
          )}
        </p>
      </div>

      <ul className="mt-4 space-y-1.5">
        {capsules.map((capsule) => {
          const owned = ownedByCapsule.get(capsule.key);
          return (
            <li
              key={capsule.key}
              className={`rounded-lg border px-2.5 py-2 ${
                owned
                  ? "border-neon/30 bg-neon/[0.05]"
                  : capsule.status === "LIVE"
                    ? "border-amber-500/30 bg-amber-500/[0.05]"
                    : "border-white/5 bg-black/30"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[0.66rem] tracking-wide text-zinc-500 uppercase">
                  {capsule.sequenceOrder}. {capsule.name}
                </span>
                {owned ? (
                  <span className="shrink-0 font-mono text-xs font-semibold text-neon">
                    <Credits value={owned.pricePaid} />
                  </span>
                ) : null}
              </div>

              {owned ? (
                <>
                  <p className="mt-0.5 truncate text-xs text-zinc-200" title={owned.tierName}>
                    {owned.tierName}
                  </p>
                  <p className="font-mono text-[0.56rem] text-zinc-600">
                    {sourceLabel[owned.priceSource] ?? owned.priceSource}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-xs text-zinc-600">
                  {capsule.status === "LIVE"
                    ? "bidding now"
                    : capsule.status === "CLOSED"
                      ? "round finished — nothing won"
                      : "not yet run"}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[0.58rem] leading-4 text-zinc-700">
        Updates as each tier settles. Only the team lead can bid; every member can read this.
      </p>
    </section>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[0.65rem] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
        Resource Manager
      </h3>
      <span className="size-1.5 rounded-full bg-neon/60" aria-hidden />
    </div>
  );
}
