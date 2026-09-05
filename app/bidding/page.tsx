import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";
import { BiddingClient } from "./bidding-client";

export const metadata: Metadata = {
  title: "Bidding | HackGrid",
  description: "Live HackGrid resource auction.",
};

export default function BiddingPage() {
  return (
    <>
      <Navbar />
      <BiddingClient />
    </>
  );
}