/**
 * Capsule and pod lifecycle.
 *
 * Plain JS and free of any transport concerns, so both the Next server action
 * (an organiser pressing Start) and the websocket hub drive the event through
 * the same code.
 *
 * The organiser flow is:
 *   1. Start event -> create every capsule plus pod assignments for all rounds
 *   2. Start a round -> open that prepared capsule for bidding
 *   3. Reset round / tier -> rewind that prepared data without touching schema
 */

import { randomInt, randomUUID } from "node:crypto";
import {
  auctionTiles,
  capsuleOrder,
  findTile,
  nextCapsuleKey,
  sequenceOf,
} from "./auction-catalog.mjs";
import { STARTING_BALANCE } from "./auction-rules.mjs";

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

function defaultCapsuleView(tile, index) {
  return {
    key: tile.id,
    name: tile.label,
    sequenceOrder: index + 1,
    capsuleId: null,
    status: "PENDING",
    tierCount: tile.items.length,
  };
}

function buildGroups(teams, podSize) {
  const ordered = shuffle(teams);
  const mainPodCount = Math.floor(ordered.length / podSize);
  const groups = [];

  for (let index = 0; index < mainPodCount; index += 1) {
    groups.push({
      kind: "MAIN",
      teams: ordered.slice(index * podSize, (index + 1) * podSize),
    });
  }

  const leftover = ordered.slice(mainPodCount * podSize);
  if (leftover.length > 0) {
    groups.push({ kind: "REMAINDER", teams: leftover });
  }

  return groups;
}

function firstBiddableRank(subCapsules, fromRank = 1) {
  return (
    subCapsules.find((subCapsule) => subCapsule.tierRank >= fromRank && !subCapsule.isAutoAssigned)
      ?.tierRank ?? null
  );
}

