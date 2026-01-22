# Maze Game ????

A full-stack maze game with stages, timer, and a leaderboard (Hall of Fame).

## Live Demo
https://maze-game-an6s.onrender.com

## Features
- Multiple stages (Stage 1–3)
- Timer per stage
- Submit best time per stage
- Hall of Fame leaderboard

## Tech Stack
- Frontend: React (CRA)
- Backend: Node.js + Express
- DB: SQLite (local file)
- Deployment: Render

## API
- GET /api/records
- POST /api/score
  Body example: { "stage": 1, "name": "player", "time": 123 }

## Run Locally

Backend:
cd server
npm install
npm start
Server: http://localhost:3000

Frontend (new terminal):
cd client
npm install
npm start
If port 3000 is taken, React will suggest another port (usually 3001).

## Notes
- Local DB file is ignored by git: server/maze_records.db
