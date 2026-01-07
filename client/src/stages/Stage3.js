import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze3 from './Maze3';
import './Stages.css';
import './Stage3.css';

function Stage3() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('INPUT');
  const [playerName, setPlayerName] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [finalTime, setFinalTime] = useState(0);

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

  const handleWin = (time) => {
    // 1. קודם כל מציגים את הפופ-אפ (מיידי!)
    setFinalTime(time);
    setShowWinPopup(true);

    // 2. רק אז שולחים לשרת ברקע
    fetch('http://127.0.0.1:3000/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 3, name: playerName, time: time })
    })
    .catch(err => console.error(err));

    // 3. ניווט אחרי זמן קבוע מראש (3 שניות)
    setTimeout(() => navigate('/'), 3000);
  };

  return (
    <div className="stage-container stage3-theme" style={{ position: 'relative', overflow: 'hidden' }}>
      {gameState === 'INPUT' && (
        <div className="setup-card">
          <h2>Stage 3: The Lava Core</h2>
          <input 
            type="text" 
            placeholder="Adventurer Name..." 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <br />
          <button className="start-btn" onClick={handleStart}>Face the Heat</button>
        </div>
      )}

      {gameState === 'COUNTDOWN' && (
        <div className="countdown-overlay">{countdown > 0 ? countdown : "BURN!"}</div>
      )}

      {gameState === 'PLAYING' && (
        <div className="game-active">
          <Maze3 onWin={handleWin} playerName={playerName} />
        </div>
      )}

      {/* פופ-אפ קומפקטי וממורכז */}
      {showWinPopup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#222',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid #ff4500',
            textAlign: 'center',
            maxWidth: '90%',
            width: '320px', // גודל קומפקטי
            boxShadow: '0 0 20px rgba(255, 69, 0, 0.5)',
            color: 'white'
          }}>
            <h2 style={{ color: '#ff4500', margin: '0 0 10px 0' }}>🏆 VICTORY!</h2>
            <p style={{ fontSize: '1.2rem', margin: '10px 0' }}>
              Wow! You made it within <br/>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{finalTime}</span> seconds!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stage3;