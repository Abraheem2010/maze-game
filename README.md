# Maze Game — Full-Stack Web App (React + Express + SQLite)

A full-stack maze game with **3 stages** and a **Hall of Fame** leaderboard.  
Each stage measures the player's completion time, sends the result to the backend, and the server stores **only the best (fastest) record per stage**.

---

## Live Demo (Render)
- App (UI): https://maze-game-an6s.onrender.com
- API (records): https://maze-game-an6s.onrender.com/api/records

---

## What the App Does
1. The Home page shows **Stage 1–3** and the **Hall of Fame** table.
2. When a player finishes a stage:
   - the timer stops
   - the client sends a score to the server
   - the server updates the leaderboard **only if the new time is better**
3. The Hall of Fame displays the current best record per stage.

---

## Leaderboard Rule (Best Record Only)
- The database keeps **one record per stage**.
- A new score replaces the existing record **only when the time is smaller** (faster).
- Otherwise, the record stays unchanged.

---

## Tech Stack
- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** SQLite (file-based)

---

## API Endpoints
Base URL (local): `http://localhost:3000`  
Base URL (Render): `https://maze-game-an6s.onrender.com`

### `GET /api/records`
Returns the leaderboard (one row per stage), sorted by stage.
Response example:
```json
[
  { "stage": 1, "name": "Ibrahim", "time": 12.34 },
  { "stage": 2, "name": "Someone", "time": 18.21 }
]
