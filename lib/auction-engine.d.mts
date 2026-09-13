import type { PrismaClient } from "@prisma/client";

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

export type StartEventResult =
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export type ResetCapsuleResult =
  | { status: "error"; message: string }
  | { status: "success"; message: string; capsuleId: string };

export function ensureEvent(prisma: AnyPrisma): Promise<{ id: string; key: string }>;

export function ensureCapsule(
  prisma: AnyPrisma,
  eventId: string,
  capsuleKey: string,
): Promise<unknown>;

export function startEvent(prisma: AnyPrisma): Promise<StartEventResult>;

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
  team: { id: number; name: string; code: string; leadEmail: string } | null;
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
    owned: {
      capsuleKey: string;
      capsuleName: string;
      sequenceOrder: number;
      tierName: string;
      pricePaid: number;
      priceSource:
        | "COMPETITIVE"
        | "AUTO_ASSIGNED"
        | "NO_BIDS_ASSIGNED"
        | "POD_AVERAGE"
        | "STARTING_BID_FALLBACK";
      settledAt: string;
    }[];
  } | null;
};

export type AdminContextResult = {
  teamCount: number;
  event: {
    startingBudget: number;
    preparedCapsules: number;
    completedCapsules: number;
    liveCapsuleKey: string | null;
    liveCapsuleName: string | null;
    isPrepared: boolean;
  };
  capsules: Array<{
    key: string;
    name: string;
    status: "PENDING" | "LIVE" | "CLOSED";
    sequenceOrder: number;
    podCount: number;
    memberCount: number;
    settlementCount: number;
    pods: Array<{
      label: string;
      kind: "MAIN" | "REMAINDER";
      auctionStatus: "PENDING" | "WAITING_FOR_TEAMS" | "LIVE" | "COMPLETE";
      activeItemName: string | null;
      settledLots: number;
      lotCount: number;
      teams: Array<{
        id: number;
        name: string;
        code: string;
        seat: number;
        item: {
          name: string;
          tierRank: number;
          pricePaid: number;
          priceSource:
            | "COMPETITIVE"
            | "AUTO_ASSIGNED"
            | "NO_BIDS_ASSIGNED"
            | "POD_AVERAGE"
            | "STARTING_BID_FALLBACK";
        } | null;
      }>;
    }>;
    subCapsules: Array<{
      key: string;
      name: string;
      tierRank: number;
      isAutoAssigned: boolean;
    }>;
  }>;
};

export function getBiddingContext(
  prisma: AnyPrisma,
  teamIdOrEmail: string,
): Promise<BiddingContextResult>;

export function getAdminEventContext(prisma: AnyPrisma): Promise<AdminContextResult>;

export function resetEvent(prisma: AnyPrisma): Promise<{ removed: number }>;

export function resetCapsule(
  prisma: AnyPrisma,
  capsuleKey: string,
): Promise<ResetCapsuleResult>;

export function resetSubCapsule(
  prisma: AnyPrisma,
  capsuleKey: string,
  subCapsuleKey: string,
): Promise<ResetCapsuleResult>;

export function liveCapsule(
  prisma: AnyPrisma,
): Promise<{ id: string; key: string; name: string } | null>;
