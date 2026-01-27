const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { db, ready } = require("./db");

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

/* ✅ ADDED #1: /healthc */
app.get("/healthc", (req, res) => {
  res.json({ ok: true });
});

// Update/Create Record (keep top 3 per stage)
app.post("/api/score", (req, res) => {
  const { stage, name, time } = req.body;

  db.run(
    "INSERT INTO records (stage, name, time, created_at) VALUES (?, ?, ?, ?)",
    [stage, name, time, Date.now()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const insertedId = this.lastID;

      db.run(
        "DELETE FROM records WHERE stage = ? AND id NOT IN (SELECT id FROM records WHERE stage = ? ORDER BY time ASC, created_at ASC LIMIT 3)",
        [stage, stage],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          db.all(
            "SELECT id, name, time FROM records WHERE stage = ? ORDER BY time ASC, created_at ASC LIMIT 3",
            [stage],
            (err3, rows) => {
              if (err3) return res.status(500).json({ error: err3.message });
              const inTop3 = rows.some((r) => r.id === insertedId);
              return res.json({
                updated: inTop3,
                reason: inTop3 ? "top3" : "not_in_top3",
                message: inTop3
                  ? "New record stored in Top 3"
                  : "Time was not fast enough for Top 3",
              });
            }
          );
        }
      );
    }
  );
});

app.get("/api/records", (req, res) => {
  db.all(
    "SELECT stage, name, time FROM records ORDER BY stage ASC, time ASC, created_at ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ✅ ADDED #2: API 404 JSON (must be before React build + before app.get('*') ) */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
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

const PORT = process.env.PORT || 3000;
ready
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log("Server running on", PORT));
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
