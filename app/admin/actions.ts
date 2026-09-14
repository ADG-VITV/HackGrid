"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getAdminEventContext,
  resetCapsule,
  resetEvent,
  resetSubCapsule,
  startCapsule,
  startEvent,
  EVENT_KEY,
} from "@/lib/auction-engine.mjs";

export type AdminReport = { status: "success" | "error"; message: string };

export type JudgeApplicationAdminView = {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
};

export type AdminContext = {
  teamCount: number;
  event: {
    startingBudget: number;
    preparedCapsules: number;
    completedCapsules: number;
    liveCapsuleKey: string | null;
    liveCapsuleName: string | null;
    isPrepared: boolean;
  };
  capsules: Array<{
    key: string;
    name: string;
    status: "PENDING" | "LIVE" | "CLOSED";
    sequenceOrder: number;
    podCount: number;
    memberCount: number;
    settlementCount: number;
    pods: Array<{
      id: string;
      label: string;
      kind: "MAIN" | "REMAINDER";
      auctionStatus: "PENDING" | "WAITING_FOR_TEAMS" | "LIVE" | "COMPLETE";
      activeItemName: string | null;
      settledLots: number;
      lotCount: number;
      /** Teams with a live socket in this pod room right now. */
      onlineCount: number;
      teams: Array<{
        id: number;
        name: string;
        code: string;
        leadName: string;
        leadEmail: string;
        seat: number;
        online: boolean;
        item: {
          name: string;
          tierRank: number;
          pricePaid: number;
          priceSource: "COMPETITIVE" | "AUTO_ASSIGNED" | "NO_BIDS_ASSIGNED" | "POD_AVERAGE" | "STARTING_BID_FALLBACK";
        } | null;
      }>;
    }>;
    subCapsules: Array<{ key: string; name: string; tierRank: number; isAutoAssigned: boolean }>;
  }>;
};

function organiserEnabled() {
  // The existing app has no server-verifiable Firebase session or admin role.
  // Do not expose destructive organiser mutations in production until that is
  // added; development uses the same organiser boundary as the auction API.
  return process.env.NODE_ENV === "development";
}

function unavailable(): AdminReport {
  return { status: "error", message: "Organiser controls require server-side admin authentication in production." };
}

async function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/bidding");
}

type Hub = {
  onCapsuleStarted?: (id: string) => Promise<void>;
  announceCapsuleStarted?: (id: string) => Promise<void>;
  onEventReset?: () => void;
  onlineTeamsByPod?: () => Promise<Map<string, Set<number>>>;
};

/** The Socket.IO hub shares this process (server.mjs); absent under plain `next dev`. */
function getHub() {
  return (globalThis as { __hackgridAuctionHub?: Hub }).__hackgridAuctionHub;
}

export async function getAdminContextAction(): Promise<AdminContext> {
  // Presence is the same signal the bidding page paints its green dots from:
  // a team is "online" when it holds a socket in its pod room. Only the live
  // round's pods can have sockets, so every other pod simply reads as empty.
  const [context, onlineByPod] = await Promise.all([
    getAdminEventContext(prisma) as Promise<AdminContext>,
    getHub()?.onlineTeamsByPod?.().catch(() => null) ?? Promise.resolve(null),
  ]);

  for (const capsule of context.capsules) {
    for (const pod of capsule.pods) {
      const online = onlineByPod?.get(pod.id) ?? new Set<number>();
      pod.teams = pod.teams.map((team) => ({ ...team, online: online.has(team.id) }));
      pod.onlineCount = pod.teams.filter((team) => team.online).length;
    }
  }

  return context;
}

export async function getJudgeApplicationsAdminAction(): Promise<JudgeApplicationAdminView[]> {
  const event = await prisma.event.findUnique({ where: { key: EVENT_KEY }, select: { id: true } });
  if (!event) return [];

  const applications = await prisma.judgeApplication.findMany({
    where: { eventId: event.id },
    orderBy: [{ status: "asc" }, { submittedAt: "asc" }],
  });

  return applications.map((application) => ({
    id: application.id,
    name: application.name,
    email: application.email,
    status: application.status,
    submittedAt: application.submittedAt.toISOString(),
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
  }));
}

export async function reviewJudgeApplicationAction(
  applicationId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  if (!applicationId || (decision !== "APPROVED" && decision !== "REJECTED")) {
    return { status: "error", message: "Invalid judge application decision." };
  }

  try {
    const application = await prisma.judgeApplication.findUnique({ where: { id: applicationId } });
    if (!application) return { status: "error", message: "Judge application was not found." };
    if (application.status !== "PENDING") {
      return { status: "error", message: "This judge application has already been reviewed." };
    }

    await prisma.$transaction(async (tx) => {
      if (decision === "REJECTED") {
        await tx.judgeApplication.update({
          where: { id: application.id },
          data: { status: "REJECTED", reviewedAt: new Date() },
        });
        return;
      }

      const judge = await tx.judgeProfile.upsert({
        where: { firebaseUid: application.firebaseUid },
        update: { name: application.name, email: application.email },
        create: {
          firebaseUid: application.firebaseUid,
          name: application.name,
          email: application.email,
        },
      });

      await tx.judgeEventAssignment.upsert({
        where: { judgeId_eventId: { judgeId: judge.id, eventId: application.eventId } },
        update: { status: "ACTIVE", approvedAt: new Date() },
        create: { judgeId: judge.id, eventId: application.eventId, status: "ACTIVE" },
      });

      await tx.judgeApplication.update({
        where: { id: application.id },
        data: { status: "APPROVED", reviewedAt: new Date(), judgeId: judge.id },
      });
    });

    await refreshAdmin();
    return {
      status: "success",
      message: decision === "APPROVED" ? "Judge application approved." : "Judge application rejected.",
    };
  } catch {
    return { status: "error", message: "Could not review the judge application." };
  }
}

export async function startEventAdminAction(): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  const report = await startEvent(prisma);
  if (report.status === "success") await refreshAdmin();
  return report;
}

async function notifyHub(capsuleId: string) {
  const hub = getHub();
  if (hub?.announceCapsuleStarted) {
    await hub.announceCapsuleStarted(capsuleId).catch(() => undefined);
    return;
  }
  await hub?.onCapsuleStarted?.(capsuleId).catch(() => undefined);
}

function notifyReset() {
  getHub()?.onEventReset?.();
}

export async function startRoundAction(capsuleKey: string): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  const report = await startCapsule(prisma, capsuleKey);
  if (report.status === "success") {
    await notifyHub(report.capsuleId);
    await refreshAdmin();
  }
  return report;
}

export async function resetEventAdminAction(): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  const { removed } = await resetEvent(prisma);
  notifyReset();
  await refreshAdmin();
  return { status: "success", message: `Reset ${removed} round(s). Teams remain onboarded; start the event again to prepare fresh pods.` };
}

export async function resetCapsuleAction(capsuleKey: string): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  const report = await resetCapsule(prisma, capsuleKey);
  if (report.status === "success") {
    if (report.capsuleId) await notifyHub(report.capsuleId);
    else notifyReset();
    await refreshAdmin();
  }
  return report;
}

export async function resetSubCapsuleAction(capsuleKey: string, subCapsuleKey: string): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  const report = await resetSubCapsule(prisma, capsuleKey, subCapsuleKey);
  if (report.status === "success") {
    if (report.capsuleId) await notifyHub(report.capsuleId);
    await refreshAdmin();
  }
  return report;
}
