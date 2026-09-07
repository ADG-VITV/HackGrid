export type ResourceItem = {
  name: string;
  price: number;
  minIncrement: number | null;
};

export type AuctionTile = {
  id: string;
  label: string;
  items: ResourceItem[];
};

export const STARTING_BALANCE = 1000;
export const AUTO_INCREMENT_FALLBACK = 10;

export const auctionTiles: AuctionTile[] = [
  {
    id: "track-auction",
    label: "Track Auction",
    items: [
      { name: "Developer Tools", price: 350, minIncrement: 30 },
      { name: "Finance", price: 300, minIncrement: 25 },
      { name: "Healthcare", price: 250, minIncrement: 25 },
      { name: "Education", price: 150, minIncrement: 20 },
      { name: "Agriculture", price: 100, minIncrement: null },
    ],
  },
  {
    id: "ai-rights",
    label: "AI Rights",
    items: [
      { name: "Premium API Models (GPT / Claude / Gemini)", price: 500, minIncrement: 50 },
      { name: "Open Source LLM (Llama / Gemma / Mistral)", price: 300, minIncrement: 25 },
      { name: "Basic AI (Classification / Prediction / Recommendation, no LLMs)", price: 150, minIncrement: 20 },
      { name: "No AI", price: 0, minIncrement: null },
    ],
  },
  {
    id: "ai-capability",
    label: "AI Capability",
    items: [
      { name: "Autonomous Workflow (full agent systems)", price: 400, minIncrement: 30 },
      { name: "Multi-Agent (LangGraph etc.)", price: 200, minIncrement: 20 },
      { name: "Single Prompt (no agents)", price: 0, minIncrement: null },
    ],
  },
  {
    id: "dataset-tier",
    label: "Dataset Tier",
    items: [
      { name: "Synthetic Dataset", price: 250, minIncrement: 25 },
      { name: "Web Scraped Dataset", price: 150, minIncrement: 20 },
      { name: "Public Dataset Only", price: 50, minIncrement: null },
    ],
  },
  {
    id: "integration-rights",
    label: "Integration Rights",
    items: [
      { name: "Unlimited Integrations", price: 500, minIncrement: 50 },
      { name: "Three Integrations", price: 250, minIncrement: 25 },
      { name: "One Integration", price: 100, minIncrement: 10 },
      { name: "No Integrations", price: 0, minIncrement: null },
    ],
  },
];

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
