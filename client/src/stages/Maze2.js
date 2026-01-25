import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

function Maze2({ onWin, playerName }) {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const cellSize = 25; // גודל תאים למבוך הגדול

  // המבוך הגדול המקורי (21 על 21)
  const maze = useMemo(() => [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ], []);

  const exit = useMemo(() => ({ x: 19, y: 19 }), []);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(timer);
  }, [startTime, isWon]);

  // ציור בצבעים המקוריים (כחול עמוק וטורקיז)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#020617"; // רקע כחול כהה
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = "#1e40af"; // קירות כחולים
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      });
    });

    // יציאה (סגול זוהר)
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(exit.x * cellSize + cellSize/2, exit.y * cellSize + cellSize/2, cellSize/3, 0, Math.PI*2);
    ctx.fill();

    // שחקן (טורקיז)
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(player.x * cellSize + 5, player.y * cellSize + 5, cellSize - 10, cellSize - 10);
  }, [player, maze, exit]);

  const handleMove = useCallback((dx, dy) => {
    if (isWon) return;
    setPlayer((prev) => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      if (maze[newY][newX] !== 0) return prev;
      if (newX === exit.x && newY === exit.y) {
        setIsWon(true);
        const finalTime = Number(((Date.now() - startTime) / 1000).toFixed(2));
        if (typeof onWin === 'function') {
           onWin(finalTime);
        }
      }
      return { x: newX, y: newY };
    });
  }, [isWon, maze, exit, onWin, startTime]);

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
    <div className="maze-container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="timer-display" style={{ marginBottom: "10px" }}>DEPTH TIME: {elapsed}s</div>

      <div className="maze-wrapper">
        <canvas
          ref={canvasRef}
          width={maze[0].length * cellSize}
          height={maze.length * cellSize}
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* כפתורי שליטה (משתמשים ב-CSS של Stage2) */}
      {!isWon && (
        <div className="controls-layout">
          <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(0, -1);}}>▲</button>
          <div className="control-row">
            <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(-1, 0);}}>◀</button>
            <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(0, 1);}}>▼</button>
            <button className="control-btn" onPointerDown={(e) => {e.preventDefault(); handleMove(1, 0);}}>▶</button>
          </div>
        </div>
      )}

      {isWon && (
        <div className="win-overlay" style={{
           position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
           backgroundColor: "rgba(2,6,23,0.9)", display: "flex", flexDirection: "column",
           justifyContent: "center", alignItems: "center", color: "#38bdf8"
        }}>
          <h2>Surface Reached!</h2>
          <p>Time: {elapsed}s</p>
        </div>
      )}
    </div>
  );
}

export default Maze2;