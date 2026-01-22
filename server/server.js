const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// לוג קצר לכל בקשה (עוזר להבין אם הבקשה בכלל מגיעה לשרת)
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - t0;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// DB בתוך server
const dbPath = path.join(__dirname, "maze_records.db");
const db = new sqlite3.Database(dbPath);

// Create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      stage INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      time REAL NOT NULL
    )
  `);
});

/* =======================
   HEALTH / PING
======================= */

// זה הראוט שהגדרת ב-Render Health Check Path
app.get("/healthc", (req, res) => {
  res.status(200).send("ok");
});

// עוד ראוט נוח לבדיקה ידנית
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* =======================
   API ROUTES
======================= */

// עדכון/יצירה של שיא
app.post("/api/score", (req, res) => {
  const stage = Number(req.body.stage);
  const name = String(req.body.name || "").trim();
  const time = Number(req.body.time);

  if (!Number.isFinite(stage) || stage <= 0) {
    return res.status(400).json({ error: "Invalid stage" });
  }
  if (name.length < 2) {
    return res.status(400).json({ error: "Invalid name" });
  }
  if (!Number.isFinite(time) || time <= 0) {
    return res.status(400).json({ error: "Invalid time" });
  }

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

// מחזירים את השיאים
app.get("/api/records", (req, res) => {
  db.all(
    "SELECT stage, name, time FROM records ORDER BY stage ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* =======================
   SERVE REACT BUILD (אם קיים)
======================= */
const clientBuildPath = path.resolve(__dirname, "..", "client", "build");
const indexHtml = path.join(clientBuildPath, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientBuildPath));

  // SPA fallback — אבל לא ל-/api
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (req, res) => {
    res.send("Server is running. Client build is missing.");
  });
}

// אם מישהו פוגע ב-API לא קיים — שיחזיר JSON ברור
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Server running on", PORT));
