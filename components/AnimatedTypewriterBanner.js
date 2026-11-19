'use client';
import { useState, useEffect } from 'react';

const MESSAGES = [
  'GLOBAL STATS: $990M+ unclaimed MEV & rewards across 1,000,000+ Solana wallets. Pro-tip: Claim after every trade!',
  'SCANNING SOLANA MAINNET: Locating unclosed positions with guaranteed MEV rewards...',
  'WHALE VERIFIED: Wallet GgGap6ti... unlocked 84.55 SOL ($18,160) across 3,460 accounts.',
  'UNWRAPPING WSOL: Claim MEV Reward & 100% of collateral from Wrapped SOL positions.',
  'PROTOCOL RADAR: Monitored Axiom Trade, FOMO Family, Pump.fun, Uniswap, Raydium, Kamino & Jupiter positions.',
  'ZERO RISK GUARANTEE: Read-only RPC inspection. Private keys NEVER leave your local device.',
  'BATCH TRANSACTION ENGINE: Claim MEV rewards from up to 25 positions in a single Solana transaction.',
];

export default function AnimatedTypewriterBanner() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIdx, setCharIdx] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const currentFull = MESSAGES[msgIdx];
    let timeout;

    if (!isDeleting && charIdx < currentFull.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayedText(currentFull.slice(0, charIdx + 1));
        setCharIdx((prev) => prev + 1);
      }, 28);
    } else if (!isDeleting && charIdx === currentFull.length) {
      // Pause at full text
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 3600);
    } else if (isDeleting && charIdx > 0) {
      // Deleting backwards rapidly
      timeout = setTimeout(() => {
        setDisplayedText(currentFull.slice(0, charIdx - 1));
        setCharIdx((prev) => prev - 1);
      }, 14);
    } else if (isDeleting && charIdx === 0) {
      // Switch to next message
      setIsDeleting(false);
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, msgIdx]);

  const handleSkip = () => {
    setIsDeleting(false);
    setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    setCharIdx(0);
    setDisplayedText('');
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 250);
  };

  return (
    <div
      className={`typewriter-terminal-box ${glitchActive ? 'terminal-glitch' : ''}`}
      onClick={handleSkip}
      title="Click to load next telemetry feed"
    >
      <div className="terminal-header-strip">
        <div className="terminal-dots">
          <span className="tdot tdot--red" />
          <span className="tdot tdot--yellow" />
          <span className="tdot tdot--green" />
        </div>
        <span className="terminal-telemetry-tag">
          <span className="telemetry-live-dot" /> LIVE TELEMETRY // SYSTEM FEED #{msgIdx + 1}
        </span>
        <span className="terminal-feed-hint">CLICK TO SKIP ↵</span>
      </div>

      <div className="terminal-prompt-line">
        <span className="terminal-prompt-symbol">&gt;&gt;</span>
        <span className="terminal-typed-content">
          {displayedText}
          <span className="terminal-cursor">█</span>
        </span>
      </div>
    </div>
  );
}
