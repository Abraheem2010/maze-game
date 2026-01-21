import React, { useEffect, useRef, useState, useCallback } from "react";

const MAZE3 = [
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
];

const EXIT3 = { x: 19, y: 19 };

function Maze3({ onWin }) {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const cellSize = 25;

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(timer);
  }, [startTime, isWon]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#030000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    MAZE3.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = "#1a0505";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = "#ff000011";
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      });
    });

    // exit
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#ff0000";
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(
      EXIT3.x * cellSize + cellSize / 2,
      EXIT3.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // player
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(
      player.x * cellSize + 6,
      player.y * cellSize + 6,
      cellSize - 12,
      cellSize - 12,
      4
    );
    ctx.fill();

    ctx.shadowBlur = 0;
  }, [player, cellSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (isWon) return;

    const handleKey = (e) => {
      let { x, y } = player;

      const moveMap = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };

      const move = moveMap[e.key];
      if (!move) return;

      const [dx, dy] = move;
      if (MAZE3[y + dy] && MAZE3[y + dy][x + dx] === 0) {
        x += dx;
        y += dy;

        setPlayer({ x, y });

        if (x === EXIT3.x && y === EXIT3.y) {
          setIsWon(true);
          onWin(parseFloat(elapsed));
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, elapsed, onWin, isWon]);

  return (
    <div className="maze-container">
      <div className="timer-display modern-timer">CORE INTEGRITY: {elapsed}s</div>

      <div className="maze-wrapper expert-frame">
        <canvas
          ref={canvasRef}
          width={MAZE3[0].length * cellSize}
          height={MAZE3.length * cellSize}
        />
      </div>
    </div>
  );
}

export default Maze3;
