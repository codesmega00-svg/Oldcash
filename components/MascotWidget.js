'use client';
import { useState, useEffect } from 'react';

const MESSAGES = [
  '⚡ Engine Ready: Scan any Solana address to locate MEV Rewards & uncollected yields.',
  '💡 Pro tip: Completed trades hold guaranteed MEV rewards ready to claim.',
  '💰 Whale detected: Wallet GgGap6... holds 84.55 SOL in MEV Rewards on mainnet!',
  '🔒 100% Non-Custodial: You approve every batch inside Phantom or Solflare.',
  '🌐 Multi-Protocol Coverage: Jupiter, Kamino, Drift, Marinade, Jito & Orca monitored live.',
];

export default function MascotWidget() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => {
        setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
        setGlitch(false);
      }, 400);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const triggerNext = () => {
    setGlitch(true);
    setTimeout(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
      setGlitch(false);
    }, 250);
  };

  return (
    <aside
      className={`mascot-companion ${minimized ? 'mascot-companion--min' : ''} ${
        glitch ? 'mascot--glitch' : ''
      }`}
      aria-label="Old Cash Recovery Mascot"
    >
      {!minimized ? (
        <div className="mascot-card">
          <div className="mascot-header">
            <span className="mascot-badge">
              <span className="mascot-dot" /> AGENT RECOVERY BOT
            </span>
            <button
              type="button"
              className="mascot-close-btn"
              onClick={() => setMinimized(true)}
              title="Minimize agent"
            >
              _
            </button>
          </div>

          <div className="mascot-body" onClick={triggerNext} role="button" tabIndex={0}>
            <div className="mascot-avatar-frame">
              <img
                src="/assets/tvhead.jpg"
                alt="CRT Recovery Agent"
                className="mascot-avatar-img"
              />
              <div className="mascot-scanlines" />
            </div>

            <div className="mascot-dialogue">
              <div className="mascot-dialogue-speaker">AGENT-01 // CRT MONITOR</div>
              <p className="mascot-dialogue-text">{MESSAGES[msgIdx]}</p>
              <span className="mascot-click-hint">click to cycle tips ↵</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mascot-bubble-btn"
          onClick={() => setMinimized(false)}
          title="Open Recovery Agent"
        >
          <img
            src="/assets/tvhead.jpg"
            alt="Agent Bot"
            className="mascot-bubble-img"
          />
          <span className="mascot-bubble-ping" />
        </button>
      )}
    </aside>
  );
}
