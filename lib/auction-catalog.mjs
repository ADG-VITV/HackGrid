/**
 * The five capsules and their tiers.
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
      { key: "developer-tools", name: "Developer Tools", price: 350, minIncrement: 30 },
      { key: "finance", name: "Finance", price: 300, minIncrement: 25 },
      { key: "healthcare", name: "Healthcare", price: 250, minIncrement: 25 },
      { key: "education", name: "Education", price: 150, minIncrement: 20 },
      { key: "agriculture", name: "Agriculture", price: 100, minIncrement: null },
    ],
  },
  {
    id: "ai-rights",
    label: "AI Rights",
    items: [
      { key: "premium-api", name: "Premium API Models (GPT / Claude / Gemini)", price: 500, minIncrement: 50 },
      { key: "open-source-llm", name: "Open Source LLM (Llama / Gemma / Mistral)", price: 300, minIncrement: 25 },
      { key: "basic-ai", name: "Basic AI (Classification / Prediction / Recommendation, no LLMs)", price: 150, minIncrement: 20 },
      { key: "no-ai", name: "No AI", price: 0, minIncrement: null },
    ],
  },
  {
    id: "ai-capability",
    label: "AI Capability",
    items: [
      { key: "autonomous-workflow", name: "Autonomous Workflow (full agent systems)", price: 400, minIncrement: 30 },
      { key: "multi-agent", name: "Multi-Agent (LangGraph etc.)", price: 200, minIncrement: 20 },
      { key: "single-prompt", name: "Single Prompt (no agents)", price: 0, minIncrement: null },
    ],
  },
  {
    id: "dataset-tier",
    label: "Dataset Tier",
    items: [
      { key: "synthetic", name: "Synthetic Dataset", price: 250, minIncrement: 25 },
      { key: "web-scraped", name: "Web Scraped Dataset", price: 150, minIncrement: 20 },
      { key: "public-only", name: "Public Dataset Only", price: 50, minIncrement: null },
    ],
  },
  {
    id: "integration-rights",
    label: "Integration Rights",
    items: [
      { key: "unlimited", name: "Unlimited Integrations", price: 500, minIncrement: 50 },
      { key: "three", name: "Three Integrations", price: 250, minIncrement: 25 },
      { key: "one", name: "One Integration", price: 100, minIncrement: 10 },
      { key: "none", name: "No Integrations", price: 0, minIncrement: null },
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
