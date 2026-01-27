# Maze Game - Full-Stack Web App (React + Express + SQLite)

A full-stack maze game with 3 stages and a Hall of Fame leaderboard.
Each stage measures the player's completion time, sends the result to the backend,
and the server stores only the best (fastest) record per stage.

---

## Live Demo (Render)
- Client (React): https://maze-game-2-1m4y.onrender.com
- Server (Express API): https://maze-game-1-hmxj.onrender.com

---

## Project Structure
- client/ - React frontend
- server/ - Express API + SQLite DB

---

## Local Setup
Prerequisites: Node.js 18+ and npm

### Server
```bash
cd server
npm install
npm start
```

### Client
```bash
cd client
npm install
npm start
```

Server API runs on http://localhost:3000.  
The React dev server starts on http://localhost:3000 if it's free, otherwise it will prompt to use http://localhost:3001.

---

## Environment Variables
Set this only if the client is deployed separately:
```
REACT_APP_API_URL=https://your-server.onrender.com
```
If not set, the client uses the same origin and `/api/*` routes.

---

## API Endpoints
Base URL (local API): http://localhost:3000  
Base URL (Render): https://maze-game-1-hmxj.onrender.com

### `GET /api/ping`
Health check.
Response:
```json
{ "ok": true, "ts": 1700000000000 }
```

### `GET /healthc`
Lightweight health check.
Response:
```json
{ "ok": true }
```

### `GET /api/records`
Returns the leaderboard (one row per stage), sorted by stage.
Response example:
```json
[
  { "stage": 1, "name": "Ibrahim", "time": 12.34 },
  { "stage": 2, "name": "Someone", "time": 18.21 }
]
```

### `POST /api/score`
Updates the best record for a stage (only if the new time is faster).
Request body:
```json
{ "stage": 1, "name": "Ibrahim", "time": 12.34 }
```
Validation rules:
- `stage` must be 1-3
- `name` must be 2-32 characters
- `time` must be a positive number

---

## Database
SQLite file: `server/maze_records.db`  
Table: `records (stage INTEGER PRIMARY KEY, name TEXT NOT NULL, time REAL NOT NULL)`
