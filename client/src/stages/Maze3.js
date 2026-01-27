import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

function Maze3({ onWin }) {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // מצב הקפאה

  const cellSize = 25;

  // מבוך 3 - 21x21
  const maze = useMemo(() => [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1],
    [1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ], []);

  const exit = { x: 19, y: 19 };

  // טיימר
  useEffect(() => {
    if (isWon || isPaused) return;
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(timer);
  }, [startTime, isWon, isPaused]);

  // ציור (לבה)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // רקע שחור
    ctx.fillStyle = "#030000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = "#1a0505"; // קירות כהים
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = "#ff000011"; // גבול אדום עדין
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      });
    });

    // יציאה (זוהר אדום)
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#ff0000";
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(exit.x * cellSize + cellSize/2, exit.y * cellSize + cellSize/2, cellSize/3, 0, Math.PI*2);
    ctx.fill();

    // שחקן (לבן זוהר)
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(player.x * cellSize + 6, player.y * cellSize + 6, cellSize - 12, cellSize - 12, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [player, maze, cellSize]);

  // תזוזה
  const handleMove = useCallback((dx, dy) => {
    if (isWon || isPaused) return;

    setPlayer((prev) => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      if (maze[newY][newX] !== 0) return prev;
      
      if (newX === exit.x && newY === exit.y) {
        setIsWon(true);
        const finalTime = Number(((Date.now() - startTime) / 1000).toFixed(2));
        onWin(finalTime);
      }
      return { x: newX, y: newY };
    });
  }, [isWon, isPaused, maze, onWin, startTime]);

  // מקלדת + רווח
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPaused(p => !p);
        return;
      }
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
      <div className="timer-display modern-timer" style={{marginBottom: "10px"}}>
        {isPaused ? "CORE PAUSED" : `CORE INTEGRITY: ${elapsed}s`}
      </div>

      <div className="maze-wrapper expert-frame" style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={maze[0].length * cellSize}
          height={maze.length * cellSize}
          style={{ maxWidth: "100%", height: "auto", display: "block", cursor: "pointer" }}
          onClick={() => !isWon && setIsPaused(p => !p)}
        />

        {isPaused && !isWon && (
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)", display: "flex", 
            justifyContent: "center", alignItems: "center", 
            color: "#ff4500", fontSize: "2rem", fontWeight: "900",
            textShadow: "0 0 10px red", pointerEvents: "none"
          }}>
            PAUSED
          </div>
        )}
      </div>

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
    </div>
  );
}

export default Maze3;