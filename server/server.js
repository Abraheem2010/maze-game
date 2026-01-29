const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { WebSocketServer } = require("ws");
const db = require("./db");

const app = express();

// Middleware
app.use(cors());

/* === CONTENT_TYPE_GUARD === */
app.use("/api/score", (req, res, next) => {
  if (req.method === "POST") {
    const ct = (req.headers["content-type"] || "").toLowerCase();
    if (!ct.includes("application/json")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
  }
  next();
});

app.use(express.json());

/* === JSON_PARSE_ERROR_HANDLER === */
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  return next(err);
});

/* === VALIDATE_SCORE_MW (single source of truth) === */
const MAX_NAME_LEN = 32;

app.use("/api/score", (req, res, next) => {
  if (req.method !== "POST") return next();

  const stage = Number(req.body?.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 3) {
    return res.status(400).json({ error: "Invalid stage" });
  }

  const n = req.body?.name;
  if (typeof n !== "string") {
    return res.status(400).json({ error: "Invalid name" });
  }
  const name = n.trim();

  if (name.length < 2 || name.length > MAX_NAME_LEN) {
    return res.status(400).json({ error: "Invalid name length" });
  }

  if (!/^[\p{L}\p{N} _-]+$/u.test(name)) {
    return res.status(400).json({ error: "Invalid name characters" });
  }

  const time = Number(req.body?.time);
  if (!Number.isFinite(time) || time <= 0) {
    return res.status(400).json({ error: "Invalid time" });
  }

  req.body.stage = stage;
  req.body.name = name;
  req.body.time = Math.round(time * 100) / 100;

  next();
});

// Logger
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - t0;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// DB Setup (initialized in db.js)

/* =======================
   API ROUTES
======================= */

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get("/healthc", (req, res) => {
  res.json({ ok: true });
});

// Update/Create World Record
app.post("/api/score", (req, res) => {
  const { stage, name, time } = req.body;

  db.get("SELECT name, time FROM records WHERE stage = ?", [stage], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      db.run(
        "INSERT INTO records (stage, name, time) VALUES (?, ?, ?)",
        [stage, name, time],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.json({ updated: true, reason: "first_record", message: "World Record set!" });
        }
      );
      return;
    }

    if (time < row.time) {
      db.run(
        "UPDATE records SET name = ?, time = ? WHERE stage = ?",
        [name, time, stage],
        (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          return res.json({
            updated: true,
            reason: "new_world_record",
            message: `New World Record! You beat ${row.name}`,
          });
        }
      );
    } else {
      return res.json({
        updated: false,
        reason: "not_better",
        message: `Current record is ${row.time}s by ${row.name}`,
      });
    }
  });
});

app.get("/api/records", (req, res) => {
  db.all("SELECT stage, name, time FROM records ORDER BY stage ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* API 404 JSON */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/* =======================
   WEBSOCKET (CHAT + VOICE SIGNALING)
======================= */
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { clients: new Map() });
  }
  return rooms.get(roomId);
}

function sendJson(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(room, payload, exceptId = null) {
  room.clients.forEach((client, id) => {
    if (exceptId && id === exceptId) return;
    sendJson(client.ws, payload);
  });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const client = { id: null, roomId: null, name: null, avatar: null, stage: null, ws };

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "join") {
      const roomId = String(msg.room || "maze");
      const name = String(msg.name || "Player").slice(0, 32);
      const avatar = typeof msg.avatar === "string" ? msg.avatar : "";
      const stage = Number.isFinite(msg.stage) ? msg.stage : null;

      const room = getRoom(roomId);
      if (room.clients.size >= 3) {
        sendJson(ws, { type: "room-full" });
        ws.close();
        return;
      }

      client.id = Math.random().toString(36).slice(2, 10);
      client.roomId = roomId;
      client.name = name;
      client.avatar = avatar;
      client.stage = stage;

      room.clients.set(client.id, client);

      const peers = Array.from(room.clients.values())
        .filter((c) => c.id !== client.id)
        .map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, stage: c.stage }));

      sendJson(ws, { type: "welcome", id: client.id, peers });
      broadcast(room, { type: "peer-joined", peer: { id: client.id, name, avatar, stage } }, client.id);
      return;
    }

    if (!client.id || !client.roomId) return;
    const room = getRoom(client.roomId);

    if (msg.type === "signal") {
      const targetId = msg.to;
      const target = room.clients.get(targetId);
      if (target) {
        sendJson(target.ws, { type: "signal", from: client.id, signal: msg.signal });
      }
      return;
    }

    if (msg.type === "chat") {
      const text = String(msg.text || "").slice(0, 500);
      if (!text) return;
      broadcast(room, {
        type: "chat",
        id: client.id,
        name: client.name,
        text,
        ts: Date.now(),
      });
      return;
    }

    if (msg.type === "position") {
      const pos = msg.pos || {};
      const stage = Number.isFinite(msg.stage) ? msg.stage : client.stage;
      client.stage = stage;
      broadcast(room, { type: "position", id: client.id, pos, stage }, client.id);
      return;
    }

    if (msg.type === "update") {
      client.name = String(msg.name || client.name || "Player").slice(0, 32);
      if (typeof msg.avatar === "string") client.avatar = msg.avatar;
      if (Number.isFinite(msg.stage)) client.stage = msg.stage;
      broadcast(
        room,
        {
          type: "peer-updated",
          peer: { id: client.id, name: client.name, avatar: client.avatar, stage: client.stage },
        },
        client.id
      );
    }
  });

  ws.on("close", () => {
    if (!client.id || !client.roomId) return;
    const room = rooms.get(client.roomId);
    if (!room) return;
    room.clients.delete(client.id);
    broadcast(room, { type: "peer-left", id: client.id });
    if (room.clients.size === 0) {
      rooms.delete(client.roomId);
    }
  });
});

/* =======================
   SERVE REACT BUILD
======================= */
const clientBuildPath = path.resolve(__dirname, "..", "client", "build");
const indexHtml = path.join(clientBuildPath, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(indexHtml);
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ error: status === 500 ? "Server error" : err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log("Server running on", PORT));
