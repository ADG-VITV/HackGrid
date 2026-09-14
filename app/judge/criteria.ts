export type CriterionKey =
  | "problemMarketScore"
  | "saasPotentialScore"
  | "productExecutionScore"
  | "innovationScore"
  | "resourceUtilizationScore";

export type Criterion = {
  key: CriterionKey;
  name: string;
  max: number;
  description: string;
};

export const CRITERIA: Criterion[] = [
  {
    key: "problemMarketScore",
    name: "Problem & Market Opportunity",
    max: 20,
    description: "Severity and value of the problem, market demand, audience size.",
  },
  {
    key: "saasPotentialScore",
    name: "SaaS Business Potential",
    max: 20,
    description: "Scalability, customer value, competitive advantage, long-term viability.",
  },
  {
    key: "productExecutionScore",
    name: "Product Execution",
    max: 20,
    description: "Functionality, UX, reliability, demo quality.",
  },
  {
    key: "innovationScore",
    name: "Innovation",
    max: 15,
    description:
      "Creativity in idea and in using acquired data, AI, and integrations.",
  },
  {
    key: "resourceUtilizationScore",
    name: "Resource Utilization Strategy",
    max: 25,
    description:
      "How effectively auction purchases were converted into product value \u2014 strategic spending, full use of acquired capability, efficiency relative to cost.",
  },
];

export const TOTAL_MAX = 100;

export const sourceLabel: Record<string, string> = {
  COMPETITIVE: "won at auction",
  AUTO_ASSIGNED: "last team standing",
  NO_BIDS_ASSIGNED: "assigned, nobody bid",
  POD_AVERAGE: "remainder pod, average price",
  STARTING_BID_FALLBACK: "remainder pod, listed price",
};
