const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "maze_records.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS records (stage INTEGER PRIMARY KEY, name TEXT NOT NULL, time REAL NOT NULL)"
  );
});

module.exports = db;
