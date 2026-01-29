import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import './styles.css';

function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('maze');
  const [robotAvatar, setRobotAvatar] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem("playerName") || "";
    const savedRoom = localStorage.getItem("roomId") || "maze";
    const savedRobotAvatar = localStorage.getItem("robotAvatarUrl") || "";
    setPlayerName(savedName);
    setRoomId(savedRoom);
    setRobotAvatar(savedRobotAvatar);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("playerName", playerName); } catch (e) {}
  }, [playerName]);

  useEffect(() => {
    try { localStorage.setItem("roomId", roomId); } catch (e) {}
  }, [roomId]);

  const resizeAvatar = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = reject;
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    reader.readAsDataURL(file);
  });

  const handleRobotAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeAvatar(file);
      setRobotAvatar(dataUrl);
      try { localStorage.setItem("robotAvatarUrl", dataUrl); } catch (err) {}
    } catch (err) {}
  };

  const clearRobotAvatar = () => {
    setRobotAvatar('');
    try { localStorage.removeItem("robotAvatarUrl"); } catch (e) {}
  };

  return (
    <div
      className="game-viewport"
      style={{ backgroundImage: "url('/bg-map.jpg')" }}
    >
      <div className="title-container">
        <h1>Maze 3D</h1>
        <p>Beat The Time</p>
      </div>

      <div className="map-layer">
        <Link to="/stage1" className="stone stone-1">
          <span className="stone-label">Level 1</span>
        </Link>

        <Link to="/stage2" className="stone stone-2">
          <span className="stone-label">Level 2</span>
        </Link>

        <Link to="/stage3" className="stone stone-3">
          <span className="stone-label">Level 3</span>
        </Link>
      </div>

      <div className="player-setup">
        <h3>Player Setup</h3>
        <label>
          Name
          <input
            type="text"
            value={playerName}
            placeholder="Your name"
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </label>
        <label>
          Room
          <input
            type="text"
            value={roomId}
            placeholder="maze"
            onChange={(e) => setRoomId(e.target.value)}
          />
        </label>

        <div className="avatar-row">
          <div className="avatar-preview" style={{ backgroundImage: robotAvatar ? `url(${robotAvatar})` : 'none' }}>
            {!robotAvatar && <span>Robot Head</span>}
          </div>
          <div className="avatar-controls">
            <input type="file" accept="image/*" onChange={handleRobotAvatarChange} />
            <button type="button" onClick={clearRobotAvatar}>Clear</button>
          </div>
        </div>
        <div className="avatar-note">Image appears only on the robot head.</div>
      </div>

      <Leaderboard />
    </div>
  );
}

export default Home;
