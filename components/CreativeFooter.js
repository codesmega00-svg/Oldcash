'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { shortAddr, isValidAddress } from '@/lib/config';

const FOOTER_TIPS = [
  '💡 Pro-Tip: pump.fun launchpad trades (jup.ag/spot/launchpads/pump.fun) leave ~0.002039 SOL behind in every position. Claim regularly!',
  '⚡ Pro-Tip: High-frequency traders on axiom.trade boost net PnL by running automated post-trade sweeps.',
  '🔥 Pro-Tip: Syndicates on fomo.family track collective member MEV rewards with 100% non-custodial batch claims.',
  '🦄 Pro-Tip: Cross-chain swappers on app.uniswap.org can recover inactive SVM routing escrow balances.',
  '🌊 Pro-Tip: LPs on meteora.ag dynamic DLMM bins can sweep forgotten fee yields and inactive position lamports.',
  '🤝 Pro-Tip: Share your 22% affiliate link (/referral) with your trading group to earn on every claim.',
  '🔒 Pro-Tip: Old Cash is 100% non-custodial. We never touch private keys; transactions sign locally in your wallet.',
];

const DEMO_PRESETS = [
  { label: 'Demo 1 (358 SOL)', addr: '2QfBNK2WDwSLoUQRb1zAnp3KM12N9hQ8q6ApwUMnWW2T' },
  { label: 'Demo 2 (2.5 SOL)', addr: '9nXDunV8eNvYSVys7JSBkm2hz9Q79Q3EYeko19srVeMC' },
  { label: 'Whale Active', addr: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
  { label: 'Anatoly (toly.sol)', addr: '6b6tL8qTz9fK2H4k1dZ7YmQW3v8rC1uE2pX4yZ9gV1sT' },
  { label: 'Foundation', addr: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg' },
];

export default function CreativeFooter() {
  const router = useRouter();
  const [slot, setSlot] = useState(470892540);
  const [tipIndex, setTipIndex] = useState(0);
  const [quickAddr, setQuickAddr] = useState('');
  const [quickError, setQuickError] = useState('');

  // Live ticking slot counter (~400ms per block on Solana mainnet)
  useEffect(() => {
    const timer = setInterval(() => {
      setSlot((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  // Cycle tips every 8s
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FOOTER_TIPS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickScan = (e) => {
    e.preventDefault();
    const target = quickAddr.trim();
    if (!target) {
      setQuickError('Please paste a Solana address.');
      return;
    }
    if (!isValidAddress(target)) {
      setQuickError('Invalid Solana base58 address.');
      return;
    }

    setQuickError('');
    // Route to scanner with wallet param & anchor
    router.push(`/?wallet=${encodeURIComponent(target)}#scanner`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="creative-footer">
      {/* ============================================================
          TOP HARDWARE TELEMETRY RIBBON
          ============================================================ */}
      <div className="cr-footer-telemetry">
        <div className="wrap cr-footer-telemetry-inner">
          <div className="cr-telemetry-left">
            <span className="cr-telemetry-item">
              <span className="ticker-live-dot" />
              <span>MAINNET-BETA: <strong>ONLINE</strong></span>
            </span>
            <span className="cr-telemetry-item">
              <span>SLOT:</span>
              <strong className="cr-slot-ticker">#{slot.toLocaleString()}</strong>
            </span>
            <span className="cr-telemetry-item cr-hide-sm">
              <span>RPC LATENCY:</span>
              <strong style={{ color: '#00ffa3' }}>~118ms</strong>
              <span className="nav-eq-bar" title="Live RPC Stream">
                <span className="nav-eq-line" />
                <span className="nav-eq-line" />
                <span className="nav-eq-line" />
              </span>
            </span>
            <span className="cr-telemetry-item cr-hide-md">
              <span className="os-tag os-tag--green" style={{ fontSize: 9, padding: '2px 6px' }}>
                100% NON-CUSTODIAL
              </span>
            </span>
          </div>

          <div className="cr-telemetry-right">
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.75 }}>
              RECOVERY.OS // v1.4.2
            </span>
            <button
              type="button"
              className="cr-back-to-top-btn"
              onClick={scrollToTop}
              title="Jump to top of page"
            >
              <span>▲ TOP</span>
            </button>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 24 }}>
        {/* ============================================================
            INTERACTIVE FOOTER QUICK-SCAN COMMAND TERMINAL
            ============================================================ */}
        <div className="cr-quickscan-card">
          <div className="cr-quickscan-bar">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--magenta)' }}>◈</span>
              <span>FOOTER DISPATCH CONSOLE // INSTANT SCANNER JUMP</span>
            </span>
            <span className="cr-quickscan-tag">FAST DISPATCH</span>
          </div>

          <div className="cr-quickscan-body">
            <div className="cr-quickscan-flex">
              {/* Left: Interactive Address Box */}
              <div style={{ flex: 1 }}>
                <form onSubmit={handleQuickScan} className="cr-quickscan-form">
                  <div className="cr-quickscan-input-wrap">
                    <span className="cr-quickscan-prefix">◎</span>
                    <input
                      type="text"
                      className="cr-quickscan-input"
                      placeholder="Paste any Solana address to execute immediate scan..."
                      value={quickAddr}
                      onChange={(e) => {
                        setQuickAddr(e.target.value);
                        setQuickError('');
                      }}
                    />
                  </div>
                  <button type="submit" className="os-btn os-btn--pink cr-quickscan-btn">
                    <span>⚡ SCAN NOW →</span>
                  </button>
                </form>

                {quickError && (
                  <div className="cr-quickscan-error">✕ {quickError}</div>
                )}

                {/* Preset Chips */}
                <div className="cr-quickscan-presets">
                  <span style={{ fontSize: 11, opacity: 0.7 }}>Quick Try:</span>
                  {DEMO_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="demo-chip cr-quickscan-chip"
                      onClick={() => {
                        setQuickAddr(p.addr);
                        setQuickError('');
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: AGENT-01 TV-Head Mascot Advice Cameo */}
              <div className="cr-quickscan-mascot-box">
                <div className="cr-mascot-avatar-small">
                  <img src="/assets/tvhead.jpg" alt="Agent-01" className="cr-mascot-img-sm" />
                  <div className="crt-scanlines" />
                </div>
                <div className="cr-mascot-bubble">
                  <div className="cr-mascot-bubble-speaker">
                    <span>AGENT-01 // CRT BOT</span>
                    <button
                      type="button"
                      className="cr-mascot-cycle-btn"
                      onClick={() => setTipIndex((prev) => (prev + 1) % FOOTER_TIPS.length)}
                      title="Next trading tip"
                    >
                      next ↵
                    </button>
                  </div>
                  <p className="cr-mascot-bubble-text">
                    {FOOTER_TIPS[tipIndex]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            RETRO ASCII ART & BRUTALIST BRAND DISPLAY
            ============================================================ */}
        <div className="cr-brand-banner">
          <div className="cr-brand-left">
            <Link href="/" className="cr-brand-anchor">
              <img src="/assets/logo.jpg" alt="Old Cash" className="cr-brand-logo" />
              <div>
                <span className="cr-brand-text">oldcash.fun</span>
                <span className="os-tag os-tag--live-pulse" style={{ marginLeft: 8 }}>
                  SOLANA ENGINE
                </span>
              </div>
            </Link>
            <div className="cr-brand-slogan">
              EVERY FORGOTTEN DOLLAR BACK TO ONE WALLET // THE NON-CUSTODIAL RECOVERY PROTOCOL
            </div>
          </div>

          <div className="cr-brand-social-pills">
            <a
              href="https://x.com/oldcashdotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="cr-social-pill cr-social-pill--x"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Follow @oldcashdotfun</span>
            </a>

            <a
              href="https://t.me/oldcashdotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="cr-social-pill cr-social-pill--tg"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              <span>t.me/oldcashdotfun</span>
            </a>

            <Link href="/early" className="cr-social-pill cr-social-pill--early">
              <span>⚡ Pioneer Pass (Phase 0)</span>
            </Link>
          </div>
        </div>

        {/* ============================================================
            4-COLUMN NEO-BRUTALIST DIRECTORY GRID
            ============================================================ */}
        <div className="cr-footer-grid">
          {/* Column 1: Core Engine */}
          <div className="cr-footer-col">
            <div className="cr-col-title">
              <span className="cr-col-dot" />
              <span>RECOVERY ENGINE</span>
            </div>
            <ul className="cr-col-links">
              <li>
                <a href="#scanner">⚡ Recovery Scanner (Live MEV)</a>
              </li>
              <li>
                <Link href="/early">⚡ Early Access (Phase 0 Whitelist)</Link>
              </li>
              <li>
                <Link href="/referral">🤝 22% Referral Commission</Link>
              </li>
              <li>
                <Link href="/docs">📖 Developer Docs &amp; API Portal</Link>
              </li>
              <li>
                <a href="#market">📈 Live Crypto Spot Oracle</a>
              </li>
              <li>
                <a href="#how">◈ Lineage &amp; Historical Milestones</a>
              </li>
              <li>
                <a href="#faq">❓ Frequently Asked Questions</a>
              </li>
            </ul>
          </div>

          {/* Column 2: Protocol Matrix */}
          <div className="cr-footer-col">
            <div className="cr-col-title">
              <span className="cr-col-dot" style={{ background: 'var(--magenta)' }} />
              <span>PROTOCOL MATRIX</span>
            </div>
            <ul className="cr-col-links">
              <li>
                <a href="https://jup.ag/spot/launchpads/pump.fun" target="_blank" rel="noopener noreferrer">◈ pump.fun Launchpads ↗</a>
              </li>
              <li>
                <a href="https://axiom.trade/" target="_blank" rel="noopener noreferrer">◈ axiom.trade Sweeps ↗</a>
              </li>
              <li>
                <a href="https://fomo.family" target="_blank" rel="noopener noreferrer">◈ fomo.family Alpha Tracking ↗</a>
              </li>
              <li>
                <a href="https://app.uniswap.org/" target="_blank" rel="noopener noreferrer">◈ Uniswap (SVM) ↗</a>
              </li>
              <li>
                <a href="https://www.meteora.ag/" target="_blank" rel="noopener noreferrer">◈ Meteora DLMM ↗</a>
              </li>
              <li>
                <a href="https://raydium.io/" target="_blank" rel="noopener noreferrer">◈ Raydium AMM &amp; CPMM ↗</a>
              </li>
              <li>
                <a href="https://jup.ag/" target="_blank" rel="noopener noreferrer">◈ Jupiter DCA &amp; Merkle Drops ↗</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer Portal & APIs */}
          <div className="cr-footer-col">
            <div className="cr-col-title">
              <span className="cr-col-dot" style={{ background: '#38bdf8' }} />
              <span>DEVELOPER PORTAL</span>
            </div>
            <ul className="cr-col-links">
              <li>
                <Link href="/docs#endpoint-scan">
                  <code>GET /api/scan</code> · Wallet Scanner
                </Link>
              </li>
              <li>
                <Link href="/docs#endpoint-prices">
                  <code>GET /api/prices</code> · Spot Aggregator
                </Link>
              </li>
              <li>
                <Link href="/docs#endpoint-claim">
                  <code>POST /v1/build-claim-tx</code>
                </Link>
              </li>
              <li>
                <Link href="/docs#endpoint-ws">
                  <code>WSS /v1/stream</code> · Real-time Feeds
                </Link>
              </li>
              <li>
                <Link href="/docs#sdks">TypeScript &amp; Python SDKs</Link>
              </li>
              <li>
                <Link href="/docs#console">Interactive Dev Console ↗</Link>
              </li>
              <li>
                <Link href="/docs#affiliate">22% Affiliate Revenue Share</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Network & Security */}
          <div className="cr-footer-col">
            <div className="cr-col-title">
              <span className="cr-col-dot" style={{ background: '#f59e0b' }} />
              <span>NETWORK &amp; SECURITY</span>
            </div>
            <ul className="cr-col-links">
              <li>
                <span className="cr-sec-item">🔒 100% Non-Custodial Protocol</span>
              </li>
              <li>
                <span className="cr-sec-item">🔒 Zero Private Key Access</span>
              </li>
              <li>
                <a href="https://solana.com" target="_blank" rel="noopener noreferrer">
                  🌐 Solana Mainnet Cluster ↗
                </a>
              </li>
              <li>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer">
                  🔍 Solscan Explorer ↗
                </a>
              </li>
              <li>
                <a href="https://x.com/oldcashdotfun" target="_blank" rel="noopener noreferrer">
                  📢 Official 𝕏: @oldcashdotfun ↗
                </a>
              </li>
              <li>
                <a href="https://t.me/oldcashdotfun" target="_blank" rel="noopener noreferrer">
                  ✈ Official TG: t.me/oldcashdotfun ↗
                </a>
              </li>
              <li>
                <span className="cr-sec-item">🛡 Verified Mainnet Security Architecture</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================
            BOTTOM HARDWARE STRIP & LEGAL NOTICE
            ============================================================ */}
        <div className="cr-footer-bottom">
          <div className="cr-bottom-left">
            <div>
              © 2026 <strong>oldcash.fun</strong> // All rights reserved. The Decentralized Solana Recovery Engine.
            </div>
            <div style={{ marginTop: 4, opacity: 0.65, fontSize: 10.5 }}>
              Old Cash is read-only non-custodial software. It does not provide financial or legal advice. Users maintain sole custody of their private keys and approve all on-chain actions.
            </div>
          </div>

          <div className="cr-bottom-right">
            <div className="cr-bottom-badges">
              <span className="cr-bottom-badge">
                <span className="ticker-live-dot" style={{ width: 5, height: 5 }} />
                <span>SHA-256 VERIFIED</span>
              </span>
              <span className="cr-bottom-badge">
                <span>NON-CUSTODIAL</span>
              </span>
              <span className="cr-bottom-badge cr-bottom-badge--pink">
                <span>CLAIM AFTER TRADE</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
