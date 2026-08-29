"use client";

import { useState } from "react";
import type { AuctionTeamState } from "./actions";

const maxTeamMembers = 6;

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      className="h-10 rounded-md border border-emerald-500/60 px-4 text-sm font-medium text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-400/10"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function TeamDetails({ state }: { state: AuctionTeamState }) {
  if (!state.team) {
    return null;
  }

  const isLeader = state.viewerRole === "LEADER";
  const isIncomplete = state.team.members.length < 2;

  return (
    <aside className="rounded-lg border border-emerald-500/30 bg-[#051306] p-5 shadow-[0_0_0_1px_rgba(22,101,52,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Team details
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{state.team.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {state.team.members.length}/{maxTeamMembers} members
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isIncomplete && (
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              Incomplete
            </span>
          )}
          <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300">
            {isLeader ? "Leader" : "Member"}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-zinc-950 p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Team code</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <code className="rounded bg-emerald-400/10 px-3 py-2 font-mono text-base font-semibold text-emerald-300">
            {state.team.code}
          </code>
          <CopyCodeButton code={state.team.code} />
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {state.team.members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-zinc-950 px-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {member.joinOrder}. {member.name}
              </p>
              <p className="truncate text-xs text-zinc-500">{member.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              {member.role === "LEADER" ? "Team leader" : "Joined"}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
