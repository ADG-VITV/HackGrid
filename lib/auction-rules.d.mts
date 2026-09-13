export const SUBCAPSULE_SECONDS: number;
export const BID_TIMEOUT_SECONDS: number;
export const STARTING_BALANCE: number;
export const REMAINDER_PICK_SECONDS: number;

export function quorumFor(podSize: number): number;

export type BidRejectionCode =
  | "LOT_NOT_OPEN"
  | "LOT_EXPIRED"
  | "AUTO_ASSIGNED"
  | "NOT_IN_POD"
  | "ALREADY_WON"
  | "ALREADY_TOP"
  | "BELOW_MINIMUM"
  | "OVER_BUDGET"
  | "RESERVE_LOCKED"
  | "NOT_INTEGER"
  | "ALREADY_CLAIMED"
  | "AWAITING_QUORUM";

export const BID_REJECTED: Record<BidRejectionCode, string>;

export function spendingCapFor(input: { remainingBalance: number; reserve?: number }): number;

export function nextMinBid(input: {
  startingBid: number;
  minIncrement: number | null;
  topAmount: number | null | undefined;
}): number;

export function computeClosesAt(input: {
  openedAt: Date | string;
  lastBidAt: Date | string | null;
}): Date;

export type BidValidation =
  | { ok: true; amount: number }
  | { ok: false; code: BidRejectionCode; reason: string; nextMin?: number; spendingCap?: number; reserve?: number };

export function validateBid(input: {
  amount: number;
  now: Date | string;
  lotStatus: string;
  closesAt: Date | string | null;
  isAutoAssigned: boolean;
  startingBid: number;
  minIncrement: number | null;
  topAmount: number | null;
  topTeamId: string | null;
  teamId: string;
  isSeatedInPod: boolean;
  hasWonInCapsule: boolean;
  remainingBalance: number;
  reserve?: number;
  holdsAnotherClaim?: boolean;
  timerStarted?: boolean;
}): BidValidation;
