"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import BulgeGrid from "@/components/BulgeGrid";
import TechCursor from "@/components/TechCursor";
import Hero from "@/components/hero/hero";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <Navbar />
      <TechCursor />

      {pathname === "/" ? (
        <div className="flex-1 relative overflow-hidden cursor-none bg-black">
          <BulgeGrid />
          <Hero />
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}
    </>
  );
}