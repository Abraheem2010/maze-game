import React, { useEffect, useRef, useState, useCallback } from "react";

const CELL_SIZE = 35;

// הגדרת המבוך (לוגיקה קיימת)
const MAZE1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,1,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const EXIT1 = { x: 13, y: 13 };

function Maze1({ onWin, playerName }) {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(timer);
  }, [startTime, isWon]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // רקע
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    MAZE1.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          // קירות
          const grad = ctx.createLinearGradient(
            x * CELL_SIZE, y * CELL_SIZE,
            (x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE
          );
          grad.addColorStop(0, "#34495e");
          grad.addColorStop(1, "#2c3e50");
          ctx.fillStyle = grad;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
          // שביל
          ctx.fillStyle = "#0d0d0d";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      });
    });

    // יציאה
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.arc(
      EXIT1.x * CELL_SIZE + CELL_SIZE / 2,
      EXIT1.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3, 0, Math.PI * 2
    );
    ctx.fill();

    // שחקן
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.roundRect(
      player.x * CELL_SIZE + 6,
      player.y * CELL_SIZE + 6,
      CELL_SIZE - 12, CELL_SIZE - 12, 5
    );
    ctx.fill();
  }, [player]);

  // לוגיקת תזוזה (משותפת למקלדת ולכפתורים)
  const handleMove = useCallback((dx, dy) => {
    if (isWon) return;

    setPlayer((prev) => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      if (MAZE1[newY][newX] !== 0) return prev; // קיר

      if (newX === EXIT1.x && newY === EXIT1.y) {
        setIsWon(true);
        const finalTime = Number(((Date.now() - startTime) / 1000).toFixed(2));
        onWin(finalTime);
      }

      return { x: newX, y: newY };
    });
  }, [isWon, onWin, startTime]);

  // האזנה למקלדת
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowUp") handleMove(0, -1);
      if (e.key === "ArrowDown") handleMove(0, 1);
      if (e.key === "ArrowLeft") handleMove(-1, 0);
      if (e.key === "ArrowRight") handleMove(1, 0);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  return (
    <div className="maze-container" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      <div className="timer-display" style={{ marginBottom: "10px" }}>TIME: {elapsed}s</div>

      <div className="maze-wrapper">
        <canvas
          ref={canvasRef}
          width={MAZE1[0].length * CELL_SIZE}
          height={MAZE1.length * CELL_SIZE}
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* --- כפתורי שליטה (משתמשים ב-CSS החדש) --- */}
      {!isWon && (
        <div className="controls-layout">
          {/* UP */}
          <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(0, -1);}}>▲</button>
          
          <div className="control-row">
            {/* LEFT */}
            <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(-1, 0);}}>◀</button>
            {/* DOWN */}
            <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(0, 1);}}>▼</button>
            {/* RIGHT */}
            <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(1, 0);}}>▶</button>
          </div>
        </div>
      )}

      {/* מסך ניצחון */}
      {isWon && (
        <div
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            borderRadius: "8px", color: "gold", textAlign: "center", zIndex: 10
          }}
        >
          <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>Well Done!</h2>
          <p style={{ fontSize: "1.5rem" }}>Time: {elapsed}s</p>
          <p style={{ fontSize: "1rem", marginTop: "10px" }}>Loading Level 2...</p>
        </div>
      )}
    </div>
  );
}

export default Maze1;