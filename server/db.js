const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "maze_records.db");
const db = new sqlite3.Database(dbPath);

const ready = new Promise((resolve, reject) => {
  db.serialize(() => {
    db.all("PRAGMA table_info(records)", (err, columns) => {
      if (err) return reject(err);

      if (!columns || columns.length === 0) {
        db.run(
          "CREATE TABLE IF NOT EXISTS records (stage INTEGER PRIMARY KEY, name TEXT NOT NULL, time REAL NOT NULL)",
          (err2) => {
            if (err2) return reject(err2);
            resolve();
          }
        );
        return;
      }

      const hasId = columns.some((c) => c.name === "id");
      if (!hasId) return resolve();

      db.run("ALTER TABLE records RENAME TO records_old", (err3) => {
        if (err3) return reject(err3);
        db.run(
          "CREATE TABLE records (stage INTEGER PRIMARY KEY, name TEXT NOT NULL, time REAL NOT NULL)",
          (err4) => {
            if (err4) return reject(err4);
            db.run(
              "INSERT INTO records (stage, name, time) " +
                "SELECT r.stage, r.name, r.time " +
                "FROM records_old r " +
                "WHERE r.id IN (" +
                "  SELECT r2.id FROM records_old r2 " +
                "  WHERE r2.stage = r.stage " +
                "  ORDER BY r2.time ASC, r2.created_at ASC " +
                "  LIMIT 1" +
                ")",
              (err5) => {
                if (err5) return reject(err5);
                db.run("DROP TABLE records_old", (err6) => {
                  if (err6) return reject(err6);
                  resolve();
                });
              }
            );
          }
        );
      });
    });
  });
});

module.exports = { db, ready };
