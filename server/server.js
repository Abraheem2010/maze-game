const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./maze_records.db');

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

// create/update best record for stage
app.post('/api/score', (req, res) => {
  const stage = Number(req.body.stage);
  const name = String(req.body.name || '').trim();
  const time = Number(req.body.time);

  if (!Number.isFinite(stage) || stage <= 0) {
    return res.status(400).json({ error: 'Invalid stage' });
  }
  if (name.length < 2) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  if (!Number.isFinite(time) || time <= 0) {
    return res.status(400).json({ error: 'Invalid time' });
  }

  db.get('SELECT time FROM records WHERE stage = ?', [stage], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    // first record for this stage
    if (!row) {
      db.run(
        'INSERT INTO records (stage, name, time) VALUES (?, ?, ?)',
        [stage, name, time],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.json({ updated: true, reason: 'first_record' });
        }
      );
      return;
    }

    // update only if better time
    if (time < row.time) {
      db.run(
        'UPDATE records SET name = ?, time = ? WHERE stage = ?',
        [name, time, stage],
        (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          return res.json({ updated: true, reason: 'new_record' });
        }
      );
    } else {
      return res.json({ updated: false, reason: 'not_better' });
    }
  });
});

// return all best records
app.get('/api/records', (req, res) => {
  db.all(
    'SELECT stage, name, time FROM records ORDER BY stage ASC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* =======================
   SERVE REACT BUILD (ONLY IF EXISTS)
   - For Render Option 3: client is usually a separate Static Site,
     so this block will simply NOT run there (no client/build).
======================= */
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // any non-API route -> React
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on', PORT));
