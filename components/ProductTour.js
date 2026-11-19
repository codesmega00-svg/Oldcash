'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const TOUR_STEPS = [
  {
    step: 1,
    badge: 'STEP 1 OF 5',
    tag: 'WALLET CONNECTION',
    title: 'Connect Your Solana Wallet',
    lead: 'Click the "◈ Connect Wallet" button to securely link your wallet on Solana Mainnet-Beta.',
    bullets: [
      'Supports Phantom, Solflare, Backpack, and all Wallet-Standard providers.',
      '100% Non-Custodial: We never request, read, or store private keys or seed phrases.',
      'Don\'t have a wallet handy? You can click "⚡ Try Demo Wallet" to test the full recovery flow instantly.',
    ],
    targetId: 'scanner',
    actionText: '◈ Open Connect Wallet Modal',
    actionType: 'wallet',
  },
  {
    step: 2,
    badge: 'STEP 2 OF 5',
    tag: 'DEEP ON-CHAIN SCAN',
    title: 'Scan Any Solana Address',
    lead: 'Paste any public Solana wallet address into the search terminal and click "⚡ Scan Wallet".',
    bullets: [
      'Queries live Solana Mainnet RPC nodes in real-time across Token-2022 and SPL accounts.',
      'Detects forgotten empty token accounts, closed market positions, and uncollected MEV yield.',
      'You can also click any of the 4 quick demo pills: Jupiter Whale, Raydium LP, Pump.fun Alpha, or Meteora LP.',
    ],
    targetId: 'scanner',
    actionText: '🔍 Scroll to Search Bar',
    actionType: 'scroll-search',
  },
  {
    step: 3,
    badge: 'STEP 3 OF 5',
    tag: 'AUDIT MATRIX',
    title: 'Review The MEV Reward Matrix & CRT Card',
    lead: 'Inspect your discovered MEV rewards on the holographic CRT Reward Card.',
    bullets: [
      'Shows your total recoverable balance in native SOL (+SOL) with live USD spot conversion.',
      'Itemizes each individual closable position, protocol source, and token mint address.',
      'Reveals unwrapped WSOL collateral and protocol incentives waiting to be reclaimed.',
    ],
    targetId: 'how',
    actionText: '📊 Scroll to Architecture & Coverage',
    actionType: 'scroll-how',
  },
  {
    step: 4,
    badge: 'STEP 4 OF 5',
    tag: '1-CLICK EXECUTION',
    title: 'Claim All MEV Rewards In 1 Click',
    lead: 'Click "⚡ ONE-CLICK CLAIM ALL MEV REWARDS" to claim all positions in one batch.',
    bullets: [
      'Bundles up to 18 position closures into a single Solana transaction.',
      'Signed exclusively inside your own wallet — zero third-party custody.',
      'Deposited lamports refund directly back to your address in the same block.',
      'Pro-Trader Mandate: "Claim after every trade to keep 100% of your SOL safe and liquid."',
    ],
    targetId: 'scanner',
    actionText: '⚡ Inspect Scanner Execution Area',
    actionType: 'scroll-scanner',
  },
  {
    step: 5,
    badge: 'STEP 5 OF 5',
    tag: '22% AFFILIATE REVENUE',
    title: 'Earn 22% Lifetime Referral Commissions',
    lead: 'Visit the Referral Terminal (/referral) to create your custom affiliate link.',
    bullets: [
      'Every wallet that claims MEV rewards via your link pays you 22% lifetime commission.',
      'Commissions are routed straight to your Solana payout wallet atomically on-chain.',
      'Includes interactive earnings simulator, live volume analytics, and branded share cards.',
    ],
    targetId: null,
    actionText: '🤝 Visit Referral Terminal →',
    actionType: 'link-referral',
  },
];

