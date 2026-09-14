"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EVENT_KEY } from "@/lib/auction-engine.mjs";

// ---------------------------------------------------------------------------
// Judge portal server actions.
//
// Identity model: a judge signs in with Firebase. The client sends the
// Firebase uid; the server resolves it to a JudgeProfile, then to the ACTIVE
// JudgeEventAssignment for the current event. The judge's action is derived
// and validated server-side — the client never sends an arbitrary assignment
// or judge id it expects to be trusted.
//
// The rubric is event data: active JudgingCriterion rows ordered by
// displayOrder, with minScore/maxScore as the only authoritative boundaries.
// Nothing here hard-codes a 20/20/20/15/25 split.
// ---------------------------------------------------------------------------

export type JudgeCriterionView = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  minScore: number;
  maxScore: number;
  displayOrder: number;
};

export type JudgeSessionView = {
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  assignmentId: string;
  eventId: string;
  eventName: string;
  startingBudget: number;
  criteria: JudgeCriterionView[];
  maxTotal: number;
};

export type JudgeSessionResult =
  | { status: "signed_out" }
  | { status: "no_profile" }
  | { status: "pending"; message: string }
  | { status: "denied"; message: string }
  | { status: "active"; message: string; session: JudgeSessionView };

export type JudgeEntranceReport = {
  status: "success" | "invalid" | "error";
  message: string;
};

export type JudgeTeamOption = {
  id: number;
  name: string;
  code: string;
  leaderName: string;
  memberNames: string[];
  reviewedScore: number | null;
};

export type JudgeSearchResult = {
  status: "success" | "error";
  message: string;
  teams: JudgeTeamOption[];
};

export type JudgeMemberView = {
  name: string;
  email: string;
  isLeader: boolean;
};

export type JudgeTeamView = {
  id: number;
  name: string;
  code: string;
  members: JudgeMemberView[];
};

export type JudgeResourceItem = {
  roundOrder: number;
  roundName: string;
  tierName: string;
  pricePaid: number;
  priceSource: string;
};

export type JudgeResources = {
  startingBudget: number;
  spent: number;
  remaining: number;
  items: JudgeResourceItem[];
};

export type JudgeEvaluationView = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  review: string | null;
  scores: Array<{ criterionId: string; key: string; score: number }>;
  total: number;
  submittedAt: string | null;
  updatedAt: string;
};

export type JudgeReviewContext = {
  team: JudgeTeamView;
  resources: JudgeResources;
  evaluation: JudgeEvaluationView | null;
};

