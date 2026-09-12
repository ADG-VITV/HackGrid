/**
 * The four capsules and their tiers.
 *
 * Plain JS so the custom server (which never goes through the Next compiler)
 * and the app can share one definition. `app/bidding/auction-data.ts` re-exports
 * this for the UI.
 *
 * Array order is meaningful in two places:
 *   - the order of `auctionTiles` is the running order of the event; capsule N
 *     only opens once capsule N-1 has finished (rulebook 8)
 *   - within a capsule, item 0 is tier_rank 1: the most expensive, sold first
 */

export const auctionTiles = [
  {
    id: "track-auction",
    label: "Track Auction",
    items: [
      { key: "developer-tools", name: "Developer Tools", price: 1000, minIncrement: 150 },
      { key: "finance", name: "Finance", price: 800, minIncrement: 125 },
      { key: "healthcare", name: "Healthcare", price: 600, minIncrement: 100 },
      { key: "education", name: "Education", price: 400, minIncrement: 75 },
      { key: "agriculture", name: "Agriculture", price: 250, minIncrement: null },
    ],
  },
  {
    id: "ai-rights",
    label: "AI Rights",
    items: [
      { key: "generative-ai", name: "Generative AI", price: 1000, minIncrement: 150 },
      { key: "predictive-ai", name: "Predictive & Analytical AI", price: 800, minIncrement: 125 },
      { key: "computer-vision", name: "Computer Vision", price: 600, minIncrement: 100 },
      { key: "speech-audio", name: "Speech & Audio AI", price: 400, minIncrement: null },
    ],
  },
  {
    id: "ai-capability",
    label: "AI Capability",
    items: [
      { key: "autonomous-workflow", name: "Autonomous Workflow (full agent systems)", price: 1000, minIncrement: 150 },
      { key: "multi-agent", name: "Multi-Agent (LangGraph etc.)", price: 800, minIncrement: 125 },
      { key: "single-agent", name: "Single Agent", price: 600, minIncrement: 100 },
      { key: "single-prompt", name: "Single Prompt (no agents)", price: 400, minIncrement: null },
    ],
  },
  {
    id: "customer-segment",
    label: "Customer Segment",
    items: [
      { key: "organizations", name: "Organizations", price: 1000, minIncrement: 150 },
      { key: "small-businesses", name: "Small Businesses", price: 800, minIncrement: 125 },
      { key: "professionals", name: "Professionals", price: 600, minIncrement: 100 },
      { key: "individuals", name: "Individuals", price: 400, minIncrement: null },
    ],
  },
];

/** Running order of the event, first to last. */
export const capsuleOrder = auctionTiles.map((tile) => tile.id);

export function findTile(id) {
  return auctionTiles.find((tile) => tile.id === id) ?? null;
}

/** 1-based position in the running order, or null if the key is unknown. */
export function sequenceOf(capsuleKey) {
  const index = capsuleOrder.indexOf(capsuleKey);
  return index === -1 ? null : index + 1;
}

/** The capsule that opens once `capsuleKey` finishes, or null if it was last. */
export function nextCapsuleKey(capsuleKey) {
  const index = capsuleOrder.indexOf(capsuleKey);
  if (index === -1 || index === capsuleOrder.length - 1) return null;
  return capsuleOrder[index + 1];
}
