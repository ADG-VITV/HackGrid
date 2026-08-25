import React from "react";
import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";

export default function Home() {
  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden cursor-none">
      
      {/* 1. Custom Mechanical Cursor */}
      <TechCursor />
      
      {/* 2. The Distorting White Mesh Grid */}
      <BulgeGrid />

      {/* 3. Central Title */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        <h1 className="md:text-6xl text-4xl font-bold text-white tracking-widest drop-shadow-md">
          ADG
        </h1>
      </div>
    </main>
  );
}