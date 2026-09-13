/**
 * Capsule and pod lifecycle.
 *
 * Plain JS and free of any transport concerns, so both the Next server action
 * (an organiser pressing Start) and the websocket hub (a capsule finishing and
 * opening the next one automatically) drive the event through the same code.
 *
 * The event runs strictly one capsule at a time, in catalogue order. A capsule
 * opens only when the organiser starts it (Force in development, the admin
 * portal in production); nothing opens on its own when the one before it
 * finishes. Pods are drawn fresh — a new shuffle of every team — at that
 * moment and never earlier, so landing on the bidding page costs one small
 * query instead of every round's worth of pod assignments.
 */

import { randomInt, randomUUID } from "node:crypto";
import {
  auctionTiles,
  findTile,
  nextCapsuleKey,
  reserveAfter,
  sequenceOf,
} from "./auction-catalog.mjs";
import { STARTING_BALANCE, spendingCapFor } from "./auction-rules.mjs";

export const EVENT_KEY = "hackgrid-default";

/** Fisher-Yates with a CSPRNG, so pods aren't reproducible between rounds. */
function shuffle(input) {
  const items = [...input];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export async function ensureEvent(prisma) {
  const event = await prisma.event.upsert({
    where: { key: EVENT_KEY },
    update: { startingBudget: STARTING_BALANCE },
    create: { key: EVENT_KEY, name: "HackGrid", startingBudget: STARTING_BALANCE },
  });

  // Teams seeded before the event table existed have no event yet.
  await prisma.team.updateMany({ where: { eventId: null }, data: { eventId: event.id } });
  return event;
}

/**
 * Make the capsule and its tiers match the catalogue. Idempotent, so the very
 * first Start works against an empty database with no separate seed step.
 */
export async function ensureCapsule(prisma, eventId, capsuleKey) {
  const tile = findTile(capsuleKey);
  if (!tile) return null;

  const capsule = await prisma.capsule.upsert({
    where: { eventId_key: { eventId, key: capsuleKey } },
    update: { name: tile.label, sequenceOrder: sequenceOf(capsuleKey) },
    create: {
      eventId,
      key: capsuleKey,
      name: tile.label,
      sequenceOrder: sequenceOf(capsuleKey),
    },
  });

  await Promise.all(
    tile.items.map((item, index) => {
      const data = {
        name: item.name,
        tierRank: index + 1,
        startingBid: item.price,
        minIncrement: item.minIncrement,
        isAutoAssigned: item.minIncrement === null,
      };
      return prisma.subCapsule.upsert({
        where: { capsuleId_key: { capsuleId: capsule.id, key: item.key } },
        update: data,
        create: { capsuleId: capsule.id, key: item.key, ...data },
      });
    }),
  );

  return prisma.capsule.findUniqueOrThrow({
    where: { id: capsule.id },
    relationLoadStrategy: "join",
    include: { subCapsules: { orderBy: { tierRank: "asc" } } },
  });
}

/**
 * Open a capsule: shuffle every team into pods and start tier 1 in the main
 * pods. Pod size is the capsule's tier count (rulebook 5); teams that don't
 * divide evenly form the Remainder Pod, which stays shut until the main pods
 * have produced the average prices it is sold at (rulebook 7).
 */
export async function startCapsule(prisma, capsuleKey, { force = false } = {}) {
  const event = await ensureEvent(prisma);
  const capsule = await ensureCapsule(prisma, event.id, capsuleKey);

  if (!capsule) {
    return { status: "error", message: `Unknown capsule "${capsuleKey}".` };
  }

  const podSize = capsule.subCapsules.length;

  const existingBids = await prisma.bid.count({
    where: { lot: { pod: { capsuleId: capsule.id } } },
  });
  if (existingBids > 0 && !force) {
    return {
      status: "error",
      message: `${capsule.name} already has ${existingBids} recorded bid(s). Hit Reset before reshuffling pods.`,
    };
  }

  const [, teams] = await Promise.all([
    prisma.pod.deleteMany({ where: { capsuleId: capsule.id } }),
    prisma.team.findMany({
      where: { eventId: event.id },
      relationLoadStrategy: "join",
      include: { leader: true },
      orderBy: { id: "asc" },
    }),
  ]);

  if (teams.length === 0) {
    return {
      status: "error",
      message: "No teams found for this event. Create teams on /teams first.",
    };
  }

  const ordered = shuffle(teams);
  const mainPodCount = Math.floor(ordered.length / podSize);
  const groups = [];

  for (let i = 0; i < mainPodCount; i += 1) {
    groups.push({ kind: "MAIN", teams: ordered.slice(i * podSize, (i + 1) * podSize) });
  }
  const leftover = ordered.slice(mainPodCount * podSize);
  if (leftover.length > 0) {
    groups.push({ kind: "REMAINDER", teams: leftover });
  }

  const openedAt = new Date();
  const firstBiddableRank = capsule.subCapsules.find((sc) => !sc.isAutoAssigned)?.tierRank ?? null;

  // Ids up front so every row goes in as one bulk insert per table.
  let mainIndex = 0;
  const podRows = groups.map((group) => ({
    id: randomUUID(),
    capsuleId: capsule.id,
    label: group.kind === "REMAINDER" ? "Remainder Pod" : `Pod ${(mainIndex += 1)}`,
    kind: group.kind,
  }));

  const membershipRows = groups.flatMap((group, index) =>
    group.teams.map((team, seat) => ({
      id: randomUUID(),
      podId: podRows[index].id,
      capsuleId: capsule.id,
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      leadName: team.leader.name,
      leadEmail: team.leader.email,
      seat: seat + 1,
    })),
  );

  const lotRows = podRows.flatMap((pod, index) =>
    capsule.subCapsules.map((sc) => {
      // Remainder-pod lots wait for the main pods to set their price.
      // A lot opens with no clock: the hub starts it once enough of the pod
      // is connected, so a tier never ticks away while teams are still
      // arriving.
      const opensNow = groups[index].kind === "MAIN" && sc.tierRank === firstBiddableRank;
      return {
        id: randomUUID(),
        podId: pod.id,
        subCapsuleId: sc.id,
        tierRank: sc.tierRank,
        status: opensNow ? "OPEN" : "PENDING",
        openedAt: null,
        closesAt: null,
      };
    }),
  );

  await prisma.$transaction(
    [
      // Strictly one capsule at a time: opening this one ends whichever was
      // still live. Its pods and results stay exactly as they were.
      prisma.capsule.updateMany({
        where: { eventId: event.id, status: "LIVE", id: { not: capsule.id } },
        data: { status: "CLOSED" },
      }),
      prisma.pod.createMany({ data: podRows }),
      prisma.podMembership.createMany({ data: membershipRows }),
      prisma.lot.createMany({ data: lotRows }),
      prisma.capsule.update({
        where: { id: capsule.id },
        data: { status: "LIVE", startedAt: openedAt },
      }),
    ],
    { timeout: 30_000 },
  );

  return {
    status: "success",
    capsuleId: capsule.id,
    capsuleKey: capsule.key,
    capsuleName: capsule.name,
    podSize,
    teamCount: teams.length,
    podCount: podRows.length,
    hasRemainderPod: groups.some((g) => g.kind === "REMAINDER"),
    message: `${capsule.name}: ${podRows.length} pod(s) of up to ${podSize} teams from ${teams.length} team(s).`,
  };
}

/**
 * Freeze the price the remainder pod pays, then open its tiers.
 *
 * The price is the average of what each tier actually sold for across the main
 * pods, snapshotted now — if a main-pod result is corrected later it must not
 * retroactively change a price the remainder pod already paid. With too few
 * teams for any main pod to have formed, the listed starting bid stands in
 * (rulebook 7, fallback rule).
 */
export async function openRemainderPod(prisma, capsuleId) {
  const [remainderPod, subCapsules, mainSettlements] = await Promise.all([
    prisma.pod.findFirst({ where: { capsuleId, kind: "REMAINDER" } }),
    prisma.subCapsule.findMany({ where: { capsuleId }, orderBy: { tierRank: "asc" } }),
    prisma.settlement.findMany({
      where: { capsuleId, lot: { pod: { kind: "MAIN" } } },
      select: { subCapsuleId: true, pricePaid: true },
    }),
  ]);

  if (!remainderPod) return null;

  const totals = new Map();
  for (const s of mainSettlements) {
    const entry = totals.get(s.subCapsuleId) ?? { sum: 0, count: 0 };
    entry.sum += s.pricePaid;
    entry.count += 1;
    totals.set(s.subCapsuleId, entry);
  }

  const priceRows = subCapsules.map((sc) => {
    const entry = totals.get(sc.id);
    if (!entry || entry.count === 0) {
      return {
        capsuleId,
        subCapsuleId: sc.id,
        avgPrice: sc.startingBid,
        podsCounted: 0,
        source: "STARTING_BID_FALLBACK",
      };
    }
    return {
      capsuleId,
      subCapsuleId: sc.id,
      avgPrice: Math.round(entry.sum / entry.count),
      podsCounted: entry.count,
      source: "POD_AVERAGE",
    };
  });

  const priceBySubCapsule = new Map(priceRows.map((row) => [row.subCapsuleId, row.avgPrice]));

  const lots = await prisma.lot.findMany({
    where: { podId: remainderPod.id, status: "PENDING" },
    select: { id: true, subCapsuleId: true },
  });

  // Unlike a main pod, every tier opens at once: teams in the remainder pod pick
  // the tier they want rather than working down from the most expensive.
  await prisma.$transaction(
    [
      prisma.roundTierPrice.deleteMany({ where: { capsuleId } }),
      prisma.roundTierPrice.createMany({ data: priceRows }),
      ...lots.map((lot) =>
        prisma.lot.update({
          where: { id: lot.id },
          data: {
            status: "OPEN",
            openedAt: null,
            closesAt: null,
            frozenPrice: priceBySubCapsule.get(lot.subCapsuleId) ?? 0,
          },
        }),
      ),
    ],
    { timeout: 30_000 },
  );

  return {
    podId: remainderPod.id,
    lotIds: lots.map((l) => l.id),
    prices: priceRows,
  };
}

/**
 * Mark a capsule finished once every lot in it is settled, and report which
 * capsule should open next.
 */
export async function closeCapsuleIfDone(prisma, capsuleId) {
  const [capsule, unfinished, total] = await Promise.all([
    prisma.capsule.findUnique({ where: { id: capsuleId }, select: { key: true, status: true } }),
    prisma.lot.count({ where: { pod: { capsuleId }, status: { not: "CLOSED" } } }),
    prisma.lot.count({ where: { pod: { capsuleId } } }),
  ]);

  if (!capsule) return { closed: false, nextKey: null };
  if (capsule.status === "CLOSED") return { closed: false, nextKey: nextCapsuleKey(capsule.key) };

  // A round that never opened has no lots, and "no unfinished lots" would
  // otherwise read as finished — which would silently skip it in the running
  // order. Only a live round with lots of its own can be closed.
  if (capsule.status !== "LIVE" || total === 0 || unfinished > 0) {
    return { closed: false, nextKey: null };
  }

  await prisma.capsule.update({ where: { id: capsuleId }, data: { status: "CLOSED" } });
  return { closed: true, nextKey: nextCapsuleKey(capsule.key) };
}

/** True once every main pod in the capsule has settled all of its lots. */
export async function mainPodsFinished(prisma, capsuleId) {
  const outstanding = await prisma.lot.count({
    where: { pod: { capsuleId, kind: "MAIN" }, status: { not: "CLOSED" } },
  });
  return outstanding === 0;
}

/** Capsules with their running order and status, for the bidding page. */
export async function listCapsules(prisma) {
  const rows = await prisma.capsule.findMany({
    where: { event: { key: EVENT_KEY } },
    select: { id: true, key: true, status: true, sequenceOrder: true },
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return auctionTiles.map((tile, index) => {
    const row = byKey.get(tile.id);
    return {
      key: tile.id,
      name: tile.label,
      sequenceOrder: index + 1,
      capsuleId: row?.id ?? null,
      status: row?.status ?? "PENDING",
      tierCount: tile.items.length,
    };
  });
}

/** Look a team up by numeric id or by any member's email. */
export async function findTeamByIdOrEmail(prisma, value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;

  return trimmed.includes("@")
    ? prisma.team.findFirst({
        where: { members: { some: { user: { email: trimmed.toLowerCase() } } } },
        relationLoadStrategy: "join",
        include: { leader: true },
      })
    : prisma.team.findUnique({
        where: { id: Number.parseInt(trimmed, 10) },
        relationLoadStrategy: "join",
        include: { leader: true },
      });
}

/**
 * Everything a viewer needs: the running order, their seat in the round that is
 * actually live, and the resources their team already owns.
 *
 * Lives here rather than in a Next server action so the Express API and the app
 * return exactly the same thing — there is no second copy to drift.
 */
export async function getBiddingContext(prisma, teamIdOrEmail) {
  const value = String(teamIdOrEmail ?? "").trim();

  const [capsuleRows, team] = await Promise.all([
    listCapsules(prisma),
    value ? findTeamByIdOrEmail(prisma, value) : Promise.resolve(null),
  ]);

  const capsules = capsuleRows.map((row) => ({
    ...row,
    podId: null,
    podLabel: null,
    podKind: null,
  }));

  if (!value) {
    return { status: "success", message: "", team: null, capsules, resources: null };
  }
  if (!team) {
    return {
      status: "error",
      message: "No team found for that identity.",
      team: null,
      capsules,
      resources: null,
    };
  }

  // Latest in the running order wins if more than one is somehow live.
  const live = capsules.findLast((capsule) => capsule.status === "LIVE") ?? null;

  const [membership, settlements] = await Promise.all([
    live?.capsuleId
      ? prisma.podMembership.findUnique({
          where: { capsuleId_teamId: { capsuleId: live.capsuleId, teamId: team.id } },
          relationLoadStrategy: "join",
          select: { podId: true, pod: { select: { label: true, kind: true } } },
        })
      : Promise.resolve(null),
    prisma.settlement.findMany({
      where: { teamId: team.id },
      relationLoadStrategy: "join",
      select: {
        pricePaid: true,
        priceSource: true,
        settledAt: true,
        capsule: { select: { key: true, name: true, sequenceOrder: true } },
        subCapsule: { select: { name: true } },
      },
    }),
  ]);

  const owned = settlements
    .map((s) => ({
      capsuleKey: s.capsule.key,
      capsuleName: s.capsule.name,
      sequenceOrder: s.capsule.sequenceOrder,
      tierName: s.subCapsule.name,
      pricePaid: s.pricePaid,
      priceSource: s.priceSource,
      settledAt: s.settledAt.toISOString(),
    }))
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const spent = owned.reduce((total, row) => total + row.pricePaid, 0);
  const remaining = STARTING_BALANCE - spent;

  // The capsule this team is (or will next be) bidding in: the live one, else
  // the first that has not closed. Its reserve is what the team must hold back.
  const current =
    live ?? capsules.find((capsule) => capsule.status !== "CLOSED") ?? capsules.at(-1) ?? null;
  const reserve = current ? reserveAfter(current.key) : 0;

  return {
    status: "success",
    message: "",
    team: { id: team.id, name: team.name, code: team.code, leadEmail: team.leader.email },
    capsules: capsules.map((capsule) =>
      capsule.key === live?.key
        ? {
            ...capsule,
            podId: membership?.podId ?? null,
            podLabel: membership?.pod.label ?? null,
            podKind: membership?.pod.kind ?? null,
          }
        : capsule,
    ),
    resources: {
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      leadName: team.leader.name,
      leadEmail: team.leader.email,
      startingBudget: STARTING_BALANCE,
      spent,
      remaining,
      reserve,
      spendingCap: spendingCapFor({ remainingBalance: remaining, reserve }),
      reserveCapsuleKey: current?.key ?? null,
      owned,
    },
  };
}

/** Wipe every pod, lot, bid and settlement for the whole event. */
export async function resetEvent(prisma) {
  const event = await ensureEvent(prisma);
  const removed = await prisma.pod.deleteMany({ where: { capsule: { eventId: event.id } } });
  await prisma.capsule.updateMany({
    where: { eventId: event.id },
    data: { status: "PENDING", startedAt: null },
  });
  return { removed: removed.count };
}

/**
 * The capsule currently open for bidding, if any. Only one can be live, but
 * should the database ever hold two, the one furthest along the running
 * order is the real one — it was opened last.
 */
export async function liveCapsule(prisma) {
  return prisma.capsule.findFirst({
    where: { event: { key: EVENT_KEY }, status: "LIVE" },
    orderBy: { sequenceOrder: "desc" },
    select: { id: true, key: true, name: true },
  });
}
