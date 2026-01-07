import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze1 from './Maze1'; // המבוך נשאר ב-src
import './Stages.css'; // נטען קודם - השלד
import './Stage1.css'; // נטען שני - הצבעים והעיצוב המהמם

function Stage1() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('INPUT');
  const [playerName, setPlayerName] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('PLAYING');
      }
    }
  }, [gameState, countdown]);

  const handleStart = () => {
    if (playerName.trim().length < 2) return alert("Please enter a name");
    setGameState('COUNTDOWN');
  };

  const handleWin = (finalTime) => {
    fetch('http://127.0.0.1:3000/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        stage: 1, 
        name: playerName, 
        time: parseFloat(finalTime) 
      })
    })
    .then(() => {
      setTimeout(() => navigate('/'), 3000); 
    })
    .catch(err => console.error("Save error:", err));
  };

  return (
    /* שים לב לתוספת ה-Class כאן - זה מה שמחבר את העיצוב */
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
          <button className="start-btn" onClick={handleStart}>Enter the Maze</button>
        </div>
      )}

      {gameState === 'COUNTDOWN' && (
        <div className="countdown-overlay">{countdown > 0 ? countdown : "GO!"}</div>
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