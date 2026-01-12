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

    // countdown הגיע ל-0
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

  const handleWin = async (finalTime) => {
    try {
      // אם אין API (למשל בפיתוח מקומי בלי env), נשלח לנתיב יחסי
      const base = API || "";
      await fetch(`${base}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 1,
          name: playerName,
          time: parseFloat(finalTime),
        }),
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setTimeout(() => navigate('/'), 3000);
    }
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
          />

          <br />

          <button className="start-btn" onClick={handleStart}>
            Enter the Maze
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
