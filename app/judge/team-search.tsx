"use client";

import { FaMagnifyingGlass } from "react-icons/fa6";
import type { JudgeSearchResult } from "./actions";

export function TeamSearch({
  query,
  onQueryChange,
  result,
  pending,
  maxTotal,
  onSelect,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  result: JudgeSearchResult;
  pending: boolean;
  maxTotal: number;
  onSelect: (teamId: number) => void;
}) {
  return (
    <section>
      <div className="relative">
        <FaMagnifyingGlass
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
          aria-hidden
        />
        <input
          type="search"
          role="searchbox"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search teams by name, code or member..."
          className="h-14 w-full rounded-2xl border border-white/15 bg-zinc-950 pl-12 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#42ff5a]/50 focus:shadow-[0_0_16px_rgba(66,255,90,0.12)] transition"
        />
        {pending ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <span className="block size-4 animate-spin rounded-full border-2 border-white/20 border-t-[#42ff5a]" />
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        {result.teams.length > 0 && !query
          ? `Showing ${result.teams.length} team${result.teams.length === 1 ? "" : "s"}`
          : query
            ? `${result.teams.length} match${result.teams.length === 1 ? "" : "es"}`
            : "Browse all teams"}
      </p>

      {result.status === "error" ? (
        <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4">
          <p className="text-sm text-red-200">{result.message}</p>
        </div>
      ) : result.teams.length === 0 && query ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No teams match &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2" aria-label="Teams">
          {result.teams.map((team) => (
            <li key={team.id}>
              <button
                type="button"
                onClick={() => onSelect(team.id)}
                className="hg-judge-team-row w-full rounded-2xl border border-white/10 bg-zinc-950 p-4 text-left transition hover:border-[#42ff5a]/40 hover:bg-[#42ff5a]/[0.03] focus-visible:border-[#42ff5a]/60 focus-visible:ring-2 focus-visible:ring-[#42ff5a]/30 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {team.name}
                    </h3>
                    <p className="mt-0.5 truncate font-mono text-[0.65rem] text-zinc-500">
                      {team.code}
                    </p>
                  </div>
                  {team.reviewedScore !== null ? (
                    <span className="shrink-0 rounded-full border border-[#42ff5a]/40 bg-[#42ff5a]/[0.08] px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-[#42ff5a]">
                      {team.reviewedScore}/{maxTotal}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  Lead: {team.leaderName}
                  {team.memberNames.length > 1
                    ? ` \u00B7 ${team.memberNames.length - 1} other${team.memberNames.length === 2 ? "" : "s"}`
                    : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}