# Maze 3D - Full-Stack Web App (React + Express + SQLite)

A full-stack 3D (First-Person) maze game with 3 stages and a Hall of Fame leaderboard.
Each stage measures the player's completion time, sends the result to the backend,
and the server stores only the best (fastest) record per stage.

---

## Live Demo
- (Add your deployment link here)

---

## Requirements Checklist
- Express server with a DB (SQLite)
- Frontend + backend
- At least 2 screens (Home + Stage 1-3)
- Non-DOM logic on server (validation + best-record rule)

---

## Chosen Submission Option
Option 3: React client + Express server.

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
Server runs on http://localhost:3000

### Client
```bash
cd client
npm install
npm start
```

If port 3000 is already taken by the server, React will start on http://localhost:3001 (recommended).
The client proxies `/api/*` calls to the server via the `proxy` setting in `client/package.json`.

### Production-like (single service locally)
```bash
cd client
npm run build
cd ..\\server
npm start
```
Then open http://localhost:3000

---

## Environment Variables
Set this only if the client is deployed separately:
```
REACT_APP_API_URL=https://your-server.example.com
```
If not set, the client uses the same origin and `/api/*` routes.

---

## Controls (3D FPS)
- Click the game to start (Pointer Lock)
- Move: WASD or Arrow keys
- Look around: Mouse

---

## Multiplayer (Optional)
- Up to 3 players in the same `Room`
- Voice chat (WebRTC) + text chat
- Use the Mic button in the in-game panel to mute/unmute

---

## Robot Head Image
On the Home screen you can upload an image.
It appears on the robot head inside the 3D maze (and is shared with other players in the same room).

---

## API Endpoints
Base URL (local server): http://localhost:3000
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

---

## QA (Optional)
From the `server/` folder:
```powershell
powershell -ExecutionPolicy Bypass -File .\qa.ps1
```

---

## Deployment (Optional)
This project can run as a single service:
1. `cd client && npm run build`
2. Start the server from `server/` with `npm start`
