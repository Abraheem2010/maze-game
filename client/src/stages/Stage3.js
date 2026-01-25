import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Maze3 from './Maze3';
import './Stages.css';
import './Stage3.css';

const API = process.env.REACT_APP_API_URL || "";

function Stage3() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('INPUT'); // INPUT | COUNTDOWN | PLAYING
  const [playerName, setPlayerName] = useState('');
  const [countdown, setCountdown] = useState(3);

  const [showWinPopup, setShowWinPopup] = useState(false);
  const [finalTime, setFinalTime] = useState(0);

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

    // שומרים שם כדי שגם השרת ושלבים אחרים יקבלו אותו
    try { localStorage.setItem("playerName", trimmed); } catch (e) {}

    setCountdown(3);
    setGameState('COUNTDOWN');
  };

  const handleWin = (winTime) => {
    const time =
      (typeof winTime === "number" && Number.isFinite(winTime))
        ? winTime
        : 0;

    // מעדיפים state, ואם ריק אז localStorage
    const name = (playerName || localStorage.getItem("playerName") || "player").trim();

    const payload = { stage: 3, name, time };

    // אופציונלי: פופאפ ניצחון (אם תרצה להשאיר)
    setFinalTime(time);
    setShowWinPopup(true);

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

    // חוזרים לבית אחרי רגע קטן כדי שהשחקן יראה ניצחון
    setTimeout(() => {
      navigate("/", { state: { playerName: name } });
    }, 700);
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleStart();
              }
            }}
          />

          <br />

          <button className="start-btn" onClick={handleStart}>
            Face the Heat
          </button>

          <button className="back-home-btn" type="button" onClick={() => navigate("/")}>
            Back to Home
          </button>
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

      {showWinPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#222',
              padding: '20px',
              borderRadius: '15px',
              border: '2px solid #ff4500',
              textAlign: 'center',
              maxWidth: '90%',
              width: '320px',
              boxShadow: '0 0 20px rgba(255, 69, 0, 0.5)',
              color: 'white'
            }}
          >
            <h2 style={{ color: '#ff4500', margin: '0 0 10px 0' }}>🔥 VICTORY!</h2>
            <p style={{ fontSize: '1.2rem', margin: '10px 0' }}>
              You made it in <br />
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{finalTime}</span> seconds!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stage3;
