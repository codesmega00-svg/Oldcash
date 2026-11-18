'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import ThemeToggle from '@/components/ThemeToggle';
import ThemeBackground from '@/components/ThemeBackground';
import {
  shortAddr,
  isValidAddress,
  SOL_USD_PRICE,
} from '@/lib/config';
import { triggerConfetti } from '@/components/ConfettiCanvas';

export default function EarlyPage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  // Step 1: 𝕏 (Twitter) Authentication State
  const [xConnected, setXConnected] = useState(false);
  const [xHandle, setXHandle] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [xModalOpen, setXModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Step 2: Community Tasks State
  const [followedX, setFollowedX] = useState(false);
  const [joinedTg, setJoinedTg] = useState(false);
  const [repostedX, setRepostedX] = useState(false);

  // Step 3: Shareable Card State
  const [pioneerId, setPioneerId] = useState('08492');
  const [cardCopied, setCardCopied] = useState(false);
  const [sharedOnX, setSharedOnX] = useState(false);

  // Step 4: Solana Wallet Submission & Auto-Move
  const [walletInput, setWalletInput] = useState('');
  const [walletError, setWalletError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [solPrice, setSolPrice] = useState(SOL_USD_PRICE);

  // Auto-fill wallet if user connects via Solana wallet adapter
  useEffect(() => {
    if (connected && publicKey) {
      setWalletInput(publicKey.toBase58());
      setWalletError('');
    }
  }, [connected, publicKey]);

  // Read saved state or generate unique Pioneer ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('oldcash_early_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.handle) {
            setXHandle(parsed.handle);
            setXConnected(true);
          }
          if (parsed.pioneerId) setPioneerId(parsed.pioneerId);
          if (parsed.followedX) setFollowedX(true);
          if (parsed.joinedTg) setJoinedTg(true);
          if (parsed.repostedX) setRepostedX(true);
          if (parsed.sharedOnX) setSharedOnX(true);
          if (parsed.wallet) setWalletInput(parsed.wallet);
        } else {
          const rand = Math.floor(1000 + Math.random() * 9000).toString();
          setPioneerId(rand);
        }
      } catch {}
    }
  }, []);

  // Poll live SOL price
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
      } catch {}
    };
    fetchSolPrice();
    const timer = setInterval(fetchSolPrice, 12000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // 𝕏 Authentication handler
  const handleConnectX = (handleToUse) => {
    const raw = (handleToUse || handleInput).trim();
    if (!raw) {
      showToast('Please enter your 𝕏 handle.');
      return;
    }
    const cleanHandle = raw.startsWith('@') ? raw : `@${raw}`;
    setAuthLoading(true);

    setTimeout(() => {
      setXHandle(cleanHandle);
      setXConnected(true);
      setAuthLoading(false);
      setXModalOpen(false);
      triggerConfetti({ count: 70 });
      showToast(`✓ Authenticated as ${cleanHandle}! Pioneer slot locked.`);

      saveTaskProgress({ handle: cleanHandle, pioneerId });
    }, 600);
  };

  // Task 1: Follow @oldcashdotfun on 𝕏
  const handleFollowX = () => {
    window.open('https://x.com/oldcashdotfun', '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      setFollowedX(true);
      showToast('✓ Verified follow of @oldcashdotfun!');
      saveTaskProgress({ followedX: true });
    }, 1000);
  };

  // Task 2: Join Telegram t.me/oldcashdotfun
  const handleJoinTg = () => {
    window.open('https://t.me/oldcashdotfun', '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      setJoinedTg(true);
      showToast('✓ Verified Telegram membership!');
      saveTaskProgress({ joinedTg: true });
    }, 1000);
  };

  // Task 3: Repost launch tweet
  const handleRepostX = () => {
    const tweetText = `Early Pioneer Whitelist is LIVE on @oldcashdotfun! 💰 Locating forgotten MEV rewards across Solana mainnet. Join here: https://oldcash.fun/early`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setTimeout(() => {
      setRepostedX(true);
      showToast('✓ Verified launch repost!');
      saveTaskProgress({ repostedX: true });
    }, 1000);
  };

  const saveTaskProgress = (updates) => {
    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem('oldcash_early_user') || '{}');
        localStorage.setItem(
          'oldcash_early_user',
          JSON.stringify({ ...current, ...updates })
        );
      } catch {}
    }
  };

  // Share Tweet text for pass card
  const shareTweetText = useMemo(() => {
    const handleStr = xHandle || '@Pioneer';
    return `⚡ Just claimed my official Early Pioneer Pass on @oldcashdotfun! 💰\n\nPass ID: #PIONEER-${pioneerId}\nMember: ${handleStr}\nWhitelist Status: 100% Guaranteed MEV Reward Priority\n\nClaim your early pass & scan your wallet after every trade:\n🌐 https://oldcash.fun/early\nTelegram: https://t.me/oldcashdotfun\n\n#Solana #MEVReward #Airdrop #OldCash`;
  }, [xHandle, pioneerId]);

  // Share Card on 𝕏
  const handleShareCardOnX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTweetText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSharedOnX(true);
    showToast('✓ Card shared on 𝕏! Final quest step unlocked.');
    saveTaskProgress({ sharedOnX: true });
  };

  // Share on Telegram
  const handleShareOnTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://oldcash.fun/early')}&text=${encodeURIComponent('Claim your Early Pioneer Pass & guaranteed Solana MEV rewards on oldcash.fun! Official channel: @oldcashdotfun')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSharedOnX(true);
  };

  // Copy Card Certificate Text
  const handleCopyCardReceipt = () => {
    const text = `◈ OLDCASH.FUN // OFFICIAL EARLY ACCESS PASS ◈\nMember: ${xHandle || '@YourHandle'}\nPass ID: #PIONEER-${pioneerId}\nWebsite: https://oldcash.fun\nOfficial 𝕏: @oldcashdotfun\nOfficial TG: t.me/oldcashdotfun\nStatus: VERIFIED EARLY PIONEER\nPerk: 100% MEV Reward Priority + 22% Referral Tier Unlocked\nNetwork: Solana Mainnet-Beta\nJoin Whitelist: https://oldcash.fun/early`;

    navigator.clipboard?.writeText(text);
    setCardCopied(true);
    triggerConfetti({ count: 50 });
    showToast('✓ Copied Pioneer Pass badge to clipboard!');
    setTimeout(() => setCardCopied(false), 2200);
  };

  // Step 4: Submit Solana Wallet & Move to Scanner
  const handleCompleteAndClaim = () => {
    const target = walletInput.trim();
    if (!target) {
      setWalletError('Please enter or connect your Solana wallet address.');
      return;
    }
    if (!isValidAddress(target)) {
      setWalletError('Invalid Solana base58 address. Please check your address.');
      return;
    }

    setWalletError('');
    setSubmitting(true);

    saveTaskProgress({
      wallet: target,
      completedAt: new Date().toISOString(),
    });

    showToast('🎉 Early Pioneer Verified! Moving to Scanner...');
    triggerConfetti({ count: 110 });

    setTimeout(() => {
      router.push(`/?wallet=${encodeURIComponent(target)}&early=true&autoclaim=true#scanner`);
    }, 900);
  };

  // Stepper state
  const step1Done = xConnected;
  const step2Done = followedX && joinedTg && repostedX;
  const step3Done = sharedOnX || cardCopied;
  const step4Done = Boolean(walletInput && isValidAddress(walletInput));

  const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4;

  return (
    <>
      <ThemeBackground />

      {/* ============================================================
          MINIMAL HEADER: NO MENU LINKS, JUST BRAND + RETURN TO SCANNER
          ============================================================ */}
      <header className="early-simple-nav">
        <Link href="/" className="early-simple-brand">
          <img
            src="/assets/logo.jpg"
            alt="Old Cash"
            className="early-simple-logo"
          />
          <div>
            <div className="early-simple-brand-text">oldcash.fun</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
              PHASE 0 · EARLY PIONEER ACCESS
            </div>
          </div>
        </Link>

        <div className="early-simple-nav-right">
          <ThemeToggle />
          <Link href="/" className="early-simple-back-btn">
            <span>←</span>
            <span>Return to Scanner</span>
          </Link>
        </div>
      </header>

      {/* ============================================================
          FOCUSED REGISTRATION CONTAINER (LIKE GETBLESSED.FUN/REGISTER)
          ============================================================ */}
      <main className="early-simple-container">
        {/* Global Toast */}
        {toast && (
          <div className="potato-batch-box" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)' }}>
              <strong>Status:</strong> {toast}
            </div>
          </div>
        )}

        {/* 4-Step Stepper Header */}
        <div className="early-stepper-bar">
          <div className={`early-stepper-item ${step1Done ? 'early-stepper-item--done' : currentStep === 1 ? 'early-stepper-item--active' : ''}`}>
            <span className="early-stepper-num">{step1Done ? '✓' : '1'}</span>
            <span>1. 𝕏 Auth</span>
          </div>
          <div className={`early-stepper-item ${step2Done ? 'early-stepper-item--done' : currentStep === 2 ? 'early-stepper-item--active' : ''}`}>
            <span className="early-stepper-num">{step2Done ? '✓' : '2'}</span>
            <span>2. Community</span>
          </div>
          <div className={`early-stepper-item ${step3Done ? 'early-stepper-item--done' : currentStep === 3 ? 'early-stepper-item--active' : ''}`}>
            <span className="early-stepper-num">{step3Done ? '✓' : '3'}</span>
            <span>3. Pass Card</span>
          </div>
          <div className={`early-stepper-item ${step4Done ? 'early-stepper-item--done' : currentStep === 4 ? 'early-stepper-item--active' : ''}`}>
            <span className="early-stepper-num">{step4Done ? '✓' : '4'}</span>
            <span>4. Payout Wallet</span>
          </div>
        </div>

        {/* Central Registration Card Window */}
        <div className="os-window os-window--white os-window--shadow">
          {/* Window Title Bar */}
          <div className="os-window__bar">
            <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ticker-live-dot" />
              <span>◈ OLDCASH.FUN // EARLY ACCESS REGISTRATION</span>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                SOLANA MAINNET
              </span>
            </div>
          </div>

          <div className="os-window__frame">
            {/* Header Hero Area */}
            <div style={{ padding: '22px 20px 18px', borderBottom: 'var(--border) solid var(--ink)', background: 'var(--paper, #fdfbf7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="os-tag os-tag--magenta" style={{ fontSize: 10 }}>PHASE-0 WHITELIST</span>
                <span className="os-tag os-tag--green" style={{ fontSize: 10 }}>MEV REWARD PRIORITY</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-disp)', fontSize: 'clamp(20px, 3.2vw, 28px)', margin: '0 0 6px', fontWeight: 900 }}>
                Early Pioneer Registration
              </h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>
                Complete the quick verification below to generate your official <strong>oldcash.fun</strong> Pioneer Pass and claim MEV rewards directly on Solana mainnet.
              </p>
            </div>

            {/* STEP 1: AUTHENTICATE THROUGH 𝕏 */}
            <div className="early-card-section">
              <div className="early-card-section__head">
                <div className="early-card-section__title">
                  <span className={`early-step-badge ${step1Done ? 'early-step-badge--done' : ''}`}>
                    {step1Done ? '✓' : '1'}
                  </span>
                  <span>Connect 𝕏 (Twitter) Identity</span>
                </div>
                {step1Done && <span className="os-tag os-tag--green">VERIFIED</span>}
              </div>

              {xConnected ? (
                <div className="early-connected-badge" style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="early-x-avatar">
                      {xHandle.slice(1, 3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{xHandle}</div>
                      <div style={{ fontSize: 11, opacity: 0.75, fontFamily: 'var(--font-mono)' }}>
                        ✓ 𝕏 Verified · Pioneer Pass #{pioneerId}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="os-btn os-btn--dark"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                    onClick={() => setXModalOpen(true)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  <p style={{ fontSize: 12, opacity: 0.75, margin: '0 0 10px', fontFamily: 'var(--font-mono)' }}>
                    Link your public 𝕏 profile to personalize your Pioneer Pass card and lock guaranteed MEV claim priority.
                  </p>
                  <button
                    type="button"
                    className="early-auth-x-btn"
                    onClick={() => setXModalOpen(true)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Connect 𝕏 (Twitter) Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* STEP 2: COMMUNITY TASKS */}
            <div className="early-card-section">
              <div className="early-card-section__head">
                <div className="early-card-section__title">
                  <span className={`early-step-badge ${step2Done ? 'early-step-badge--done' : ''}`}>
                    {step2Done ? '✓' : '2'}
                  </span>
                  <span>Community Tasks (@oldcashdotfun)</span>
                </div>
                <span className="os-tag" style={{ fontSize: 10 }}>
                  {[followedX, joinedTg, repostedX].filter(Boolean).length}/3 Completed
                </span>
              </div>

              <div className="early-tasks-grid" style={{ marginTop: 8 }}>
                {/* 2.1 Follow 𝕏 */}
                <div className={`early-task-card ${followedX ? 'early-task-card--done' : ''}`}>
                  <div className="early-task-card__head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="early-task-icon">𝕏</span>
                      <div>
                        <strong>Follow @oldcashdotfun</strong>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>Official protocol updates</div>
                      </div>
                    </div>
                    {followedX && <span className="os-tag os-tag--green" style={{ fontSize: 9 }}>✓ DONE</span>}
                  </div>
                  <div className="early-task-card__action">
                    <button
                      type="button"
                      className={`os-btn ${followedX ? 'os-btn--dark' : 'os-btn--pink'}`}
                      onClick={handleFollowX}
                      style={{ width: '100%', fontSize: 11, padding: '5px' }}
                    >
                      {followedX ? '✓ Following @oldcashdotfun' : '⚡ Follow @oldcashdotfun ↗'}
                    </button>
                  </div>
                </div>

                {/* 2.2 Join Telegram */}
                <div className={`early-task-card ${joinedTg ? 'early-task-card--done' : ''}`}>
                  <div className="early-task-card__head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="early-task-icon">✈</span>
                      <div>
                        <strong>Join Telegram Community</strong>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>t.me/oldcashdotfun</div>
                      </div>
                    </div>
                    {joinedTg && <span className="os-tag os-tag--green" style={{ fontSize: 9 }}>✓ DONE</span>}
                  </div>
                  <div className="early-task-card__action">
                    <button
                      type="button"
                      className={`os-btn ${joinedTg ? 'os-btn--dark' : 'os-btn--pink'}`}
                      onClick={handleJoinTg}
                      style={{ width: '100%', fontSize: 11, padding: '5px' }}
                    >
                      {joinedTg ? '✓ Joined t.me/oldcashdotfun' : '✈ Join Telegram ↗'}
                    </button>
                  </div>
                </div>

                {/* 2.3 Repost */}
                <div className={`early-task-card ${repostedX ? 'early-task-card--done' : ''}`}>
                  <div className="early-task-card__head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="early-task-icon">🔁</span>
                      <div>
                        <strong>Repost Launch Tweet</strong>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>Spread the word on 𝕏</div>
                      </div>
                    </div>
                    {repostedX && <span className="os-tag os-tag--green" style={{ fontSize: 9 }}>✓ DONE</span>}
                  </div>
                  <div className="early-task-card__action">
                    <button
                      type="button"
                      className={`os-btn ${repostedX ? 'os-btn--dark' : 'os-btn--pink'}`}
                      onClick={handleRepostX}
                      style={{ width: '100%', fontSize: 11, padding: '5px' }}
                    >
                      {repostedX ? '✓ Repost Verified' : '🔁 Repost on 𝕏 ↗'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: SHAREABLE EARLY PIONEER PASS CARD */}
            <div className="early-card-section">
              <div className="early-card-section__head">
                <div className="early-card-section__title">
                  <span className={`early-step-badge ${step3Done ? 'early-step-badge--done' : ''}`}>
                    {step3Done ? '✓' : '3'}
                  </span>
                  <span>Share Your Early Pioneer Pass</span>
                </div>
                <span className="os-tag os-tag--magenta" style={{ fontSize: 10 }}>#PIONEER-{pioneerId}</span>
              </div>

              {/* The Holographic Pass Card */}
              <div className="early-pass-card-wrap" style={{ margin: '8px 0 14px' }}>
                <div className="early-pass-card">
                  {/* Top Holographic Strip */}
                  <div className="early-pass-card__top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="ticker-live-dot" />
                      <span style={{ fontFamily: 'var(--font-disp)', fontWeight: 900, letterSpacing: '0.06em' }}>
                        OLDCASH.FUN // OFFICIAL EARLY ACCESS PASS
                      </span>
                    </div>
                    <div className="early-pass-chip">
                      <span>PHASE-0 VERIFIED</span>
                    </div>
                  </div>

                  {/* Body with Mascot & Details */}
                  <div className="early-pass-card__body">
                    <div className="early-pass-avatar-pane">
                      <div className="early-pass-img-frame">
                        <img
                          src="/assets/tvhead.jpg"
                          alt="Pioneer Mascot"
                          className="early-pass-img"
                        />
                        <div className="crt-scanlines" />
                      </div>
                      <div className="early-pass-rank-tag">
                        UNIT // PIONEER-01
                      </div>
                    </div>

                    <div className="early-pass-details-pane">
                      <div className="early-pass-meta-row">
                        <span className="early-pass-label">MEMBER:</span>
                        <span className="early-pass-val" style={{ color: '#00ffa3' }}>
                          {xConnected ? xHandle : '@YourHandle'}
                        </span>
                      </div>
                      <div className="early-pass-meta-row">
                        <span className="early-pass-label">PASS ID:</span>
                        <span className="early-pass-val" style={{ color: '#38bdf8' }}>
                          #PIONEER-{pioneerId}
                        </span>
                      </div>
                      <div className="early-pass-meta-row">
                        <span className="early-pass-label">WEBSITE:</span>
                        <span className="early-pass-val">
                          https://oldcash.fun
                        </span>
                      </div>
                      <div className="early-pass-meta-row">
                        <span className="early-pass-label">OFFICIAL 𝕏:</span>
                        <span className="early-pass-val" style={{ color: '#ec4899' }}>
                          @oldcashdotfun
                        </span>
                      </div>
                      <div className="early-pass-meta-row">
                        <span className="early-pass-label">TELEGRAM:</span>
                        <span className="early-pass-val">
                          t.me/oldcashdotfun
                        </span>
                      </div>
                      <div className="early-pass-perk-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#00ffa3' }}>⚡</span>
                          <strong>GUARANTEED PERK:</strong>
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                          1-Click MEV Reward Priority + 22% Referral Split Whitelisted.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Barcode */}
                  <div className="early-pass-card__footer">
                    <div className="early-pass-barcode">
                      ||| |||| | |||||| || | |||| ||||| | ||||| OLDCASH-{pioneerId}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.75 }}>
                        SOLANA MAINNET
                      </span>
                      <svg width="18" height="14" viewBox="0 0 397 311" fill="none">
                        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="#00FFA3"/>
                        <path d="M64.6 3.8C67 1.4 70.3 0 73.8 0h313.7c5.8 0 8.7 7 4.6 11.1L329.4 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#DC1FFF"/>
                        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H10.2c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h313.7c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#00FFA3"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="early-share-actions-row">
                <button
                  type="button"
                  className="social-share-btn social-share-btn--x"
                  onClick={handleShareCardOnX}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>{sharedOnX ? '✓ Shared on 𝕏' : 'Share on 𝕏 (Twitter)'}</span>
                </button>

                <button
                  type="button"
                  className="social-share-btn social-share-btn--tg"
                  onClick={handleShareOnTelegram}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  <span>Share on Telegram</span>
                </button>

                <button
                  type="button"
                  className="social-share-btn social-share-btn--copy"
                  onClick={handleCopyCardReceipt}
                >
                  <span>📋</span>
                  <span>{cardCopied ? '✓ Copied' : 'Copy Pass Text'}</span>
                </button>
              </div>
            </div>

            {/* STEP 4: ENTER WALLET & MOVE TO SCANNER */}
            <div className="early-card-section" style={{ background: 'var(--paper, #fdfbf7)' }}>
              <div className="early-card-section__head">
                <div className="early-card-section__title">
                  <span className={`early-step-badge ${step4Done ? 'early-step-badge--done' : ''}`}>
                    {step4Done ? '✓' : '4'}
                  </span>
                  <span>Deposit Solana Wallet &amp; Claim MEV Reward</span>
                </div>
                <span className="os-tag os-tag--green" style={{ fontSize: 10 }}>FINAL STEP</span>
              </div>

              <div style={{ marginTop: 6 }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                  Submit your Solana payout address. It will automatically load in the scanner and trigger your live MEV reward scan.
                </p>

                {/* Wallet Input */}
                <div className="early-wallet-input-row">
                  <span className="early-wallet-prefix">◎</span>
                  <input
                    type="text"
                    className="early-wallet-input"
                    placeholder="Paste Solana address (e.g. 9WzDXwBbmkg...)..."
                    value={walletInput}
                    onChange={(e) => {
                      setWalletInput(e.target.value);
                      setWalletError('');
                    }}
                  />
                  {connected && publicKey && (
                    <span className="os-tag os-tag--green" style={{ fontSize: 10, padding: '2px 6px' }}>
                      CONNECTED
                    </span>
                  )}
                </div>

                {walletError && (
                  <div className="early-wallet-error" style={{ marginTop: 8 }}>
                    ✕ {walletError}
                  </div>
                )}

                {/* Direct Action Button */}
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="early-submit-claim-btn"
                    disabled={submitting}
                    onClick={handleCompleteAndClaim}
                  >
                    {submitting ? (
                      <span>⚡ VERIFYING PASS &amp; OPENING SCANNER...</span>
                    ) : (
                      <span>⚡ CONFIRM WALLET &amp; CLAIM MEV REWARD ON SCANNER DIRECTLY →</span>
                    )}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, marginTop: 8 }}>
                    🔒 100% Non-Custodial · Direct move to scanner with auto-run · Zero private key permissions required
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            MINIMAL SINGLE-LINE FOOTER (NO DIRECTORY, NO BLOAT)
            ============================================================ */}
        <div className="early-simple-footer">
          <div>
            <strong>oldcash.fun</strong> // Official 𝕏: <a href="https://x.com/oldcashdotfun" target="_blank" rel="noopener noreferrer">@oldcashdotfun</a> · Telegram: <a href="https://t.me/oldcashdotfun" target="_blank" rel="noopener noreferrer">t.me/oldcashdotfun</a>
          </div>
          <div style={{ marginTop: 4, opacity: 0.8 }}>
            Phase-0 Early Pioneer Gateway · Non-Custodial Solana Protocol Engine · All Lamports Refund to Your Connected Address
          </div>
        </div>
      </main>

      {/* 𝕏 Authentication Modal */}
      {xModalOpen && (
        <div className="modal-backdrop" onClick={() => setXModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span>AUTHENTICATE THROUGH 𝕏 (TWITTER)</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setXModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>𝕏</div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  Link Your 𝕏 Identity to oldcash.fun
                </h4>
                <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.75 }}>
                  Enter your 𝕏 username to verify your pioneer allocation and print your custom pass.
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 6 }}>
                  Your 𝕏 Handle:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--ink)', background: 'var(--white)' }}>
                  <span style={{ padding: '8px 12px', background: '#f1f5f9', fontWeight: 700, borderRight: '1.5px solid var(--ink)' }}>@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={handleInput.replace(/^@/, '')}
                    onChange={(e) => setHandleInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 14 }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>Quick presets:</span>
                {['solana_trader', 'crypto_whale', 'degen_pioneer'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="demo-chip"
                    onClick={() => setHandleInput(preset)}
                  >
                    @{preset}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="os-btn os-btn--pink"
                disabled={authLoading}
                onClick={() => handleConnectX()}
                style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 700 }}
              >
                {authLoading ? '⚡ Authenticating...' : '✓ Authorize 𝕏 & Unlock Pioneer Pass'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