function buildPreparedRows(capsule, groups, { openFromRank = null } = {}) {
  let mainIndex = 0;
  const podRows = groups.map((group) => ({
    id: randomUUID(),
    capsuleId: capsule.id,
    label: group.kind === "REMAINDER" ? "Remainder Pod" : `Pod ${(mainIndex += 1)}`,
    kind: group.kind,
  }));

  const membershipRows = groups.flatMap((group, groupIndex) =>
    group.teams.map((team, seat) => ({
      id: randomUUID(),
      podId: podRows[groupIndex].id,
      capsuleId: capsule.id,
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      leadName: team.leader.name,
      leadEmail: team.leader.email,
      seat: seat + 1,
    })),
  );

  const lotRows = podRows.flatMap((pod, groupIndex) =>
    capsule.subCapsules.map((subCapsule) => ({
      id: randomUUID(),
      podId: pod.id,
      subCapsuleId: subCapsule.id,
      tierRank: subCapsule.tierRank,
      status:
        groups[groupIndex].kind === "MAIN" && openFromRank === subCapsule.tierRank ? "OPEN" : "PENDING",
      openedAt: null,
      closesAt: null,
      frozenPrice: null,
      topBidId: null,
    })),
  );

  return { podRows, membershipRows, lotRows };
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
 * Make the capsule and its tiers match the catalogue. Idempotent, so Start can
 * prepare from an empty database with no extra seed step.
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

async function ensureAllCapsules(prisma, eventId) {
  const prepared = await Promise.all(capsuleOrder.map((capsuleKey) => ensureCapsule(prisma, eventId, capsuleKey)));
  return prepared.filter(Boolean);
}

async function eventTeams(prisma, eventId) {
  return prisma.team.findMany({
    where: { eventId },
    relationLoadStrategy: "join",
    include: { leader: true },
    orderBy: { id: "asc" },
  });
}

async function podIdsForCapsule(prisma, capsuleId) {
  const pods = await prisma.pod.findMany({
    where: { capsuleId },
    orderBy: [{ kind: "asc" }, { label: "asc" }],
    select: { id: true, kind: true },
  });

  return pods;
}

async function prepareCapsulePods(prisma, capsule, teams) {
  const groups = buildGroups(teams, capsule.subCapsules.length);
  const { podRows, membershipRows, lotRows } = buildPreparedRows(capsule, groups);

  await prisma.$transaction(
    [
      prisma.roundTierPrice.deleteMany({ where: { capsuleId: capsule.id } }),
      prisma.pod.deleteMany({ where: { capsuleId: capsule.id } }),
      prisma.pod.createMany({ data: podRows }),
      prisma.podMembership.createMany({ data: membershipRows }),
      prisma.lot.createMany({ data: lotRows }),
      prisma.capsule.update({
        where: { id: capsule.id },
        data: { status: "PENDING", startedAt: null },
      }),
    ],
    { timeout: 30_000 },
  );

  return {
    podCount: podRows.length,
    memberCount: membershipRows.length,
  };
}

export async function startEvent(prisma) {
  const event = await ensureEvent(prisma);
  const [capsules, teams, live, settlements, existingPods] = await Promise.all([
    ensureAllCapsules(prisma, event.id),
    eventTeams(prisma, event.id),
    prisma.capsule.findFirst({
      where: { eventId: event.id, status: "LIVE" },
      select: { name: true },
    }),
    prisma.settlement.count({ where: { capsule: { eventId: event.id } } }),
    prisma.pod.count({ where: { capsule: { eventId: event.id } } }),
  ]);

  if (teams.length === 0) {
    return {
      status: "error",
      message: "No teams found for this event. Create teams on /teams first.",
    };
  }

  if (live) {
    return {
      status: "error",
      message: `${live.name} is already live.`,
    };
  }

  if (settlements > 0) {
    return {
      status: "error",
      message: "This event already has settled results. Reset the event before preparing it again.",
    };
  }

  if (existingPods > 0) {
    return {
      status: "error",
      message: "This event is already prepared. Reset it first if you need fresh pod assignments.",
    };
  }

  let totalPods = 0;
  for (const capsule of capsules) {
    const result = await prepareCapsulePods(prisma, capsule, teams);
    totalPods += result.podCount;
  }

  return {
    status: "success",
    message: `Prepared ${capsules.length} round(s) for ${teams.length} team(s) with ${totalPods} pod(s).`,
  };
}

/**
 * Open a prepared capsule. Start Event should already have drawn its pods; the
 * force path exists only for development convenience.
 */
export async function startCapsule(prisma, capsuleKey, { force = false } = {}) {
  const event = await ensureEvent(prisma);
  const capsule = await ensureCapsule(prisma, event.id, capsuleKey);

  if (!capsule) {
    return { status: "error", message: `Unknown capsule "${capsuleKey}".` };
  }

  const [live, pods, teams, bids, settlements, teamCount, capsuleRows] = await Promise.all([
    prisma.capsule.findFirst({
      where: { eventId: event.id, status: "LIVE" },
      select: { id: true, key: true, name: true },
    }),
    podIdsForCapsule(prisma, capsule.id),
    force ? eventTeams(prisma, event.id) : Promise.resolve([]),
    prisma.bid.count({ where: { lot: { pod: { capsuleId: capsule.id } } } }),
    prisma.settlement.count({ where: { capsuleId: capsule.id } }),
    prisma.podMembership.count({ where: { capsuleId: capsule.id } }),
    prisma.capsule.findMany({
      where: { eventId: event.id },
      select: { key: true, status: true, sequenceOrder: true },
      orderBy: { sequenceOrder: "asc" },
    }),
  ]);

  if (live) {
    if (live.id === capsule.id) {
      return { status: "error", message: `${capsule.name} is already live.` };
    }

    return { status: "error", message: `${live.name} is already live. Finish or reset it first.` };
  }

  if (!force) {
    const previous = capsuleRows.filter((row) => row.sequenceOrder < capsule.sequenceOrder);
    const blockedBy = previous.find((row) => row.status !== "CLOSED");
    if (blockedBy) {
      return {
        status: "error",
        message: `Finish ${findTile(blockedBy.key)?.label ?? blockedBy.key} before starting ${capsule.name}.`,
      };
    }
  }

  if (bids > 0 || settlements > 0) {
    return {
      status: "error",
      message: `${capsule.name} already has recorded bidding. Reset that round before starting it again.`,
    };
  }

  let preparedPods = pods;
  let preparedTeamCount = teamCount;
  if (preparedPods.length === 0) {
    if (!force) {
      return {
        status: "error",
        message: "Start event first so pod assignments exist for every round.",
      };
    }

    if (teams.length === 0) {
      return {
        status: "error",
        message: "No teams found for this event. Create teams on /teams first.",
      };
    }

    await prepareCapsulePods(prisma, capsule, teams);
    preparedPods = await podIdsForCapsule(prisma, capsule.id);
    preparedTeamCount = teams.length;
  }

  const openingRank = firstBiddableRank(capsule.subCapsules);

  await prisma.$transaction(
    [
      prisma.roundTierPrice.deleteMany({ where: { capsuleId: capsule.id } }),
      prisma.lot.updateMany({
        where: { pod: { capsuleId: capsule.id } },
        data: { status: "PENDING", openedAt: null, closesAt: null, frozenPrice: null, topBidId: null },
      }),
      ...(openingRank === null
        ? []
        : [
            prisma.lot.updateMany({
              where: {
                podId: { in: preparedPods.filter((pod) => pod.kind === "MAIN").map((pod) => pod.id) },
                tierRank: openingRank,
              },
              data: { status: "OPEN", openedAt: null, closesAt: null },
            }),
          ]),
      prisma.capsule.update({
        where: { id: capsule.id },
        data: { status: "LIVE", startedAt: new Date() },
      }),
    ],
    { timeout: 30_000 },
  );

  return {
    status: "success",
    capsuleId: capsule.id,
    capsuleKey: capsule.key,
    capsuleName: capsule.name,
    podSize: capsule.subCapsules.length,
    teamCount: preparedTeamCount,
    podCount: preparedPods.length,
    hasRemainderPod: preparedPods.some((pod) => pod.kind === "REMAINDER"),
    message: `${capsule.name} is live with ${preparedPods.length} prepared pod(s).`,
  };
}

/**
 * Freeze the price the remainder pod pays, then open its tiers.
 *
 * The price is the average of what each tier actually sold for across the main
 * pods, snapshotted now. With too few teams for any main pod to have formed,
 * the listed starting bid stands in.
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
  for (const settlement of mainSettlements) {
    const entry = totals.get(settlement.subCapsuleId) ?? { sum: 0, count: 0 };
    entry.sum += settlement.pricePaid;
    entry.count += 1;
    totals.set(settlement.subCapsuleId, entry);
  }

  const priceRows = subCapsules.map((subCapsule) => {
    const entry = totals.get(subCapsule.id);
    if (!entry || entry.count === 0) {
      return {
        capsuleId,
        subCapsuleId: subCapsule.id,
        avgPrice: subCapsule.startingBid,
        podsCounted: 0,
        source: "STARTING_BID_FALLBACK",
      };
    }

    return {
      capsuleId,
      subCapsuleId: subCapsule.id,
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
    lotIds: lots.map((lot) => lot.id),
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
      ...defaultCapsuleView(tile, index),
      capsuleId: row?.id ?? null,
      status: row?.status ?? "PENDING",
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

  const live = capsules.find((capsule) => capsule.status === "LIVE") ?? null;

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
    .map((settlement) => ({
      capsuleKey: settlement.capsule.key,
      capsuleName: settlement.capsule.name,
      sequenceOrder: settlement.capsule.sequenceOrder,
      tierName: settlement.subCapsule.name,
      pricePaid: settlement.pricePaid,
      priceSource: settlement.priceSource,
      settledAt: settlement.settledAt.toISOString(),
    }))
    .sort((left, right) => left.sequenceOrder - right.sequenceOrder);

  const spent = owned.reduce((total, row) => total + row.pricePaid, 0);

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
      remaining: STARTING_BALANCE - spent,
      owned,
    },
  };
}

export async function getAdminEventContext(prisma) {
  const [event, teamCount] = await Promise.all([
    prisma.event.findUnique({
      where: { key: EVENT_KEY },
      select: { id: true, startingBudget: true },
    }),
    prisma.team.count(),
  ]);

  const capsuleRows = event
    ? await prisma.capsule.findMany({
        where: { eventId: event.id },
        relationLoadStrategy: "join",
        orderBy: { sequenceOrder: "asc" },
        include: {
          subCapsules: { orderBy: { tierRank: "asc" } },
          _count: {
            select: {
              pods: true,
              memberships: true,
              settlements: true,
            },
          },
        },
      })
    : [];

  const byKey = new Map(capsuleRows.map((capsule) => [capsule.key, capsule]));
  const capsules = auctionTiles.map((tile, index) => {
    const capsule = byKey.get(tile.id);
    return {
      key: tile.id,
      name: tile.label,
      status: capsule?.status ?? "PENDING",
      sequenceOrder: index + 1,
      podCount: capsule?._count.pods ?? 0,
      memberCount: capsule?._count.memberships ?? 0,
      settlementCount: capsule?._count.settlements ?? 0,
      subCapsules:
        capsule?.subCapsules.map((subCapsule) => ({
          key: subCapsule.key,
          name: subCapsule.name,
          tierRank: subCapsule.tierRank,
          isAutoAssigned: subCapsule.isAutoAssigned,
        })) ??
        tile.items.map((item, itemIndex) => ({
          key: item.key,
          name: item.name,
          tierRank: itemIndex + 1,
          isAutoAssigned: item.minIncrement === null,
        })),
    };
  });

  const liveCapsule = capsules.find((capsule) => capsule.status === "LIVE") ?? null;

  return {
    teamCount,
    event: {
      startingBudget: event?.startingBudget ?? STARTING_BALANCE,
      preparedCapsules: capsules.filter((capsule) => capsule.podCount > 0).length,
      completedCapsules: capsules.filter((capsule) => capsule.status === "CLOSED").length,
      liveCapsuleKey: liveCapsule?.key ?? null,
      liveCapsuleName: liveCapsule?.name ?? null,
      isPrepared: capsules.every((capsule) => capsule.podCount > 0),
    },
    capsules,
  };
}

/** Wipe every pod, lot, bid, settlement and frozen price snapshot for the event. */
export async function resetEvent(prisma) {
  const event = await ensureEvent(prisma);
  const capsuleIds = (
    await prisma.capsule.findMany({ where: { eventId: event.id }, select: { id: true } })
  ).map((capsule) => capsule.id);

  const removed = await prisma.pod.deleteMany({ where: { capsule: { eventId: event.id } } });
  if (capsuleIds.length > 0) {
    await prisma.roundTierPrice.deleteMany({ where: { capsuleId: { in: capsuleIds } } });
  }
  await prisma.capsule.updateMany({
    where: { eventId: event.id },
    data: { status: "PENDING", startedAt: null },
  });
  return { removed: removed.count };
}

/** Reset one capsule to its prepared, not-yet-started state while keeping its pods. */
export async function resetCapsule(prisma, capsuleKey) {
  const event = await ensureEvent(prisma);
  const capsule = await ensureCapsule(prisma, event.id, capsuleKey);

  if (!capsule) {
    return { status: "error", message: `Unknown capsule "${capsuleKey}".` };
  }

  const pods = await podIdsForCapsule(prisma, capsule.id);
  if (pods.length === 0) {
    return {
      status: "error",
      message: "That round has not been prepared yet. Start event first.",
    };
  }

  const lotRows = pods.flatMap((pod) =>
    capsule.subCapsules.map((subCapsule) => ({
      id: randomUUID(),
      podId: pod.id,
      subCapsuleId: subCapsule.id,
      tierRank: subCapsule.tierRank,
      status: "PENDING",
      openedAt: null,
      closesAt: null,
      frozenPrice: null,
      topBidId: null,
    })),
  );

  await prisma.$transaction(
    [
      prisma.roundTierPrice.deleteMany({ where: { capsuleId: capsule.id } }),
      prisma.lot.deleteMany({ where: { pod: { capsuleId: capsule.id } } }),
      prisma.lot.createMany({ data: lotRows }),
      prisma.capsule.update({
        where: { id: capsule.id },
        data: { status: "PENDING", startedAt: null },
      }),
    ],
    { timeout: 30_000 },
  );

  return {
    status: "success",
    capsuleId: capsule.id,
    message: `${capsule.name} is reset. Pod assignments are preserved; start the round when ready.`,
  };
}

/**
 * Rewind a capsule back to a selected tier. Earlier tiers stay settled; the
 * chosen tier and anything after it are recreated so bidding can resume there.
 */
export async function resetSubCapsule(prisma, capsuleKey, subCapsuleKey) {
  const event = await ensureEvent(prisma);
  const capsule = await ensureCapsule(prisma, event.id, capsuleKey);

  if (!capsule) {
    return { status: "error", message: `Unknown capsule "${capsuleKey}".` };
  }

  const target = capsule.subCapsules.find((subCapsule) => subCapsule.key === subCapsuleKey);
  if (!target) {
    return { status: "error", message: `Unknown tier "${subCapsuleKey}".` };
  }

  const pods = await podIdsForCapsule(prisma, capsule.id);
  if (pods.length === 0) {
    return {
      status: "error",
      message: "That round has not been prepared yet. Start event first.",
    };
  }

  const affected = capsule.subCapsules.filter((subCapsule) => subCapsule.tierRank >= target.tierRank);
  const affectedIds = affected.map((subCapsule) => subCapsule.id);
  const reopeningRank = capsule.status === "LIVE" ? firstBiddableRank(affected, target.tierRank) : null;

  const lotRows = pods.flatMap((pod) =>
    affected.map((subCapsule) => ({
      id: randomUUID(),
      podId: pod.id,
      subCapsuleId: subCapsule.id,
      tierRank: subCapsule.tierRank,
      status: pod.kind === "MAIN" && reopeningRank === subCapsule.tierRank ? "OPEN" : "PENDING",
      openedAt: null,
      closesAt: null,
      frozenPrice: null,
      topBidId: null,
    })),
  );

  await prisma.$transaction(
    [
      prisma.roundTierPrice.deleteMany({
        where: { capsuleId: capsule.id, subCapsuleId: { in: affectedIds } },
      }),
      prisma.lot.deleteMany({
        where: {
          pod: { capsuleId: capsule.id },
          subCapsuleId: { in: affectedIds },
        },
      }),
      prisma.lot.createMany({ data: lotRows }),
      prisma.capsule.update({
        where: { id: capsule.id },
        data: {
          status: capsule.status === "LIVE" ? "LIVE" : "PENDING",
          startedAt: capsule.status === "LIVE" ? capsule.startedAt ?? new Date() : null,
        },
      }),
    ],
    { timeout: 30_000 },
  );

  return {
    status: "success",
    capsuleId: capsule.id,
    message:
      capsule.status === "LIVE"
        ? `${target.name} is reset. Earlier tiers stay settled; this tier now resumes from a clean state.`
        : `${target.name} is reset. Earlier tiers stay settled; start the round to replay the remaining tiers.`,
  };
}

/** The capsule currently open for bidding, if any. */
export async function liveCapsule(prisma) {
  return prisma.capsule.findFirst({
    where: { event: { key: EVENT_KEY }, status: "LIVE" },
    select: { id: true, key: true, name: true },
  });
}
