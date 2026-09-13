"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { FaRegCircleUser, FaRegSquarePlus } from "react-icons/fa6";
import {
  getAuctionTeamForEmailAction,
  submitAuctionTeamAction,
  type AuctionTeamState,
} from "./actions";
import { TeamDashboard } from "./team-dashboard";
import { useRequireSignIn, useViewerEmail } from "@/lib/use-viewer-email";
import {
  Chip,
  CornerMarks,
  Eyebrow,
  Panel,
  inputField,
  primaryButton,
} from "@/components/ui/panel";

const initialAuctionTeamState: AuctionTeamState = {
  status: "idle",
  message: "",
};

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
  email,
  setEmail,
  emailLocked,
  isBusy,
  submit,
}: {
  kind: FormKind;
  onClose: () => void;
  email: string;
  setEmail: (value: string) => void;
  emailLocked: boolean;
  isBusy: boolean;
  submit: (formData: FormData) => void;
}) {
  const isJoin = kind === "join";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <Panel
        className="relative w-full max-w-lg p-6 shadow-[0_0_80px_rgba(66,255,90,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <CornerMarks />
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow tone="neon">{isJoin ? "Join" : "Create"}</Eyebrow>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {isJoin ? "Join a team" : "Create a team"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-lg border border-white/10 text-zinc-500 transition hover:border-neon/40 hover:text-neon"
          >
            &times;
          </button>
        </div>

        <form action={submit} className="mt-5">
          <input type="hidden" name="intent" value={kind} />
          <p className="text-sm leading-6 text-zinc-500">
            {isJoin
              ? "Enter the code your lead shared. You will be listed after the people already in."
              : "You become the team lead — the one account that bids for the team."}
          </p>

          {isJoin ? (
            <label className="mt-5 block text-sm font-medium text-zinc-300">
              Team code
              <input
                name="teamCode"
                placeholder="HG-ABC123"
                autoComplete="off"
                className={`${inputField} font-mono tracking-[0.14em] uppercase`}
              />
            </label>
          ) : (
            <label className="mt-5 block text-sm font-medium text-zinc-300">
              Team name
              <input name="teamName" placeholder="Team Alpha" className={inputField} />
            </label>
          )}

          <label className="mt-4 block text-sm font-medium text-zinc-300">
            Gmail
            <input
              name="email"
              type="email"
              value={email}
              readOnly={emailLocked}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              className={inputField}
            />
            {emailLocked ? (
              <span className="mt-1.5 block font-mono text-[0.6rem] text-zinc-600">
                From your Google sign-in.
              </span>
            ) : null}
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-300">
            Your name
            <input
              name={isJoin ? "memberName" : "leaderName"}
              placeholder={isJoin ? "Your name" : "Team lead name"}
              className={inputField}
            />
          </label>

          {isJoin ? null : (
            <label className="mt-5 flex gap-3 rounded-xl border border-neon/20 bg-neon/[0.04] p-3 text-sm leading-6 text-zinc-300">
              <input
                name="leaderAccepted"
                type="checkbox"
                defaultChecked
                required
                className="mt-1 size-4 accent-[#42ff5a]"
              />
              <span>
                Creating a team makes me the team lead. I alone bid in the auction; my members
                watch.
              </span>
            </label>
          )}

          <button type="submit" disabled={isBusy} className={`${primaryButton} mt-6 w-full`}>
            {isBusy ? "Working…" : isJoin ? "Join team" : "Generate team code"}
          </button>
        </form>
      </Panel>
    </div>
  );
}

