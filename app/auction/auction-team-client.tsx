"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  getAuctionTeamForEmailAction,
  submitAuctionTeamAction,
  type AuctionTeamState,
} from "./actions";

const initialAuctionTeamState: AuctionTeamState = {
  status: "idle",
  message: "",
};

const emailStorageKeys = [
  "hackgrid:gmail",
  "hackgrid:userEmail",
  "firebase:email",
  "firebaseEmail",
  "email",
];

const auctionStartAt = new Date("2026-09-12T13:00:00+05:30").getTime();
const maxTeamMembers = 6;

function findEmailInJson(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  if ("email" in value && typeof value.email === "string") {
    return value.email;
  }

  if ("user" in value) {
    return findEmailInJson(value.user);
  }

  return "";
}

function readStoredEmail() {
  for (const key of emailStorageKeys) {
    const value = window.localStorage.getItem(key);

    if (!value) {
      continue;
    }

    if (value.includes("@")) {
      return value;
    }

    try {
      const parsedEmail = findEmailInJson(JSON.parse(value));
      if (parsedEmail) {
        return parsedEmail;
      }
    } catch {
      // Ignore non-JSON values.
    }
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.toLowerCase().includes("firebase")) {
      continue;
    }

    const value = window.localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsedEmail = findEmailInJson(JSON.parse(value));
      if (parsedEmail) {
        return parsedEmail;
      }
    } catch {
      // Ignore non-JSON Firebase values.
    }
  }

  return "";
}

function persistEmail(formData: FormData) {
  const email = formData.get("email");

  if (typeof email === "string" && email.trim()) {
    window.localStorage.setItem("hackgrid:gmail", email.trim());
  }
}

function getTimeLeft() {
  const distance = Math.max(0, auctionStartAt - Date.now());

  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000) / 60_000),
    seconds: Math.floor((distance % 60_000) / 1000),
  };
}

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

function TeamDetails({ state }: { state: AuctionTeamState }) {
  if (!state.team) {
    return null;
  }

  const isLeader = state.viewerRole === "LEADER";

  return (
    <aside className="rounded-lg border border-emerald-500/30 bg-black p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]">
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
        <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300">
          {isLeader ? "Leader" : "Member"}
        </span>
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

export function AuctionTeamClient() {
  const [actionState, formAction, pending] = useActionState(
    submitAuctionTeamAction,
    initialAuctionTeamState,
  );
  const [isLookupPending, startLookupTransition] = useTransition();
  const [currentTeamState, setCurrentTeamState] = useState<AuctionTeamState>(initialAuctionTeamState);
  const [joinEmail, setJoinEmail] = useState("");
  const [createEmail, setCreateEmail] = useState("");

  useEffect(() => {
    const email = readStoredEmail();
    setJoinEmail(email);
    setCreateEmail(email);

    if (email) {
      startLookupTransition(async () => {
        const nextState = await getAuctionTeamForEmailAction(email);

        if (nextState.team) {
          setCurrentTeamState(nextState);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (actionState.team) {
      setCurrentTeamState(actionState);
    }
  }, [actionState]);

  const statusTone = useMemo(() => {
    if (actionState.status === "error") {
      return "border-red-500/30 bg-red-500/10 text-red-200";
    }

    return "border-emerald-500/30 bg-emerald-400/10 text-emerald-200";
  }, [actionState.status]);

  const visibleState = actionState.team ? actionState : currentTeamState;
  const isBusy = pending || isLookupPending;

  if (visibleState.team) {
    return <AuctionDashboard state={visibleState} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-black px-4 py-3">
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div className="grid gap-6 md:grid-cols-2">
            <form
              action={(formData) => {
                persistEmail(formData);
                return formAction(formData);
              }}
              className="rounded-lg border border-white/10 bg-black p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <input type="hidden" name="intent" value="join" />
              <h1 className="text-xl font-semibold text-white">Join a team</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Enter the shared code. Your name appears after the existing members.
              </p>

              <label className="mt-6 block text-sm font-medium text-zinc-300">
                Team code
                <input
                  name="teamCode"
                  placeholder="HG-ABC123"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 font-mono text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-zinc-300">
                Gmail
                <input
                  name="email"
                  type="email"
                  value={joinEmail}
                  onChange={(event) => setJoinEmail(event.target.value)}
                  placeholder="you@gmail.com"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-zinc-300">
                Your name
                <input
                  name="memberName"
                  placeholder="Your name"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="mt-6 h-11 w-full rounded-md bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isBusy ? "Working..." : "Join team"}
              </button>
            </form>

            <form
              action={(formData) => {
                persistEmail(formData);
                return formAction(formData);
              }}
              className="rounded-lg border border-emerald-500/25 bg-black p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
            >
              <input type="hidden" name="intent" value="create" />
              <h1 className="text-xl font-semibold text-white">Create a team</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Generate a team code and become the first member in the list.
              </p>

              <label className="mt-6 block text-sm font-medium text-zinc-300">
                Team name
                <input
                  name="teamName"
                  placeholder="Team Alpha"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-zinc-300">
                Gmail
                <input
                  name="email"
                  type="email"
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                  placeholder="you@gmail.com"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-zinc-300">
                Your name
                <input
                  name="leaderName"
                  placeholder="Team leader name"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <label className="mt-5 flex gap-3 rounded-md border border-emerald-500/20 bg-emerald-400/5 p-3 text-sm leading-6 text-zinc-300">
                <input
                  name="leaderAccepted"
                  type="checkbox"
                  defaultChecked
                  required
                  className="mt-1 size-4 accent-emerald-400"
                />
                <span>
                  Creating a team makes me the team leader, so I will participate in the auction.
                </span>
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="mt-6 h-11 w-full rounded-md bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isBusy ? "Generating..." : "Generate team code"}
              </button>
            </form>
          </div>

          <div id="team-details">
            <TeamDetails state={visibleState} />
          </div>
        </section>

        {actionState.message ? (
          <p className={`rounded-md border px-4 py-3 text-sm ${statusTone}`} aria-live="polite">
            {actionState.message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function CountdownValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-4 text-center">
      <div className="font-mono text-3xl font-semibold text-emerald-300 sm:text-5xl">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function AuctionDashboard({ state }: { state: AuctionTeamState }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-black px-4 py-3">
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <section className="flex min-h-[360px] flex-col justify-center rounded-lg border border-emerald-500/25 bg-black p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Auction starts in
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">
              September 12, 2026 at 1:00 PM
            </h1>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CountdownValue label="Days" value={timeLeft.days} />
              <CountdownValue label="Hours" value={timeLeft.hours} />
              <CountdownValue label="Mins" value={timeLeft.minutes} />
              <CountdownValue label="Secs" value={timeLeft.seconds} />
            </div>
          </section>

          <div id="team-details">
            <TeamDetails state={state} />
          </div>
        </section>
      </div>
    </main>
  );
}
