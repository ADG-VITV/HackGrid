"use client";

import { useActionState, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { lookupTeamMemberAction, type AuctionTeamState } from "./actions";
import { TeamDetails } from "./team-details";

const initialLookupState: AuctionTeamState = {
  status: "idle",
  message: "",
};

export function TeamLookupButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [lookupState, lookupAction, pending] = useActionState(
    lookupTeamMemberAction,
    initialLookupState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-[#051306] text-sm font-medium text-emerald-300 transition hover:border-emerald-400 hover:bg-[#08230c]"
      >
        <FaMagnifyingGlass className="size-4" aria-hidden />
        View a team
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-dashed border-emerald-400/70 bg-[#051306] p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Look up team details</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full border border-emerald-500/40 text-zinc-400 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                &times;
              </button>
            </div>

            <form action={lookupAction} className="mt-5">
              <p className="text-sm leading-6 text-zinc-500">
                Enter a name and Gmail from the database to see the team view that person gets
                as a leader or a member.
              </p>

              <label className="mt-6 block text-sm font-medium text-zinc-300">
                Name
                <input
                  name="lookupName"
                  placeholder="Their name"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-zinc-300">
                Gmail
                <input
                  name="lookupEmail"
                  type="email"
                  placeholder="them@gmail.com"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
                />
              </label>

              <button
                type="submit"
                disabled={pending}
                className="mt-6 h-11 w-full rounded-md bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {pending ? "Looking up..." : "Show team details"}
              </button>
            </form>

            {lookupState.message ? (
              <p
                className={`mt-4 rounded-md border px-4 py-3 text-sm ${
                  lookupState.status === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-emerald-500/30 bg-emerald-400/10 text-emerald-200"
                }`}
                aria-live="polite"
              >
                {lookupState.message}
              </p>
            ) : null}

            {lookupState.team ? (
              <div className="mt-5">
                <TeamDetails state={lookupState} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
