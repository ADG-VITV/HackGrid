"use client";

export type EntranceView =
  | { view: "signed_out" }
  | { view: "redeem" }
  | { view: "pending"; message: string }
  | { view: "denied"; message: string }
  | { view: "active" };

export function JudgeEntrance({
  view,
  firebaseName,
  firebaseEmail,
  code,
  pending,
  message,
  onCodeChange,
  onRedeem,
  onSignIn,
  onSignOut,
}: {
  view: EntranceView;
  firebaseName: string | null;
  firebaseEmail: string | null;
  code: string;
  pending: boolean;
  message: string | null;
  onCodeChange: (code: string) => void;
  onRedeem: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (view.view === "signed_out") {
    return (
      <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Judge Portal
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-white">
          Sign in to review teams
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Sign in with Google, then submit your secret key for organiser approval.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          disabled={pending}
          className="mt-4 rounded-xl border border-[#42ff5a]/50 bg-[#42ff5a]/10 px-6 py-2.5 text-sm font-semibold text-[#42ff5a] transition hover:bg-[#42ff5a]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    );
  }

  if (view.view === "active") {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#42ff5a]/30 bg-[#42ff5a]/[0.04] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-2 shrink-0 rounded-full bg-[#42ff5a] shadow-[0_0_10px_rgba(66,255,90,0.7)]" />
          <span className="text-[0.65rem] font-semibold tracking-wide text-[#42ff5a] uppercase">
            Judge Online
          </span>
          <span className="truncate max-w-[200px] text-sm font-medium text-zinc-200">
            {firebaseName || firebaseEmail}
          </span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-[#42ff5a]/40 hover:text-[#42ff5a]"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (view.view === "denied") {
    return (
      <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-amber-300">
          Access denied
        </p>
        <p className="mt-1.5 text-sm leading-6 text-zinc-300">{view.message}</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-[#42ff5a]/40 hover:text-[#42ff5a]"
          >
            Switch account
          </button>
        </div>
      </div>
    );
  }

  if (view.view === "pending") {
    return (
      <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-amber-300">
          Application pending
        </p>
        <p className="mt-1.5 text-sm leading-6 text-zinc-300">{view.message}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-[#42ff5a]/40 hover:text-[#42ff5a]"
        >
          Switch account
        </button>
      </div>
    );
  }

  // Redemption: signed in but no judge profile for this account yet.
  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Invitation code
      </p>
      <p className="mt-1.5 text-sm text-zinc-400">
        Signed in as{" "}
        <span className="font-mono text-[0.8rem] text-zinc-200">
          {firebaseEmail || "your Google account"}
        </span>
        .
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          id="judge-code"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Enter your invitation code"
          className="h-10 w-full rounded-lg border border-white/10 bg-black px-3 font-mono text-sm uppercase text-white outline-none placeholder:text-zinc-700 focus:border-[#42ff5a]/60"
        />
        <button
          type="button"
          onClick={onRedeem}
          disabled={pending || !code.trim()}
          className="h-10 rounded-lg border border-[#42ff5a]/50 bg-[#42ff5a]/10 px-4 text-sm font-semibold text-[#42ff5a] transition hover:bg-[#42ff5a]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Checking..." : "Activate"}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            message.startsWith("Application sent")
              ? "border-[#42ff5a]/30 bg-[#42ff5a]/[0.06] text-[#42ff5a]"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSignOut}
        className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-600 transition hover:text-zinc-300"
      >
        Use a different account
      </button>
    </div>
  );
}
