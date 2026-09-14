"use server";

import { Prisma } from "@prisma/client";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  alert?: "ALREADY_IN_TEAM";
  viewerRole?: "LEADER" | "MEMBER";
  team?: TeamView;
};

const teamInclude = {
  members: {
    orderBy: { joinOrder: "asc" },
    include: { user: true },
  },
} satisfies Prisma.TeamInclude;

type TeamWithMembers = Prisma.TeamGetPayload<{ include: typeof teamInclude }>;

const maxTeamMembers = 6;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  return value.toLowerCase();
}

function normalizeTeamCode(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function makeTeamCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[randomInt(alphabet.length)];
  }

  return `HG-${suffix}`;
}

/** Leadership lives on teams.leaderId, so a member's role is derived. */
function toTeamView(team: TeamWithMembers): TeamView {
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    members: team.members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.userId === team.leaderId ? "LEADER" : "MEMBER",
      joinOrder: member.joinOrder,
    })),
  };
}

function alreadyInTeamState(team: TeamWithMembers, email: string): AuctionTeamState {
  const view = toTeamView(team);
  const member = view.members.find((candidate) => candidate.email === email);

  return {
    status: "error",
    alert: "ALREADY_IN_TEAM",
    message: `You are already in ${view.name}. You can only belong to one team.`,
    viewerRole: member?.role ?? "MEMBER",
    team: view,
  };
}

function databaseMissingState(): AuctionTeamState {
  return {
    status: "error",
    message: "Add DATABASE_URL for your Neon Postgres database, then run Prisma generate and db push.",
  };
}

function validationError(message: string): AuctionTeamState {
  return {
    status: "error",
    message,
  };
}

function databaseError(error: unknown): AuctionTeamState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "EACCES") {
    return validationError(
      "Could not reach Neon from the dev server. Restart Next with network access.",
    );
  }

  return validationError("Database request failed. Try again.");
}

async function findTeamForEmail(email: string) {
  return prisma.team.findFirst({
    where: { members: { some: { user: { email } } } },
    orderBy: { createdAt: "desc" },
    include: teamInclude,
  });
}

export async function getAuctionTeamForEmailAction(emailValue: string): Promise<AuctionTeamState> {
  try {
    if (!process.env.DATABASE_URL) {
      return databaseMissingState();
    }

    const email = normalizeEmail(emailValue);

    if (!isEmail(email)) {
      return { status: "idle", message: "" };
    }

    const team = await findTeamForEmail(email);

    if (!team) {
      return { status: "idle", message: "" };
    }

    const view = toTeamView(team);
    const viewer = view.members.find((member) => member.email === email);

    return {
      status: "success",
      message: "Team loaded.",
      viewerRole: viewer?.role ?? "MEMBER",
      team: view,
    };
  } catch (error) {
    return databaseError(error);
  }
}

/** Look up any team by a member's name and email. Used by the teams page. */
export async function lookupTeamMemberAction(
  _previousState: AuctionTeamState,
  formData: FormData,
): Promise<AuctionTeamState> {
  try {
    if (!process.env.DATABASE_URL) {
      return databaseMissingState();
    }

    const name = field(formData, "lookupName");
    const email = normalizeEmail(field(formData, "lookupEmail"));

    if (!name) {
      return validationError("Enter the person's name.");
    }

    if (!isEmail(email)) {
      return validationError("Enter a valid email address.");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return validationError("No person found with that email.");
    }

    if (user.name.trim().toLowerCase() !== name.toLowerCase()) {
      return validationError("That name does not match the email on record.");
    }

    const team = await findTeamForEmail(email);

    if (!team) {
      return validationError("That person is not in a team yet.");
    }

    const view = toTeamView(team);
    const viewer = view.members.find((member) => member.email === email);

    return {
      status: "success",
      message: `Showing ${view.name} as ${viewer?.role === "LEADER" ? "the team lead" : "a member"}.`,
      viewerRole: viewer?.role ?? "MEMBER",
      team: view,
    };
  } catch (error) {
    return databaseError(error);
  }
}

