"use server";

import { prisma } from "@/lib/prisma";
import { STARTING_BALANCE } from "@/lib/auction-rules.mjs";
import { revalidatePath } from "next/cache";
import { CRITERIA, type CriterionKey } from "./criteria";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type JudgeTeamOption = {
  id: number;
  name: string;
  code: string;
  leaderName: string;
  memberNames: string[];
  reviewedScore: number | null;
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
  leadName: string;
  leadEmail: string;
  members: JudgeMemberView[];
};

export type JudgeResourceItem = {
  roundOrder: number;
  roundName: string;
  tierName: string;
  pricePaid: number;
  priceSource: string;
  settledAt: string;
};

export type JudgeResources = {
  startingBudget: number;
  spent: number;
  remaining: number;
  items: JudgeResourceItem[];
};

export type JudgeEvaluationView = {
  id: string;
  judgeName: string;
  problemMarketScore: number;
  saasPotentialScore: number;
  productExecutionScore: number;
  innovationScore: number;
  resourceUtilizationScore: number;
  totalScore: number;
  updatedAt: string;
};

export type JudgeReviewContext = {
  team: JudgeTeamView;
  resources: JudgeResources;
  evaluation: JudgeEvaluationView | null;
};

export type JudgeSearchResult = {
  status: "success" | "error";
  message: string;
  teams: JudgeTeamOption[];
};

export type JudgeReviewResult = {
  status: "success" | "error";
  message: string;
  context: JudgeReviewContext | null;
};

export type JudgeAccessReport = {
  ok: boolean;
  message: string;
};

