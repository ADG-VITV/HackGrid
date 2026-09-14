"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listUsersAction, type RosterUser } from "./actions";
import { startActingAs } from "@/lib/use-viewer";
import { CornerMarks, Eyebrow } from "@/components/ui/panel";

/** Leads in red, members in blue, everyone else in the page's grey. */
function roleColor(role: RosterUser["role"]) {
  return role === "LEADER" ? "text-red-400" : role === "MEMBER" ? "text-sky-400" : "text-zinc-300";
}

function roleLabel(role: RosterUser["role"]) {
  return role === "LEADER" ? "Lead" : role === "MEMBER" ? "Member" : "No team";
}

/**
 * The third box on the teams page, development only. Pick anyone on the
 * roster and the site behaves as if they had signed in with Google — navbar,
 * teams page, bidding page — until Logout in the navbar ends it.
 */
export function ActAsCard() {
  const [users, setUsers] = useState<RosterUser[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listUsersAction()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const matches = useMemo(() => {
    if (!users) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        (user.teamName ?? "").toLowerCase().includes(needle),
    );
  }, [users, query]);

  function pick(user: RosterUser) {
    setOpen(false);
    startActingAs({ email: user.email, name: user.name });
  }

  return (
    <section className="relative flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] p-8 text-center md:col-span-2 xl:col-span-1">
      <CornerMarks className="opacity-40" />
      <Eyebrow tone="amber">Development only</Eyebrow>
      <h2 className="mt-1 text-2xl font-semibold tracking-wide text-white">
        I only come in development
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
        Pick anyone on the roster and the site behaves as if they signed in. Logout in the navbar
        ends it.
      </p>

      <div ref={pickerRef} className="relative mt-6 w-full max-w-xs text-left">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={!users || users.length === 0}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-11 w-full items-center justify-between rounded-xl border border-amber-500/30 bg-black px-3 text-sm text-zinc-300 transition hover:border-amber-500/60 disabled:cursor-not-allowed disabled:text-zinc-600"
        >
          <span>
            {users === null
              ? "Loading people…"
              : users.length === 0
                ? "Nobody on the roster yet"
                : "Pick a person…"}
          </span>
          <span aria-hidden className="text-zinc-500">
            ⌄
          </span>
        </button>

        {open ? (
          <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-amber-500/30 bg-black/95 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email or team"
              className="h-10 w-full border-b border-white/10 bg-transparent px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
              {matches.length === 0 ? (
                <li className="px-3 py-3 text-xs text-zinc-600">No one matches.</li>
              ) : (
                matches.map((user) => (
                  <li key={user.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => pick(user)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${roleColor(user.role)}`}>
                          {user.name}
                        </span>
                        <span className="block truncate font-mono text-[0.6rem] text-zinc-500">
                          {user.email}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.56rem] tracking-[0.12em] text-zinc-600 uppercase">
                        {roleLabel(user.role)}
                        {user.teamName ? ` · ${user.teamName}` : ""}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>

      <p className="mt-3 flex gap-3 font-mono text-[0.58rem] tracking-[0.12em] uppercase">
        <span className="text-red-400">● Lead</span>
        <span className="text-sky-400">● Member</span>
        <span className="text-zinc-500">● No team</span>
      </p>
    </section>
  );
}
