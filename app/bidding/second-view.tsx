"use client";

import { useState } from "react";
import type { TeamOption } from "./actions";

/**
 * Who is sitting in the Remainder Pod this round.
 *
 * Development only. The point is not to watch their room from here — for that
 * you open another browser tab and pick the team from "Acting as". This just
 * tells you which teams to pick, since with an even team count there may be
 * none at all.
 */
export function SecondView({ teams }: { teams: TeamOption[] }) {
  const remainder = teams.filter((team) => team.podKind === "REMAINDER");
  const seated = teams.filter((team) => team.podLabel).length;
  const [copied, setCopied] = useState<number | null>(null);

  async function copyCode(team: TeamOption) {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied(team.id);
      window.setTimeout(() => setCopied((current) => (current === team.id ? null : current)), 1400);
    } catch {
      // Clipboard can be unavailable in some contexts; the code is still visible.
    }
  }

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.65rem] font-semibold tracking-[0.16em] text-amber-400/80 uppercase">
          Remainder Pod
        </h3>
        <span className="font-mono text-[0.55rem] tracking-wide text-zinc-600 uppercase">
          dev only
        </span>
      </div>

      {seated === 0 ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">No round is live, so no pods yet.</p>
      ) : remainder.length === 0 ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          None this round — {seated} teams divided evenly into pods. Sideline a couple of teams to
          make one appear.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            {remainder.length} team{remainder.length === 1 ? "" : "s"} waiting on the main pods. Open
            another tab and pick one under <span className="text-zinc-300">Acting as</span> to see
            their screen.
          </p>
          <ul className="mt-3 space-y-1.5">
            {remainder.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-black/40 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-100">{team.name}</p>
                  <p className="truncate font-mono text-[0.58rem] text-zinc-500">
                    {team.code} · {team.leadEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(team)}
                  className="shrink-0 rounded border border-amber-500/30 px-2 py-1 font-mono text-[0.58rem] tracking-wide text-amber-300 uppercase transition hover:bg-amber-500/10"
                >
                  {copied === team.id ? "copied" : "copy code"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
