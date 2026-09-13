/**
 * Express router for the auction.
 *
 * Everything here is a thin HTTP wrapper over lib/auction-engine.mjs — the same
 * functions the Next server actions and the websocket hub call. There is no
 * second copy of the rules, so an organiser hitting these endpoints and a team
 * using the UI can never disagree about the state of the event.
 *
 * Mounted at /api/auction by server.mjs.
 */

import { Router } from "express";
import {
  getBiddingContext,
  liveCapsule,
  listCapsules,
  resetEvent,
  startCapsule,
} from "./auction-engine.mjs";
import { capsuleOrder } from "./auction-catalog.mjs";

/** Wraps an async handler so a rejected promise reaches Express's error handler. */
const route = (handler) => (req, res, nextFn) => Promise.resolve(handler(req, res)).catch(nextFn);

export function createAuctionRouter({ prisma, hub, dev }) {
  const router = Router();

  /** Organiser-only in production; open while developing. */
  function organiserOnly(req, res, nextFn) {
    if (dev) return nextFn();
    res.status(403).json({ status: "error", message: "Organiser controls are disabled here." });
  }

  router.get("/health", (_req, res) => {
    res.json({ status: "ok", at: new Date().toISOString() });
  });

  // The running order and where each round has got to.
  router.get(
    "/state",
    route(async (_req, res) => {
      const [capsules, live] = await Promise.all([listCapsules(prisma), liveCapsule(prisma)]);
      res.json({ status: "success", capsules, live });
    }),
  );

  // One team's view: their seat in the live round plus what they already own.
  router.get(
    "/context/:teamIdOrEmail",
    route(async (req, res) => {
      const context = await getBiddingContext(prisma, req.params.teamIdOrEmail);
      res.status(context.status === "error" ? 404 : 200).json(context);
    }),
  );

  // The Resource Manager, on its own so a team member can poll just this.
  router.get(
    "/teams/:teamIdOrEmail/resources",
    route(async (req, res) => {
      const context = await getBiddingContext(prisma, req.params.teamIdOrEmail);
      if (!context.resources) {
        return res.status(404).json({ status: "error", message: context.message || "Unknown team." });
      }
      res.json({ status: "success", resources: context.resources });
    }),
  );

  // Open the first round only. Every capsule, this one included, opens solely
  // when the organiser starts it; nothing chains on its own.
  router.post(
    "/start",
    organiserOnly,
    route(async (_req, res) => {
      const already = await liveCapsule(prisma);
      if (already) {
        return res.status(409).json({ status: "error", message: `${already.name} is already live.` });
      }

      const report = await startCapsule(prisma, capsuleOrder[0]);
      if (report.status !== "success") {
        return res.status(400).json(report);
      }

      await hub?.onCapsuleStarted?.(report.capsuleId).catch(() => undefined);
      hub?.broadcastAll?.("CAPSULE_OPENED", {
        capsuleKey: report.capsuleKey,
        capsuleId: report.capsuleId,
      });
      res.json(report);
    }),
  );

  // Force one round open out of order. Development convenience.
  router.post(
    "/capsules/:key/start",
    organiserOnly,
    route(async (req, res) => {
      const report = await startCapsule(prisma, req.params.key, { force: true });
      if (report.status !== "success") {
        return res.status(400).json(report);
      }
      await hub?.onCapsuleStarted?.(report.capsuleId).catch(() => undefined);
      hub?.broadcastAll?.("CAPSULE_OPENED", {
        capsuleKey: report.capsuleKey,
        capsuleId: report.capsuleId,
      });
      res.json(report);
    }),
  );

  router.post(
    "/reset",
    organiserOnly,
    route(async (_req, res) => {
      const { removed } = await resetEvent(prisma);
      res.json({
        status: "success",
        message: `Removed ${removed} pod(s) with their lots, bids and settlements.`,
      });
    }),
  );

  return router;
}
