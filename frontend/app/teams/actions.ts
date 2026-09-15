"use server";

/**
 * Teams: create, join, look up. The rules and the database live in the
 * backend (/api/teams); these actions carry the form to it and hand its
 * answer back to the page unchanged.
 */

import { revalidatePath } from "next/cache";
import { BackendError, backendRequest } from "@/lib/backend";

export type TeamMemberView = {
  id: number;
  name: string;
  email: string;
  role: "LEADER" | "MEMBER";
  joinOrder: number;
};

export type TeamView = {
  id: number;
  name: string;
  code: string;
  members: TeamMemberView[];
};

export type AuctionTeamState = {
  status: "idle" | "success" | "error";
  message: string;
  viewerRole?: "LEADER" | "MEMBER";
  team?: TeamView;
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  return value.toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function backendUnavailable(error: unknown): AuctionTeamState {
  console.error("teams action failed:", error);
  return {
    status: "error",
    message:
      error instanceof BackendError && error.status === 0
        ? "Could not reach the backend. Check NEXT_PUBLIC_BACKEND_URL and that the server is running."
        : "Database request failed. Try again.",
  };
}

export async function getAuctionTeamForEmailAction(emailValue: string): Promise<AuctionTeamState> {
  const email = normalizeEmail(emailValue.trim());

  if (!isEmail(email)) {
    return { status: "idle", message: "" };
  }

  try {
    return await backendRequest<AuctionTeamState>(`/api/teams/by-email/${encodeURIComponent(email)}`);
  } catch (error) {
    return backendUnavailable(error);
  }
}

export async function submitAuctionTeamAction(
  _previousState: AuctionTeamState,
  formData: FormData,
): Promise<AuctionTeamState> {
  // The form is sent as JSON; the backend applies the same validation the
  // server action used to, and answers with the same messages.
  const payload = {
    intent: field(formData, "intent"),
    teamName: field(formData, "teamName"),
    leaderName: field(formData, "leaderName"),
    memberName: field(formData, "memberName"),
    teamCode: field(formData, "teamCode"),
    email: field(formData, "email"),
    leaderAccepted: formData.get("leaderAccepted") === "on",
  };

  try {
    const state = await backendRequest<AuctionTeamState>("/api/teams/submit", { body: payload });
    if (state.status === "success") revalidatePath("/teams");
    return state;
  } catch (error) {
    return backendUnavailable(error);
  }
}

export type RosterUser = {
  id: number;
  name: string;
  email: string;
  /** Null when the person is on no team. */
  role: "LEADER" | "MEMBER" | null;
  teamName: string | null;
};

/**
 * Everyone in the users table, for the development-only "act as" picker on
 * the teams page. The backend answers with an empty list unless it, too, is
 * running in development.
 */
export async function listUsersAction(): Promise<RosterUser[]> {
  if (process.env.NODE_ENV !== "development") {
    return [];
  }

  try {
    return await backendRequest<RosterUser[]>("/api/teams/users");
  } catch (error) {
    console.error("listUsersAction failed:", error);
    return [];
  }
}
