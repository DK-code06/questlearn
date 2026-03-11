import { useState } from 'react';
import Mascot from './Mascot'; // <--- We import your existing file here!
import './GameStyles.css';    // <--- We import the styles for the buttons

const GameInterface = () => {
  // Simple state to test the robot's mood
  const [mood, setMood] = useState<'idle' | 'happy' | 'sad'>('idle');

  return (
    <div className="game-container">
      
      {/* LEFT SIDE: Your Mascot */}
      <div className="avatar-section">
         <Mascot mood={mood} />
      </div>

      {/* RIGHT SIDE: The Colorful Buttons */}
      <div className="options-list">
        
        <button className="option-btn" onClick={() => setMood('happy')}>
          <span className="btn-icon">A</span> Click for Happy Robot
        </button>

        <button className="option-btn" onClick={() => setMood('sad')}>
          <span className="btn-icon">B</span> Click for Sad Robot
        </button>

        <button className="option-btn" onClick={() => setMood('idle')}>
          <span className="btn-icon">C</span> Click for Idle Robot
        </button>

        <button className="option-btn">
          <span className="btn-icon">D</span> System Reboot
        </button>

      </div>
    </div>
  );
};

export default GameInterface;