import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze1 from './Maze1';
import './Stages.css';
import './Stage1.css';

const API = process.env.REACT_APP_API_URL || "";

function Stage1() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('INPUT'); // INPUT | COUNTDOWN | PLAYING
  const [playerName, setPlayerName] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (gameState !== 'COUNTDOWN') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }

    setGameState('PLAYING');
  }, [gameState, countdown]);

  const handleStart = () => {
    const trimmed = playerName.trim();

    if (trimmed.length < 2) {
      alert("Please enter a name");
      return;
    }

    // שמירה של השם כדי שגם stages הבאים והשרת יקבלו אותו
    try { localStorage.setItem("playerName", trimmed); } catch (e) {}

    setCountdown(3);
    setGameState('COUNTDOWN');
  };

  const handleWin = (finalTime) => {
    const time =
      (typeof finalTime === "number" && Number.isFinite(finalTime))
        ? finalTime
        : 0;

    // מעדיפים את השם מה-state, ואם אין אז מה-localStorage
    const name = (playerName || localStorage.getItem("playerName") || "player").trim();

    const payload = { stage: 1, name, time };

    // mark leaderboard dirty
    try { localStorage.setItem("records_dirty", String(Date.now())); } catch (e) {}

    // save in background (NO await)
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon(`${API}/api/score`, blob);
      } else {
        fetch(`${API}/api/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {}

    // instant next stage
    navigate("/stage2", { state: { playerName: name } });
  };

  return (
    <div className="stage-container stage1-theme">
      {gameState === 'INPUT' && (
        <div className="setup-card">
          <h2>Identify Yourself</h2>

          <input
            type="text"
            placeholder="Adventurer Name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleStart();
              }
            }}
          />

          <br />

          <button className="start-btn" onClick={handleStart}>
            Enter the Maze
          </button>

          <button
            className="back-home-btn"
            type="button"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      )}

      {gameState === 'COUNTDOWN' && (
        <div className="countdown-overlay">
          {countdown > 0 ? countdown : "GO!"}
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="game-active">
          <div className="maze-wrapper">
            <Maze1 onWin={handleWin} playerName={playerName} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Stage1;
