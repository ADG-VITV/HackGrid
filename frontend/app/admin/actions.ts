"use server";

/**
 * Organiser controls. Every action is a call to the backend's /api/admin
 * router, which owns the engine and the Socket.IO hub. The organiser key
 * (ADMIN_API_KEY, server-only) is attached by lib/backend.ts so the backend
 * accepts these in production; without it the backend answers with the same
 * "requires admin authentication" report the page has always shown.
 */

import { revalidatePath } from "next/cache";
import { BackendError, backendRequest } from "@/lib/backend";

export type AdminReport = { status: "success" | "error"; message: string };

export type AdminContext = {
  teamCount: number;
  teams: Array<{ id: number; name: string; code: string; leadName: string; leadEmail: string }>;
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

async function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/bidding");
}

function failed(error: unknown): AdminReport {
  console.error("admin action failed:", error);
  return {
    status: "error",
    message:
      error instanceof BackendError && error.status === 0
        ? "Could not reach the backend."
        : "The backend could not complete that action.",
  };
}

/** Run an organiser mutation and refresh the pages that show its result. */
async function mutate(
  path: string,
  options: { method?: "POST" | "PATCH" | "DELETE"; body?: Record<string, unknown> } = {},
): Promise<AdminReport> {
  try {
    const report = await backendRequest<AdminReport>(path, {
      method: options.method ?? "POST",
      body: options.body ?? (options.method === "DELETE" ? undefined : {}),
      organiser: true,
    });
    if (report.status === "success") await refreshAdmin();
    return report;
  } catch (error) {
    return failed(error);
  }
}

const capsulePath = (capsuleKey: string) => `/api/admin/capsules/${encodeURIComponent(capsuleKey)}`;
const podPath = (capsuleKey: string, podId: string) =>
  `${capsulePath(capsuleKey)}/pods/${encodeURIComponent(podId)}`;

export async function getAdminContextAction(): Promise<AdminContext> {
  // Thrown on purpose: the page turns a rejection into "Could not load
  // organiser state." and keeps polling.
  return backendRequest<AdminContext>("/api/admin/context");
}

export async function startEventAdminAction(): Promise<AdminReport> {
  return mutate("/api/admin/event/start");
}

export async function startRoundAction(capsuleKey: string): Promise<AdminReport> {
  return mutate(`${capsulePath(capsuleKey)}/start`);
}

export async function resetEventAdminAction(): Promise<AdminReport> {
  return mutate("/api/admin/event/reset");
}

export async function resetCapsuleAction(capsuleKey: string): Promise<AdminReport> {
  return mutate(`${capsulePath(capsuleKey)}/reset`);
}

export async function resetPodAction(capsuleKey: string, podId: string): Promise<AdminReport> {
  return mutate(`${podPath(capsuleKey, podId)}/reset`);
}

export async function createManualPodAction(
  capsuleKey: string,
  podNumber: number,
  isRemainder: boolean,
): Promise<AdminReport> {
  return mutate(`${capsulePath(capsuleKey)}/pods`, { body: { podNumber, isRemainder } });
}

export async function addTeamToPodAction(
  capsuleKey: string,
  podId: string,
  teamId: number,
): Promise<AdminReport> {
  return mutate(`${podPath(capsuleKey, podId)}/teams`, { body: { teamId } });
}

export async function removeTeamFromPodAction(
  capsuleKey: string,
  podId: string,
  teamId: number,
): Promise<AdminReport> {
  return mutate(`${podPath(capsuleKey, podId)}/teams/${teamId}`, { method: "DELETE" });
}

export async function deleteManualPodAction(capsuleKey: string, podId: string): Promise<AdminReport> {
  return mutate(podPath(capsuleKey, podId), { method: "DELETE" });
}

export async function setPodRemainderFlagAction(
  capsuleKey: string,
  podId: string,
  flagged: boolean,
): Promise<AdminReport> {
  return mutate(`${podPath(capsuleKey, podId)}/remainder`, { method: "PATCH", body: { flagged } });
}

export async function resetSubCapsuleAction(capsuleKey: string, subCapsuleKey: string): Promise<AdminReport> {
  return mutate(`${capsulePath(capsuleKey)}/sub-capsules/${encodeURIComponent(subCapsuleKey)}/reset`);
}
