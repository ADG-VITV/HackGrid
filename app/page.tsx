import React from "react";
import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";
import Hero from "@/components/hero/hero";
import Footer from "@/components/footer/footer";

export default function Home() {
  return (
    <>
      <main className="relative h-screen w-screen bg-black overflow-hidden cursor-none">
        <TechCursor />
        <BulgeGrid />
        <Hero />
      </main>

      <Footer />
    </>
  );
}