export default function ProductTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleOpenTour = () => {
      setIsOpen(true);
      setCurrentStepIdx(0);
    };

    window.addEventListener('open-oldcash-tour', handleOpenTour);
    return () => window.removeEventListener('open-oldcash-tour', handleOpenTour);
  }, []);

  // Prevent background scroll while tour modal is active
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard navigation: Left/Right arrows for steps, ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIdx]);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleStepAction = (step) => {
    if (step.actionType === 'wallet') {
      setIsOpen(false);
      // Trigger connect wallet modal
      const connectBtn = document.querySelector('.site-nav .os-btn--dark');
      if (connectBtn) {
        connectBtn.click();
      }
    } else if (step.actionType === 'scroll-search' || step.actionType === 'scroll-scanner') {
      setIsOpen(false);
      const el = document.getElementById('scanner');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        const input = el.querySelector('input');
        if (input) {
          setTimeout(() => input.focus(), 500);
        }
      }
    } else if (step.actionType === 'scroll-how') {
      setIsOpen(false);
      const el = document.getElementById('how');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (step.actionType === 'link-referral') {
      setIsOpen(false);
      window.location.href = '/referral';
    }
  };

  const current = TOUR_STEPS[currentStepIdx];
  const progressPercent = Math.round(((currentStepIdx + 1) / TOUR_STEPS.length) * 100);

  return (
    <>
      {/* Floating Tour Launch Pill (Bottom Left) */}
      <div className="product-tour-pill">
        <button
          className="product-tour-launch-btn"
          type="button"
          onClick={() => {
            setCurrentStepIdx(0);
            setIsOpen(true);
          }}
          title="Open interactive step-by-step product walkthrough"
        >
          <span className="product-tour-icon">🗺️</span>
          <span className="product-tour-label">PRODUCT TOUR</span>
          <span className="product-tour-step-badge">5 STEPS</span>
        </button>
      </div>

      {/* Interactive Modal Walkthrough */}
      {isOpen && mounted && createPortal(
        <div
          className="modal-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-dialog-title"
        >
          <div
            className="modal-card product-tour-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Window Top Titlebar */}
            <div className="modal-header">
              <span id="tour-dialog-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🗺️</span>
                <span>OLD CASH PROTOCOL · INTERACTIVE PRODUCT TOUR</span>
              </span>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close product tour"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Ribbon */}
            <div className="tour-stepper-header">
              <div className="tour-steps-row">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    className={`tour-step-pill ${idx === currentStepIdx ? 'tour-step-pill--active' : idx < currentStepIdx ? 'tour-step-pill--done' : ''}`}
                    onClick={() => setCurrentStepIdx(idx)}
                  >
                    <span>{idx < currentStepIdx ? '✓' : s.step}</span>
                    <span className="tour-step-pill-text">{s.tag}</span>
                  </button>
                ))}
              </div>
              <div className="tour-progress-bar-wrap">
                <div
                  className="tour-progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Tour Body Content */}
            <div className="modal-body tour-card-body">
              <div className="tour-meta-row">
                <span className="os-tag os-tag--magenta">{current.badge}</span>
                <span className="os-tag os-tag--green">● LIVE SOLANA MAINNET</span>
                <span className="tour-step-counter">{currentStepIdx + 1} of {TOUR_STEPS.length}</span>
              </div>

              <h2 className="tour-step-title">{current.title}</h2>
              <p className="tour-step-lead">{current.lead}</p>

              <div className="tour-step-box">
                <div className="tour-box-title">⚡ PROTOCOL EXECUTION GUIDE:</div>
                <ul className="tour-bullet-list">
                  {current.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              {/* Direct In-Step Action Button */}
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="os-btn os-btn--pink tour-action-jump-btn"
                  onClick={() => handleStepAction(current)}
                >
                  <span>{current.actionText}</span>
                </button>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="tour-footer-controls">
              <button
                type="button"
                className="os-btn tour-nav-btn"
                disabled={currentStepIdx === 0}
                onClick={handlePrev}
                style={{ opacity: currentStepIdx === 0 ? 0.4 : 1 }}
              >
                ← Previous Step
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="os-btn tour-skip-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Exit Tour
                </button>

                <button
                  type="button"
                  className="os-btn os-btn--dark tour-nav-btn"
                  onClick={handleNext}
                >
                  {currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish Tour 🎉' : 'Next Step →'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
