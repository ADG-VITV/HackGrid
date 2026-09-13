"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  SOCKET_PATH,
  type BidAck,
  type ClientToServerEvents,
  type RoomState,
  type ServerToClientEvents,
} from "@/lib/socket-events";

export type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

export type ConsoleEntry = {
  id: number;
  at: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
};

export type BidFeedback = {
  kind: "accepted" | "rejected" | "outbid";
  lotId: string;
  message: string;
  nextMin?: number;
} | null;

/** Lifecycle events the page reacts to by re-reading its context. */
export type LifecycleEvent =
  | { type: "LOT_CLOSED" }
  | { type: "CAPSULE_CLOSED" }
  | { type: "CAPSULE_OPENED" }
  | { type: "EVENT_COMPLETE" };

type AuctionSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let entryId = 0;

/**
 * Holds one Socket.IO connection to one pod room.
 *
 * The server owns all auction state — this hook mirrors what arrives and
 * forwards bid intents. It never decides whether a bid is legal; the server's
 * acknowledgement does.
 *
 * Reconnection, heartbeats and backoff are Socket.IO's job, so none of that
 * lives here.
 */
export function useAuctionSocket(podId: string | null, teamId: string | null) {
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [state, setState] = useState<RoomState | null>(null);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [feedback, setFeedback] = useState<BidFeedback>(null);
  const [lastEvent, setLastEvent] = useState<LifecycleEvent | null>(null);
  /** serverTime minus local clock, so every countdown runs off server truth. */
  const [clockSkew, setClockSkew] = useState(0);

  const socketRef = useRef<AuctionSocket | null>(null);

  const pushEntry = useCallback((level: ConsoleEntry["level"], message: string, at?: string) => {
    setEntries((previous) => {
      const next = [
        ...previous,
        { id: (entryId += 1), at: at ?? new Date().toISOString(), level, message },
      ];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
  }, []);

  const clearEntries = useCallback(() => setEntries([]), []);

  useEffect(() => {
    if (!podId || !teamId) return;

    // Identity travels in the handshake, where the server's io.use() gate
    // reads it, rather than in a query string.
    const socket: AuctionSocket = io({
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
      auth: { podId, teamId },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnection("open");
      pushEntry("success", `Connected to room ${podId}.`);
    });

    socket.on("disconnect", (reason) => {
      setConnection("closed");
      // "io server disconnect" means the server refused or ejected us; every
      // other reason is transient and Socket.IO will retry on its own.
      if (reason === "io server disconnect") {
        pushEntry("error", "The room closed this connection.");
      } else {
        pushEntry("warn", `Connection lost (${reason}) — reconnecting.`);
      }
    });

    socket.on("connect_error", (error) => {
      setConnection("error");
      pushEntry("error", error.message || "Could not connect to the room.");
    });

    socket.on("ROOM_STATE", (roomState) => {
      setState(roomState);
      setClockSkew(Date.parse(roomState.serverTime) - Date.now());
    });

    socket.on("OUTBID", ({ lotId, byTeamName, amount, nextMin }) => {
      setFeedback({
        kind: "outbid",
        lotId,
        message: `${byTeamName} bid ${amount}. Next bid is ${nextMin}.`,
        nextMin,
      });
      pushEntry("warn", `${byTeamName} bid ${amount} credits.`);
    });

    socket.on("LOT_OPENED", ({ name }) => {
      pushEntry("info", `Now bidding: ${name}.`);
      setFeedback(null);
    });

    socket.on("LOT_CLOSED", ({ name, winnerTeamName, pricePaid }) => {
      pushEntry(
        "info",
        winnerTeamName
          ? `${name} sold to ${winnerTeamName} for ${pricePaid} credits.`
          : `${name} closed with no bids.`,
      );
      setLastEvent({ type: "LOT_CLOSED" });
    });

    socket.on("POD_COMPLETE", () => {
      pushEntry("success", "Every tier in this pod is settled.");
    });

    socket.on("CAPSULE_CLOSED", ({ nextKey }) => {
      pushEntry(
        "success",
        nextKey
          ? "This round is finished. The next opens when the organiser starts it — pods are redrawn then."
          : "This round is finished.",
      );
      setLastEvent({ type: "CAPSULE_CLOSED" });
    });

    socket.on("CAPSULE_OPENED", () => {
      pushEntry("success", "Next round is open. Fetching your new pod.");
      setLastEvent({ type: "CAPSULE_OPENED" });
    });

    socket.on("EVENT_COMPLETE", () => {
      pushEntry("success", "Every round is settled. The auction is over.");
      setLastEvent({ type: "EVENT_COMPLETE" });
    });

    socket.on("LOG", ({ level, message, at }) => pushEntry(level, message, at));
    socket.on("ROOM_ERROR", ({ message }) => pushEntry("error", message));

    // Leaving a room clears its state, so switching pods never shows the
    // previous room's lots for a frame.
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnection("idle");
      setState(null);
      setFeedback(null);
    };
  }, [podId, teamId, pushEntry]);

  /**
   * Send a bid and wait for the server's acknowledgement. The ack is the only
   * thing that decides whether it counted.
   */
  const placeBid = useCallback(
    (lotId: string, amount: number) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        pushEntry("error", "Not connected — bid was not sent.");
        return false;
      }

      socket.emit("BID", { lotId, amount }, (result: BidAck) => {
        if (result.ok) {
          setFeedback({
            kind: "accepted",
            lotId: result.lotId,
            message: `Your bid of ${result.amount} credits is on top.`,
          });
          pushEntry("success", `Bid accepted at ${result.amount} credits.`);
          return;
        }

        setFeedback({
          kind: "rejected",
          lotId: result.lotId,
          message: result.reason,
          nextMin: result.nextMin,
        });
        pushEntry("error", `Bid rejected — ${result.reason}`);
      });

      return true;
    },
    [pushEntry],
  );

  const resync = useCallback(() => {
    socketRef.current?.emit("SYNC");
  }, []);

  // Between "we have a room to join" and Socket.IO's first connect event there
  // is no explicit state to set, so it is derived rather than assigned.
  const reportedConnection: ConnectionState =
    podId && teamId && connection === "idle" ? "connecting" : connection;

  return {
    connection: reportedConnection,
    state,
    entries,
    feedback,
    lastEvent,
    clockSkew,
    placeBid,
    resync,
    clearEntries,
    clearFeedback: useCallback(() => setFeedback(null), []),
  };
}

/** Seconds left on a server deadline, corrected for clock skew. */
export function secondsUntil(closesAt: string | null, clockSkew: number) {
  if (!closesAt) return null;
  const remaining = Date.parse(closesAt) - (Date.now() + clockSkew);
  return Math.max(0, Math.ceil(remaining / 1000));
}

/** Re-renders once a second so countdowns tick. */
export function useSecondTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);
}