export type JudgeSubmitReport = {
  status: "success" | "invalid" | "error";
  message: string;
  evaluation: JudgeEvaluationView | null;
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseIntSafe(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function databaseError(): JudgeEntranceReport {
  return { status: "error", message: "Database request failed. Try again." };
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function eventByKey() {
  return prisma.event.findUnique({ where: { key: EVENT_KEY } });
}

async function toCriteriaViews(
  eventId: string,
): Promise<JudgeCriterionView[]> {
  const rows = await prisma.judgingCriterion.findMany({
    where: { eventId, active: true },
    orderBy: { displayOrder: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    minScore: row.minScore,
    maxScore: row.maxScore,
    displayOrder: row.displayOrder,
  }));
}

async function toEvaluationView(
  eventId: string,
  judgeAssignmentId: string,
  teamId: number,
): Promise<JudgeEvaluationView | null> {
  const evaluation = await prisma.evaluation.findUnique({
    where: {
      eventId_judgeAssignmentId_teamId: {
        eventId,
        judgeAssignmentId,
        teamId,
      },
    },
    include: {
      scores: { include: { criterion: true } },
    },
  });

  if (!evaluation) return null;

  return {
    id: evaluation.id,
    status: evaluation.status,
    review: evaluation.review,
    scores: evaluation.scores.map((score) => ({
      criterionId: score.criterionId,
      key: score.criterion.key,
      score: score.score,
    })),
    total: evaluation.scores.reduce((sum, score) => sum + score.score, 0),
    submittedAt: evaluation.submittedAt?.toISOString() ?? null,
    updatedAt: evaluation.updatedAt.toISOString(),
  };
}

async function resourcesView(event: { id: string; startingBudget: number }, teamId: number) {
  const settlements = await prisma.settlement.findMany({
    where: { teamId, capsule: { eventId: event.id } },
    include: { capsule: true, subCapsule: true },
    orderBy: [
      { capsule: { sequenceOrder: "asc" } },
      { subCapsule: { tierRank: "asc" } },
    ],
  });

  const items: JudgeResourceItem[] = settlements.map((settlement) => ({
    roundOrder: settlement.capsule.sequenceOrder,
    roundName: settlement.capsule.name,
    tierName: settlement.subCapsule.name,
    pricePaid: settlement.pricePaid,
    priceSource: settlement.priceSource,
  }));

  const spent = settlements.reduce((sum, s) => sum + s.pricePaid, 0);

  return {
    startingBudget: event.startingBudget,
    spent,
    remaining: event.startingBudget - spent,
    items,
  } satisfies JudgeResources;
}

// ---------------------------------------------------------------------------
// Session / identity
// ---------------------------------------------------------------------------

export async function getJudgeSessionAction(
  firebaseUid: string | null,
): Promise<JudgeSessionResult> {
  try {
    const event = await eventByKey();

    if (!event) {
      return {
        status: "denied",
        message: "The event has not been prepared yet.",
      };
    }

    if (!firebaseUid) {
      return { status: "signed_out" };
    }

    const judge = await prisma.judgeProfile.findUnique({ where: { firebaseUid } });

    if (!judge) {
      const application = await prisma.judgeApplication.findUnique({
        where: { eventId_firebaseUid: { eventId: event.id, firebaseUid } },
        select: { status: true },
      });

      if (application?.status === "PENDING") {
        return {
          status: "pending",
          message: "Your judge application is awaiting an organiser decision.",
        };
      }

      if (application?.status === "REJECTED") {
        return {
          status: "denied",
          message: "Your judge application was not approved.",
        };
      }

      return { status: "no_profile" };
    }

    const assignment = await prisma.judgeEventAssignment.findUnique({
      where: {
        judgeId_eventId: { judgeId: judge.id, eventId: event.id },
      },
    });

    if (!assignment) {
      return {
        status: "denied",
        message: "You are not assigned to judge this event yet.",
      };
    }

    if (assignment.status !== "ACTIVE") {
      return {
        status: "denied",
        message: "Your judging access for this event is suspended.",
      };
    }

    const criteria = await toCriteriaViews(event.id);

    return {
      status: "active",
      message: `Signed in as ${judge.name}.`,
      session: {
        judgeId: judge.id,
        judgeName: judge.name,
        judgeEmail: judge.email,
        assignmentId: assignment.id,
        eventId: event.id,
        eventName: event.name,
        startingBudget: event.startingBudget,
        criteria,
        maxTotal: criteria.reduce((sum, c) => sum + c.maxScore, 0),
      },
    };
  } catch (error) {
    console.error("[judge] failed to resolve judging access", error);
    return {
      status: "denied",
      message: "Could not check judging access because the server could not reach its data. Try again shortly.",
    };
  }
}

export async function redeemJudgeInvitationAction(
  _previousState: JudgeEntranceReport,
  formData: FormData,
): Promise<JudgeEntranceReport> {
  const firebaseUid = field(formData, "firebaseUid");
  const name = field(formData, "name");
  const email = field(formData, "email");
  const code = field(formData, "code");

  if (!firebaseUid) {
    return { status: "invalid", message: "Sign in with Google first." };
  }

  if (!code) {
    return { status: "invalid", message: "Enter your invitation code." };
  }

  if (name.length > 80 || email.length > 254) {
    return { status: "invalid", message: "Check your name and email." };
  }

  try {
    const event = await eventByKey();
    if (!event) {
      return { status: "error", message: "The event has not been prepared yet." };
    }

    const hashCode = sha256(code.trim().toUpperCase());
    const invitation = await prisma.judgeInvitation.findUnique({
      where: { codeHash: hashCode },
    });

    if (!invitation || invitation.eventId !== event.id) {
      return {
        status: "invalid",
        message: "That invitation code is not valid for this event.",
      };
    }

    if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
      return {
        status: "invalid",
        message: "That invitation code has expired.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const existingApplication = await tx.judgeApplication.findUnique({
        where: { eventId_firebaseUid: { eventId: event.id, firebaseUid } },
        select: { status: true },
      });

      if (existingApplication?.status === "PENDING") {
        throw new Error("APPLICATION_PENDING");
      }
      if (existingApplication?.status === "APPROVED") {
        throw new Error("APPLICATION_APPROVED");
      }
      if (existingApplication?.status === "REJECTED") {
        throw new Error("APPLICATION_REJECTED");
      }

      await tx.judgeApplication.create({
        data: {
          eventId: event.id,
          invitationId: invitation.id,
          firebaseUid,
          name: name || "Judge",
          email: email || `${firebaseUid}@judge.local`,
          status: "PENDING",
        },
      });

    });

    return {
      status: "success",
      message: "Application sent. An organiser must approve it before you can judge.",
    };
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        APPLICATION_PENDING: "Your judge application is already awaiting review.",
        APPLICATION_APPROVED: "Your judge application has already been approved.",
        APPLICATION_REJECTED: "Your judge application was rejected and cannot be resubmitted.",
      };
      if (messages[error.message]) return { status: "invalid", message: messages[error.message] };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "invalid",
        message: "This Google account already has a judge application for this event.",
      };
    }
    console.error("[judge] failed to submit judge application", error);
    return databaseError();
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchJudgeTeamsAction(
  firebaseUid: string | null,
  queryValue: string,
): Promise<JudgeSearchResult> {
  try {
    const event = await eventByKey();
    if (!event) {
      return { status: "error", message: "The event has not been prepared yet.", teams: [] };
    }

    if (!firebaseUid) {
      return { status: "error", message: "Sign in to browse teams.", teams: [] };
    }

    const judge = await prisma.judgeProfile.findUnique({
      where: { firebaseUid },
    });
    if (!judge) {
      return { status: "error", message: "Your judge profile is not registered.", teams: [] };
    }

    const assignment = await prisma.judgeEventAssignment.findUnique({
      where: { judgeId_eventId: { judgeId: judge.id, eventId: event.id } },
    });
    if (!assignment || assignment.status !== "ACTIVE") {
      return { status: "error", message: "You are not an active judge for this event.", teams: [] };
    }

    const query = queryValue.trim();

    const where: Prisma.TeamWhereInput = {
      eventId: event.id,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { code: { contains: query, mode: "insensitive" } },
              {
                members: {
                  some: {
                    user: {
                      OR: [
                        { name: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const teams = await prisma.team.findMany({
      where,
      include: {
        leader: true,
        members: {
          include: { user: true },
          orderBy: { joinOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    const evaluations = await prisma.evaluation.findMany({
      where: {
        eventId: event.id,
        judgeAssignmentId: assignment.id,
        teamId: { in: teams.map((t) => t.id) },
      },
      include: { scores: true },
    });

    const totalsByTeam = new Map(
      evaluations.map((evaluation) => [
        evaluation.teamId,
        evaluation.scores.reduce((sum, score) => sum + score.score, 0),
      ]),
    );

    return {
      status: "success",
      message: `Found ${teams.length} team${teams.length === 1 ? "" : "s"}.`,
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        code: team.code,
        leaderName: team.leader.name,
        memberNames: team.members.map((member) => member.user.name),
        reviewedScore: totalsByTeam.get(team.id) ?? null,
      })),
    };
  } catch {
    return { status: "error", message: "Could not load teams.", teams: [] };
  }
}

// ---------------------------------------------------------------------------
// Review context
// ---------------------------------------------------------------------------

export async function getJudgeReviewAction(
  firebaseUid: string | null,
  teamIdValue: number,
): Promise<
  | { status: "success"; context: JudgeReviewContext }
  | { status: "error"; message: string; context: null }
> {
  try {
    const event = await eventByKey();
    if (!event) {
      return { status: "error", message: "The event has not been prepared yet.", context: null };
    }

    if (!firebaseUid) {
      return { status: "error", message: "Sign in to review a team.", context: null };
    }

    const judge = await prisma.judgeProfile.findUnique({ where: { firebaseUid } });
    if (!judge) {
      return { status: "error", message: "Your judge profile is not registered.", context: null };
    }

    const assignment = await prisma.judgeEventAssignment.findUnique({
      where: { judgeId_eventId: { judgeId: judge.id, eventId: event.id } },
    });
    if (!assignment || assignment.status !== "ACTIVE") {
      return { status: "error", message: "You are not an active judge for this event.", context: null };
    }

    const team = await prisma.team.findUnique({
      where: { id_eventId: { id: teamIdValue, eventId: event.id } },
      include: {
        leader: true,
        members: {
          include: { user: true },
          orderBy: { joinOrder: "asc" },
        },
      },
    });

    if (!team) {
      return { status: "error", message: "That team was not found in this event.", context: null };
    }

    const [resources, evaluation] = await Promise.all([
      resourcesView(event, team.id),
      toEvaluationView(event.id, assignment.id, team.id),
    ]);

    return {
      status: "success",
      context: {
        team: {
          id: team.id,
          name: team.name,
          code: team.code,
          members: team.members.map((member) => ({
            name: member.user.name,
            email: member.user.email,
            isLeader: member.userId === team.leaderId,
          })),
        },
        resources,
        evaluation,
      },
    };
  } catch {
    return { status: "error", message: "Could not load team data.", context: null };
  }
}

// ---------------------------------------------------------------------------
// Submit / update
// ---------------------------------------------------------------------------

export async function submitJudgeEvaluationAction(
  formData: FormData,
): Promise<JudgeSubmitReport> {
  const firebaseUid = field(formData, "firebaseUid");
  const teamId = parseIntSafe(field(formData, "teamId"), Number.NaN);
  const review = formData.get("review");
  const reviewText = typeof review === "string" ? review : "";
  const scoresRaw = field(formData, "scores");

  if (!firebaseUid || Number.isNaN(teamId)) {
    return {
      status: "invalid",
      message: "Sign in and pick a team before submitting.",
      evaluation: null,
    };
  }

  try {
    const event = await eventByKey();
    if (!event) {
      return { status: "error", message: "The event has not been prepared yet.", evaluation: null };
    }

    const judge = await prisma.judgeProfile.findUnique({ where: { firebaseUid } });
    if (!judge) {
      return { status: "error", message: "Your judge profile is not registered.", evaluation: null };
    }

    const assignment = await prisma.judgeEventAssignment.findUnique({
      where: { judgeId_eventId: { judgeId: judge.id, eventId: event.id } },
    });
    if (!assignment) {
      return { status: "error", message: "You are not assigned to this event.", evaluation: null };
    }
    if (assignment.status !== "ACTIVE") {
      return {
        status: "invalid",
        message: "Your judging access for this event is suspended.",
        evaluation: null,
      };
    }

    const team = await prisma.team.findUnique({
      where: { id_eventId: { id: teamId, eventId: event.id } },
      select: { id: true },
    });
    if (!team) {
      return { status: "invalid", message: "That team does not belong to this event.", evaluation: null };
    }

    const criteria = await toCriteriaViews(event.id);
    if (criteria.length === 0) {
      return { status: "error", message: "No judging criteria have been configured yet.", evaluation: null };
    }

    let parsedScores: Record<string, unknown>;
    try {
      parsedScores = JSON.parse(scoresRaw || "{}");
    } catch {
      return { status: "invalid", message: "Scores could not be read.", evaluation: null };
    }

    // Validate every active criterion has an integer within its DB range.
    const scores: Record<string, number> = {};
    for (const criterion of criteria) {
      const raw = parsedScores[criterion.id];
      const value = typeof raw === "string" ? Number.parseInt(raw, 10) : raw;
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return {
          status: "invalid",
          message: `Give ${criterion.name} a score before submitting.`,
          evaluation: null,
        };
      }
      if (value < criterion.minScore || value > criterion.maxScore) {
        return {
          status: "invalid",
          message: `${criterion.name} must be between ${criterion.minScore} and ${criterion.maxScore}.`,
          evaluation: null,
        };
      }
      scores[criterion.id] = value;
    }

    const knownIds = new Set(criteria.map((c) => c.id));
    for (const id of Object.keys(parsedScores)) {
      if (!knownIds.has(id)) {
        return { status: "invalid", message: "An unknown criterion was submitted.", evaluation: null };
      }
    }

    await prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.upsert({
        where: {
          eventId_judgeAssignmentId_teamId: {
            eventId: event.id,
            judgeAssignmentId: assignment.id,
            teamId,
          },
        },
        update: {
          review: reviewText || null,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        create: {
          eventId: event.id,
          judgeAssignmentId: assignment.id,
          teamId,
          review: reviewText || null,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      await tx.evaluationScore.deleteMany({
        where: { evaluationId: evaluation.id },
      });

      await tx.evaluationScore.createMany({
        data: criteria.map((criterion) => ({
          evaluationId: evaluation.id,
          criterionId: criterion.id,
          eventId: event.id,
          score: scores[criterion.id],
        })),
      });
    });

    const evaluationView = await toEvaluationView(event.id, assignment.id, teamId);

    return {
      status: "success",
      message: "Evaluation saved.",
      evaluation: evaluationView,
    };
  } catch {
    return {
      status: "error",
      message: "A server error occurred. Try again.",
      evaluation: null,
    };
  }
}
