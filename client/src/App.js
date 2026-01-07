import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Stage1 from './stages/Stage1';
import Stage2 from './stages/Stage2';
import Stage3 from './stages/Stage3'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* דף הבית */}
        <Route path="/" element={<Home />} />

        {/* שלב 1 - האדום/חום (Parchment) */}
        <Route path="/stage1" element={<Stage1 />} />

        {/* שלב 2 - הכחול (Deep Blue) */}
        <Route path="/stage2" element={<Stage2 />} />

        {/* שלב 3 - (Lava/Locked) */}
        <Route path="/stage3" element={<Stage3 />} />
      </Routes>
    </Router>
  );
}

export default App;