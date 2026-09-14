// Evaluation criteria are live rows in the database (judging_criteria) — the
// scoring UI is driven by minScore/maxScore/displayOrder from the server.
// This file only keeps client-side labels for settlement price sources.

export const sourceLabel: Record<string, string> = {
  COMPETITIVE: "won at auction",
  AUTO_ASSIGNED: "last team standing",
  NO_BIDS_ASSIGNED: "assigned, nobody bid",
  POD_AVERAGE: "remainder pod, average price",
  STARTING_BID_FALLBACK: "remainder pod, listed price",
};