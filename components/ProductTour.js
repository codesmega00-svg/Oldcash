'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TOUR_STEPS = [
  {
    step: 1,
    tag: 'STEP 1 OF 5 · WALLET CONNECTION',
    selector: '[data-tour="connect-wallet"]',
    title: '◈ Connect Your Solana Wallet',
    lead: 'Click the "◈ Connect Wallet" button in the top navigation bar to link your Phantom, Solflare, or Backpack wallet on Solana Mainnet-Beta.',
    bullets: [
      '100% Non-Custodial: We never ask for, read, or store private keys or seed phrases.',
      'Approved via official Wallet-Standard browser APIs.',
    ],
    actionLabel: '👉 Click Here to Open Connect Wallet',
    actionType: 'open-wallet',
    fallbackTargetId: 'scanner',
  },
  {
    step: 2,
    tag: 'STEP 2 OF 5 · ON-CHAIN RPC SCAN',
    selector: '[data-tour="demo-pills"]',
    title: '🔍 Scan Address or Try Demo',
    lead: 'Paste any public Solana address into the search bar, or click any of the 4 Quick Demos below to inspect live on-chain balances.',
    bullets: [
      'Token-2022 & standard SPL token accounts scanned via live RPC.',
      'Detects empty accounts, closed DEX markets, and uncollected MEV rewards.',
    ],
    actionLabel: '⚡ Click Here to Run "Pump.fun Alpha" Demo',
    actionType: 'run-demo',
    fallbackTargetId: 'scanner',
  },
  {
    step: 3,
    tag: 'STEP 3 OF 5 · REWARD AUDIT',
    selector: '[data-tour="crt-card"]',
    title: '💰 Discovered MEV Rewards & CRT Card',
    lead: 'The holographic CRT card reveals your total recoverable native SOL (+SOL) and converts it to live USD using real-time market spot rates.',
    bullets: [
      'View individual closable positions in the Recovery.Desk.',
      'Check unwrapped WSOL collateral and estimated gas (~0.000005 SOL).',
    ],
    actionLabel: '📊 Click Here to View Recovery Details',
    actionType: 'scroll-crt',
    fallbackTargetId: 'scanner',
  },
  {
    step: 4,
    tag: 'STEP 4 OF 5 · ATOMIC BATCH CLAIM',
    selector: '[data-tour="claim-btn"]',
    title: '⚡ 1-Click Batch Claim On Mainnet',
    lead: 'Click "⚡ ONE-CLICK CLAIM ALL MEV REWARDS" to claim all discovered positions in a single Solana mainnet transaction.',
    bullets: [
      'Packs up to 18 positions into one atomic transaction.',
      'Signed exclusively inside your wallet — 100% of reclaimed SOL refunds directly to your balance.',
      'Rule: Claim after every trade to keep 100% of your SOL safe!',
    ],
    actionLabel: '⚡ Click Here to Highlight Claim Button',
    actionType: 'highlight-claim',
    fallbackTargetId: 'scanner',
  },
  {
    step: 5,
    tag: 'STEP 5 OF 5 · 22% AFFILIATE REVENUE',
    selector: '[data-tour="referral-nav"]',
    title: '🤝 Earn 22% Lifetime Referral Commissions',
    lead: 'Click "🤝 Referrals (22%)" in the top navigation to visit the Referral Terminal and create your custom affiliate link.',
    bullets: [
      'Earn 22% of all protocol fees recovered by users who claim through your link.',
      'Commissions are routed straight to your payout wallet atomically on-chain.',
    ],
    actionLabel: '🤝 Click Here to Go to Referral Terminal →',
    actionType: 'go-referral',
    fallbackTargetId: null,
  },
];

