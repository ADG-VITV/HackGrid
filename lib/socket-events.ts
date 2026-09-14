import type { BidRejectionCode } from "@/lib/auction-rules.mjs";

/**
 * The Socket.IO contract between the browser and the auction server.
 *
 * Socket.IO is mounted on its own path so it never collides with Next's HMR
 * socket, which lives on /_next/hmr.
 */
export const SOCKET_PATH = "/socket.io";

export type LotView = {
  id: string;
  subCapsuleId: string;
  subCapsuleKey: string;
  name: string;
  tierRank: number;
  status: "PENDING" | "OPEN" | "CLOSED";
  /** Price the tier opens at: the listed bid, or the frozen average in a remainder pod. */
  startingBid: number;
  /** The catalogue price, kept alongside so a remainder pod can show both. */
  listedPrice: number;
  /** Set only in a remainder pod: what the winner pays regardless of the bid. */
  frozenPrice: number | null;
  minIncrement: number | null;
  isAutoAssigned: boolean;
  openedAt: string | null;
  /** Null while the tier is open but its clock has not started yet. */
  closesAt: string | null;
  /** True when the tier is open but the pod has not filled up enough to run it. */
  awaitingQuorum: boolean;
  nextMin: number;
  bidCount: number;
  top: { teamId: number; teamName: string; amount: number; at: string } | null;
  result: {
    teamId: number;
    teamName: string;
    pricePaid: number;
    priceSource: "COMPETITIVE" | "AUTO_ASSIGNED" | "NO_BIDS_ASSIGNED" | "POD_AVERAGE" | "STARTING_BID_FALLBACK";
  } | null;
};

export type PodMemberView = {
  teamId: number;
  teamName: string;
  teamCode: string;
  leadName: string;
  leadEmail: string;
  seat: number;
  online: boolean;
};

export type RoomState = {
  serverTime: string;
  pod: {
    id: string;
    label: string;
    kind: "MAIN" | "REMAINDER";
    capsuleId: string;
    capsuleKey: string;
    capsuleName: string;
    podSize: number;
    /** Teams that must be connected before the clock starts (podSize - 1). */
    quorum: number;
    onlineCount: number;
  };
  members: PodMemberView[];
  you: {
    teamId: number;
    teamName: string;
    remainingBalance: number;
    /** Coins that must stay untouched for the capsules after this one. */
    reserve: number;
    /** The most this team may bid in this capsule: remainingBalance - reserve. */
    spendingCap: number;
    wonLotId: string | null;
  };
  lots: LotView[];
};

/** What the server answers a BID with, through the Socket.IO acknowledgement. */
export type BidAck =
  | { ok: true; lotId: string; amount: number; bidId: string }
  | {
      ok: false;
      lotId: string;
      code: BidRejectionCode | "UNKNOWN";
      reason: string;
      nextMin?: number;
    };

/** Events the server sends down. */
export type ServerToClientEvents = {
  ROOM_STATE: (state: RoomState) => void;
  OUTBID: (payload: {
    lotId: string;
    byTeamName: string;
    amount: number;
    nextMin: number;
  }) => void;
  LOT_OPENED: (payload: { lotId: string; name: string; closesAt: string }) => void;
  LOT_CLOSED: (payload: {
    lotId: string;
    name: string;
    winnerTeamId: number | null;
    winnerTeamName: string | null;
    pricePaid: number | null;
  }) => void;
  POD_COMPLETE: (payload: { podId: string }) => void;
  /** `nextKey` is the capsule the organiser opens next; null after the last one. */
  CAPSULE_CLOSED: (payload: { capsuleId: string; nextKey: string | null }) => void;
  CAPSULE_OPENED: (payload: { capsuleKey: string; capsuleId: string }) => void;
  EVENT_COMPLETE: () => void;
  LOG: (payload: { level: "info" | "warn" | "error"; message: string; at: string }) => void;
  ROOM_ERROR: (payload: { message: string }) => void;
};

/** Events the browser sends up. BID carries an acknowledgement. */
export type ClientToServerEvents = {
  BID: (payload: { lotId: string; amount: number }, ack: (result: BidAck) => void) => void;
  SYNC: () => void;
};

/** Identity is sent in the handshake, not as a query string. */
export type SocketAuth = {
  podId: string;
  teamId: number;
  /** The signed-in email; the hub seats it only if it is the team lead. */
  email: string;
};
