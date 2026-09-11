"use client";

import { Navbar } from "@/components/ui/Navbar";
import TechCursor from "@/components/TechCursor";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <TechCursor />

      <main className="flex-1">{children}</main>
    </>
  );
}
