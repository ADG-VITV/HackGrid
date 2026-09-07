"use server";

/**
 * Thin wrappers so the React UI can call the auction without a fetch round trip.
 *
 * All the behaviour lives in lib/auction-engine.mjs, which the Express router at
 * /api/auction and the websocket hub also call. These actions and that API
 * return the same shapes because they are the same functions.
 */

import { prisma } from "@/lib/prisma";
import { auctionTiles, capsuleOrder } from "@/lib/auction-catalog.mjs";
import {
  getBiddingContext,
  liveCapsule,
  resetEvent,
  startCapsule,
} from "@/lib/auction-engine.mjs";

export type StartReport = {
  status: "success" | "error";
  message: string;
};

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
  priceSource: "COMPETITIVE" | "AUTO_ASSIGNED" | "POD_AVERAGE" | "STARTING_BID_FALLBACK";
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
  owned: OwnedResource[];
};

export type BiddingContext = {
  status: "success" | "error";
  message: string;
  team: { id: number; name: string; code: string; leadEmail: string } | null;
  capsules: CapsuleContext[];
  resources: TeamResources | null;
};

export type TeamOption = {
  id: number;
  name: string;
  code: string;
  leadEmail: string;
  /** Where this team sits in the round that is live, if any. */
  podLabel: string | null;
  podKind: "MAIN" | "REMAINDER" | null;
};

function isDev() {
  return process.env.NODE_ENV === "development";
}

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

type Hub = { onCapsuleStarted?: (id: string) => Promise<void> };

async function notifyHub(capsuleId: string) {
  const hub = (globalThis as { __hackgridAuctionHub?: Hub }).__hackgridAuctionHub;
  if (hub?.onCapsuleStarted) {
    await hub.onCapsuleStarted(capsuleId).catch(() => undefined);
  }
}

export async function getBiddingContextAction(teamIdOrEmail: string): Promise<BiddingContext> {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        status: "error",
        message: "DATABASE_URL is not set.",
        team: null,
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
      capsules: capsuleShell(),
      resources: null,
    };
  }
}

/**
 * Open the first round. From here the event runs itself: each capsule opens the
 * next when its last lot settles, so pods are only ever drawn for the round
 * about to be played.
 */
export async function startEventAction(): Promise<StartReport> {
  if (!isDev()) {
    return { status: "error", message: "Starting the event is an organiser control." };
  }

  try {
    const already = await liveCapsule(prisma);
    if (already) {
      return { status: "error", message: `${already.name} is already live.` };
    }

    const report = await startCapsule(prisma, capsuleOrder[0]);
    if (report.status !== "success") return { status: "error", message: report.message };

    await notifyHub(report.capsuleId);
    return {
      status: "success",
      message: `${report.message} Later rounds open automatically as each one finishes.`,
    };
  } catch (error) {
    console.error("startEventAction failed:", error);
    return { status: "error", message: "Could not start the event." };
  }
}

/** Force one round open, ignoring the running order. Development only. */
export async function startCapsuleAction(capsuleKey: string): Promise<StartReport> {
  if (!isDev()) {
    return { status: "error", message: "Start is a development-mode control." };
  }

  try {
    const report = await startCapsule(prisma, capsuleKey, { force: true });
    if (report.status !== "success") return { status: "error", message: report.message };
    await notifyHub(report.capsuleId);
    return { status: "success", message: report.message };
  } catch (error) {
    console.error("startCapsuleAction failed:", error);
    return { status: "error", message: "Could not start the capsule." };
  }
}

/** Wipe every pod, lot, bid and settlement for the whole event. Development only. */
export async function resetEventAction(): Promise<StartReport> {
  if (!isDev()) {
    return { status: "error", message: "Reset is a development-mode control." };
  }

  try {
    const { removed } = await resetEvent(prisma);
    return {
      status: "success",
      message: `Removed ${removed} pod(s) with their lots, bids and settlements. Every capsule is back to pending.`,
    };
  } catch (error) {
    console.error("resetEventAction failed:", error);
    return { status: "error", message: "Could not reset the event." };
  }
}

/**
 * Dev-only "act as" picker source. Each team carries its seat in the live
 * round, so the picker can show who is in the Remainder Pod and the second
 * view can default to one of them.
 */
export async function listTeamsAction(): Promise<TeamOption[]> {
  if (!isDev() || !process.env.DATABASE_URL) return [];

  try {
    const live = await liveCapsule(prisma);

    const [teams, memberships] = await Promise.all([
      prisma.team.findMany({
        orderBy: { id: "asc" },
        relationLoadStrategy: "join",
        include: { leader: true },
      }),
      live
        ? prisma.podMembership.findMany({
            where: { capsuleId: live.id },
            relationLoadStrategy: "join",
            select: { teamId: true, pod: { select: { label: true, kind: true } } },
          })
        : Promise.resolve([]),
    ]);

    const seat = new Map(memberships.map((m) => [m.teamId, m.pod]));

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      code: team.code,
      leadEmail: team.leader.email,
      podLabel: seat.get(team.id)?.label ?? null,
      podKind: seat.get(team.id)?.kind ?? null,
    }));
  } catch (error) {
    console.error("listTeamsAction failed:", error);
    return [];
  }
}
