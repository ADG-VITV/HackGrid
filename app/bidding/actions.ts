"use server";

/**
 * Thin wrappers so the React UI can call the auction without a fetch round trip.
 *
 * All the behaviour lives in lib/auction-engine.mjs, which the Express router at
 * /api/auction and the websocket hub also call. These actions and that API
 * return the same shapes because they are the same functions.
 */

import { prisma } from "@/lib/prisma";
import { auctionTiles } from "@/lib/auction-catalog.mjs";
import { getBiddingContext } from "@/lib/auction-engine.mjs";

export type CapsuleContext = {
  key: string;
  name: string;
  sequenceOrder: number;
  capsuleId: string | null;
  status: "PENDING" | "LIVE" | "CLOSED";
  tierCount: number;
  /** Set only for the capsule that is currently live. */
  podId: string | null;
  podLabel: string | null;
  podKind: "MAIN" | "REMAINDER" | null;
};

export type OwnedResource = {
  capsuleKey: string;
  capsuleName: string;
  sequenceOrder: number;
  tierName: string;
  pricePaid: number;
  priceSource: "COMPETITIVE" | "AUTO_ASSIGNED" | "NO_BIDS_ASSIGNED" | "POD_AVERAGE" | "STARTING_BID_FALLBACK";
  settledAt: string;
};

export type TeamResources = {
  teamId: number;
  teamName: string;
  teamCode: string;
  leadName: string;
  leadEmail: string;
  startingBudget: number;
  spent: number;
  remaining: number;
  /** Coins held back for the capsules after the one the team is in now. */
  reserve: number;
  /** remaining - reserve: the most the team may bid in its current capsule. */
  spendingCap: number;
  /** Which capsule `reserve` was computed for. */
  reserveCapsuleKey: string | null;
  owned: OwnedResource[];
};

export type ViewerRole = "LEADER" | "MEMBER";

export type CurrentLot = {
  name: string;
  tierRank: number;
  closesAt: string | null;
};

export type BiddingContext = {
  status: "success" | "error";
  message: string;
  team: { id: number; name: string; code: string; leadName: string; leadEmail: string } | null;
  /** Who asked: the lead bids, a member watches. Null without a team. */
  viewerRole: ViewerRole | null;
  /** The tier open in this team's pod right now — what the lead is bidding on. */
  currentLot: CurrentLot | null;
  capsules: CapsuleContext[];
  resources: TeamResources | null;
};

const capsuleShell = (): CapsuleContext[] =>
  auctionTiles.map((tile, index) => ({
    key: tile.id,
    name: tile.label,
    sequenceOrder: index + 1,
    capsuleId: null,
    status: "PENDING" as const,
    tierCount: tile.items.length,
    podId: null,
    podLabel: null,
    podKind: null,
  }));

export async function getBiddingContextAction(teamIdOrEmail: string): Promise<BiddingContext> {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        status: "error",
        message: "DATABASE_URL is not set.",
        team: null,
        viewerRole: null,
        currentLot: null,
        capsules: capsuleShell(),
        resources: null,
      };
    }
    return (await getBiddingContext(prisma, teamIdOrEmail)) as BiddingContext;
  } catch (error) {
    console.error("getBiddingContextAction failed:", error);
    return {
      status: "error",
      message: "Database request failed.",
      team: null,
      viewerRole: null,
      currentLot: null,
      capsules: capsuleShell(),
      resources: null,
    };
  }
}

