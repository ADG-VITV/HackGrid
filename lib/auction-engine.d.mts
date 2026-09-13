import type { PrismaClient } from "@prisma/client";

/** The engine is plain JS; it works through whichever client it is handed. */
type AnyPrisma = PrismaClient;

export const EVENT_KEY: string;

export type CapsuleRow = {
  key: string;
  name: string;
  sequenceOrder: number;
  capsuleId: string | null;
  status: "PENDING" | "LIVE" | "CLOSED";
  tierCount: number;
};

export type StartCapsuleResult =
  | { status: "error"; message: string }
  | {
      status: "success";
      message: string;
      capsuleId: string;
      capsuleKey: string;
      capsuleName: string;
      podSize: number;
      teamCount: number;
      podCount: number;
      hasRemainderPod: boolean;
    };

export function ensureEvent(prisma: AnyPrisma): Promise<{ id: string; key: string }>;

export function ensureCapsule(
  prisma: AnyPrisma,
  eventId: string,
  capsuleKey: string,
): Promise<unknown>;

export function startCapsule(
  prisma: AnyPrisma,
  capsuleKey: string,
  options?: { force?: boolean },
): Promise<StartCapsuleResult>;

export function openRemainderPod(
  prisma: AnyPrisma,
  capsuleId: string,
): Promise<{
  podId: string;
  closesAt: Date;
  lotIds: string[];
  prices: { subCapsuleId: string; avgPrice: number; podsCounted: number; source: string }[];
} | null>;

export function closeCapsuleIfDone(
  prisma: AnyPrisma,
  capsuleId: string,
): Promise<{ closed: boolean; nextKey: string | null }>;

export function mainPodsFinished(prisma: AnyPrisma, capsuleId: string): Promise<boolean>;

export function listCapsules(prisma: AnyPrisma): Promise<CapsuleRow[]>;

export function findTeamByIdOrEmail(prisma: AnyPrisma, value: string): Promise<unknown>;

export type BiddingContextResult = {
  status: "success" | "error";
  message: string;
  team: { id: number; name: string; code: string; leadName: string; leadEmail: string } | null;
  /** Null when no identity was given or no team matched. */
  viewerRole: "LEADER" | "MEMBER" | null;
  /** The tier open in this team's pod right now, if any. */
  currentLot: { name: string; tierRank: number; closesAt: string | null } | null;
  capsules: (CapsuleRow & {
    podId: string | null;
    podLabel: string | null;
    podKind: "MAIN" | "REMAINDER" | null;
  })[];
  resources: {
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
    owned: {
      capsuleKey: string;
      capsuleName: string;
      sequenceOrder: number;
      tierName: string;
      pricePaid: number;
      priceSource: "COMPETITIVE" | "AUTO_ASSIGNED" | "NO_BIDS_ASSIGNED" | "POD_AVERAGE" | "STARTING_BID_FALLBACK";
      settledAt: string;
    }[];
  } | null;
};

export function getBiddingContext(
  prisma: AnyPrisma,
  teamIdOrEmail: string,
): Promise<BiddingContextResult>;

export function resetEvent(prisma: AnyPrisma): Promise<{ removed: number }>;

export function liveCapsule(
  prisma: AnyPrisma,
): Promise<{ id: string; key: string; name: string } | null>;
