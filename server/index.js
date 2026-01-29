const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, "scores.json");

app.use(cors());
app.use(express.json());

const emptyScores = { 1: null, 2: null, 3: null };
let scores = { ...emptyScores };

const loadScores = () => {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      scores = { ...emptyScores, ...data };
    }
  } catch {
    scores = { ...emptyScores };
  }
};

const saveScores = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
};

loadScores();

app.get("/api/scores", (req, res) => {
  res.json({ scores });
});

app.post("/api/scores", (req, res) => {
  const level = Number(req.body?.level);
  const time = Number(req.body?.time);

  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return res.status(400).json({ error: "Invalid level" });
  }
  if (!Number.isFinite(time) || time <= 0) {
    return res.status(400).json({ error: "Invalid time" });
  }

  const current = scores[level];
  let updated = false;
  if (current === null || time < current) {
    scores[level] = Math.round(time * 100) / 100;
    updated = true;
    saveScores();
  }

  return res.json({ updated, bestTime: scores[level] });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});