export function AuctionTeamClient() {
  const [actionState, formAction, pending] = useActionState(
    submitAuctionTeamAction,
    initialAuctionTeamState,
  );
  const [isLookupPending, startLookupTransition] = useTransition();
  /** The roster lookup for `viewer.email`, tagged with the email it answered for. */
  const [lookup, setLookup] = useState<{ email: string; state: AuctionTeamState }>({
    email: "",
    state: initialAuctionTeamState,
  });
  const [typedEmail, setTypedEmail] = useState("");
  const [devBypassTeam, setDevBypassTeam] = useState(false);
  const [openForm, setOpenForm] = useState<FormKind | null>(null);

  const viewer = useViewerEmail();
  // Production: no session, no teams page. Development keeps the typed-email flow.
  const { blocked } = useRequireSignIn();
  const isDev = process.env.NODE_ENV === "development";

  // The signed-in email wins; a typed one is only for people without a session.
  const email = viewer.signedIn ? viewer.email : typedEmail || viewer.email;

  useEffect(() => {
    const target = viewer.email;
    if (!target) return;
    startLookupTransition(async () => {
      const state = await getAuctionTeamForEmailAction(target);
      setLookup({ email: target, state });
    });
  }, [viewer.email]);

  // A just-submitted form is the freshest truth; otherwise the roster lookup
  // for the current email, and never a lookup that answered for another one.
  const visibleState = actionState.team
    ? actionState
    : lookup.email === viewer.email
      ? lookup.state
      : initialAuctionTeamState;
  const lookedUp = !viewer.email || lookup.email === viewer.email;
  const isBusy = pending || isLookupPending;

  function submit(formData: FormData) {
    const submitted = formData.get("email");
    if (typeof submitted === "string" && submitted.trim()) viewer.remember(submitted);
    return formAction(formData);
  }

  // Nothing to show until the session is known and the roster lookup has
  // answered — a lead who refreshes should not see "create a team" flash
  // before their team appears, and a signed-out visitor sees nothing at all
  // on the way to /login.
  if (blocked || viewer.loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black pt-16">
        <Chip tone="muted">{blocked && !viewer.loading ? "Sign in to continue…" : "Loading…"}</Chip>
      </main>
    );
  }

  if (devBypassTeam) {
    return <TeamDashboard state={devBypassState} viewerEmail={email} signedIn={viewer.signedIn} />;
  }

  if (visibleState.team) {
    return <TeamDashboard state={visibleState} viewerEmail={email} signedIn={viewer.signedIn} />;
  }

  if (!lookedUp) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black pt-16">
        <Chip tone="muted">Loading your team…</Chip>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-black p-4 pt-20 text-zinc-100 sm:p-[3%] sm:pt-24">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <Eyebrow tone="neon">Teams</Eyebrow>
            <h1 className="mt-2 text-3xl font-semibold tracking-wide text-white sm:text-4xl">
              Build your team.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Up to six people. One lead bids for everyone; the rest follow the tier on the block
              and the ledger of what the team wins.
            </p>
          </div>
          <Chip tone={viewer.signedIn ? "neon" : "muted"}>
            {viewer.signedIn ? viewer.email : "Not signed in"}
          </Chip>
        </header>

        <section className="grid flex-1 gap-4 md:grid-cols-2">
          <ChoiceCard
            icon={<FaRegCircleUser className="size-10" aria-hidden />}
            eyebrow="Have a code?"
            title="Join a team"
            body="Your lead shares an HG- code. Enter it and you are on the roster."
            onClick={() => setOpenForm("join")}
          />
          <ChoiceCard
            icon={<FaRegSquarePlus className="size-10" aria-hidden />}
            eyebrow="Starting fresh?"
            title="Create a team"
            body="Get a code to share. Creating the team makes you its lead — the one who bids."
            onClick={() => setOpenForm("create")}
          />
        </section>

        {actionState.message ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              actionState.status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-neon/30 bg-neon/10 text-neon"
            }`}
            aria-live="polite"
          >
            {actionState.message}
          </p>
        ) : null}

        {isDev ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] px-4 py-2.5">
            <span className="font-mono text-[0.6rem] tracking-[0.14em] text-amber-500/80 uppercase">
              Dev
            </span>
            <button
              type="button"
              onClick={() => setDevBypassTeam(true)}
              className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-[0.6rem] font-semibold tracking-wide text-amber-400/90 uppercase transition hover:bg-amber-500/10"
            >
              Skip team making
            </button>
            <span className="text-[0.62rem] text-zinc-600">
              Opens the dashboard as a fake lead. Nothing is written to the database.
            </span>
          </div>
        ) : null}
      </div>

      {openForm ? (
        <TeamModal
          kind={openForm}
          onClose={() => setOpenForm(null)}
          email={email}
          setEmail={setTypedEmail}
          emailLocked={viewer.signedIn}
          isBusy={isBusy}
          submit={submit}
        />
      ) : null}
    </main>
  );
}

function ChoiceCard({
  icon,
  eyebrow,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-neon/20 bg-zinc-950/60 p-8 text-center transition hover:border-neon/60 hover:bg-neon/[0.04] hover:shadow-[0_0_60px_rgba(66,255,90,0.08)] focus:outline-none focus-visible:border-neon"
    >
      <CornerMarks className="opacity-40 transition group-hover:opacity-100" />
      <span className="grid size-20 place-items-center rounded-2xl border border-neon/20 bg-black/60 text-neon transition group-hover:border-neon/50 group-hover:shadow-[0_0_30px_rgba(66,255,90,0.18)]">
        {icon}
      </span>
      <Eyebrow className="mt-6">{eyebrow}</Eyebrow>
      <span className="mt-1 text-2xl font-semibold tracking-wide text-white transition group-hover:text-neon">
        {title}
      </span>
      <span className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">{body}</span>
    </button>
  );
}
