"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import {
  searchJudgeTeamsAction,
  getJudgeReviewAction,
  verifyJudgeAccessAction,
  submitJudgeEvaluationAction,
  type JudgeSearchResult,
  type JudgeReviewContext,
  type JudgeEvaluationView,
  type JudgeSubmitReport,
} from "./actions";
import { JudgeAccess } from "./judge-access";
import { TeamSearch } from "./team-search";
import { TeamOverview } from "./team-overview";
import { AuctionResources } from "./auction-resources";
import { EvaluationForm } from "./evaluation-form";
import { SubmitBar } from "./submit-bar";

// ---------------------------------------------------------------------------
// Judge identity store (persisted to localStorage via useSyncExternalStore)
// ---------------------------------------------------------------------------

const JUDGE_NAME_KEY = "hackgrid:judgeName";
const JUDGE_PASSCODE_KEY = "hackgrid:judgePasscode";
const JUDGE_AUTH_KEY = "hackgrid:judgePasscodeVerified";

type JudgeIdentity = {
  name: string;
  passcode: string;
  verified: boolean;
};

const EMPTY_IDENTITY: JudgeIdentity = { name: "", passcode: "", verified: false };

let identityCache: JudgeIdentity = EMPTY_IDENTITY;
const identityListeners = new Set<() => void>();

function subscribeIdentity(listener: () => void) {
  identityListeners.add(listener);
  return () => {
    identityListeners.delete(listener);
  };
}

function readIdentity() {
  if (typeof window === "undefined") return EMPTY_IDENTITY;
  const name = window.localStorage.getItem(JUDGE_NAME_KEY) ?? "";
  const passcode = window.localStorage.getItem(JUDGE_PASSCODE_KEY) ?? "";
  const verified = window.localStorage.getItem(JUDGE_AUTH_KEY) === "true";
  if (
    identityCache.name !== name ||
    identityCache.passcode !== passcode ||
    identityCache.verified !== verified
  ) {
    identityCache = { name, passcode, verified };
  }
  return identityCache;
}

function writeIdentity(name: string, passcode: string, verified: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(JUDGE_NAME_KEY, name);
    window.localStorage.setItem(JUDGE_PASSCODE_KEY, passcode);
    window.localStorage.setItem(JUDGE_AUTH_KEY, verified ? "true" : "false");
  }
  identityCache = { name, passcode, verified };
  identityListeners.forEach((listener) => listener());
}

const SCORE_KEYS = [
  "problemMarketScore",
  "saasPotentialScore",
  "productExecutionScore",
  "innovationScore",
  "resourceUtilizationScore",
] as const;

