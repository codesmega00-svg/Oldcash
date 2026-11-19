'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
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
    : `https://oldcash.fun/?ref=${refWallet}`;

  const shareText = `⚡ Just inspected my Solana wallet on @oldcashdotfun! ${
    totalRentSol > 0
      ? `Discovered +${totalRentSol} SOL (~$${totalRentUsd} USD) in forgotten MEV rewards 💰`
      : `Verified 100% clean with zero unclaimed lamports left behind 🛡️`
  }\n\nRule of thumb: Claim after every trade to keep 100% of your SOL.\n\nScan your wallet here 👇\n${shareUrl}\n\n#Solana #OldCash #MEV`;

  // 1. Share on 𝕏 (Twitter)
  const handleShareX = () => {
    triggerConfetti({ count: 60 });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 2. Share on Telegram
  const handleShareTelegram = () => {
    triggerConfetti({ count: 60 });
    const msg = `⚡ Discovered +${totalRentSol} SOL (~$${totalRentUsd} USD) in MEV rewards on Old Cash! Claim after every trade:\n${shareUrl}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 3. Share on WhatsApp
  const handleShareWhatsApp = () => {
    triggerConfetti({ count: 60 });
    const msg = `⚡ Found *+${totalRentSol} SOL* (~$${totalRentUsd} USD) in forgotten MEV rewards on Solana using Old Cash!\n\n💡 *Pro-Tip:* Claim after every trade to keep 100% of your SOL.\n\nCheck your wallet here 👇\n${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 4. Copy Formatted Discord Embed
  const handleCopyDiscord = () => {
    const discordText = `\`\`\`ansi
\u001b[1;36m◈ OLD CASH SOLANA RECOVERY TERMINAL // VERIFIED ON-CHAIN ◈\u001b[0m
\u001b[1;32mWallet:\u001b[0m ${shortAddr(targetWallet, 6)}
\u001b[1;33mTotal MEV Reward:\u001b[0m +${totalRentSol} SOL (≈ $${totalRentUsd} USD)
\u001b[1;35mPositions:\u001b[0m ${accountsCount} claimable accounts auto-buffered
\u001b[1;34mSecurity:\u001b[0m 100% Non-Custodial · Zero private key access
\u001b[1;37mMandate:\u001b[0m Claim after every trade!
\`\`\`
🔗 **Scan your wallet & claim MEV rewards:** <${shareUrl}>`;
    navigator.clipboard?.writeText(discordText);
    setCopiedDiscord(true);
    triggerConfetti({ count: 70 });
    showToast?.('✓ Copied Discord ANSI flex embed to clipboard!');
    setTimeout(() => setCopiedDiscord(false), 2200);
  };

  // 5. Copy Text Share Receipt
  const handleCopyReceipt = () => {
    const receiptText = `◈ OLD CASH SOLANA RECOVERY VERIFIED ◈\nWallet: ${shortAddr(targetWallet, 6)}\nTotal MEV Reward: +${totalRentSol} SOL (≈ $${totalRentUsd} USD)\nMEV Positions: ${accountsCount} positions\nStatus: 100% Non-Custodial On-Chain Claim\n👉 Scan your wallet & claim after every trade: ${shareUrl}`;
    navigator.clipboard?.writeText(receiptText);
    setCopiedReceipt(true);
    triggerConfetti({ count: 60 });
    showToast?.('✓ Copied recovery proof badge to clipboard!');
    setTimeout(() => setCopiedReceipt(false), 2200);
  };

  // 6. Copy 22% Referral Link
  const handleCopyRefLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopiedRef(true);
    triggerConfetti({ count: 60 });
    showToast?.('✓ Referral link copied! Earn 22% on every referral claim.');
    setTimeout(() => setCopiedRef(false), 2200);
  };

  // 7. Native Mobile Web Share Sheet
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Old Cash Solana MEV Recovery',
          text: shareText,
          url: shareUrl,
        });
        triggerConfetti({ count: 70 });
      } catch {}
    } else {
      handleCopyReceipt();
    }
  };

  // 8. Download Branded High-Res PNG Flex Card via HTML5 Canvas
  const handleDownloadFlexImage = () => {
    try {
      setDownloadingImg(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark cyberpunk background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
      bgGrad.addColorStop(0, '#0a0e1a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // Subtle cyan grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 630);
        ctx.stroke();
      }
      for (let y = 0; y < 630; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Holographic top border ribbon
      const holoGrad = ctx.createLinearGradient(0, 0, 1200, 0);
      holoGrad.addColorStop(0, '#ff007a');
      holoGrad.addColorStop(0.25, '#7928ca');
      holoGrad.addColorStop(0.5, '#0070f3');
      holoGrad.addColorStop(0.75, '#00ffa3');
      holoGrad.addColorStop(1, '#ff007a');
      ctx.fillStyle = holoGrad;
      ctx.fillRect(0, 0, 1200, 8);

      // Card outer border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, 1152, 582);

      // Top branding header
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('◈ OLDCASH.FUN // SOLANA MEV RECOVERY TERMINAL', 50, 75);

      ctx.fillStyle = '#00ffa3';
      ctx.font = '700 15px monospace';
      ctx.fillText('SOLANA MAINNET-BETA · 100% NON-CUSTODIAL', 740, 75);

      // Header divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.moveTo(50, 95);
      ctx.lineTo(1150, 95);
      ctx.stroke();

      // Left: Agent Telemetry Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(50, 120, 360, 420);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 120, 360, 420);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 17px monospace';
      ctx.fillText('● UNIT: AGENT-01 // CRT BOT', 70, 160);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px monospace';
      ctx.fillText(`TARGET: ${shortAddr(targetWallet, 6)}`, 70, 210);
      ctx.fillText(`STATUS: ${accountsCount} claimable positions`, 70, 250);
      ctx.fillText('BUFFER: Consolidated on-chain', 70, 290);
      ctx.fillText('SECURITY: Zero key storage', 70, 330);

      ctx.fillStyle = '#00ffa3';
      ctx.font = '700 16px monospace';
      ctx.fillText('RULE: Claim after every trade!', 70, 385);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('1-click multi-instruction execution', 70, 425);
      ctx.fillText('Atomic mainnet settlement (~400ms)', 70, 455);
      ctx.fillText('Verified cryptographic telemetry', 70, 485);

      // Right: Big MEV Reward Centerpiece
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(440, 120, 710, 420);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(440, 120, 710, 420);

      // Status pill
      ctx.fillStyle = totalRentSol > 0 ? '#ec4899' : '#00ffa3';
      ctx.font = '800 15px monospace';
      ctx.fillText(
        totalRentSol > 0 ? '🔥 WHALE MEV ALPHA UNLOCKED' : '🛡️ 100% CLEAN SOLANA WALLET (0 LOSS)',
        470,
        160
      );

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '700 16px monospace';
      ctx.fillText('TOTAL UNCLAIMED MEV REWARD', 470, 205);

      // Big SOL Amount
      ctx.fillStyle = '#00ffa3';
      ctx.font = '900 64px sans-serif';
      ctx.fillText(`+${totalRentSol} SOL`, 470, 280);

      // USD Amount
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 32px sans-serif';
      ctx.fillText(`≈ $${totalRentUsd} USD`, 470, 335);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '14px monospace';
      ctx.fillText(`Spot Rate: $${solPrice.toFixed(2)} USD / SOL · Network Fee: < $0.001`, 470, 380);

      // Metric Chips on canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(470, 410, 320, 42);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(470, 410, 320, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 14px monospace';
      ctx.fillText(`⚡ ${accountsCount} MEV Positions Auto-Buffered`, 485, 437);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(810, 410, 320, 42);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(810, 410, 320, 42);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 14px monospace';
      ctx.fillText(`Recipient: ${shortAddr(targetWallet, 6)}`, 825, 437);

      // Bottom barcode & URL stamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px monospace';
      ctx.fillText(
        `||| |||| | |||||| || | |||| ||||| | ||||| OLDCASH-${targetWallet ? targetWallet.slice(0, 8) : 'VERIFIED'}`,
        470,
        500
      );

      ctx.fillStyle = '#00ffa3';
      ctx.font = '700 14px monospace';
      ctx.fillText('👉 Scan & claim on: https://oldcash.fun', 780, 500);

      // Convert to image download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `oldcash-flex-${targetWallet ? targetWallet.slice(0, 6) : 'pass'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      triggerConfetti({ count: 80 });
      showToast?.('✓ Branded Flex Card PNG downloaded! Ready to share on social media.');
    } catch (err) {
      showToast?.('Failed to export image: ' + err.message);
    } finally {
      setDownloadingImg(false);
    }
  };

  return (
    <div className="crt-container-wrap">
      {/* ============================================================
          SHARABLE FLEX CARD (WITH HOLOGRAPHIC BORDER & BRANDING)
          ============================================================ */}
      <div className="crt-flex-card-wrapper">
        <div className="crt-hero-card crt-hero-card--flex">
          {/* Top Hologram Ribbon with Branding */}
          <div className="crt-flex-branding-bar">
            <div className="crt-flex-branding-left">
              <img
                src="/assets/logo.jpg"
                alt="Old Cash Logo"
                className="crt-flex-logo-img"
              />
              <div>
                <span className="crt-flex-brand-name">oldcash.fun</span>
                <span className="crt-flex-engine-tag">RECOVERY.OS1</span>
              </div>
            </div>

            <div className="crt-flex-branding-right">
              <div className="crt-flex-live-status">
                <span className="ticker-live-dot" />
                <span>MAINNET-BETA</span>
                <span className="nav-eq-bar" title="Live Solana Mainnet Stream">
                  <span className="nav-eq-line" />
                  <span className="nav-eq-line" />
                  <span className="nav-eq-line" />
                </span>
              </div>
              <span className={`crt-flex-status-pill ${totalRentSol > 0 ? 'crt-flex-status-pill--whale' : 'crt-flex-status-pill--clean'}`}>
                {totalRentSol > 0 ? '🔥 WHALE MEV FLEX' : '🛡️ 100% CLEAN WALLET'}
              </span>
            </div>
          </div>

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
              <div className="crt-agent-frame crt-agent-frame--holo">
                <img
                  src="/assets/tvhead.jpg"
                  alt="CRT Recovery Mascot"
                  className="crt-agent-img"
                />
                <div className="crt-scanlines" />
                <div className="crt-glass-glare" />
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
                  <svg className="crt-sol-logo crt-sol-logo--glow" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <span>⚡ ONE-CLICK CLAIM ALL MEV REWARDS</span>
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

          {/* Holographic Barcode & Security Watermark Footer */}
          <div className="crt-flex-card-footer">
            <div className="crt-flex-barcode">
              ||| |||| | |||||| || | |||| ||||| | ||||| OLDCASH-{targetWallet ? targetWallet.slice(0, 6) : 'VERIFIED'}
            </div>
            <div className="crt-flex-footer-meta">
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                SOLANA MAINNET-BETA // VERIFIED CRYPTOGRAPHIC PROOF
              </span>
              <span className="os-tag os-tag--green" style={{ fontSize: 9, padding: '1px 6px' }}>
                GENUINE FLEX CARD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          VIRAL MULTI-CHANNEL SOCIAL SHARING & FLEX HUB
          ============================================================ */}
      <div className="social-sharing-station">
        <div className="social-sharing-head">
          <div>
            <div className="social-sharing-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ticker-live-dot" />
              <span>📢 Flex Your Wallet &amp; Share on All Social Medias</span>
            </div>
            <div className="social-sharing-sub">
              Flex your {totalRentSol > 0 ? `+${totalRentSol} SOL ($${totalRentUsd} USD) MEV reward` : 'clean 0-loss wallet status'} across social media. Every wallet that claims through your link earns you 22% lifetime commission!
            </div>
          </div>
          <span className="os-tag os-tag--magenta">22% AFFILIATE REWARD</span>
        </div>

        {/* Action Share Buttons Grid */}
        <div className="social-share-buttons social-share-buttons--flex">
          {/* 1. Download Branded Flex PNG */}
          <button
            className="social-share-btn social-share-btn--download"
            type="button"
            onClick={handleDownloadFlexImage}
            disabled={downloadingImg}
            title="Download high-res PNG image to post on Twitter, Discord or Reddit"
          >
            <span>📸</span>
            <span>{downloadingImg ? 'Generating PNG...' : 'Download Flex Card PNG'}</span>
          </button>

          {/* 2. 𝕏 (Twitter) */}
          <button className="social-share-btn social-share-btn--x" type="button" onClick={handleShareX}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Share on 𝕏</span>
          </button>

          {/* 3. Telegram */}
          <button className="social-share-btn social-share-btn--tg" type="button" onClick={handleShareTelegram}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            <span>Telegram</span>
          </button>

          {/* 4. WhatsApp */}
          <button className="social-share-btn social-share-btn--wa" type="button" onClick={handleShareWhatsApp}>
            <span>💬</span>
            <span>WhatsApp</span>
          </button>

          {/* 5. Discord Formatted ANSI Embed */}
          <button className="social-share-btn social-share-btn--discord" type="button" onClick={handleCopyDiscord}>
            <span>🎮</span>
            <span>{copiedDiscord ? '✓ Copied ANSI Embed!' : 'Copy Discord Embed'}</span>
          </button>

          {/* 6. Copy Text Receipt */}
          <button className="social-share-btn social-share-btn--copy" type="button" onClick={handleCopyReceipt}>
            <span>📋</span>
            <span>{copiedReceipt ? '✓ Copied!' : 'Copy Share Receipt'}</span>
          </button>

          {/* 7. Copy 22% Referral Link */}
          <button className="social-share-btn social-share-btn--ref" type="button" onClick={handleCopyRefLink}>
            <span>🔗</span>
            <span>{copiedRef ? '✓ Copied Link!' : 'Copy 22% Link'}</span>
          </button>

          {/* 8. Mobile Native Share */}
          <button className="social-share-btn social-share-btn--native" type="button" onClick={handleNativeShare}>
            <span>📲</span>
            <span>More Options</span>
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
            style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={handleCopyReceipt}
          >
            {copiedReceipt ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