export type JudgeSubmitReport = {
  status: "success" | "error" | "invalid";
  message: string;
  evaluation: JudgeEvaluationView | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DB_MISSING =
  "Add DATABASE_URL for your Neon Postgres database, then run Prisma generate and db push.";

function invalid(message: string): JudgeSubmitReport {
  return { status: "invalid", message, evaluation: null };
}

function toEvaluationView(e: {
  id: string;
  judgeName: string;
  problemMarketScore: number;
  saasPotentialScore: number;
  productExecutionScore: number;
  innovationScore: number;
  resourceUtilizationScore: number;
  totalScore: number;
  updatedAt: Date;
}): JudgeEvaluationView {
  return {
    id: e.id,
    judgeName: e.judgeName,
    problemMarketScore: e.problemMarketScore,
    saasPotentialScore: e.saasPotentialScore,
    productExecutionScore: e.productExecutionScore,
    innovationScore: e.innovationScore,
    resourceUtilizationScore: e.resourceUtilizationScore,
    totalScore: e.totalScore,
    updatedAt: e.updatedAt.toISOString(),
  };
}

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function judgePasscodeConfigured() {
  const code = process.env.JUDGE_PASSCODE;
  return typeof code === "string" && code.length >= 4;
}

// ---------------------------------------------------------------------------
// Search teams
// ---------------------------------------------------------------------------

export async function searchJudgeTeamsAction(
  query: string,
  judgeName: string | null,
): Promise<JudgeSearchResult> {
  if (!process.env.DATABASE_URL) {
    return { status: "error", message: DB_MISSING, teams: [] };
  }

  try {
    const q = query.trim();
    const or = q
      ? [
          { name: { contains: q, mode: "insensitive" as const } },
          { code: { contains: q, mode: "insensitive" as const } },
          {
            members: {
              some: {
                user: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
            },
          },
          {
            members: {
              some: {
                user: {
                  email: {
                    contains: q.toLowerCase(),
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          },
        ]
      : [];

    const teams = await prisma.team.findMany({
      where: or.length > 0 ? { OR: or } : undefined,
      orderBy: [{ name: "asc" }],
      take: 80,
      relationLoadStrategy: "join",
      include: {
        leader: { select: { name: true } },
        members: {
          orderBy: { joinOrder: "asc" },
          select: { user: { select: { name: true } } },
        },
      },
    });

    let reviewedScores = new Map<number, number>();
    if (judgeName) {
      const rows = await prisma.judgeEvaluation.findMany({
        where: { judgeName },
        select: { teamId: true, totalScore: true },
      });
      reviewedScores = new Map(rows.map((r) => [r.teamId, r.totalScore]));
    }

    return {
      status: "success",
      message: "",
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        code: team.code,
        leaderName: team.leader.name,
        memberNames: team.members.map((m) => m.user.name),
        reviewedScore: reviewedScores.get(team.id) ?? null,
      })),
    };
  } catch (error) {
    console.error("searchJudgeTeamsAction failed:", error);
    return {
      status: "error",
      message: "Could not search teams right now. Try again.",
      teams: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Fetch full review context for a team
// ---------------------------------------------------------------------------

export async function getJudgeReviewAction(
  teamId: number,
  judgeName: string | null,
): Promise<JudgeReviewResult> {
  if (!process.env.DATABASE_URL) {
    return { status: "error", message: DB_MISSING, context: null };
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      relationLoadStrategy: "join",
      include: {
        leader: { select: { name: true, email: true } },
        members: {
          orderBy: { joinOrder: "asc" },
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!team) {
      return {
        status: "error",
        message: "That team no longer exists.",
        context: null,
      };
    }

    const [settlements, evaluation] = await Promise.all([
      prisma.settlement.findMany({
        where: { teamId },
        orderBy: { capsule: { sequenceOrder: "asc" } },
        relationLoadStrategy: "join",
        include: {
          capsule: { select: { key: true, name: true, sequenceOrder: true } },
          subCapsule: { select: { name: true } },
        },
      }),
      judgeName
        ? prisma.judgeEvaluation.findUnique({
            where: {
              teamId_judgeName: { teamId, judgeName },
            },
          })
        : Promise.resolve(null),
    ]);

    const spent = settlements.reduce((sum, s) => sum + s.pricePaid, 0);

    const context: JudgeReviewContext = {
      team: {
        id: team.id,
        name: team.name,
        code: team.code,
        leadName: team.leader.name,
        leadEmail: team.leader.email,
        members: team.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
          isLeader: m.userId === team.leaderId,
        })),
      },
      resources: {
        startingBudget: STARTING_BALANCE,
        spent,
        remaining: STARTING_BALANCE - spent,
        items: settlements.map((s) => ({
          roundOrder: s.capsule.sequenceOrder,
          roundName: s.capsule.name,
          tierName: s.subCapsule.name,
          pricePaid: s.pricePaid,
          priceSource: s.priceSource,
          settledAt: s.settledAt.toISOString(),
        })),
      },
      evaluation: evaluation ? toEvaluationView(evaluation) : null,
    };

    return { status: "success", message: "", context };
  } catch (error) {
    console.error("getJudgeReviewAction failed:", error);
    return {
      status: "error",
      message: "Could not load team data. Try again.",
      context: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Verify judge access
// ---------------------------------------------------------------------------

export async function verifyJudgeAccessAction(
  judgeName: string,
  passcode: string,
): Promise<JudgeAccessReport> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: DB_MISSING };
  }

  const name = judgeName.trim();
  if (!name) {
    return { ok: false, message: "Enter your name so reviews are saved to you." };
  }
  if (name.length > 80) {
    return { ok: false, message: "Name is too long (max 80 characters)." };
  }

  if (judgePasscodeConfigured()) {
    const envCode = process.env.JUDGE_PASSCODE!;
    if (passcode.trim() !== envCode) {
      return { ok: false, message: "That passcode is not recognised." };
    }
  }

  return { ok: true, message: `Signed in as ${name}.` };
}

// ---------------------------------------------------------------------------
// Submit / update evaluation
// ---------------------------------------------------------------------------

export async function submitJudgeEvaluationAction(
  formData: FormData,
): Promise<JudgeSubmitReport> {
  try {
    if (!process.env.DATABASE_URL) {
      return { status: "error", message: DB_MISSING, evaluation: null };
    }

    const teamIdRaw = field(formData, "teamId");
    const teamId = Number.parseInt(teamIdRaw, 10);
    const judgeName = field(formData, "judgeName");
    const passcode = field(formData, "passcode");

    if (!Number.isInteger(teamId) || teamId <= 0) {
      return invalid("That team is not valid.");
    }
    if (!judgeName) {
      return invalid("Enter your judge name before submitting.");
    }
    if (judgeName.length > 80) {
      return invalid("Judge name is too long (max 80 characters).");
    }

    if (judgePasscodeConfigured()) {
      if (passcode !== process.env.JUDGE_PASSCODE) {
        return invalid("The judge passcode is not correct.");
      }
    }

    const scores: Record<CriterionKey, number> = {
      problemMarketScore: 0,
      saasPotentialScore: 0,
      productExecutionScore: 0,
      innovationScore: 0,
      resourceUtilizationScore: 0,
    };

    for (const criterion of CRITERIA) {
      const raw = field(formData, criterion.key);
      if (!/^\d+$/.test(raw)) {
        return invalid(
          `"${criterion.name}" requires a whole number (0\u2013${criterion.max}).`,
        );
      }
      const value = Number.parseInt(raw, 10);
      if (!Number.isInteger(value) || value < 0 || value > criterion.max) {
        return invalid(
          `"${criterion.name}" must be between 0 and ${criterion.max} (you entered ${value}).`,
        );
      }
      scores[criterion.key] = value;
    }

    const total = CRITERIA.reduce(
      (sum, c) => sum + scores[c.key],
      0,
    );

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });

    if (!team) {
      return invalid("That team no longer exists.");
    }

    const data = {
      problemMarketScore: scores.problemMarketScore,
      saasPotentialScore: scores.saasPotentialScore,
      productExecutionScore: scores.productExecutionScore,
      innovationScore: scores.innovationScore,
      resourceUtilizationScore: scores.resourceUtilizationScore,
      totalScore: total,
    };

    const existing = await prisma.judgeEvaluation.findUnique({
      where: { teamId_judgeName: { teamId, judgeName } },
      select: { id: true },
    });

    let saved;
    if (existing) {
      saved = await prisma.judgeEvaluation.update({
        where: { id: existing.id },
        data,
      });
    } else {
      saved = await prisma.judgeEvaluation.create({
        data: { teamId, judgeName, ...data },
      });
    }

    revalidatePath("/judge");

    const message = existing
      ? `Evaluation for "${teamId}" updated \u2014 ${total}/100.`
      : `Evaluation saved \u2014 ${total}/100.`;

    return {
      status: "success",
      message,
      evaluation: toEvaluationView(saved),
    };
  } catch (error) {
    console.error("submitJudgeEvaluationAction failed:", error);
    return {
      status: "error",
      message: "Server error while saving your evaluation. Try again.",
      evaluation: null,
    };
  }
}
