const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./maze_records.db");

/* =======================
   DATABASE (BEST PER STAGE)
======================= */
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
   API ROUTES
======================= */
app.post("/api/score", (req, res) => {
  const stage = Number(req.body.stage);
  const name = String(req.body.name || "").trim();
  const time = Number(req.body.time);

  if (!Number.isFinite(stage) || stage <= 0) return res.status(400).json({ error: "Invalid stage" });
  if (name.length < 2) return res.status(400).json({ error: "Invalid name" });
  if (!Number.isFinite(time) || time <= 0) return res.status(400).json({ error: "Invalid time" });

  db.get("SELECT time FROM records WHERE stage = ?", [stage], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      db.run("INSERT INTO records (stage, name, time) VALUES (?, ?, ?)", [stage, name, time], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ updated: true, reason: "first_record" });
      });
      return;
    }

    if (time < row.time) {
      db.run("UPDATE records SET name = ?, time = ? WHERE stage = ?", [name, time, stage], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        return res.json({ updated: true, reason: "new_record" });
      });
    } else {
      return res.json({ updated: false, reason: "not_better" });
    }
  });
});

app.get("/api/records", (req, res) => {
  db.all("SELECT stage, name, time FROM records ORDER BY stage ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* =======================
   SERVE REACT BUILD (if exists)
======================= */
const clientBuildPath = path.join(__dirname, "..", "client", "build");
const indexPath = path.join(clientBuildPath, "index.html");

if (fs.existsSync(indexPath)) {
  app.use(express.static(clientBuildPath));

  // only for NON-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(indexPath);
  });
} else {
  // if you open / in browser and build doesn't exist yet
  app.get("/", (req, res) => {
    res.status(200).send("Server is running ✅ (React build not found yet)");
  });
}

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
