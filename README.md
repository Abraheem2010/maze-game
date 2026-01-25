# 🧩 Maze Adventure (Maze Game)

A full-stack maze game with **3 stages**, a **timer per stage**, and a **Hall of Fame** leaderboard that stores the **best (fastest) time per stage**.

## 🌐 Deployed App (Render)
Play the game here:
https://maze-game-an6s.onrender.com

### How to open the game
1) Open the Render link in your browser  
2) You’ll see the **Stage Map** (Stage 1–3) and the **Hall of Fame**  
3) Click a stage to enter its maze and start playing

> Note: After inactivity, Render may “cold start”, so the first request can be slower. Refresh once and it should be fast.

## 🎮 How the Game Works
- 3 stages with increasing difficulty
- Enter a stage → the timer starts
- Reach the finish → the timer stops
- The client sends `{ stage, name, time }` to the server
- The server keeps **only the best (smallest) time** per stage
- The Home page shows the **Hall of Fame** (best record per stage)

## ✅ Backend Response Reasons (POST /api/score)
- `updated: true, reason: "first_record"` → first record for that stage
- `updated: true, reason: "new_record"` → new time is better, record updated
- `updated: false, reason: "not_better"` → new time is worse, record not updated

## 🏗️ Tech Stack
- Frontend: React (Create React App)
- Backend: Node.js + Express
- Database: SQLite
- Deployment: Render

## 📡 API
Base URL (Render): `https://maze-game-an6s.onrender.com`

- `GET /api/records` — returns the Hall of Fame (best record per stage)
- `POST /api/score` — submits a score and updates only if the new time is better

POST body example:
```json
{ "stage": 1, "name": "player", "time": 12.34 }
