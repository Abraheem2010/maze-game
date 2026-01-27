const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "maze_records.db");
const db = new sqlite3.Database(dbPath);

const ensureIndex = (resolve, reject) => {
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_records_stage_time ON records(stage, time, created_at)",
    (err) => {
      if (err) return reject(err);
      resolve();
    }
  );
};

const ready = new Promise((resolve, reject) => {
  db.serialize(() => {
    db.all("PRAGMA table_info(records)", (err, columns) => {
      if (err) return reject(err);

      if (!columns || columns.length === 0) {
        db.run(
          "CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, stage INTEGER NOT NULL, name TEXT NOT NULL, time REAL NOT NULL, created_at INTEGER NOT NULL)",
          (err2) => {
            if (err2) return reject(err2);
            ensureIndex(resolve, reject);
          }
        );
        return;
      }

      const hasId = columns.some((c) => c.name === "id");
      if (!hasId) {
        db.run("ALTER TABLE records RENAME TO records_old", (err3) => {
          if (err3) return reject(err3);
          db.run(
            "CREATE TABLE records (id INTEGER PRIMARY KEY AUTOINCREMENT, stage INTEGER NOT NULL, name TEXT NOT NULL, time REAL NOT NULL, created_at INTEGER NOT NULL)",
            (err4) => {
              if (err4) return reject(err4);
              db.run(
                "INSERT INTO records (stage, name, time, created_at) SELECT stage, name, time, strftime('%s','now') FROM records_old",
                (err5) => {
                  if (err5) return reject(err5);
                  db.run("DROP TABLE records_old", (err6) => {
                    if (err6) return reject(err6);
                    ensureIndex(resolve, reject);
                  });
                }
              );
            }
          );
        });
        return;
      }

      ensureIndex(resolve, reject);
    });
  });
});

module.exports = { db, ready };
