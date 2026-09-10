"use client";

import { useEffect, useRef } from "react";
import type { ConsoleEntry } from "./use-auction-socket";

const levelStyles: Record<ConsoleEntry["level"], string> = {
  info: "text-zinc-400",
  success: "text-neon",
  warn: "text-amber-400",
  error: "text-red-400",
};

function clockOf(iso: string) {
  const date = new Date(iso);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

/**
 * On-screen server log. Everything here is echoed from the websocket, so it
 * shows exactly what the server decided rather than what the client guessed.
 */
export function DevConsole({
  entries,
  onClear,
}: {
  entries: ConsoleEntry[];
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-neon/20 bg-black">
      <div className="flex shrink-0 items-center justify-between border-b border-neon/15 px-4 py-2.5">
        <h4 className="text-[0.65rem] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
          Server Log
        </h4>
        <button
          type="button"
          onClick={onClear}
          className="rounded border border-neon/25 px-2 py-0.5 text-[0.6rem] tracking-wide text-zinc-500 uppercase transition hover:border-neon/50 hover:text-neon"
        >
          Clear
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[140px] flex-1 space-y-1 overflow-y-auto px-4 py-3 font-mono text-[0.68rem] leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-zinc-600">Waiting for server events…</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex gap-2">
              <span className="shrink-0 text-zinc-700">{clockOf(entry.at)}</span>
              <span className={levelStyles[entry.level]}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
