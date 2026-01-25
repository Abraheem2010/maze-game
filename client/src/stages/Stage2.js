import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze2 from './Maze2';
import './Stages.css';
import './Stage2.css';

const API = process.env.REACT_APP_API_URL || "";

function Stage2() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('INPUT'); // INPUT | COUNTDOWN | PLAYING
  const [playerName, setPlayerName] = useState('');
  const [countdown, setCountdown] = useState(3);

  // טעינת השם האוטומטית
  useEffect(() => {
     const savedName = localStorage.getItem("playerName");
     if (savedName) setPlayerName(savedName);
  }, []);

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

    try { localStorage.setItem("playerName", trimmed); } catch (e) {}

    setCountdown(3);
    setGameState('COUNTDOWN');
  };

  const handleWin = (finalTime) => {
    const time =
      (typeof finalTime === "number" && Number.isFinite(finalTime))
        ? finalTime
        : 0;

    const name = (playerName || localStorage.getItem("playerName") || "player").trim();
    const payload = { stage: 2, name, time };

    try { localStorage.setItem("records_dirty", String(Date.now())); } catch (e) {}

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

    navigate("/stage3", { state: { playerName: name } });
  };

  return (
    <div className="stage-container stage2-theme">
      {gameState === 'INPUT' && (
        <div className="setup-card">
          <h2>Stage 2: The Deep Blue</h2>

          <input
            type="text"
            placeholder="Explorer Name..."
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
            Dive Down
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
        <div className="countdown-overlay">{countdown}</div>
      )}

      {gameState === 'PLAYING' && (
        <div className="game-active">
          <Maze2 onWin={handleWin} playerName={playerName} />
        </div>
      )}
    </div>
  );
}

export default Stage2;