export default function ProductTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [viewMode, setViewMode] = useState('spotlight'); // 'spotlight' or 'modal'
  const resizeTimerRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    const handleOpenTour = () => {
      setIsOpen(true);
      setCurrentStepIdx(0);
      setViewMode('spotlight');
    };

    window.addEventListener('open-oldcash-tour', handleOpenTour);
    return () => window.removeEventListener('open-oldcash-tour', handleOpenTour);
  }, []);

  const updateTargetRect = () => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIdx];
    let el = document.querySelector(step.selector);
    if (!el && step.fallbackTargetId) {
      el = document.getElementById(step.fallbackTargetId);
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
      }, 350);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      const onScrollOrResize = () => {
        clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = setTimeout(updateTargetRect, 80);
      };
      window.addEventListener('resize', onScrollOrResize);
      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      return () => {
        window.removeEventListener('resize', onScrollOrResize);
        window.removeEventListener('scroll', onScrollOrResize);
      };
    }
  }, [isOpen, currentStepIdx]);

  // Keyboard navigation
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

  const handleActionClick = () => {
    const step = TOUR_STEPS[currentStepIdx];
    if (step.actionType === 'open-wallet') {
      const btn = document.querySelector('[data-tour="connect-wallet"]');
      if (btn) btn.click();
      handleNext();
    } else if (step.actionType === 'run-demo') {
      const demoBtn = document.querySelector('[data-tour="demo-pills"] button');
      if (demoBtn) demoBtn.click();
      setTimeout(() => {
        handleNext();
      }, 900);
    } else if (step.actionType === 'scroll-crt') {
      const crt = document.querySelector('[data-tour="crt-card"]') || document.getElementById('scanner');
      if (crt) crt.scrollIntoView({ behavior: 'smooth', block: 'center' });
      handleNext();
    } else if (step.actionType === 'highlight-claim') {
      const claimBtn = document.querySelector('[data-tour="claim-btn"]');
      if (claimBtn) {
        claimBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        claimBtn.classList.add('tour-claim-pulse-active');
        setTimeout(() => claimBtn.classList.remove('tour-claim-pulse-active'), 2000);
      }
      handleNext();
    } else if (step.actionType === 'go-referral') {
      setIsOpen(false);
      window.location.href = '/referral';
    }
  };

  const current = TOUR_STEPS[currentStepIdx];

  // Calculate tooltip popover positioning relative to target element
  const getTooltipStyle = () => {
    if (!targetRect || typeof window === 'undefined') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      return {
        bottom: '16px',
        left: '12px',
        right: '12px',
        maxWidth: 'calc(100vw - 24px)',
        margin: '0 auto',
      };
    }

    // Desktop positioning
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top = targetRect.bottom + 14;
    let left = targetRect.left;

    if (spaceBelow < 280 && spaceAbove > 280) {
      top = targetRect.top - 290;
    }

    // Keep within horizontal bounds
    if (left + 460 > window.innerWidth) {
      left = window.innerWidth - 475;
    }
    if (left < 16) left = 16;

    return {
      top: `${Math.max(16, top)}px`,
      left: `${Math.max(16, left)}px`,
    };
  };

  return (
    <>
      {/* Floating Tour Launch Pill (Bottom-Left) */}
      <div className="product-tour-pill">
        <button
          className="product-tour-launch-btn"
          type="button"
          onClick={() => {
            setCurrentStepIdx(0);
            setIsOpen(true);
            setViewMode('spotlight');
          }}
          title="Open interactive clickable product walkthrough"
        >
          <span className="product-tour-icon">🗺️</span>
          <span className="product-tour-label">CLICKABLE TOUR</span>
          <span className="product-tour-step-badge">5 STEPS</span>
        </button>
      </div>

      {/* Interactive Spotlight & Clickable Tour Portal */}
      {isOpen && mounted && createPortal(
        <div className="tour-spotlight-layer" role="dialog" aria-modal="true">
          {/* Spotlight Cutout Overlay */}
          {targetRect && (
            <div
              className="tour-spotlight-cutout"
              style={{
                top: `${targetRect.top - 6}px`,
                left: `${targetRect.left - 6}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 12}px`,
              }}
              onClick={handleActionClick}
              title="Click target element directly to execute"
            />
          )}

          {/* Clickable Floating Tooltip Box */}
          <div
            className="tour-spotlight-card"
            style={getTooltipStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Window Bar */}
            <div className="tour-spotlight-head">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ticker-live-dot" />
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, textTransform: 'uppercase' }}>
                  {current.tag}
                </span>
              </span>
              <button
                className="modal-close-btn"
                style={{ padding: '2px 6px', fontSize: 14 }}
                onClick={() => setIsOpen(false)}
                title="Exit tour (ESC)"
              >
                ✕
              </button>
            </div>

            {/* Stepper Dots Row */}
            <div className="tour-dots-ribbon">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  className={`tour-dot-btn ${idx === currentStepIdx ? 'tour-dot-btn--active' : idx < currentStepIdx ? 'tour-dot-btn--done' : ''}`}
                  onClick={() => setCurrentStepIdx(idx)}
                  title={`Jump to Step ${s.step}`}
                >
                  {idx < currentStepIdx ? '✓' : s.step}
                </button>
              ))}
              <span className="tour-step-tagline">{currentStepIdx + 1} of 5</span>
            </div>

            {/* Body Description */}
            <div className="tour-spotlight-body">
              <h3 className="tour-card-h3">{current.title}</h3>
              <p className="tour-card-p">{current.lead}</p>

              <ul className="tour-card-ul">
                {current.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              {/* Big Interactive Clickable Action Button */}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="os-btn os-btn--pink tour-execute-btn"
                  onClick={handleActionClick}
                >
                  <span>{current.actionLabel}</span>
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="tour-spotlight-footer">
              <button
                type="button"
                className="os-btn tour-btn-sm"
                disabled={currentStepIdx === 0}
                onClick={handlePrev}
                style={{ opacity: currentStepIdx === 0 ? 0.35 : 1 }}
              >
                ← Prev
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="os-btn tour-skip-text"
                  onClick={() => setIsOpen(false)}
                >
                  Exit
                </button>
                <button
                  type="button"
                  className="os-btn os-btn--dark tour-btn-sm"
                  onClick={handleNext}
                >
                  {currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish 🎉' : 'Next Step →'}
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
