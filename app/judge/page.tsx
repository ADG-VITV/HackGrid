import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";
import { JudgeClient } from "./judge-client";

export const metadata: Metadata = {
  title: "Judge Review | HackGrid",
  description: "Review HackGrid teams against the official judging criteria.",
};

export default function JudgePage() {
  return (
    <>
      <Navbar />
      <JudgeClient />
    </>
  );
}
