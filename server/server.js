const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== DB (inside server folder) =====
const dbPath = path.join(__dirname, "maze_records.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      stage INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      time REAL NOT NULL
    )
  `);
});

// ===== API ROUTES =====
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

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

// אם מישהו פוגע ב־/api/משהו-לא-קיים — נחזיר 404 JSON ברור
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ===== SERVE REACT BUILD (if exists) =====
const clientBuildPath = path.resolve(__dirname, "..", "client", "build");
const indexHtml = path.join(clientBuildPath, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientBuildPath));

  // SPA fallback לכל דבר שהוא לא /api
  app.get("*", (req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  // אין build? עדיין שיהיה root ברור ולא "Cannot GET /"
  app.get("/", (req, res) => {
    res.send("Server is running ✅ (client build is missing)");
  });

  app.get("*", (req, res) => {
    res.status(404).send("Not Found");
  });
}

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on", PORT);
  console.log("DB:", dbPath);
  console.log("Client build exists?", fs.existsSync(indexHtml));
});
