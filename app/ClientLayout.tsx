"use client";

import { Navbar } from "@/components/ui/Navbar";
import TechCursor from "@/components/TechCursor";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEvaluationView = pathname === "/judge/evaluations";

  return (
    <>
      {!isEvaluationView ? <Navbar /> : null}
      {!isEvaluationView ? <TechCursor /> : null}

      <main className="flex-1">{children}</main>
    </>
  );
}
