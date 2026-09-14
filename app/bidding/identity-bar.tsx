"use client";

import type { ConnectionState } from "./use-auction-socket";
import { Credits } from "./credits";

const connectionCopy: Record<ConnectionState, { label: string; className: string }> = {
  idle: { label: "No room", className: "border-zinc-700 bg-zinc-900 text-zinc-500" },
  connecting: { label: "Connecting", className: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  open: { label: "Live", className: "border-neon/50 bg-neon/10 text-neon" },
  closed: { label: "Disconnected", className: "border-zinc-700 bg-zinc-900 text-zinc-400" },
  error: { label: "Error", className: "border-red-500/40 bg-red-500/10 text-red-400" },
};

/**
 * Identity strip: the room connection, the signed-in team, its pod this
 * round, and what it has left to spend.
 */
export function IdentityBar({
  teamLabel,
  podLabel,
  connection,
  balance,
}: {
  teamLabel: string | null;
  podLabel: string | null;
  connection: ConnectionState;
  balance: number | null;
}) {
  const status = connectionCopy[connection];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neon/20 bg-zinc-950/60 px-4 py-3">
      <span
        className={`rounded-md border px-2.5 py-1 font-mono text-[0.6rem] tracking-[0.14em] uppercase ${status.className}`}
      >
        {status.label}
      </span>

      <span className="text-sm text-zinc-300">{teamLabel ?? "Not signed in"}</span>

      {podLabel ? (
        <span className="rounded-md border border-neon/25 bg-neon/[0.06] px-2.5 py-1 font-mono text-[0.65rem] text-neon">
          {podLabel}
        </span>
      ) : null}

      <span className="ml-auto text-sm text-zinc-400">
        Balance{" "}
        <span className="font-mono text-base font-semibold text-neon">
          {balance === null ? "—" : <Credits value={balance} />}
        </span>
      </span>
    </div>
  );
}
