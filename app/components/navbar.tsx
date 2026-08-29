import Link from "next/link";

export function Navbar() {
  return (
    <header className="flex shrink-0 items-center justify-between rounded-lg border border-emerald-500/25 bg-black px-4 py-3">
      <Link href="/" className="text-base font-semibold text-white">
        HackGrid
      </Link>
      <nav className="flex items-center gap-4 text-sm text-zinc-400">
        <Link href="/" className="transition hover:text-emerald-300">
          Home
        </Link>
        <a href="#about" className="transition hover:text-emerald-300">
          About
        </a>
        <a href="#team-details" className="transition hover:text-emerald-300">
          TeamDetails
        </a>
        <div className="grid size-9 place-items-center rounded-full border border-emerald-500/50 text-sm font-semibold text-emerald-300">
          G
        </div>
      </nav>
    </header>
  );
}
