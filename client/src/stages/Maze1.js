import React, { useEffect, useRef, useState } from "react";

const CELL_SIZE = 35;

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

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    MAZE1.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const grad = ctx.createLinearGradient(
            x * CELL_SIZE,
            y * CELL_SIZE,
            (x + 1) * CELL_SIZE,
            (y + 1) * CELL_SIZE
          );
          grad.addColorStop(0, "#34495e");
          grad.addColorStop(1, "#2c3e50");
          ctx.fillStyle = grad;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = "#0d0d0d";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      });
    });

    // exit
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.arc(
      EXIT1.x * CELL_SIZE + CELL_SIZE / 2,
      EXIT1.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // player
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.roundRect(
      player.x * CELL_SIZE + 6,
      player.y * CELL_SIZE + 6,
      CELL_SIZE - 12,
      CELL_SIZE - 12,
      5
    );
    ctx.fill();
  }, [player]);

  // Keydown (FIXED: no re-register on every move/time change)
  useEffect(() => {
    if (isWon) return;

    const handleKey = (e) => {
      setPlayer((prev) => {
        let { x, y } = prev;

        if (e.key === "ArrowUp" && MAZE1[y - 1][x] === 0) y--;
        if (e.key === "ArrowDown" && MAZE1[y + 1][x] === 0) y++;
        if (e.key === "ArrowLeft" && MAZE1[y][x - 1] === 0) x--;
        if (e.key === "ArrowRight" && MAZE1[y][x + 1] === 0) x++;

        // no move
        if (x === prev.x && y === prev.y) return prev;

        // reached exit
        if (x === EXIT1.x && y === EXIT1.y) {
          setIsWon(true);

          // compute final time directly (no dependency on "elapsed")
          const finalTime = Number(((Date.now() - startTime) / 1000).toFixed(2));
          onWin(finalTime);
        }

        return { x, y };
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isWon, onWin, startTime]);

  return (
    <div className="maze-container" style={{ position: "relative" }}>
      <div className="timer-display">TIME: {elapsed}s</div>

      <div className="maze-wrapper">
        <canvas
          ref={canvasRef}
          width={MAZE1[0].length * CELL_SIZE}
          height={MAZE1.length * CELL_SIZE}
        />
      </div>

      {isWon && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "8px",
            color: "gold",
          }}
        >
          <h2 style={{ fontSize: "2.5vw" }}>Well Done!</h2>
          <p style={{ fontSize: "1.8vw" }}>Stage completed in: {elapsed}s</p>
          <p style={{ fontSize: "1.2vw" }}>Loading next stage...</p>
        </div>
      )}
    </div>
  );
}

export default Maze1;
