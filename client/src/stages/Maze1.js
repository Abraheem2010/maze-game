import React, { useEffect, useRef, useState } from 'react';

function Maze1({ onWin, playerName }) {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isWon, setIsWon] = useState(false); // מצב ניצחון להצגת הודעה
  const cellSize = 35; 

  const maze = [
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
  
  const exit = { x: 13, y: 13 };

  useEffect(() => {
    if (isWon) return; // מפסיק את הטיימר בניצחון
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
    }, 50);
    return () => clearInterval(timer);
  }, [startTime, isWon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const grad = ctx.createLinearGradient(x*cellSize, y*cellSize, (x+1)*cellSize, (y+1)*cellSize);
          grad.addColorStop(0, '#34495e'); grad.addColorStop(1, '#2c3e50');
          ctx.fillStyle = grad;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#0d0d0d';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      });
    });

    // יציאה
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(exit.x * cellSize + cellSize/2, exit.y * cellSize + cellSize/2, cellSize/3, 0, Math.PI*2);
    ctx.fill();

    // שחקן
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(player.x * cellSize + 6, player.y * cellSize + 6, cellSize - 12, cellSize - 12, 5);
    ctx.fill();
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
          // שליחה לשרת והמתנה קלה לפני חזרה למפה
          setTimeout(() => onWin(parseFloat(elapsed)), 3000);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [player, elapsed, onWin, isWon]);

  return (
    <div className="maze-container" style={{ position: 'relative' }}>
      <div className="timer-display">TIME: {elapsed}s</div>
      <div className="maze-wrapper">
        <canvas ref={canvasRef} width={maze[0].length * cellSize} height={maze.length * cellSize} />
      </div>

      {isWon && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', borderRadius: '8px', color: 'gold'
        }}>
          <h2 style={{ fontSize: '2.5vw' }}>Well Done!</h2>
          <p style={{ fontSize: '1.8vw' }}>Stage completed in: {elapsed}s</p>
          <p style={{ fontSize: '1.2vw' }}>Returning to map...</p>
        </div>
      )}
    </div>
  );
}

export default Maze1;