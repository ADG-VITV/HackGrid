"use client";

import { Navbar } from "@/components/ui/Navbar";
import TechCursor from "@/components/TechCursor";
import { usePathname } from "next/navigation";
import { useViewer } from "@/lib/use-viewer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEvaluationView = pathname === "/judge/evaluations";
  // The navbar shows whoever the site currently treats as signed in — the
  // Google session, or in development the person picked on /teams. Passing
  // it in keeps the navbar itself free of any knowledge of "acting as".
  const viewer = useViewer();

  return (
    <>
      {!isEvaluationView ? <Navbar
        user={
          viewer.signedIn
            ? { displayName: viewer.name, email: viewer.email, photoURL: viewer.photoURL }
            : null
        }
        loading={viewer.loading}
        onSignOut={viewer.signOut}
      /> : null}
      {!isEvaluationView ? <TechCursor /> : null}

      <main className="flex-1">{children}</main>
    </>
  );
}
