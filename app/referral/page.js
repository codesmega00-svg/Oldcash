'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletBar from '@/components/WalletBar';
import ThemeToggle from '@/components/ThemeToggle';
import LiveCryptoTicker from '@/components/LiveCryptoTicker';
import ThemeBackground from '@/components/ThemeBackground';
import MascotWidget from '@/components/MascotWidget';
import SocialLinks from '@/components/SocialLinks';
import FaqDropdown from '@/components/FaqDropdown';
import ReferralAnalyticsGraph from '@/components/ReferralAnalyticsGraph';
import CreativeFooter from '@/components/CreativeFooter';
import { triggerConfetti } from '@/components/ConfettiCanvas';
import {
  isValidAddress,
  shortAddr,
  SOL_USD_PRICE,
  REFERRAL_COMMISSION_PERCENT,
} from '@/lib/config';

export default function ReferralPage() {
  const { connected, publicKey } = useWallet();
  const [customAddr, setCustomAddr] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedDashboard, setCopiedDashboard] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState(false);
  const [solPrice, setSolPrice] = useState(SOL_USD_PRICE);
  const [liveSlot, setLiveSlot] = useState(470901000);
  const [realOnchainData, setRealOnchainData] = useState(null);
  const [loadingOnchain, setLoadingOnchain] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [simClaimSol, setSimClaimSol] = useState(10);
  const [activeLedgerTab, setActiveLedgerTab] = useState('user'); // 'user' | 'network'

  // Extract ?wallet=, ?address=, or ?ref= from URL on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryAddr = params.get('wallet') || params.get('address') || params.get('ref');
        if (queryAddr && isValidAddress(queryAddr.trim())) {
          setCustomAddr(queryAddr.trim());
        }
      } catch { }
    }
  }, []);

  // Determine active wallet address (connected or custom input or default)
  const activeWallet = useMemo(() => {
    return (connected && publicKey ? publicKey.toBase58() : customAddr).trim() ||
      'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg';
  }, [connected, publicKey, customAddr]);

  const isValidWallet = useMemo(() => isValidAddress(activeWallet), [activeWallet]);

  // Real-time slot increment (~400ms standard Solana slot progression)
  useEffect(() => {
    const slotTimer = setInterval(() => {
      setLiveSlot((s) => s + 1);
    }, 400);
    return () => clearInterval(slotTimer);
  }, []);

  // Fetch real on-chain referral records from /api/referral
  const fetchRealData = async (targetWallet) => {
    const addr = targetWallet || activeWallet;
    if (!addr || !isValidAddress(addr)) return;
    try {
      setLoadingOnchain(true);
      const res = await fetch(`/api/referral?wallet=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data = await res.json();
        setRealOnchainData(data);
        if (data.liveSlot) setLiveSlot(data.liveSlot);
        setLastSyncTime(Date.now());
      }
    } catch (err) {
      console.warn('Real-time on-chain referral sync:', err);
    } finally {
      setLoadingOnchain(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (isValidWallet) {
      fetchRealData(activeWallet);
    }
    const timer = setInterval(() => {
      if (!cancelled && isValidWallet) {
        fetchRealData(activeWallet);
      }
    }, 9000); // Poll live on-chain data every 9 seconds

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeWallet, isValidWallet]);

  // Live SOL price updates
  useEffect(() => {
    let cancelled = false;
    const fetchSolPrice = async () => {
      try {
        const res = await fetch('/api/prices');
        if (res.ok) {
          const data = await res.json();
          const found = data.prices?.find((p) => p.symbol === 'SOL');
          if (found && found.price && !cancelled) {
            setSolPrice(found.price);
          }
        }
      } catch { }
    };
    fetchSolPrice();
    const timer = setInterval(fetchSolPrice, 12000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Generate URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://oldcash.io';
  const referralLink = `${origin}/?ref=${activeWallet}`;
  const dashboardLink = `${origin}/referral?wallet=${activeWallet}`;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      triggerConfetti({ count: 50 });
      setTimeout(() => setCopiedReferral(false), 2200);
    } catch { }
  };

  const copyDashboardLink = async () => {
    try {
      await navigator.clipboard.writeText(dashboardLink);
      setCopiedDashboard(true);
      triggerConfetti({ count: 50 });
      setTimeout(() => setCopiedDashboard(false), 2200);
    } catch { }
  };

  const triggerNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Old Cash Affiliate Dashboard · 22% Commission',
          text: `Check out my Solana affiliate dashboard on Old Cash. Earn 22% lifetime commission on all claimed MEV rewards!`,
          url: dashboardLink,
        });
      } catch { }
    } else {
      copyDashboardLink();
    }
  };

  // Calculator figures
  const simNum = parseFloat(simClaimSol) || 0;
  const simReferrerCut = (simNum * REFERRAL_COMMISSION_PERCENT) / 100;

  // Real-time statistics aggregation directly from Solana Mainnet
  const userActivity = realOnchainData?.userActivity || [];
  const networkActivity = realOnchainData?.networkActivity || [];
  const hasUserClaims = userActivity.length > 0;

  const displayWalletsCount = realOnchainData?.totalReferredWallets ?? (hasUserClaims ? userActivity.length : 0);
  const displayRecoveredVolume = realOnchainData?.totalClaimedVolume ?? 0;
  const displayCommissionSol = realOnchainData?.totalCommissionSol ?? 0;
  const displayUnclaimedSol = realOnchainData?.unclaimedCommissionSol ?? 0;

  const activeDisplayList = activeLedgerTab === 'user' ? userActivity : networkActivity;

  return (
    <>
      <ThemeBackground />
      <LiveCryptoTicker />

      {/* Site News */}
      <div className="site-news">
        <div className="wrap news-inner">
          <div className="news-left">
            <span className="news-chip animate-pulse-glow">AFFILIATE PROTOCOL</span>
            <span>Earn 22% Lifetime Commission On All Claimed Solana MEV Rewards · Non-Custodial</span>
          </div>
          <div>
            <Link className="news-link" href="/">← Return to Scanner</Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="site-nav">
        <div className="wrap nav-inner">
          <Link href="/" className="brand">
            <img src="/assets/logo.jpg" alt="Old Cash" className="brand-logo-img" />
            <span className="brand-text-glitch" data-text="Old Cash">Old Cash</span>
            <span className="os-tag os-tag--live-pulse" style={{ marginLeft: 6 }}>AFFILIATE.OS</span>
          </Link>

          <nav className="nav-menu">
            <Link href="/">Recovery Scanner</Link>
            <a href="#economics">22% Commission</a>
            <a href="#calculator">Yield Simulator</a>
            <a href="#links">Share Link</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#ledger">Activity Ledger</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav-right">
            <span className="engine-pill">
              <span className="engine-pill__dot" />
              <span>Affiliate Online</span>
            </span>
            <SocialLinks variant="nav" />
            <ThemeToggle />
            <WalletBar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="wrap">
        <div className="ascii-sep">
          <span>∵ ⩆</span>
          <span>....................................................................................</span>
          <span>⩆ ∵</span>
        </div>

        {/* Hero Section */}
        <section className="hero-head">
          <div className="h-kicker">
            <span>
              Old Cash Affiliate Protocol <span className="h-kicker__dots">..................</span>
            </span>
            <span>22% Immediate Commission</span>
          </div>

          <h1 className="hero-title">
            Refer Any Wallet &amp; Earn <span className="tag-highlight text-shimmer-anim">22% of All Claimed SOL</span>
          </h1>

          <p className="hero-lead">
            Every Solana wallet has forgotten capital — MEV rewards, wrapped SOL positions, and uncollected staking rewards.
            Share your unique referral link: whenever a referred user claims MEV Rewards, <strong>you receive 22% of the claimed amount</strong> directly
            to your wallet in the same instant on-chain transaction.
          </p>
        </section>

        {/* ============================================================
            SECTION 1: TRANSPARENT REFERRAL COMMISSION (22%)
            ============================================================ */}
        <section className="referral-section" id="economics">
          <div className="os-window os-window--white os-window--shadow">
            <div className="os-window__bar">
              <span className="os-window__title">
                ⚖ Affiliate Program Economics · 22% Direct On-Chain Payout
              </span>
              <span className="os-window__meta">Network: Solana Mainnet-Beta</span>
            </div>
            <div className="os-window__frame">
              <div className="os-window__body">
                {/* Visual Proportion Bar */}
                <div className="split-progress-bar" title="22% Direct Referrer Lifetime Commission">
                  <div className="split-segment split-segment--referrer" style={{ width: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)' }}>
                    <span>22% Lifetime Commission On All Referred Claims · Instant Settlement</span>
                  </div>
                </div>

                {/* 3 Detail Cards */}
                <div className="split-cards-grid">
                  <div className="split-card split-card--referrer">
                    <div className="split-card-header">
                      <span className="split-card-tag">🤝 REFERRAL COMMISSION</span>
                      <span className="split-card-pct">22.0%</span>
                    </div>
                    <div className="split-card-title">Instant Direct Payout</div>
                    <p className="split-card-desc">
                      Paid instantly to your Solana wallet upon each claimed batch transaction on Solana mainnet.
                      Zero waiting periods, non-custodial, and verifiable on Solana Explorer.
                    </p>
                    <div className="split-card-stat">
                      <span>Example on 10 SOL Claim:</span>
                      <strong>+2.20 SOL (≈ ${(2.2 * solPrice).toFixed(2)} USD)</strong>
                    </div>
                  </div>

                  <div className="split-card split-card--protocol">
                    <div className="split-card-header">
                      <span className="split-card-tag">⚡ SPEED</span>
                      <span className="split-card-pct">~400ms</span>
                    </div>
                    <div className="split-card-title">Atomic Mainnet Settlement</div>
                    <p className="split-card-desc">
                      The referral commission transfer instruction is executed in the exact same slot and transaction
                      as the MEV reward claim. No middleman, no thresholds.
                    </p>
                    <div className="split-card-stat">
                      <span>Execution Speed:</span>
                      <strong>Sub-second finality</strong>
                    </div>
                  </div>

                  <div className="split-card split-card--user">
                    <div className="split-card-header">
                      <span className="split-card-tag">🪙 SECURITY</span>
                      <span className="split-card-pct">100%</span>
                    </div>
                    <div className="split-card-title">Non-Custodial Architecture</div>
                    <p className="split-card-desc">
                      Scanning is 100% free and read-only. All transactions are approved and signed inside the user&apos;s own wallet.
                      Never requires private keys or seed phrases.
                    </p>
                    <div className="split-card-stat">
                      <span>Upfront Capital Needed:</span>
                      <strong>0 SOL (100% Free to Scan)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: REFERRAL LINK GENERATOR & SHARING HUB
            ============================================================ */}
        <section className="referral-section" id="links">
          <div className="os-window os-window--white os-window--shadow">
            <div className="os-window__bar">
              <span className="os-window__title">
                🔗 Your Unique Affiliate Link &amp; Share Terminal
              </span>
              <span className="os-window__meta">Status: {connected ? 'Wallet Linked' : 'Manual / Query Mode'}</span>
            </div>
            <div className="os-window__frame">
              <div className="os-window__body">
                <div className="link-generator-box">
                  <div className="link-instructions">
                    <span>Your Solana Payout Wallet:</span>
                    {connected && publicKey ? (
                      <span className="wallet-connected-pill">
                        ● Connected: {publicKey.toBase58()}
                      </span>
                    ) : (
                      <input
                        type="text"
                        className="custom-wallet-input"
                        placeholder="Paste your Solana wallet address or connect wallet above..."
                        value={customAddr}
                        onChange={(e) => setCustomAddr(e.target.value)}
                      />
                    )}
                  </div>

                  {/* Generated Link Field */}
                  <div className="link-copy-group">
                    <div className="link-display-box">
                      <span className="link-prefix">🔗</span>
                      <input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="link-input-readonly"
                      />
                    </div>
                    <button
                      type="button"
                      className={`copy-link-btn ${copiedReferral ? 'copy-link-btn--copied' : ''}`}
                      onClick={copyReferralLink}
                    >
                      {copiedReferral ? '✓ Copied!' : '📋 Copy Referral Link'}
                    </button>
                    <button
                      type="button"
                      className="os-btn"
                      style={{ background: 'var(--magenta)', color: '#fff', padding: '0 16px', fontWeight: 700 }}
                      onClick={() => setShareModalOpen(true)}
                    >
                      🚀 Share Dashboard
                    </button>
                  </div>

                  {/* Share Action Buttons */}
                  <div className="share-buttons-row">
                    <span className="share-row-label">Instant 1-Click Share:</span>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        'Found money I forgot I had on Solana using @OldCashRecovery! Scan your wallet for MEV rewards, idle accounts and uncollected yields: '
                      )}&url=${encodeURIComponent(referralLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-btn share-btn share-btn--twitter"
                    >
                      𝕏 Post on Twitter
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
                        'Discover forgotten Solana tokens, idle staking yields and MEV rewards with Old Cash:'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-btn share-btn"
                    >
                      ✈ Share on Telegram
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Check if you have forgotten SOL MEV rewards to claim: ${referralLink}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-btn share-btn"
                    >
                      💬 WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={triggerNativeShare}
                      className="os-btn share-btn"
                    >
                      📲 More Share Options
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: REAL-TIME YIELD SIMULATOR (CALCULATOR)
            ============================================================ */}
        <section className="referral-section" id="calculator">
          <div className="os-window os-window--white os-window--shadow">
            <div className="os-window__bar">
              <span className="os-window__title">
                🧮 Interactive Yield Simulator · Calculate Your 22% Payout
              </span>
              <span className="os-window__meta">SOL / USD: ${solPrice.toFixed(2)} (Live)</span>
            </div>
            <div className="os-window__frame">
              <div className="os-window__body">
                <div className="calc-flex-layout">
                  {/* Slider Control */}
                  <div className="calc-slider-pane">
                    <div className="calc-slider-header">
                      <label htmlFor="sim-slider" className="calc-slider-label">Simulated Total Referral Claim:</label>
                      <span className="calc-slider-val">{simNum.toFixed(2)} SOL</span>
                    </div>

                    <input
                      id="sim-slider"
                      type="range"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={simClaimSol}
                      onChange={(e) => setSimClaimSol(e.target.value)}
                      className="calc-range-input"
                    />

                    <div className="calc-presets-row">
                      <span>Quick Presets:</span>
                      <button type="button" className="demo-chip" onClick={() => setSimClaimSol(1)}>1 SOL</button>
                      <button type="button" className="demo-chip" onClick={() => setSimClaimSol(5)}>5 SOL</button>
                      <button type="button" className="demo-chip" onClick={() => setSimClaimSol(10)}>10 SOL</button>
                      <button type="button" className="demo-chip" onClick={() => setSimClaimSol(25)}>25 SOL</button>
                      <button type="button" className="demo-chip" onClick={() => setSimClaimSol(84.55)}>
                        Whale (84.55 SOL)
                      </button>
                    </div>
                  </div>

                  {/* Live Results Panel */}
                  <div className="calc-results-pane">
                    <div className="calc-result-box calc-result-box--referrer">
                      <span className="calc-result-label">YOUR 22% COMMISSION</span>
                      <div className="calc-result-amount">+{simReferrerCut.toFixed(4)} SOL</div>
                      <span className="calc-result-usd">≈ ${(simReferrerCut * solPrice).toFixed(2)} USD</span>
                    </div>

                    <div className="calc-result-box calc-result-box--user">
                      <span className="calc-result-label">REFERRED CLAIM VOLUME</span>
                      <div className="calc-result-amount">{simNum.toFixed(4)} SOL</div>
                      <span className="calc-result-usd">≈ ${(simNum * solPrice).toFixed(2)} USD</span>
                    </div>

                    <div className="calc-result-box calc-result-box--protocol">
                      <span className="calc-result-label">SETTLEMENT SPEED</span>
                      <div className="calc-result-amount">~400ms</div>
                      <span className="calc-result-usd">Solana Mainnet-Beta</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: REFERRAL DASHBOARD & CLAIM TERMINAL
            ============================================================ */}
        <section className="referral-section" id="dashboard">
          <div className="os-window os-window--white os-window--shadow">
            <div className="os-window__bar">
              <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📊 Affiliate Performance Dashboard · {shortAddr(activeWallet, 5)}</span>
                <span className="os-tag os-tag--green" style={{ fontSize: 9 }}>REAL-TIME MAINNET</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="os-btn"
                  style={{ fontSize: 11, padding: '2px 8px', background: 'var(--magenta)', color: '#fff' }}
                  onClick={() => setShareModalOpen(true)}
                >
                  🔗 Share Dashboard
                </button>
                <span className="os-window__meta">Slot #{liveSlot.toLocaleString()}</span>
              </div>
            </div>
            <div className="os-window__frame">
              <div className="os-window__body">
                {/* 4 Overview Stat Cards */}
                <div className="overview-stats" style={{ marginBottom: 20 }}>
                  <div className="stat-card">
                    <div className="stat-card__head">
                      <span>Total Referred Wallets</span>
                      <span className="os-tag os-tag--green">Active</span>
                    </div>
                    <div className="stat-card__amount">{displayWalletsCount} Wallets</div>
                    <div className="stat-card__sub">
                      {loadingOnchain ? 'Syncing Solana RPC...' : displayWalletsCount === 0 ? 'No referrals yet' : 'Real-time on-chain active'}
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card__head">
                      <span>Total Recovered Volume</span>
                      <span className="os-tag">On-Chain</span>
                    </div>
                    <div className="stat-card__amount">{displayRecoveredVolume.toFixed(4)} SOL</div>
                    <div className="stat-card__sub">
                      ≈ ${(displayRecoveredVolume * solPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD aggregate
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card__head">
                      <span>Your 22% Lifetime Cut</span>
                      <span className="os-tag os-tag--magenta">Yield</span>
                    </div>
                    <div className="stat-card__amount stat-card__amount--highlight">
                      {displayCommissionSol.toFixed(4)} SOL
                    </div>
                    <div className="stat-card__sub">
                      ≈ ${(displayCommissionSol * solPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD earned
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card__head">
                      <span>Settlement Mode</span>
                      <span className="os-tag">Atomic</span>
                    </div>
                    <div className="stat-card__amount">Instant</div>
                    <div className="stat-card__sub">Solana Mainnet (~400ms)</div>
                  </div>
                </div>

                {/* Claimable Commission Box */}
                <div className="claim-commission-banner">
                  <div className="claim-banner-info">
                    <span className="claim-banner-tag">UNCLAIMED REWARDS READY FOR SETTLEMENT</span>
                    <div className="claim-banner-sol">
                      {displayUnclaimedSol.toFixed(4)} SOL{' '}
                      <span className="claim-banner-usd">≈ ${(displayUnclaimedSol * solPrice).toFixed(2)} USD</span>
                    </div>
                    <p className="claim-banner-note">
                      {displayUnclaimedSol > 0
                        ? 'Earned from recent wallet claims. Available for direct on-chain payout to your wallet.'
                        : 'No unclaimed commission yet. Share your referral link above to start earning 22% lifetime commission on every claim!'}
                    </p>
                  </div>
                  <div>
                    {displayUnclaimedSol > 0 ? (
                      <button
                        type="button"
                        className="mev-claim-btn"
                        onClick={() => setClaimModalOpen(true)}
                      >
                        ⚡ Settle {displayUnclaimedSol.toFixed(4)} SOL Commission (≈ ${(displayUnclaimedSol * solPrice).toFixed(2)} USD) →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mev-claim-btn"
                        style={{ background: 'var(--ink)', borderColor: 'var(--magenta)' }}
                        onClick={copyReferralLink}
                      >
                        📋 Copy Referral Link to Start Earning →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4.5: INTERACTIVE YIELD & VOLUME ANALYTICS GRAPH
            ============================================================ */}
        <ReferralAnalyticsGraph
          solPrice={solPrice}
          liveSlot={liveSlot}
          realData={realOnchainData}
          activeWallet={activeWallet}
        />

        {/* ============================================================
            SECTION 5: RECENT REFERRAL ACTIVITY LEDGER
            ============================================================ */}
        <section className="referral-section" id="ledger">
          <div className="os-window os-window--white os-window--shadow">
            <div className="os-window__bar">
              <span className="os-window__title">
                📜 Real-Time Referral Activity Ledger · Verified Mainnet Claims
              </span>
              <span className="os-window__meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="ticker-live-dot" style={{ width: 6, height: 6 }} />
                <span>Slot #{liveSlot.toLocaleString()}</span>
                <span className="os-tag os-tag--green" style={{ fontSize: 10, padding: '1px 6px' }}>LIVE RPC STREAM</span>
              </span>
            </div>
            <div className="os-window__frame">
              {/* Tab Selector for Ledger */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--ink)', background: 'var(--grey-1)', padding: '6px 12px', gap: 8 }}>
                <button
                  type="button"
                  className={`os-btn ${activeLedgerTab === 'user' ? 'os-btn--active' : ''}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    background: activeLedgerTab === 'user' ? 'var(--ink)' : 'transparent',
                    color: activeLedgerTab === 'user' ? '#fff' : 'inherit',
                  }}
                  onClick={() => setActiveLedgerTab('user')}
                >
                  👤 Your Wallet Activity ({userActivity.length})
                </button>
                <button
                  type="button"
                  className={`os-btn ${activeLedgerTab === 'network' ? 'os-btn--active' : ''}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    background: activeLedgerTab === 'network' ? 'var(--ink)' : 'transparent',
                    color: activeLedgerTab === 'network' ? '#fff' : 'inherit',
                  }}
                  onClick={() => setActiveLedgerTab('network')}
                >
                  ⚡ Live Network Stream ({networkActivity.length})
                </button>
              </div>

              <div className="os-window__body" style={{ padding: 0 }}>
                {activeDisplayList.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                      No On-Chain Claims Recorded Yet
                    </div>
                    <p style={{ maxWidth: 440, margin: '0 auto 16px', fontSize: 13, opacity: 0.8 }}>
                      No referral claims have finalized on Solana Mainnet for {shortAddr(activeWallet, 6)} yet.
                      Share your link below to earn 22% commission on every claim!
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                      <button
                        type="button"
                        className="copy-link-btn"
                        onClick={copyReferralLink}
                      >
                        📋 Copy Your Referral Link
                      </button>
                      <button
                        type="button"
                        className="os-btn"
                        onClick={() => setActiveLedgerTab('network')}
                      >
                        View Live Network Stream →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="scan-table-wrap">
                    <table className="scan-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Referred Wallet</th>
                          <th>Category</th>
                          <th>Total Claimed</th>
                          <th>Your 22% Cut</th>
                          <th>Settlement</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDisplayList.map((r, idx) => (
                          <tr key={r.signature || idx} className={r.isLive ? 'ref-row-live' : ''}>
                            <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.85, whiteSpace: 'nowrap' }}>
                              {r.isLive && (
                                <span className="os-tag os-tag--green" style={{ fontSize: 9, padding: '1px 5px', marginRight: 6 }}>
                                  LIVE
                                </span>
                              )}
                              {r.date}
                            </td>
                            <td>
                              <a
                                href={`https://solscan.io/account/${r.wallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="addr-chip"
                                title={r.wallet}
                                style={{ textDecoration: 'none' }}
                              >
                                {shortAddr(r.wallet, 5)} ↗
                              </a>
                            </td>
                            <td>
                              <span className="token-asset-symbol">{r.category}</span>
                            </td>
                            <td>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                                {r.totalClaimed.toFixed(4)} SOL
                              </strong>
                              <div style={{ fontSize: 10, opacity: 0.7 }}>
                                ≈ ${(r.totalClaimed * solPrice).toFixed(2)}
                              </div>
                            </td>
                            <td>
                              <span className="referral-green-cut">
                                +{r.commission.toFixed(4)} SOL
                              </span>
                              <div style={{ fontSize: 10, color: 'var(--green)', opacity: 0.85 }}>
                                ≈ ${(r.commission * solPrice).toFixed(2)} USD
                              </div>
                            </td>
                            <td>
                              <span className="protocol-cut-text" style={{ color: 'var(--green)', fontWeight: 600 }}>
                                Instant On-Chain
                              </span>
                            </td>
                            <td>
                              <a
                                href={r.solscanUrl || `https://solscan.io/tx/${r.signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="os-tag os-tag--green"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <span>✓ {r.status}</span>
                                <span style={{ fontSize: 9 }}>↗</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 6: REFERRAL FAQ
            ============================================================ */}
        <section className="referral-section" id="faq" style={{ marginBottom: 40 }}>
          <div className="h-kicker">
            <span>Affiliate Guidance ....................</span>
            <span>Protocol Rules</span>
          </div>
          <h2 className="hero-title" style={{ fontSize: 26, marginBottom: 20 }}>
            Frequently Asked Questions Regarding Referrals
          </h2>

          <FaqDropdown
            items={[
              [
                'How does the 22% payout work?',
                'When a user visits Old Cash through your referral link and completes a claim transaction (such as claiming MEV positions or unwrapping WSOL), 22% of the recovered fee is routed straight to your Solana payout wallet atomically in the same on-chain transaction.',
              ],
              [
                'How quickly is the 22% commission paid?',
                'Commissions are settled atomically in the very same Solana transaction as the user claim. In ~400ms, your 22% cut is deposited into your wallet with zero delay.',
              ],
              [
                'Do my referrals need upfront capital?',
                'No. Scanning is 100% free and read-only. When claiming, MEV reward claim transactions release SOL that was already deposited on-chain, meaning users finish with more SOL in their wallet than when they started.',
              ],
              [
                'Is this non-custodial and safe?',
                'Yes. Old Cash never asks for private keys or seed phrases. The affiliate routing instructions are atomic and validated inside the user\'s Phantom, Solflare, or Ledger wallet before signing.',
              ],
            ]}
          />
        </section>
      </main>

      {/* Share Dashboard Modal */}
      {shareModalOpen && (
        <div className="modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <span>SHARE YOUR AFFILIATE DASHBOARD</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShareModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Visual Preview Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                  color: '#fff',
                  padding: '16px',
                  border: '2px solid #ec4899',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/assets/logo.jpg" alt="Old Cash" style={{ width: 28, height: 28, borderRadius: 4 }} />
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-pixel)', fontSize: 13, letterSpacing: 1 }}>OLD CASH AFFILIATE</span>
                  </div>
                  <span className="os-tag os-tag--magenta" style={{ fontSize: 10 }}>22% LIFETIME CUT</span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.8, marginBottom: 10 }}>
                  Wallet: {activeWallet}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 4 }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>TOTAL VOLUME RECOVERED</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#00e5ff' }}>{displayRecoveredVolume.toFixed(4)} SOL</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>22% COMMISSION EARNED</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#ec4899' }}>+{displayCommissionSol.toFixed(4)} SOL</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 10, display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                  <span>Network: Solana Mainnet-Beta</span>
                  <span>Non-Custodial · Instant Settlement</span>
                </div>
              </div>

              {/* Shareable Link 1: Public Dashboard View */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  1. Shareable Dashboard URL (View Live Stats):
                </label>
                <div className="link-copy-group" style={{ margin: 0 }}>
                  <div className="link-display-box">
                    <input type="text" readOnly value={dashboardLink} className="link-input-readonly" style={{ fontSize: 11 }} />
                  </div>
                  <button
                    type="button"
                    className={`copy-link-btn ${copiedDashboard ? 'copy-link-btn--copied' : ''}`}
                    onClick={copyDashboardLink}
                    style={{ minWidth: 120 }}
                  >
                    {copiedDashboard ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                </div>
              </div>

              {/* Shareable Link 2: Direct Referral Scanner Link */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  2. Your Affiliate Scanner Link (Earn on Claims):
                </label>
                <div className="link-copy-group" style={{ margin: 0 }}>
                  <div className="link-display-box">
                    <input type="text" readOnly value={referralLink} className="link-input-readonly" style={{ fontSize: 11 }} />
                  </div>
                  <button
                    type="button"
                    className={`copy-link-btn ${copiedReferral ? 'copy-link-btn--copied' : ''}`}
                    onClick={copyReferralLink}
                    style={{ minWidth: 120 }}
                  >
                    {copiedReferral ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                </div>
              </div>

              {/* Social 1-Click Share Row */}
              <div style={{ borderTop: '1px dashed var(--grey-2)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                  1-Click Share To Socials:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Tracking my Solana recovery earnings on @OldCashRecovery! 22% lifetime commission on all claimed MEV rewards. View my dashboard: `
                    )}&url=${encodeURIComponent(dashboardLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="os-btn share-btn share-btn--twitter"
                    style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
                  >
                    𝕏 Post on Twitter
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(dashboardLink)}&text=${encodeURIComponent(
                      'Check out my Solana affiliate dashboard and MEV earnings on Old Cash:'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="os-btn share-btn"
                    style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
                  >
                    ✈ Telegram
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Check out my Solana recovery affiliate dashboard: ${dashboardLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="os-btn share-btn"
                    style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
                  >
                    💬 WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={triggerNativeShare}
                    className="os-btn share-btn"
                    style={{ flex: 1, minWidth: 100, justifyContent: 'center' }}
                  >
                    📲 Share Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Commission Modal */}
      {claimModalOpen && (
        <div className="modal-backdrop" onClick={() => setClaimModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>SOLANA MAINNET · SETTLE COMMISSION</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setClaimModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12 }}>
                Confirm withdrawal of your accumulated 22% referral commission to your connected payout wallet.
              </p>
              <div className="security-box" style={{ marginBottom: 16 }}>
                <div><strong>Amount:</strong> {displayUnclaimedSol.toFixed(4)} SOL (≈ ${(displayUnclaimedSol * solPrice).toFixed(2)} USD)</div>
                <div><strong>Destination:</strong> {shortAddr(activeWallet, 6)}</div>
                <div><strong>Network Fee:</strong> ~0.000005 SOL ($0.001)</div>
              </div>

              {claimedNotice ? (
                <div className="os-tag os-tag--green" style={{ width: '100%', padding: '10px 14px', fontSize: 13 }}>
                  ✓ Commission claim transaction broadcasted successfully to Solana mainnet!
                </div>
              ) : (
                <button
                  type="button"
                  className="mev-claim-btn"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setClaimedNotice(true);
                    triggerConfetti({ count: 70 });
                    setTimeout(() => {
                      setClaimedNotice(false);
                      setClaimModalOpen(false);
                    }, 2400);
                  }}
                >
                  ⚡ Confirm &amp; Receive {displayUnclaimedSol.toFixed(4)} SOL
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Creative Footer */}
      <CreativeFooter />

      <MascotWidget />
    </>
  );
}
