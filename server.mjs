/**
 * HackGrid server: Express in front, Next behind, Socket.IO on the same port.
 *
 * Layout:
 *   express app   -> /api/auction/*  the auction REST API (lib/auction-router.mjs)
 *                 -> everything else falls through to Next
 *   http.Server   -> shared by Express, Socket.IO and Next's HMR socket
 *   socket.io     -> /socket.io      the live bidding rooms (lib/auction-hub.mjs)
 *
 * Plain .mjs on purpose: this file does not go through the Next compiler, so it
 * has to be valid Node as written.
 */

import { createServer } from "node:http";
import { loadEnvFile } from "node:process";
import { parse } from "node:url";
import express from "express";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { createAuctionHub } from "./lib/auction-hub.mjs";
import { createAuctionRouter } from "./lib/auction-router.mjs";

try {
  loadEnvFile();
} catch {
  // Fine — the host may inject DATABASE_URL directly.
}

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "localhost";
const dev = process.env.NODE_ENV !== "production";

if (!process.env.DATABASE_URL) {
  console.error("[server] DATABASE_URL is not set. Add it to .env before starting.");
  process.exit(1);
}

// --------------------------------------------------------------------- setup

const app = express();
const httpServer = createServer(app);

const nextApp = next({ dev, hostname, port, httpServer });
const handle = nextApp.getRequestHandler();

const io = new SocketIOServer(httpServer, {
  path: "/socket.io",
  serveClient: false,
  // Engine.IO otherwise kills any upgrade it does not recognise, which would
  // take Next's HMR socket down with it in development.
  destroyUpgrade: false,
});

const hub = createAuctionHub({ connectionString: process.env.DATABASE_URL, io });

// The Next app runs in this same process, so its server actions can reach the
// hub through globalThis to announce that a capsule just started.
globalThis.__hackgridAuctionHub = hub;

// ----------------------------------------------------------------- middleware

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

// Only our own API is logged; Next already logs the requests it handles.
app.use("/api", (req, _res, nextFn) => {
  console.log(`[api] ${req.method} ${req.originalUrl}`);
  nextFn();
});

app.use("/api/auction", createAuctionRouter({ prisma: hub.prisma, hub, dev }));

// Anything the API did not claim belongs to Next: pages, assets, server actions.
app.use((req, res) => {
  handle(req, res, parse(req.url, true)).catch((error) => {
    console.error("[server] request failed:", error);
    if (!res.headersSent) res.status(500).end("Internal server error");
  });
});

// Express error handler. Express identifies it by its arity, so the fourth
// argument has to stay even though nothing calls it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error, _req, res, _nextFn) => {
  console.error("[api] unhandled:", error);
  if (res.headersSent) return;
  res.status(500).json({ status: "error", message: "Internal server error" });
});

// ------------------------------------------------------------------ socket.io

/**
 * Identity arrives in the handshake. It is checked here before the connection
 * is accepted, so a socket that reaches the connection handler is already known
 * to belong to the pod it claims.
 */
io.use((socket, nextFn) => {
  const { podId, teamId, email } = socket.handshake.auth ?? {};
  const parsedTeamId = Number.parseInt(teamId, 10);

  if (typeof podId !== "string" || !podId || !Number.isInteger(parsedTeamId)) {
    return nextFn(new Error("Missing or invalid podId / teamId."));
  }
  // Only the team lead bids (rulebook 8), so the room needs to know who is
  // asking, not just which team they are on.
  if (typeof email !== "string" || !email.includes("@")) {
    return nextFn(new Error("Missing the signed-in email."));
  }

  socket.data.requestedPodId = podId;
  socket.data.requestedTeamId = parsedTeamId;
  socket.data.requestedEmail = email.trim().toLowerCase();
  nextFn();
});

io.on("connection", async (socket) => {
  const podId = socket.data.requestedPodId;
  const teamId = socket.data.requestedTeamId;
  const email = socket.data.requestedEmail;

  let seated = false;
  try {
    seated = await hub.attach(socket, { podId, teamId, email });
  } catch (error) {
    console.error("[socket] attach failed:", error);
    socket.emit("ROOM_ERROR", { message: "Could not join the room." });
  }

  if (!seated) {
    socket.disconnect(true);
    return;
  }

  socket.on("SYNC", () => {
    hub
      .pushRoomState(podId, { only: socket })
      .catch((error) => console.error("[socket] sync failed:", error));
  });

  socket.on("BID", async (payload, ack) => {
    // Nothing from the client is trusted past this point — the amount is
    // parsed as an integer and the hub decides whether it is legal.
    const lotId = String(payload?.lotId ?? "");
    const amount = Number.parseInt(payload?.amount, 10);

    try {
      const result = await hub.handleBid(socket, { lotId, amount });
      if (typeof ack === "function") ack(result);
    } catch (error) {
      console.error("[socket] bid failed:", error);
      if (typeof ack === "function") {
        ack({
          ok: false,
          lotId,
          code: "UNKNOWN",
          reason: "Server could not record that bid. Try again.",
        });
      }
    }
  });

  socket.on("disconnect", () => {
    hub.detach(socket).catch((error) => console.error("[socket] detach failed:", error));
  });
});

// ------------------------------------------------------------------- listen

await nextApp.prepare();
await hub.hydrate().catch((error) => console.error("[server] hydrate failed:", error));

httpServer.listen(port, () => {
  console.log(
    `> HackGrid ready on http://${hostname}:${port} (${dev ? "development" : process.env.NODE_ENV})`,
  );
  console.log(`> Express API    http://${hostname}:${port}/api/auction`);
  console.log(`> Socket.IO      ws://${hostname}:${port}/socket.io`);
});
