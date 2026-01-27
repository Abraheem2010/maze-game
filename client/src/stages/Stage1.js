import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze1 from './Maze1';
import { buildApiUrl } from '../api';
import './Stages.css';
import './Stage1.css';

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
    const payload = { stage: 1, name, time };

    try { localStorage.setItem("records_dirty", String(Date.now())); } catch (e) {}

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon(buildApiUrl("/api/score"), blob);
      } else {
        fetch(buildApiUrl("/api/score"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {}

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
        <div className="countdown-overlay">{countdown}</div>
      )}

      {gameState === 'PLAYING' && (
        <div className="game-active">
          <Maze1 onWin={handleWin} />
        </div>
      )}
    </div>
  );
}

export default Stage1;
