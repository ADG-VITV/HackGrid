/**
 * Idempotent seed for the judging side of the event:
 *   - the event row itself (keyed, never duplicated),
 *   - the five official judging criteria (rows, not hard-coded columns),
 *   - one shared dev invitation code so judges can apply to the portal.
 *
 * Run with `npx prisma db seed`. Anything already present is left untouched.
 */

import { createHash } from "node:crypto";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

try {
  loadEnvFile();
} catch {
  // Fine — the host may inject DATABASE_URL directly.
}

if (!process.env.DATABASE_URL) {
  console.error("[seed] DATABASE_URL is not set.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EVENT_KEY = process.env.HACKGRID_EVENT_KEY ?? "hackgrid-default";

const CRITERIA = [
  {
    key: "problem-market",
    name: "Problem & Market Opportunity",
    description:
      "Severity and value of the problem, market demand, audience size.",
    displayOrder: 1,
    minScore: 0,
    maxScore: 20,
    weight: 20,
  },
  {
    key: "saas-potential",
    name: "SaaS Business Potential",
    description:
      "Scalability, customer value, competitive advantage, long-term viability.",
    displayOrder: 2,
    minScore: 0,
    maxScore: 20,
    weight: 20,
  },
  {
    key: "product-execution",
    name: "Product Execution",
    description: "Functionality, UX, reliability, demo quality.",
    displayOrder: 3,
    minScore: 0,
    maxScore: 20,
    weight: 20,
  },
  {
    key: "innovation",
    name: "Innovation",
    description:
      "Creativity in idea and in using acquired data, AI, and integrations.",
    displayOrder: 4,
    minScore: 0,
    maxScore: 15,
    weight: 15,
  },
  {
    key: "resource-utilization",
    name: "Resource Utilization Strategy",
    description:
      "How effectively auction purchases were converted into product value — strategic spending, full use of acquired capability, efficiency relative to cost.",
    displayOrder: 5,
    minScore: 0,
    maxScore: 25,
    weight: 25,
  },
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const event = await prisma.event.upsert({
    where: { key: EVENT_KEY },
    update: { name: "HackGrid" },
    create: { key: EVENT_KEY, name: "HackGrid", startingBudget: 10000 },
  });

  let createdCriteria = 0;
  for (const criterion of CRITERIA) {
    const existing = await prisma.judgingCriterion.findUnique({
      where: { eventId_key: { eventId: event.id, key: criterion.key } },
    });
    if (existing) continue;
    await prisma.judgingCriterion.create({
      data: {
        eventId: event.id,
        ...criterion,
      },
    });
    createdCriteria += 1;
  }

  let inviteCode = null;
  const rawCode = process.env.HACKGRID_JUDGE_INVITE_CODE ?? "JUDGE-2026";
  const codeHash = sha256(rawCode.trim().toUpperCase());
  const existingInvite = await prisma.judgeInvitation.findUnique({
    where: { codeHash },
  });
  if (!existingInvite) {
    await prisma.judgeInvitation.create({
      data: {
        eventId: event.id,
        codeHash,
        expiresAt: null,
      },
    });
    inviteCode = rawCode.trim().toUpperCase();
  }

  const criteria = await prisma.judgingCriterion.count({
    where: { eventId: event.id },
  });

  console.log(
    `[seed] event "${event.key}" ready (${criteria} criteria; created ${createdCriteria}).`,
  );
  if (inviteCode) {
    console.log(`[seed] judge invitation code created: ${inviteCode}`);
  }
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
