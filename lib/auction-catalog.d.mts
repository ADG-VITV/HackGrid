export type ResourceItem = {
  key: string;
  name: string;
  price: number;
  minIncrement: number | null;
};

export type AuctionTile = {
  id: string;
  label: string;
  items: ResourceItem[];
};

export const auctionTiles: AuctionTile[];
export const capsuleOrder: string[];
export function findTile(id: string): AuctionTile | null;
export function sequenceOf(capsuleKey: string): number | null;
export function nextCapsuleKey(capsuleKey: string): string | null;
