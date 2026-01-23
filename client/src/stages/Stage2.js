import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze2 from './Maze2';
import { buildApiUrl } from '../api';
import './Stages.css';
import './Stage2.css';

function Stage2() {
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
    if (playerName.trim().length < 2) {
      alert("Please enter a name");
      return;
    }
    setCountdown(3);
    setGameState('COUNTDOWN');
  };

  const handleWin = (finalTime) => {
    // ✅ navigate timing is not blocked by saving
    setTimeout(() => navigate('/'), 3000);

    // ✅ save in background (no await)
    fetch(buildApiUrl("/api/score"), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 2,
        name: playerName,
        time: parseFloat(finalTime),
      }),
    }).catch((err) => {
      console.error("Save error:", err);
    });
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
        </div>
      )}

      {gameState === 'COUNTDOWN' && (
        <div className="countdown-overlay">
          {countdown > 0 ? countdown : "GO!"}
        </div>
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
