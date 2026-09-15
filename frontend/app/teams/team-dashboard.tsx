"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuctionTeamState } from "./actions";
import { TeamDetails } from "./team-details";
import { ResourceManager } from "@/app/bidding/resource-manager";
import { getBiddingContextAction, type BiddingContext } from "@/app/bidding/actions";
import { auctionTiles } from "@/app/bidding/auction-data";
import { Credits } from "@/app/bidding/credits";
import { Chip } from "@/components/ui/panel";

const emptyContext: BiddingContext = {
  status: "success",
  message: "",
  team: null,
  viewerRole: null,
  currentLot: null,
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
  resources: null,
};

/** How often the dashboard re-reads the ledger. Nobody bids from here, so a slow poll is fine. */
const POLL_MS = 10_000;

/**
 * Where a team lands once it exists. The team is the main column; the ledger
 * sits in the same right-hand slot it has on the bidding page, so moving
 * between the two never moves the thing you were reading.
 */
export function TeamDashboard({
  state,
  viewerEmail,
  signedIn,
}: {
  state: AuctionTeamState;
  viewerEmail: string;
  /** True for a live Google session; false when only a remembered email is known. */
  signedIn: boolean;
}) {
  const [context, setContext] = useState<BiddingContext>(emptyContext);
  const isLeader = state.viewerRole === "LEADER";

  const refresh = useCallback(() => {
    if (!viewerEmail) return;
    getBiddingContextAction(viewerEmail)
      .then(setContext)
      .catch(() => undefined);
  }, [viewerEmail]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const team = state.team!;

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-black p-4 pt-20 text-zinc-100 sm:p-[3%] sm:pt-24">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neon/20 bg-zinc-950/60 px-4 py-3">
          <Chip
            tone={signedIn ? "neon" : "muted"}
            className="max-w-[16rem] truncate normal-case tracking-normal"
          >
            {signedIn ? viewerEmail : viewerEmail ? `${viewerEmail} · not signed in` : "Not signed in"}
          </Chip>
          <span className="text-sm text-zinc-300">
            {team.name} · {team.code}
          </span>
          <Chip tone={isLeader ? "neon" : "muted"}>{isLeader ? "Team lead" : "Member"}</Chip>
          <span className="ml-auto text-sm text-zinc-400">
            Balance{" "}
            <span className="font-mono text-base font-semibold text-neon">
              {context.resources ? <Credits value={context.resources.remaining} /> : "—"}
            </span>
          </span>
        </div>

        <section className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-[2.5%]">
          <div className="flex min-w-0 flex-col gap-4 lg:w-[74%]">
            <TeamDetails state={state} viewerEmail={viewerEmail} />
          </div>

          <aside className="flex w-full flex-col gap-4 self-start lg:w-[23%]">
            <ResourceManager
              resources={context.resources}
              capsules={context.capsules}
              identityHint={
                viewerEmail
                  ? "The ledger fills in once the auction starts."
                  : "Sign in with your roster email to see the ledger."
              }
              revealLive={isLeader}
              showBidCap={isLeader}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}
