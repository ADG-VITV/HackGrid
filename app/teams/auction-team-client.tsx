"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  getAuctionTeamForEmailAction,
  submitAuctionTeamAction,
  type AuctionTeamState,
} from "./actions";
import { AuctionDashboard } from "./auction-dashboard";
import { TeamDetails } from "./team-details";
import { FaRegCircleUser, FaRegSquarePlus } from "react-icons/fa6";

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

const devBypassState: AuctionTeamState = {
  status: "success",
  message: "",
  viewerRole: "LEADER",
  team: {
    id: -1,
    name: "Dev Team",
    code: "HG-DEV000",
    members: [
      { id: -1, name: "Dev User", email: "dev@hackgrid.local", role: "LEADER", joinOrder: 1 },
    ],
  },
};

type FormKind = "join" | "create";

function TeamModal({
  kind,
  onClose,
  joinEmail,
  setJoinEmail,
  createEmail,
  setCreateEmail,
  isBusy,
  submit,
}: {
  kind: FormKind;
  onClose: () => void;
  joinEmail: string;
  setJoinEmail: (value: string) => void;
  createEmail: string;
  setCreateEmail: (value: string) => void;
  isBusy: boolean;
  submit: (formData: FormData) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border-dashed border-2 border-emerald-400/70 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {kind === "join" ? "Join a team" : "Create a team"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full border border-emerald-500/40 text-zinc-400 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            &times;
          </button>
        </div>

        {kind === "join" ? (
          <form
            action={submit}
            className="mt-5"
          >
            <input type="hidden" name="intent" value="join" />
            <p className="text-sm leading-6 text-zinc-500">
              Enter the shared code. Your name appears after the existing members.
            </p>

            <label className="mt-6 block text-sm font-medium text-zinc-300">
              Team code
              <input
                name="teamCode"
                placeholder="HG-ABC123"
                className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 font-mono text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
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
                className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-300">
              Your name
              <input
                name="memberName"
                placeholder="Your name"
                className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
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
        ) : (
          <form
            action={submit}
            className="mt-5"
          >
            <input type="hidden" name="intent" value="create" />
            <p className="text-sm leading-6 text-zinc-500">
              Generate a team code and become the first member in the list.
            </p>

            <label className="mt-6 block text-sm font-medium text-zinc-300">
              Team name
              <input
                name="teamName"
                placeholder="Team Alpha"
                className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
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
                className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-300">
              Your name
              <input
                name="leaderName"
                placeholder="Team leader name"
                className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
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
        )}
      </div>
    </div>
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
  const [devBypassTeam, setDevBypassTeam] = useState(false);
  const [openForm, setOpenForm] = useState<FormKind | null>(null);

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    const email = readStoredEmail();
    if (email) {
      startLookupTransition(async () => {
        setJoinEmail(email);
        setCreateEmail(email);
        const nextState = await getAuctionTeamForEmailAction(email);

        if (nextState.team) {
          setCurrentTeamState(nextState);
        }
      });
    }
  }, []);

  if (actionState.team && actionState !== currentTeamState) {
    setCurrentTeamState(actionState);
  }

  const statusTone = useMemo(() => {
    if (actionState.status === "error") {
      return "border-red-500/30 bg-red-500/10 text-red-200";
    }

    return "border-emerald-500/30 bg-emerald-400/10 text-emerald-200";
  }, [actionState.status]);

  const visibleState = actionState.team ? actionState : currentTeamState;
  const isBusy = pending || isLookupPending;

  function submit(formData: FormData) {
    persistEmail(formData);
    return formAction(formData);
  }

  if (devBypassTeam) {
    return <AuctionDashboard state={devBypassState} />;
  }

  if (visibleState.team) {
    return <AuctionDashboard state={visibleState} />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 px-5 py-6 pb-[24vh] text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div className="grid gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setOpenForm("join")}
              className="group grid h-full place-items-center rounded-2xl border-2 border-dashed border-emerald-400/60 bg-[#051306] p-6 text-center transition hover:border-emerald-400 hover:bg-[#08230c]"
            >
              <span className="flex flex-col items-center gap-4">
                <FaRegCircleUser className="size-12 text-emerald-300 transition group-hover:text-emerald-200" aria-hidden />
                <span className="text-xl font-semibold text-white transition group-hover:text-emerald-200">
                  Join a team
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOpenForm("create")}
              className="group grid h-full min-h-[220px] place-items-center rounded-2xl border-2 border-dashed border-emerald-400/60 bg-[#051306] p-6 text-center transition hover:border-emerald-400 hover:bg-[#08230c]"
            >
              <span className="flex flex-col items-center gap-4">
                <FaRegSquarePlus className="size-12 text-emerald-300 transition group-hover:text-emerald-200" aria-hidden />
                <span className="text-xl font-semibold text-white transition group-hover:text-emerald-200">
                  Create A team
                </span>
              </span>
            </button>
          </div>

          <div id="team-details" className="h-full">
            <TeamDetails state={visibleState} />
          </div>
        </section>

        {actionState.message ? (
          <p className={`rounded-md border px-4 py-3 text-sm ${statusTone}`} aria-live="polite">
            {actionState.message}
          </p>
        ) : null}
      </div>

      {isDev && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5">
          <button
            type="button"
            onClick={() => setDevBypassTeam(true)}
            className="rounded-full border border-amber-500/50 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-300 backdrop-blur transition hover:bg-amber-500/20"
          >
            Skip Team Making
          </button>
        </div>
      )}

      {openForm ? (
        <TeamModal
          kind={openForm}
          onClose={() => setOpenForm(null)}
          joinEmail={joinEmail}
          setJoinEmail={setJoinEmail}
          createEmail={createEmail}
          setCreateEmail={setCreateEmail}
          isBusy={isBusy}
          submit={submit}
        />
      ) : null}
    </main>
  );
}
