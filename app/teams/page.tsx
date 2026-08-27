
import type { Metadata } from "next";
import { AuctionTeamClient } from "./auction-team-client";

export const metadata: Metadata = {
  title: "Auction | HackGrid",
  description: "Create or join a HackGrid auction team.",
};

export default function AuctionPage() {
  return <AuctionTeamClient />;
}
