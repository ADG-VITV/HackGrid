"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuctionTeamState } from "./actions";
import { CornerMarks, Eyebrow, Panel, ghostButton, primaryButton } from "@/components/ui/panel";

const maxTeamMembers = 6;

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be unavailable; the code is still on screen.
    }
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      className="h-9 shrink-0 rounded-lg border border-neon/40 bg-neon/[0.06] px-3 font-mono text-[0.62rem] tracking-[0.14em] text-neon uppercase transition hover:bg-neon/15"
    >
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}

/**
 * The team, top to bottom: name, the code to share, the people in joining
 * order, whether you lead or belong, and the one thing you can do next.
 */
export function TeamDetails({
  state,
  viewerEmail,
}: {
  state: AuctionTeamState;
  viewerEmail?: string | null;
}) {
  if (!state.team) {
    return null;
  }

  const { team } = state;
  const isLeader = state.viewerRole === "LEADER";
  const me = viewerEmail?.toLowerCase() ?? "";

  return (
    <Panel className="relative p-5 sm:p-6">
      <CornerMarks />

      <Eyebrow tone="neon">Team details</Eyebrow>
      <h2 className="mt-2 truncate text-2xl font-semibold tracking-wide text-white sm:text-3xl">
        {team.name}
      </h2>
      <p className="mt-1 font-mono text-[0.62rem] tracking-[0.12em] text-zinc-500 uppercase">
        {team.members.length} of {maxTeamMembers} members
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neon/15 bg-black/50 px-4 py-3">
        <div className="min-w-0">
          <Eyebrow>Team code</Eyebrow>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.18em] text-neon text-glow-neon">
            {team.code}
          </p>
        </div>
        <CopyCodeButton code={team.code} />
      </div>

      <Eyebrow className="mt-5">Members · joining order</Eyebrow>
      <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {team.members.map((member) => {
          const isMe = me !== "" && member.email.toLowerCase() === me;
          const isLead = member.role === "LEADER";
          return (
            <li
              key={member.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                isLead ? "border-neon/30 bg-neon/[0.05]" : "border-white/5 bg-black/30"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-md font-mono text-[0.62rem] ${
                  isLead ? "bg-neon/20 text-neon" : "bg-zinc-900 text-zinc-500"
                }`}
              >
                {member.joinOrder}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {member.name}
                  {isMe ? <span className="ml-1.5 text-[0.62rem] text-neon">you</span> : null}
                </p>
                <p className="truncate font-mono text-[0.6rem] text-zinc-500">{member.email}</p>
              </div>
              <span
                className={`shrink-0 font-mono text-[0.58rem] tracking-[0.12em] uppercase ${
                  isLead ? "text-neon" : "text-zinc-600"
                }`}
              >
                {isLead ? "Lead" : "Member"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neon/10 pt-5">
        <div>
          <Eyebrow tone={isLeader ? "neon" : "muted"}>{isLeader ? "Team lead" : "Member"}</Eyebrow>
          <p className="mt-1 text-sm text-zinc-300">
            {isLeader ? "You bid for the team." : "Your lead bids for the team."}
          </p>
        </div>
        <Link
          href="/bidding"
          className={`${isLeader ? primaryButton : ghostButton} h-12 px-7 text-base`}
        >
          {isLeader ? "Start auction" : "Watch"}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </Panel>
  );
}