export function JudgeClient() {
  const [mode, setMode] = useState<"search" | "review">("search");
  const identity = useSyncExternalStore(
    subscribeIdentity,
    readIdentity,
    () => EMPTY_IDENTITY,
  );

  // access
  const [accessPending, startAccess] = useTransition();
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  // search
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<JudgeSearchResult>({
    status: "success",
    message: "",
    teams: [],
  });
  const [searchPending, startSearch] = useTransition();
  const searchMounted = useRef(false);

  // review
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [context, setContext] = useState<JudgeReviewContext | null>(null);
  const [reviewPending, startReview] = useTransition();
  const [reviewError, setReviewError] = useState<string | null>(null);

  // scores
  const [scores, setScores] = useState<
    Record<string, number | undefined> | null
  >(null);
  const [savedEvaluation, setSavedEvaluation] =
    useState<JudgeEvaluationView | null>(null);

  // submit
  const [submitPending, startSubmit] = useTransition();
  const [feedback, setFeedback] = useState<JudgeSubmitReport | null>(null);

  const passcodeForQuery = identity.verified ? identity.name : null;

  // Debounced team search
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true;
    }
    const timer = setTimeout(() => {
      startSearch(async () => {
        const result = await searchJudgeTeamsAction(
          query,
          passcodeForQuery,
        ).catch(() => ({
          status: "error" as const,
          message: "Could not load teams.",
          teams: [],
        }));
        setSearchResult(result);
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [query, passcodeForQuery]);

  // Load review context
  const loadReview = useCallback(
    (teamId: number) => {
      startReview(async () => {
        setReviewError(null);
        const result = await getJudgeReviewAction(
          teamId,
          passcodeForQuery,
        ).catch(() => ({
          status: "error" as const,
          message: "Could not load team data.",
          context: null,
        }));
        if (result.status === "error") {
          setReviewError(result.message);
          setContext(null);
          setScores(null);
          setSavedEvaluation(null);
        } else {
          setContext(result.context);
          setSavedEvaluation(result.context?.evaluation ?? null);
          if (result.context?.evaluation) {
            const e = result.context.evaluation;
            setScores({
              problemMarketScore: e.problemMarketScore,
              saasPotentialScore: e.saasPotentialScore,
              productExecutionScore: e.productExecutionScore,
              innovationScore: e.innovationScore,
              resourceUtilizationScore: e.resourceUtilizationScore,
            });
          } else {
            setScores(null);
          }
        }
      });
    },
    [passcodeForQuery],
  );

  // When selectedId changes, load review
  useEffect(() => {
    if (selectedId) loadReview(selectedId);
  }, [selectedId, loadReview]);

  function handleSelectTeam(teamId: number) {
    setSelectedId(teamId);
    setMode("review");
    setFeedback(null);
    setContext(null);
    setScores(null);
    setSavedEvaluation(null);
    setReviewError(null);
  }

  function handleFindAnotherTeam() {
    setMode("search");
    setSelectedId(null);
    setContext(null);
    setScores(null);
    setSavedEvaluation(null);
    setFeedback(null);
    setReviewError(null);
  }

  function handleScoreChange(field: string, value: number) {
    setScores((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFeedback(null);
  }

  function handleSubmit() {
    if (!context || !scores) return;

    if (!identity.verified) {
      setFeedback({
        status: "error",
        message: "Enter your judge name and passcode to submit.",
        evaluation: null,
      });
      return;
    }

    const fd = new FormData();
    fd.set("teamId", String(context.team.id));
    fd.set("judgeName", identity.name);
    fd.set("passcode", identity.passcode);

    for (const key of SCORE_KEYS) {
      const value = scores[key];
      fd.set(key, value !== undefined ? String(value) : "0");
    }

    startSubmit(async () => {
      const result = await submitJudgeEvaluationAction(fd).catch(
        () =>
          ({
            status: "error",
            message: "A server error occurred. Try again.",
            evaluation: null,
          }) satisfies JudgeSubmitReport,
      );

      setFeedback(result);

      if (result.status === "success") {
        setSavedEvaluation(result.evaluation);
        loadReview(context.team.id);
      }
    });
  }

  // Re-evaluate total from scores
  const total = scores
    ? Math.min(
        100,
        SCORE_KEYS.reduce((sum, key) => sum + (scores[key] ?? 0), 0),
      )
    : 0;

  const isComplete = scores !== null && SCORE_KEYS.every(
    (key) => scores[key] !== undefined,
  );

  function handleActivate() {
    setAccessMessage(null);
    startAccess(async () => {
      const result = await verifyJudgeAccessAction(
        identity.name.trim(),
        identity.passcode.trim(),
      ).catch(() => ({
        ok: false,
        message: "Could not verify. Try again.",
      }));
      if (result.ok) {
        writeIdentity(identity.name.trim(), identity.passcode.trim(), true);
        setAccessMessage(result.message);
      } else {
        writeIdentity(identity.name, identity.passcode, false);
        setAccessMessage(result.message);
      }
    });
  }

  return (
    <main className="min-h-dvh bg-black">
      <div className="mx-auto max-w-5xl px-4 pt-28 pb-40 sm:px-6">
        {/* Page header */}
        <header className="mb-6">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#42ff5a]">
            Judge Portal
          </p>
          <h1
            className="font-pixel mt-2 text-2xl font-bold tracking-wider text-white sm:text-3xl"
            style={{
              textShadow: "0 0 12px rgba(66,255,90,0.35)",
            }}
          >
            Judge Review
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            Search for a team, review what they acquired in the auction, score
            them against the official criteria, and submit.
          </p>
        </header>

        {/* Judge identity bar */}
        <JudgeAccess
          judgeName={identity.name}
          passcode={identity.passcode}
          granted={identity.verified}
          pending={accessPending}
          message={accessMessage}
          onJudgeNameChange={(name) => {
            writeIdentity(name, identity.passcode, false);
            setAccessMessage(null);
          }}
          onPasscodeChange={(pc) => {
            writeIdentity(identity.name, pc, false);
            setAccessMessage(null);
          }}
          onActivate={handleActivate}
          onReset={() => {
            writeIdentity("", "", false);
            setAccessMessage(null);
          }}
        />

        {mode === "search" ? (
          <TeamSearch
            query={query}
            onQueryChange={setQuery}
            result={searchResult}
            pending={searchPending}
            onSelect={handleSelectTeam}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={handleFindAnotherTeam}
              className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-400 transition hover:border-[#42ff5a]/40 hover:text-[#42ff5a]"
            >
              <span aria-hidden="true">&#8592;</span>
              Find another team
            </button>

            {reviewPending && !context ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
                  <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
                </div>
                <div className="h-[600px] animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
              </div>
            ) : reviewError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-5">
                <p className="text-sm text-red-200">{reviewError}</p>
                <button
                  type="button"
                  onClick={() => selectedId && loadReview(selectedId)}
                  className="mt-3 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-300 hover:bg-red-500/10"
                >
                  Retry
                </button>
              </div>
            ) : context ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <div className="space-y-4">
                  <TeamOverview team={context.team} evaluation={savedEvaluation} />
                  <AuctionResources resources={context.resources} />
                </div>
                <EvaluationForm
                  scores={scores}
                  evaluation={savedEvaluation}
                  onChange={handleScoreChange}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Sticky submit bar — review mode only */}
      {mode === "review" && context ? (
        <SubmitBar
          total={total}
          complete={isComplete}
          isUpdate={Boolean(savedEvaluation)}
          pending={submitPending}
          granted={identity.verified}
          feedback={feedback}
          onFindTeam={handleFindAnotherTeam}
          onSubmit={handleSubmit}
        />
      ) : null}
    </main>
  );
}