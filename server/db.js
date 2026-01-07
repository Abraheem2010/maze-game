const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./maze_records.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS scores (stage INTEGER PRIMARY KEY, name TEXT, time REAL)");
});

module.exports = db;