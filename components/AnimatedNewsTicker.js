'use client';
import { useState, useEffect } from 'react';

const NEWS_ITEMS = [
  'Solana Telemetry: $990M+ Unclaimed Across 1,000,000+ Wallets · Pro-Tip: Claim After Every Trade!',
  'Recovery Engine Live · Read-only RPC · 0 Capital Required',
  'Whale Detected: 84.55 SOL ($18,160) Found in Single Wallet GgGap6...',
  'Solana MEV Rewards: Dynamic Yield Claimed Per Trade',
  'Protocols Synced: Pump.fun, Raydium, Axio, Terminal, Uniswap, Kamino & Jupiter',
  'Non-Custodial Architecture: All Transactions Signed In Your Wallet',
  'Over 3,460 MEV Positions Claimed in 1 Batch Transaction',
];

export default function AnimatedNewsTicker() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
        setAnimating(false);
      }, 350);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animated-news-container">
      <span className={`animated-news-text ${animating ? 'news-text--exit' : 'news-text--enter'}`}>
        {NEWS_ITEMS[index]}
      </span>
    </div>
  );
}
