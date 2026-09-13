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
} from "@/lib/auction-engine.mjs";

export type AdminReport = { status: "success" | "error"; message: string };

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

export async function getAdminContextAction(): Promise<AdminContext> {
  return (await getAdminEventContext(prisma)) as AdminContext;
}

export async function startEventAdminAction(): Promise<AdminReport> {
  if (!organiserEnabled()) return unavailable();
  const report = await startEvent(prisma);
  if (report.status === "success") await refreshAdmin();
  return report;
}

type Hub = {
  onCapsuleStarted?: (id: string) => Promise<void>;
  announceCapsuleStarted?: (id: string) => Promise<void>;
  onEventReset?: () => void;
};

async function notifyHub(capsuleId: string) {
  const hub = (globalThis as { __hackgridAuctionHub?: Hub }).__hackgridAuctionHub;
  if (hub?.announceCapsuleStarted) {
    await hub.announceCapsuleStarted(capsuleId).catch(() => undefined);
    return;
  }
  await hub?.onCapsuleStarted?.(capsuleId).catch(() => undefined);
}

function notifyReset() {
  const hub = (globalThis as { __hackgridAuctionHub?: Hub }).__hackgridAuctionHub;
  hub?.onEventReset?.();
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
