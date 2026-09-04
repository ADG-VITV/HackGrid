"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="flex shrink-0 items-center justify-between rounded-lg border border-emerald-500/25 bg-black px-4 py-3">
      <Link
        href="/"
        className="text-base font-semibold text-white"
      >
        HackGrid
      </Link>

      <nav className="flex items-center gap-4 text-sm text-zinc-400">
        <Link
          href="/"
          className="transition hover:text-emerald-300"
        >
          Home
        </Link>

        <a
          href="#about"
          className="transition hover:text-emerald-300"
        >
          About
        </a>

        <a
          href="#team-details"
          className="transition hover:text-emerald-300"
        >
          TeamDetails
        </a>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="grid size-9 place-items-center rounded-full border border-emerald-500/50 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
            aria-label="Open profile menu"
            aria-expanded={isProfileOpen}
          >
            G
          </button>

          {/* Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-emerald-500/25 bg-zinc-950 p-4 shadow-xl shadow-black/40">
              <div className="border-b border-zinc-800 pb-3">
                <p className="font-medium text-white">
                  Guest User
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  guest@example.com
                </p>
              </div>

              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  Profile
                </button>

                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}