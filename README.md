# Maze Game - Full-Stack Web App (React + Express + SQLite)

A full-stack maze game with 3 stages and a Hall of Fame leaderboard.
Each stage measures the player's completion time, sends the result to the backend,
and the server stores the Top 3 fastest records per stage.

---

## Live Demo (Render)
- https://maze-game-an6s.onrender.com (single service: UI + API under `/api`)

---

## Authors
- ibraheem hassda
- omer bendr
- aviv hod

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
Base URL (Render): same as the app link above

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
Returns the leaderboard (up to 3 rows per stage), sorted by stage and time.
Response example:
```json
[
  { "stage": 1, "name": "Ibrahim", "time": 12.34 },
  { "stage": 1, "name": "Omer", "time": 14.12 },
  { "stage": 1, "name": "Aviv", "time": 15.90 }
]
```

### `POST /api/score`
Updates records for a stage (keeps only the Top 3 fastest times).
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
Table: `records (id INTEGER PRIMARY KEY AUTOINCREMENT, stage INTEGER, name TEXT, time REAL, created_at INTEGER)`

---

## Deployment (Render)
Single service (Express serves React build):
1. Build the client: `cd client && npm run build`
2. Ensure the build output is in `client/build`
3. Start the server with `npm start` from the `server/` folder

If you deploy the client separately, set `REACT_APP_API_URL` to the server URL.
