"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/bidding", label: "Bidding" },
  { href: "/teams", label: "Teams" },
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ src, alt, name }: { src?: string | null; alt?: string; name?: string | null }) {
  return (
    <div className="relative h-8 w-8 rounded-full overflow-hidden border border-neon/30 bg-zinc-800 flex items-center justify-center">
      {src ? (
        <img
          src={src}
          alt={alt || "Profile"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-medium text-neon select-none">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  // Show skeleton/placeholder while loading to prevent flicker
  if (loading) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-neon/15 bg-black/70 px-6 backdrop-blur-md sm:px-[3%]">
        <Link href="/" className="text-base font-bold tracking-[0.2em] text-neon uppercase">
          HackGrid
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <div className="h-8 w-8 rounded-full bg-zinc-800/50 animate-pulse border border-neon/20" />
        </nav>
      </header>
    );
  }

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
              className={`flex h-9 items-center rounded-lg px-3 text-sm font-medium transition sm:px-4 ${isActive
                  ? "border border-neon/50 bg-neon/10 text-neon"
                  : "border border-transparent text-zinc-400 hover:bg-neon/5 hover:text-zinc-100"
                }`}
            >
              {link.label}
            </Link>
          );
        })}

        {user ? (
          <Dropdown
            align="right"
            offset={4}
            trigger={
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full p-0 transition-all hover:bg-neon/10 focus:outline-none focus:ring-2 focus:ring-neon/50"
                aria-label="User menu"
              >
                <Avatar
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  name={user.displayName}
                />

                <span className="ml-1 text-zinc-400">⌄</span>
              </button>
            }
          >
            <DropdownLabel className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  name={user.displayName}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user.displayName || "User"}
                  </p>

                  <p className="truncate text-xs text-zinc-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownLabel>

            <DropdownSeparator />

            <DropdownItem
              onClick={() => {
                // TODO: navigate to profile
              }}
            >
              User Profile
            </DropdownItem>

            <DropdownSeparator />

            <DropdownItem
              onClick={signOut}
              destructive
            >
              Logout
            </DropdownItem>
          </Dropdown>
        ) : (
          <Link
            href="/login"
            className="flex h-9 items-center rounded-lg border border-neon/50 bg-neon/10 px-3 text-sm font-medium text-neon transition hover:bg-neon/20 sm:px-4"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}