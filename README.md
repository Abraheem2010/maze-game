# Maze Game

A full-stack maze game with multiple stages, a timer, and a Hall of Fame leaderboard.

## Deployed App (Render)
https://maze-game-an6s.onrender.com

## Features
- 3 stages (Stage 1-3)
- Timer per stage
- Saves best time per stage (updates only if the new time is better)
- Hall of Fame leaderboard (best record per stage)

## Tech Stack
- Frontend: React (Create React App)
- Backend: Node.js + Express
- Database: SQLite
- Deployment: Render

## API
Base URL: https://maze-game-an6s.onrender.com

- GET /api/records
- POST /api/score
  Body example:
  { "stage": 1, "name": "player", "time": 12.34 }

## Project Structure
- client/  (React)
- server/  (Express + SQLite)

## Run Locally
(For local run only: localhost links work after you start the server/client as shown below.)
(For local run only: localhost links work after you start the server/client as shown below.)
Backend:
1) cd server
2) npm install
3) npm start
Server: http://localhost:3000

Frontend (new terminal):
1) cd client
2) npm install
3) npm start
If port 3000 is taken, React will use another port (usually 3001).

Note:
- client/package.json includes a proxy to http://localhost:3000
  so fetch("/api/...") from the client goes to the server locally.

## Notes
- Local DB file is ignored by git: server/maze_records.db
- On Render, the first request after inactivity can be slower (cold start). Then it becomes fast.
