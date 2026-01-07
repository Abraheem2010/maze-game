const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./maze_records.db');

app.use(cors());
app.use(express.json());

// יצירת טבלה בלי הגדרות סוג (הכי גמיש שיש)
db.run("CREATE TABLE IF NOT EXISTS scores (stage, name, time)");

app.post('/api/score', (req, res) => {
    const { stage, name, time } = req.body;
    
    // הדפסה לטרמינל כדי לראות מה מגיע מהמבוך
    console.log("Incoming Data:", { stage, name, time });

    db.run("INSERT INTO scores (stage, name, time) VALUES (?, ?, ?)", [stage, name, time], (err) => {
        if (err) return res.status(500).json(err.message);
        res.json({ message: "Saved" });
    });
});

app.get('/api/records', (req, res) => {
    db.all("SELECT * FROM scores", [], (err, rows) => {
        if (err) return res.status(500).json(err.message);
        res.json(rows);
    });
});

app.listen(3000, () => console.log("Server active on 3000"));