"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  getJudgeSessionAction,
  redeemJudgeInvitationAction,
  searchJudgeTeamsAction,
  getJudgeReviewAction,
  submitJudgeEvaluationAction,
  type JudgeSessionResult,
  type JudgeSessionView,
  type JudgeSearchResult,
  type JudgeReviewContext,
  type JudgeEvaluationView,
  type JudgeSubmitReport,
  type JudgeEntranceReport,
} from "./actions";
import { JudgeEntrance, type EntranceView } from "./judge-entrance";
import { TeamSearch } from "./team-search";
import { TeamOverview } from "./team-overview";
import { AuctionResources } from "./auction-resources";
import { EvaluationForm } from "./evaluation-form";
import { SubmitBar } from "./submit-bar";

type EntranceStage = "bootstrapping" | "entrance" | "active";

export function JudgeClient() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [session, setSession] = useState<
    { result: JudgeSessionResult; firebaseUid: string | null } | null
  >(null);

  // invitation
  const [code, setCode] = useState("");
  const [redeemPending, startRedeem] = useTransition();
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);

  // search
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<JudgeSearchResult>({
    status: "success",
    message: "",
    teams: [],
  });
  const [searchPending, startSearch] = useTransition();

  // review
  const [mode, setMode] = useState<"search" | "review">("search");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [context, setContext] = useState<JudgeReviewContext | null>(null);
  const [reviewPending, startReview] = useTransition();
  const [reviewError, setReviewError] = useState<string | null>(null);

  // scoring
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [review, setReview] = useState("");
  const [savedEvaluation, setSavedEvaluation] =
    useState<JudgeEvaluationView | null>(null);

  // submit
  const [submitPending, startSubmit] = useTransition();
  const [feedback, setFeedback] = useState<JudgeSubmitReport | null>(null);

  // ------------------------------------------------------------------ session

  const resolving =
    authLoading || Boolean(user && (session === null || session.firebaseUid !== user.uid));

  useEffect(() => {
    if (authLoading) return;
    const currentUid = user?.uid ?? null;
    if (!currentUid) return;
    getJudgeSessionAction(currentUid)
      .then((result) => setSession({ result, firebaseUid: currentUid }))
      .catch(() =>
        setSession({
          result: {
            status: "denied",
            message: "Could not check your judging access. Try again.",
          },
          firebaseUid: currentUid,
        }),
      );
  }, [authLoading, user?.uid]);

  const activeSession: JudgeSessionView | null =
    session?.result.status === "active" && session.firebaseUid === user?.uid
      ? session.result.session
      : null;

  const stage: EntranceStage = !user
    ? "entrance"
    : resolving
      ? "bootstrapping"
      : activeSession
        ? "active"
        : "entrance";

  let entranceView: EntranceView;
  if (!user) {
    entranceView = { view: "signed_out" };
  } else if (activeSession) {
    entranceView = { view: "active" };
  } else if (session?.result.status === "pending" && session.firebaseUid === user.uid) {
    entranceView = { view: "pending", message: session.result.message };
  } else if (session?.result.status === "denied" && session.firebaseUid === user.uid) {
    entranceView = { view: "denied", message: session.result.message };
  } else {
    entranceView = { view: "redeem" };
  }

  function resetForSearch() {
    setMode("search");
    setSelectedId(null);
    setContext(null);
    setScores(null);
    setReview("");
    setSavedEvaluation(null);
    setFeedback(null);
    setReviewError(null);
  }

  function handleSignIn() {
    startRedeem(async () => {
      setRedeemMessage(null);
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch {
        setRedeemMessage("Sign-in was cancelled or failed. Try again.");
      }
    });
  }

  function handleSignOut() {
    resetForSearch();
    setCode("");
    setRedeemMessage(null);
    signOut().catch(() => undefined);
  }

  function handleRedeem() {
    if (!user || !code.trim()) return;
    startRedeem(async () => {
      setRedeemMessage(null);
      const fd = new FormData();
      fd.set("firebaseUid", user.uid);
      fd.set("name", user.displayName ?? "");
      fd.set("email", user.email ?? "");
      fd.set("code", code.trim().toUpperCase());
      const report: JudgeEntranceReport = await redeemJudgeInvitationAction(
        { status: "error", message: "" },
        fd,
      ).catch(() => ({
        status: "error" as const,
        message: "Could not redeem the code. Try again.",
      }));
      setRedeemMessage(report.message);
      if (report.status === "success") {
        getJudgeSessionAction(user.uid)
          .then((result) => setSession({ result, firebaseUid: user.uid }))
          .catch(() => undefined);
      }
    });
  }

  // ------------------------------------------------------------ team search

  useEffect(() => {
    if (stage !== "active") return;
    const currentUid = user?.uid ?? null;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const result = await searchJudgeTeamsAction(currentUid, query).catch(
          () => ({
            status: "error" as const,
            message: "Could not load teams.",
            teams: [],
          }),
        );
        setSearchResult(result);
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [query, stage, user?.uid]);

  // ------------------------------------------------------------------ review

  const loadReview = useCallback(
    (teamId: number) => {
      const currentUid = user?.uid ?? null;
      startReview(async () => {
        setReviewError(null);
        const result = await getJudgeReviewAction(currentUid, teamId).catch(
          () => ({
            status: "error" as const,
            message: "Could not load team data.",
            context: null,
          }),
        );
        if (result.status === "error") {
          setReviewError(result.message);
          setContext(null);
          setScores(null);
          setReview("");
          setSavedEvaluation(null);
        } else {
          setContext(result.context);
          const evaluation = result.context?.evaluation ?? null;
          setSavedEvaluation(evaluation);
          if (evaluation) {
            const map: Record<string, number> = {};
            for (const score of evaluation.scores) {
              map[score.criterionId] = score.score;
            }
            setScores(map);
            setReview(evaluation.review ?? "");
          } else {
            setScores({});
            setReview("");
          }
        }
      });
    },
    [user?.uid],
  );

  useEffect(() => {
    if (selectedId) loadReview(selectedId);
  }, [selectedId, loadReview]);

  function handleSelectTeam(teamId: number) {
    setSelectedId(teamId);
    setMode("review");
    setFeedback(null);
    setContext(null);
    setScores(null);
    setReview("");
    setSavedEvaluation(null);
    setReviewError(null);
  }

  function handleScoreChange(criterionId: string, value: number) {
    setScores((prev) => ({ ...(prev ?? {}), [criterionId]: value }));
    setFeedback(null);
  }

  function handleSubmit() {
    if (!context || !activeSession || !user) return;

    const fd = new FormData();
    fd.set("firebaseUid", user.uid);
    fd.set("teamId", String(context.team.id));
    fd.set("review", review);
    fd.set("scores", JSON.stringify(scores ?? {}));

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
        startSearch(async () => {
          const search = await searchJudgeTeamsAction(user.uid, query).catch(
            () => searchResult,
          );
          setSearchResult(search);
        });
      }
    });
  }

  const criteria = activeSession?.criteria ?? [];
  const maxTotal = activeSession?.maxTotal ?? 0;
  const total = criteria.reduce((sum, c) => sum + (scores?.[c.id] ?? 0), 0);
  const isComplete =
    scores !== null && criteria.every((c) => scores[c.id] !== undefined);

  // ---------------------------------------------------------------- render

  return (
    <main className="min-h-dvh bg-black">
      <div className="mx-auto max-w-5xl px-4 pt-28 pb-40 sm:px-6">
        {/* Page header */}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
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
                them against the event rubric, and submit.
              </p>
            </div>
            {stage === "active" ? (
              <Link
                href="/judge/evaluations"
                className="rounded-lg border border-[#42ff5a]/50 bg-[#42ff5a]/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#42ff5a] transition hover:bg-[#42ff5a]/20"
              >
                View evaluations
              </Link>
            ) : null}
          </div>
        </header>

        {stage === "bootstrapping" ? (
          <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
        ) : (
          <>
            <JudgeEntrance
              view={entranceView}
              firebaseName={user?.displayName ?? null}
              firebaseEmail={user?.email ?? null}
              code={code}
              pending={redeemPending}
              message={redeemMessage}
              onCodeChange={setCode}
              onRedeem={handleRedeem}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
            />

            {stage === "active" &&
              (mode === "search" ? (
                <TeamSearch
                  query={query}
                  onQueryChange={setQuery}
                  result={searchResult}
                  pending={searchPending}
                  maxTotal={maxTotal}
                  onSelect={handleSelectTeam}
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={resetForSearch}
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
                        <TeamOverview
                          team={context.team}
                          evaluation={savedEvaluation}
                          maxTotal={maxTotal}
                        />
                        <AuctionResources resources={context.resources} />
                      </div>
                      <EvaluationForm
                        criteria={criteria}
                        scores={scores}
                        review={review}
                        evaluation={savedEvaluation}
                        maxTotal={maxTotal}
                        onChange={handleScoreChange}
                        onReviewChange={setReview}
                      />
                    </div>
                  ) : null}
                </>
              ))}
          </>
        )}
      </div>

      {/* Sticky submit bar — review mode only */}
      {mode === "review" && context && stage === "active" ? (
        <SubmitBar
          total={total}
          maxTotal={maxTotal}
          complete={isComplete}
          isUpdate={Boolean(savedEvaluation)}
          pending={submitPending}
          feedback={feedback}
          onFindTeam={resetForSearch}
          onSubmit={handleSubmit}
        />
      ) : null}
    </main>
  );
}
