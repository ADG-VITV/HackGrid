import React from "react";
import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";
import Hero from "@/components/Hero/Hero";

export default function Home() {
  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden cursor-none">
      <TechCursor />

      <div className="absolute inset-0 z-[5]">
        <BulgeGrid />
      </div>

      <Hero />
    </main>
  );
}

