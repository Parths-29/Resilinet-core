import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import Simulator from './App';
import './index.css';

// App states: landing | intro | simulator
function Root() {
  const [screen, setScreen] = useState('landing');

  const handleLaunch = () => {
    setScreen('intro');
    // After intro animation, go to simulator
    setTimeout(() => setScreen('simulator'), 2800);
  };

  if (screen === 'landing') return <LandingPage onLaunch={handleLaunch} />;
  if (screen === 'intro') return <IntroScreen />;
  return <Simulator />;
}

const IntroScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(100, p + 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="intro-screen">
      <div className="intro-scanline" />
      <div className="intro-content">
        <div className="intro-icon">
          <svg viewBox="0 0 60 60" width="64" height="64">
            <circle cx="30" cy="30" r="28" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
            <circle cx="30" cy="30" r="20" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            <circle cx="30" cy="30" r="6" fill="#06b6d4" />
            <line x1="30" y1="2" x2="30" y2="58" stroke="#06b6d430" strokeWidth="1" />
            <line x1="2" y1="30" x2="58" y2="30" stroke="#06b6d430" strokeWidth="1" />
          </svg>
        </div>
        <h1 className="intro-title">RESILINET</h1>
        <div className="intro-sub">INITIALIZING NEURAL LATTICE...</div>
        <div className="intro-bar-wrap">
          <div className="intro-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="intro-progress-text">{progress}%</div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
