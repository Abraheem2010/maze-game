const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./maze_records.db');

app.use(cors());
app.use(express.json());

/* =======================
   DATABASE
======================= */
db.run("CREATE TABLE IF NOT EXISTS scores (stage, name, time)");

/* =======================
   API ROUTES
======================= */
app.post('/api/score', (req, res) => {
  const { stage, name, time } = req.body;

  db.run(
    "INSERT INTO scores (stage, name, time) VALUES (?, ?, ?)",
    [stage, name, time],
    (err) => {
      if (err) return res.status(500).json(err.message);
      res.json({ message: "Saved" });
    }
  );
});

app.get('/api/records', (req, res) => {
  db.all("SELECT * FROM scores", [], (err, rows) => {
    if (err) return res.status(500).json(err.message);
    res.json(rows);
  });
});

/* =======================
   SERVE REACT BUILD
======================= */
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');

app.use(express.static(clientBuildPath));

// 👇 זה הפיקס הקריטי (במקום app.get('*'))
app.get('/*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
