import React from 'react';
import { Link } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import './styles.css';

function Home() {
  return (
    <div
      className="game-viewport"
      style={{ backgroundImage: "url('/bg-map.jpg')" }}
    >
      <div className="title-container">
        <h1>The Maze</h1>
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

      <Leaderboard />
    </div>
  );
}

export default Home;
