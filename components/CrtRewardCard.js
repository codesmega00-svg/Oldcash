'use client';
import { useState, useEffect } from 'react';
import { shortAddr, RENT_PER_TOKEN_ACCOUNT_SOL } from '@/lib/config';
import { triggerConfetti } from './ConfettiCanvas';

export default function CrtRewardCard({
  report,
  solPrice,
  executingLive,
  onClaimAll,
  showToast,
  connected,
  publicKey,
  referrer,
}) {
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [animatedSol, setAnimatedSol] = useState(0);

  const totalRentSol = +(report?.totalRentRecoverable || 0).toFixed(6);
  const totalRentUsd = +(totalRentSol * solPrice).toFixed(2);
  const accountsCount = report?.closableAccounts?.length || 0;
  const targetWallet = report?.address || (connected && publicKey ? publicKey.toBase58() : '');
  const refWallet = (connected && publicKey ? publicKey.toBase58() : targetWallet) || 'YourWallet';

  // Smooth exponential count-up ticker animation
  useEffect(() => {
    if (!totalRentSol) {
      setAnimatedSol(0);
      return;
    }
    const duration = 1100;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = +(totalRentSol * ease).toFixed(4);
      setAnimatedSol(val);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedSol(totalRentSol);
      }
    };

    requestAnimationFrame(animate);
  }, [totalRentSol]);

  if (!report) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${refWallet}`
    : `https://oldcash.io/?ref=${refWallet}`;

  const shareText = `⚡ Just discovered +${totalRentSol} SOL (~$${totalRentUsd} USD) in forgotten MEV rewards on @OldCashSolana! 💰\n\nRule of thumb: Claim after every trade to keep 100% of your SOL.\n\nScan your wallet here 👇\n${shareUrl}`;

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`⚡ Discovered +${totalRentSol} SOL (~$${totalRentUsd} USD) in MEV rewards on Old Cash! Claim after every trade:`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyReceipt = () => {
    const receiptText = `◈ OLD CASH SOLANA RECOVERY VERIFIED ◈\nWallet: ${shortAddr(targetWallet, 6)}\nTotal MEV Reward: +${totalRentSol} SOL (≈ $${totalRentUsd} USD)\nMEV Positions: ${accountsCount} positions\nStatus: 100% Non-Custodial On-Chain Claim\n👉 Scan your wallet & claim after every trade: ${shareUrl}`;
    navigator.clipboard?.writeText(receiptText);
    setCopiedReceipt(true);
    triggerConfetti({ count: 60 });
    showToast?.('✓ Copied recovery proof badge to clipboard!');
    setTimeout(() => setCopiedReceipt(false), 2200);
  };

  const handleCopyRefLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopiedRef(true);
    triggerConfetti({ count: 60 });
    showToast?.('✓ Referral link copied! Earn 22% on every referral claim.');
    setTimeout(() => setCopiedRef(false), 2200);
  };

  return (
    <div className="crt-container-wrap">
      {/* ============================================================
          BIG CRT MEV REWARD HERO CARD
          ============================================================ */}
      <div className="crt-hero-card">
        {/* Terminal Header Strip */}
        <div className="crt-hero-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ticker-live-dot" />
            <span>◈ RETRO CRT MEV TERMINAL // AUTO-BUFFER ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>ALL {accountsCount} ACCOUNTS AUTOMATICALLY BUFFERED</span>
            <span className="os-tag os-tag--green" style={{ fontSize: 10 }}>100% NON-CUSTODIAL</span>
          </div>
        </div>

        {/* 2-Column CRT Grid */}
        <div className="crt-hero-grid">
          {/* Left: Live CRT Monitor Pane */}
          <div className="crt-agent-pane">
            <div className="crt-agent-frame">
              <img
                src="/assets/tvhead.jpg"
                alt="CRT Recovery Mascot"
                className="crt-agent-img"
              />
              <div className="crt-scanlines" />
            </div>

            <div className="crt-telemetry-box">
              <div className="crt-telemetry-status">
                <span className="ticker-live-dot" style={{ width: 6, height: 6 }} />
                <span>UNIT: AGENT-01 // CRT BOT</span>
              </div>
              <div>
                <strong>STATUS:</strong> {accountsCount} claimable MEV positions located.
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>BUFFER:</strong> Automatically consolidated in backend logic.
              </div>
              <div style={{ marginTop: 4, color: '#38bdf8' }}>
                <strong>RULE:</strong> Claim after every trade!
              </div>
            </div>
          </div>

          {/* Right: Big Reward & Claim Centerpiece */}
          <div className="crt-reward-pane">
            <div className="crt-tag-row">
              <span className="os-tag os-tag--magenta">⚡ 1-Click MEV Claim</span>
              <span className="os-tag os-tag--green">● {accountsCount} Accounts Auto-Selected</span>
              <span className="os-tag">Zero Private Key Access</span>
            </div>

            <div className="crt-amount-section">
              <span className="crt-amount-title">TOTAL UNCLAIMED MEV REWARD</span>

              {/* Big SOL Amount Row with Official Solana Logo */}
              <div className="crt-sol-row">
                {/* Official Solana SVG Logo */}
                <svg className="crt-sol-logo" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h313.7c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol_g1)"/>
                  <path d="M64.6 3.8C67 1.4 70.3 0 73.8 0h313.7c5.8 0 8.7 7 4.6 11.1L329.4 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol_g2)"/>
                  <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H10.2c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h313.7c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol_g3)"/>
                  <defs>
                    <linearGradient id="sol_g1" x1="363.8" y1="234.1" x2="26.7" y2="311.9" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00FFA3"/>
                      <stop offset="1" stopColor="#DC1FFF"/>
                    </linearGradient>
                    <linearGradient id="sol_g2" x1="363.8" y1=".1" x2="26.7" y2="77.9" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00FFA3"/>
                      <stop offset="1" stopColor="#DC1FFF"/>
                    </linearGradient>
                    <linearGradient id="sol_g3" x1="32.8" y1="116.3" x2="369.9" y2="194.1" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00FFA3"/>
                      <stop offset="1" stopColor="#DC1FFF"/>
                    </linearGradient>
                  </defs>
                </svg>

                <div className="crt-sol-number crt-sol-number--animate">
                  +{animatedSol} SOL
                </div>

                <div className="crt-usd-number crt-usd-number--animate">
                  ≈ ${(animatedSol * solPrice).toFixed(2)} USD
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', opacity: 0.75, marginTop: 4 }}>
                Calculated live at current Solana market spot rate (${solPrice.toFixed(2)} USD / SOL)
              </div>
            </div>

            {/* Quick Metrics Chips */}
            <div className="crt-metrics-chips">
              <span className="crt-chip crt-chip--pulse">⚡ {accountsCount} MEV Reward Positions</span>
              {report.wsolRecoverable > 0 && (
                <span className="crt-chip" style={{ background: '#f0fdf4', borderColor: 'var(--green)' }}>
                  ★ {report.wsolRecoverable.toFixed(4)} WSOL Unwrapped
                </span>
              )}
              <span className="crt-chip">Network Fee: ~0.000005 SOL (&lt; $0.001)</span>
              <span className="crt-chip">
                Recipient: {connected && publicKey ? shortAddr(publicKey.toBase58(), 6) : 'Connected Wallet'}
              </span>
            </div>

            {/* Huge 1-Click Action Button */}
            <div>
              <button
                className="crt-huge-claim-btn crt-huge-claim-btn--aura"
                type="button"
                disabled={executingLive || accountsCount === 0}
                onClick={() => {
                  triggerConfetti({ count: 90 });
                  onClaimAll();
                }}
              >
                {executingLive ? (
                  <span>⚡ PROCESSING BATCH ON SOLANA MAINNET...</span>
                ) : accountsCount > 0 ? (
                  <span>⚡ ONE-CLICK CLAIM ALL MEV REWARDS (+{totalRentSol} SOL · ≈ ${totalRentUsd} USD)</span>
                ) : (
                  <span>✓ ALL MEV REWARDS ALREADY CLAIMED</span>
                )}
              </button>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', opacity: 0.7, marginTop: 6, textAlign: 'center' }}>
                🔒 100% Non-Custodial: All {accountsCount} positions are claimed automatically in one Solana transaction. Lamports refund directly to your address.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          INTERACTIVE SOCIAL SHARING STATION
          ============================================================ */}
      <div className="social-sharing-station">
        <div className="social-sharing-head">
          <div>
            <div className="social-sharing-title">
              <span>📢 Share Your Recovery &amp; Earn 22% Referral Commissions</span>
            </div>
            <div className="social-sharing-sub">
              Spread the word about your +{totalRentSol} SOL MEV recovery. Every wallet that claims through your link earns you 22% lifetime commission!
            </div>
          </div>
          <span className="os-tag os-tag--magenta">22% AFFILIATE REWARD</span>
        </div>

        {/* Action Share Buttons */}
        <div className="social-share-buttons">
          <button className="social-share-btn social-share-btn--x" type="button" onClick={handleShareX}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Share on 𝕏 (Twitter)</span>
          </button>

          <button className="social-share-btn social-share-btn--tg" type="button" onClick={handleShareTelegram}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            <span>Share on Telegram</span>
          </button>

          <button className="social-share-btn social-share-btn--copy" type="button" onClick={handleCopyReceipt}>
            <span>📋</span>
            <span>{copiedReceipt ? '✓ Copied!' : 'Copy Share Receipt'}</span>
          </button>

          <button className="social-share-btn social-share-btn--ref" type="button" onClick={handleCopyRefLink}>
            <span>🔗</span>
            <span>{copiedRef ? '✓ Copied Link!' : 'Copy 22% Referral Link'}</span>
          </button>
        </div>

        {/* Live Receipt Card Preview */}
        <div className="social-card-preview">
          <div className="social-card-text">
            <span>◈ <strong>OLD CASH SOLANA MAINNET RECOVERY</strong>: </span>
            <span>Unclaimed MEV: <strong style={{ color: 'var(--green)' }}>+{totalRentSol} SOL</strong> (~${totalRentUsd} USD) · </span>
            <span>{accountsCount} Claimable Positions Auto-Buffered · </span>
            <span style={{ color: 'var(--pink)' }}>Pro-Tip: Claim after every trade!</span>
          </div>
          <button
            type="button"
            className="os-btn os-btn--dark"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={handleCopyReceipt}
          >
            {copiedReceipt ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
