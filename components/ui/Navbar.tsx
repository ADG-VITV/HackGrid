"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/bidding", label: "Bidding" },
  { href: "/teams", label: "Teams" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-neon/15 bg-black/70 px-6 backdrop-blur-md sm:px-[3%]">
      <Link href="/" className="text-base font-bold tracking-[0.2em] text-neon uppercase">
        HackGrid
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex h-9 items-center rounded-lg px-3 text-sm font-medium transition sm:px-4 ${
                isActive
                  ? "border border-neon/50 bg-neon/10 text-neon"
                  : "border border-transparent text-zinc-400 hover:bg-neon/5 hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}