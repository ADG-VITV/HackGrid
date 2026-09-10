import { STARTING_BALANCE as SHARED_STARTING_BALANCE } from "@/lib/auction-rules.mjs";

// The catalogue itself lives in lib/ as plain JS so the websocket server can
// read the same definition the UI does. This module is the UI's view of it.
export {
  auctionTiles,
  capsuleOrder,
  findTile,
  nextCapsuleKey,
  sequenceOf,
} from "@/lib/auction-catalog.mjs";
export type { AuctionTile, ResourceItem } from "@/lib/auction-catalog.mjs";

export const STARTING_BALANCE = SHARED_STARTING_BALANCE;
export const AUTO_INCREMENT_FALLBACK = 10;

export function formatCredits(value: number) {
  return value.toLocaleString("en-US");
}

export function incrementLabel(minIncrement: number | null) {
  if (minIncrement === null || minIncrement === 0) {
    return "Auto-assigned";
  }
  return `${formatCredits(minIncrement)} credits`;
}

export function compactIncrement(minIncrement: number | null) {
  if (minIncrement === null || minIncrement === 0) {
    return "— (auto-assigned)";
  }
  return `${formatCredits(minIncrement)} credits`;
}
