'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { shortAddr, LAMPORTS_PER_SOL } from '@/lib/config';

export default function ConnectWalletModal({ isOpen, onClose, onScanWallet }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { wallets, select, wallet, connect, connected, publicKey, disconnect, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mount tracking & mobile user agent check
  useEffect(() => {
    setMounted(true);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Prevent background body scroll when modal is open on desktop & mobile
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // ESC key listener to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch balance when connected
  useEffect(() => {
    let active = true;
    if (connected && publicKey && connection) {
      connection
        .getBalance(publicKey)
        .then((b) => {
          if (active) setBalance(b / LAMPORTS_PER_SOL);
        })
        .catch(() => {});
    } else {
      setBalance(null);
    }
    return () => {
      active = false;
    };
  }, [connected, publicKey, connection]);

  if (!isOpen || !mounted) return null;

  const handleSelectWallet = async (wName) => {
    setErrorMsg('');
    try {
      select(wName);
      const selectedWallet = wallets.find((w) => w.adapter.name === wName);

      // If wallet extension / in-app provider is ready, connect directly
      if (selectedWallet && selectedWallet.readyState === 'Installed') {
        await selectedWallet.adapter.connect();
      } else {
        // Handle mobile browser outside wallet app or desktop without extension
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://oldcash.io';
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://oldcash.io';

        if (wName.toLowerCase().includes('phantom')) {
          if (isMobileDevice) {
            window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(currentOrigin)}`;
          } else {
            window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer');
          }
        } else if (wName.toLowerCase().includes('solflare')) {
          if (isMobileDevice) {
            window.location.href = `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}`;
          } else {
            window.open('https://solflare.com/download', '_blank', 'noopener,noreferrer');
          }
        } else {
          setErrorMsg(`${wName} not detected. Please install the extension or launch via wallet mobile browser.`);
        }
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to connect wallet');
    }
  };

  const handleCopyAddr = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-wallet-title"
    >
      <div
        className="modal-card modal-card--wallet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Window Header */}
        <div className="modal-header">
          <span id="connect-wallet-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/assets/logo.jpg" alt="Old Cash" style={{ width: 18, height: 18, borderRadius: '50%' }} />
            <span>Wallet.Connect · Solana Mainnet</span>
          </span>
          <button
            className="modal-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Network Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'var(--grey-1)',
              border: '1px solid var(--ink)',
              fontFamily: 'var(--font-pixel)',
              fontSize: 11,
              marginBottom: 14,
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="engine-pill__dot" style={{ width: 6, height: 6 }} />
              Solana Mainnet-Beta
            </span>
            <span style={{ opacity: 0.65 }}>Chain ID: 101</span>
          </div>

          {connected && publicKey ? (
            /* ============================================================
               CONNECTED STATE
               ============================================================ */
            <div>
              <div
                style={{
                  background: 'var(--green-bg)',
                  border: '1.5px solid var(--green)',
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, textTransform: 'uppercase', color: 'var(--green)', fontWeight: 700 }}>
                    ● Connected Wallet
                  </span>
                  <span className="os-tag">{wallet?.adapter?.name || 'Solana Wallet'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, wordBreak: 'break-all' }}>
                    {shortAddr(publicKey.toBase58(), 6)}
                  </span>
                  <button
                    className="os-btn"
                    style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }}
                    onClick={handleCopyAddr}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  Balance:{' '}
                  <strong>{balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}</strong>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="os-btn os-btn--pink"
                  style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}
                  onClick={() => {
                    if (onScanWallet) onScanWallet(publicKey.toBase58());
                    onClose();
                  }}
                >
                  ⚡ Scan This Wallet
                </button>
                <button
                  className="os-btn"
                  style={{ justifyContent: 'center', minWidth: 100 }}
                  onClick={() => disconnect()}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================
               CONNECT PROVIDER SELECTION LIST
               ============================================================ */
            <div>
              {/* Dedicated 1-Tap Mobile Wallet Deep Link Section */}
              {isMobile && (
                <div
                  style={{
                    marginBottom: 14,
                    background: 'var(--grey-1)',
                    border: '1px solid var(--grey-3)',
                    padding: '10px 12px',
                    borderRadius: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>
                      📱 MOBILE 1-TAP CONNECT
                    </span>
                    <span className="os-tag os-tag--green" style={{ fontSize: 9 }}>AUTO DEEP LINK</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink-86)', marginBottom: 8, lineHeight: 1.35 }}>
                    Browsing on mobile? Tap below to launch Old Cash directly in your wallet app:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <a
                      href={`https://phantom.app/ul/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}?ref=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                      className="os-btn os-btn--pink"
                      style={{ justifyContent: 'center', padding: '8px 6px', fontSize: 11, textDecoration: 'none' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>🟣 Open Phantom</span>
                    </a>
                    <a
                      href={`https://solflare.com/ul/v1/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      className="os-btn os-btn--dark"
                      style={{ justifyContent: 'center', padding: '8px 6px', fontSize: 11, textDecoration: 'none' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>🟡 Open Solflare</span>
                    </a>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 13, color: 'var(--ink-86)', marginBottom: 12, lineHeight: 1.4 }}>
                Select an installed Solana wallet or mobile app to scan and execute non-custodial MEV claims:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {wallets.map((w) => {
                  const isInstalled = w.readyState === 'Installed';
                  return (
                    <button
                      key={w.adapter.name}
                      className="os-btn"
                      type="button"
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--white)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onClick={() => handleSelectWallet(w.adapter.name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        {w.adapter.icon && (
                          <img
                            src={w.adapter.icon}
                            alt={w.adapter.name}
                            width={24}
                            height={24}
                            style={{ borderRadius: 4, flexShrink: 0 }}
                          />
                        )}
                        <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {w.adapter.name}
                        </span>
                      </div>
                      <span
                        className={`os-tag ${isInstalled ? 'os-tag--green' : ''}`}
                        style={{ fontSize: 10, flexShrink: 0 }}
                      >
                        {isInstalled ? '● Detected' : isMobile ? 'Mobile 1-Tap' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  background: 'var(--grey-1)',
                  border: '1px solid var(--grey-2)',
                  padding: '10px 12px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.5,
                  color: 'var(--ink-86)',
                }}
              >
                🔒 <strong>Non-Custodial Guarantee:</strong> Old Cash connects via standard browser provider APIs (Wallet Standard). It never asks for, reads, or stores private keys or seed phrases.
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 10px',
                background: '#fee2e2',
                border: '1px solid #dc2626',
                color: '#dc2626',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
            >
              ✕ {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