async function createTeam(formData: FormData): Promise<AuctionTeamState> {
  if (!process.env.DATABASE_URL) {
    return databaseMissingState();
  }

  const teamName = field(formData, "teamName");
  const leaderName = field(formData, "leaderName");
  const email = normalizeEmail(field(formData, "email"));
  const leaderAccepted = formData.get("leaderAccepted") === "on";

  if (!teamName) {
    return validationError("Enter a team name.");
  }

  if (!leaderName) {
    return validationError("Enter your name.");
  }

  if (!isEmail(email)) {
    return validationError("Enter a valid Gmail address.");
  }

  if (!leaderAccepted) {
    return validationError("Confirm that creating a team makes you the team leader.");
  }

  const existing = await findTeamForEmail(email);

  if (existing) {
    return alreadyInTeamState(existing, email);
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const team = await prisma.$transaction(async (tx) => {
        const leader = await tx.user.upsert({
          where: { email },
          update: { name: leaderName },
          create: { email, name: leaderName },
        });

        const created = await tx.team.create({
          data: {
            name: teamName,
            code: makeTeamCode(),
            leaderId: leader.id,
            members: { create: { userId: leader.id, joinOrder: 1 } },
          },
          include: teamInclude,
        });

        return created;
      });

      revalidatePath("/teams");

      return {
        status: "success",
        message: "Team created. Share the team code with your members.",
        viewerRole: "LEADER",
        team: toTeamView(team),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await findTeamForEmail(email);

        if (existing) {
          return alreadyInTeamState(existing, email);
        }

        if (attempt < 4) {
          continue;
        }
      }

      throw error;
    }
  }

  return validationError("Could not create a unique team code. Try again.");
}

async function joinTeam(formData: FormData): Promise<AuctionTeamState> {
  if (!process.env.DATABASE_URL) {
    return databaseMissingState();
  }

  const code = normalizeTeamCode(field(formData, "teamCode"));
  const memberName = field(formData, "memberName");
  const email = normalizeEmail(field(formData, "email"));

  if (!code) {
    return validationError("Enter a team code.");
  }

  if (!memberName) {
    return validationError("Enter your name.");
  }

  if (!isEmail(email)) {
    return validationError("Enter a valid Gmail address.");
  }

  const existingTeam = await prisma.team.findUnique({
    where: { code },
    include: teamInclude,
  });

  if (!existingTeam) {
    return validationError("No team found for that code.");
  }

  const alreadyIn = existingTeam.members.find((member) => member.user.email === email);

  if (alreadyIn) {
    return alreadyInTeamState(existingTeam, email);
  }

  if (existingTeam.members.length >= maxTeamMembers) {
    return validationError("This team is full. A team can have at most 6 people.");
  }

  const elsewhere = await findTeamForEmail(email);

  if (elsewhere) {
    return alreadyInTeamState(elsewhere, email);
  }

  const nextJoinOrder =
    existingTeam.members.reduce((highest, member) => Math.max(highest, member.joinOrder), 0) + 1;

  const team = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: { name: memberName },
      create: { email, name: memberName },
    });

    await tx.teamMember.create({
      data: { teamId: existingTeam.id, userId: user.id, joinOrder: nextJoinOrder },
    });

    return tx.team.findUniqueOrThrow({ where: { id: existingTeam.id }, include: teamInclude });
  });

  revalidatePath("/teams");

  return {
    status: "success",
    message: "Joined team. Team members are listed in joining order.",
    viewerRole: "MEMBER",
    team: toTeamView(team),
  };
}

export async function submitAuctionTeamAction(
  _previousState: AuctionTeamState,
  formData: FormData,
): Promise<AuctionTeamState> {
  try {
    const intent = field(formData, "intent");

    if (intent === "create") {
      return createTeam(formData);
    }

    if (intent === "join") {
      return joinTeam(formData);
    }

    return validationError("Choose whether you want to create or join a team.");
  } catch (error) {
    // The database enforces one membership per user. If two forms are submitted
    // concurrently, turn that unique-constraint result into the same UI state as
    // the normal pre-flight check.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const email = normalizeEmail(field(formData, "email"));
      const existing = isEmail(email) ? await findTeamForEmail(email) : null;

      if (existing) {
        return alreadyInTeamState(existing, email);
      }
    }

    return databaseError(error);
  }
}
