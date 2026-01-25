const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

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
/* === END CONTENT_TYPE_GUARD === */

app.use(express.json());

/* === JSON_PARSE_ERROR_HANDLER === */
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  return next(err);
});
/* === END JSON_PARSE_ERROR_HANDLER === */

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

  if (name.length < 2) {
    return res.status(400).json({ error: "Invalid name" });
  }

  if (name.length > MAX_NAME_LEN) {
    return res.status(400).json({ error: 'Name too long' });
  }

  if (!/^[\p{L}\p{N} _-]+$/u.test(name)) {
    return res.status(400).json({ error: "Invalid name" });
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
/* === END VALIDATE_SCORE_MW === */

// Logger
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - t0;
    console.log(req.method + " " + req.originalUrl + " -> " + res.statusCode + " (" + ms + "ms)");
  });
  next();
});

// DB inside server folder
const dbPath = path.join(__dirname, "maze_records.db");
const db = new sqlite3.Database(dbPath);

// Create table
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS records (stage INTEGER PRIMARY KEY, name TEXT NOT NULL, time REAL NOT NULL)");
});

/* =======================
   HEALTH / PING
======================= */

app.get("/healthc", (req, res) => {
  res.status(200).send("ok");
});

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* =======================
   API ROUTES
======================= */

// Update/Create Score
app.post("/api/score", (req, res) => {
  // After VALIDATE_SCORE_MW - already normalized
  const stage = req.body.stage;
  const name  = req.body.name;
  const time  = req.body.time;

  db.get("SELECT time FROM records WHERE stage = ?", [stage], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      db.run(
        "INSERT INTO records (stage, name, time) VALUES (?, ?, ?)",
        [stage, name, time],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.json({ updated: true, reason: "first_record" });
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
          return res.json({ updated: true, reason: "new_record" });
        }
      );
    } else {
      return res.json({ updated: false, reason: "not_better" });
    }
  });
});

// Get Records (Original Route)
app.get("/api/records", (req, res) => {
  db.all(
    "SELECT stage, name, time FROM records WHERE stage IN (1,2,3) ORDER BY stage ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// *** FIX: Leaderboard Alias for QA ***
app.get("/api/leaderboard", (req, res) => {
  db.all(
    "SELECT stage, name, time FROM records WHERE stage IN (1,2,3) ORDER BY stage ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* =======================
   SERVE REACT BUILD
======================= */
const clientBuildPath = path.resolve(__dirname, "..", "client", "build");
const indexHtml = path.join(clientBuildPath, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientBuildPath));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (req, res) => {
    res.send("Server is running. Client build is missing.");
  });
}

// 404 for API
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/* === GLOBAL_JSON_ERROR_HANDLER === */
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Server error" : (err.message || "Error")
  });
});
/* === END GLOBAL_JSON_ERROR_HANDLER === */

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Server running on", PORT));