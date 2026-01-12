import React, { useEffect, useRef, useState, useCallback } from 'react';

function Maze2({ onWin, playerName }) {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const cellSize = 25; // גודל תא קטן יותר כי המבוך גדול יותר

  const maze = [
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
  ];

  const exit = { x: 19, y: 19 };

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(timer);
  }, [startTime, isWon]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = '#1e40af'; // קירות כחול ים
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      });
    });

    // יציאה (סגול זוהר)
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(exit.x * cellSize + cellSize/2, exit.y * cellSize + cellSize/2, cellSize/3, 0, Math.PI*2);
    ctx.fill();

    // שחקן (טורקיז)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(player.x * cellSize + 5, player.y * cellSize + 5, cellSize - 10, cellSize - 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  useEffect(() => {
    if (isWon) return;
    const handleKey = (e) => {
      let { x, y } = player;
      if (e.key === 'ArrowUp' && maze[y-1][x] === 0) y--;
      if (e.key === 'ArrowDown' && maze[y+1][x] === 0) y++;
      if (e.key === 'ArrowLeft' && maze[y][x-1] === 0) x--;
      if (e.key === 'ArrowRight' && maze[y][x+1] === 0) x++;

      if (x !== player.x || y !== player.y) {
        setPlayer({ x, y });
        if (x === exit.x && y === exit.y) {
          setIsWon(true);
          onWin(parseFloat(elapsed));

        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, elapsed, onWin, isWon]);

  return (
    <div className="maze-container">
      <div className="timer-display">DEPTH TIME: {elapsed}s</div>
      <div className="maze-wrapper">
        <canvas ref={canvasRef} width={maze[0].length * cellSize} height={maze.length * cellSize} />
      </div>

      {isWon && (
        <div className="win-overlay" style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(2, 6, 23, 0.9)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', color: '#38bdf8'
        }}>
          <h2>Surface Reached!</h2>
          <p>Time: {elapsed}s</p>
        </div>
      )}
    </div>
  );
}

export default Maze2;
