"use client";

export function JudgeAccess({
  judgeName,
  passcode,
  granted,
  pending,
  message,
  onJudgeNameChange,
  onPasscodeChange,
  onActivate,
  onReset,
}: {
  judgeName: string;
  passcode: string;
  granted: boolean;
  pending: boolean;
  message: string | null;
  onJudgeNameChange: (name: string) => void;
  onPasscodeChange: (passcode: string) => void;
  onActivate: () => void;
  onReset: () => void;
}) {
  if (granted) {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#42ff5a]/30 bg-[#42ff5a]/[0.04] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-2 shrink-0 rounded-full bg-[#42ff5a] shadow-[0_0_10px_rgba(66,255,90,0.7)]" />
          <span className="text-[0.65rem] font-semibold tracking-wide text-[#42ff5a] uppercase">
            Judge Online
          </span>
          <span className="truncate max-w-[200px] text-sm font-medium text-zinc-200">
            {judgeName}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-[#42ff5a]/40 hover:text-[#42ff5a]"
        >
          Switch
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Sign in to submit reviews
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1">
          <label
            htmlFor="judge-name"
            className="text-xs font-medium text-zinc-400"
          >
            Your name
          </label>
          <input
            id="judge-name"
            type="text"
            value={judgeName}
            onChange={(e) => onJudgeNameChange(e.target.value)}
            placeholder="e.g. Judge 1"
            className="h-10 w-full rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#42ff5a]/60"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="judge-passcode"
            className="text-xs font-medium text-zinc-400"
          >
            Passcode
          </label>
          <input
            id="judge-passcode"
            type="password"
            value={passcode}
            onChange={(e) => onPasscodeChange(e.target.value)}
            placeholder="Judge passcode"
            className="h-10 w-full rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#42ff5a]/60"
          />
        </div>

        <button
          type="button"
          onClick={onActivate}
          disabled={
            pending ||
            !judgeName.trim() ||
            !passcode.trim()
          }
          className="h-10 rounded-lg border border-[#42ff5a]/50 bg-[#42ff5a]/10 px-4 text-sm font-semibold text-[#42ff5a] transition hover:bg-[#42ff5a]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Checking..." : "Activate"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {message}
        </p>
      ) : null}
    </div>
  );
}
