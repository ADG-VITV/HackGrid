import React from "react";
import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";
import { Navbar } from "@/components/ui/Navbar";
import Hero from "@/components/hero/hero";

export default function Home() {
  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden cursor-none">
      
      {/* 1. Custom Mechanical Cursor */}
      <TechCursor />
      
      {/* 2. The Distorting White Mesh Grid */}
      <BulgeGrid />

      <Navbar />

      <Hero />

    </main>
  );
}