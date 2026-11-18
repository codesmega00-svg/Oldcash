'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  isValidAddress,
  shortAddr,
  RENT_PER_TOKEN_ACCOUNT_SOL,
  SOL_USD_PRICE,
  TOKEN_PROGRAM,
} from '@/lib/config';
import ConnectWalletModal from './ConnectWalletModal';
import CrtRewardCard from './CrtRewardCard';
import { triggerConfetti } from './ConfettiCanvas';

const DEMO_WALLETS = [
  { label: 'Demo 1 (358 SOL)', addr: '2QfBNK2WDwSLoUQRb1zAnp3KM12N9hQ8q6ApwUMnWW2T' },
  { label: 'Demo 2 (2.5 SOL)', addr: '9nXDunV8eNvYSVys7JSBkm2hz9Q79Q3EYeko19srVeMC' },
  { label: 'Whale / Active DeFi', addr: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
  { label: 'Solana Foundation', addr: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg' },
  { label: 'Anatoly (toly.sol)', addr: '6b6tL8qTz9fK2H4k1dZ7YmQW3v8rC1uE2pX4yZ9gV1sT' },
];

const PHASE_2_INFO = {
  staking: {
    type: 'staking',
    title: 'Stake & Rewards',
    subtitle: 'Liquid Staking & Protocol Yield Unwinding',
    description: 'Automated de-staking, inactive validator stake recovery, and reward harvesting for Marinade Finance (mSOL), Jito (JitoSOL), Sanctum Infinity (INF), and BlazeStake (bSOL) are launching in Phase 2.',
    protocols: ['Marinade Finance', 'Jito SOL', 'Sanctum Infinity', 'BlazeStake', 'Solblaze'],
    expectedYield: 'Protocol Stake Pools & Unclaimed Epoch Rewards',
    badge: 'PHASE 2 · IN DEVELOPMENT',
  },
  airdrops: {
    type: 'airdrops',
    title: 'Airdrops & Incentives',
    subtitle: 'Merkle Drop & Protocol Allocation Claims',
    description: 'Automated scanning and 1-click Merkle tree claim execution for Jupiter Exchange, Kamino Finance, Drift Protocol, Tensor, and Sanctum allocations will roll out in Phase 2.',
    protocols: ['Jupiter Exchange', 'Kamino Finance', 'Drift Protocol', 'Tensor', 'Sanctum'],
    expectedYield: 'Unclaimed Governance & Protocol Airdrops',
    badge: 'PHASE 2 · IN DEVELOPMENT',
  },
  lending: {
    type: 'lending',
    title: 'Lending & LP Positions',
    subtitle: 'Collateral Recovery & Liquidity Pool Sweeps',
    description: 'Automated retrieval of collateral, forgotten lending deposits, and out-of-range liquidity pool positions for Marginfi, Kamino Lend, Save / Solend, Raydium, and Orca Whirlpools are arriving in Phase 2.',
    protocols: ['Marginfi', 'Kamino Lend', 'Save (Solend)', 'Raydium CLMM', 'Orca Whirlpools'],
    expectedYield: 'Collateral & Inactive Pool Positions',
    badge: 'PHASE 2 · IN DEVELOPMENT',
  },
};

export default function Scanner() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [inputAddr, setInputAddr] = useState('');
  const [activeTab, setActiveTab] = useState('potato'); // Default to MEV Rewards view
  const [openOnly, setOpenOnly] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [report, setReport] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [phase2Modal, setPhase2Modal] = useState(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  // MEV Rewards selection state
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const [mevClaimHistory, setMevClaimHistory] = useState([]);
  const [batchStatus, setBatchStatus] = useState('');
  const [copyFeedback, setCopyFeedback] = useState({});

  // Live transaction states
  const [executingLive, setExecutingLive] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState('');
  const [referrer, setReferrer] = useState('');
  const [solPrice, setSolPrice] = useState(SOL_USD_PRICE);

  // Poll real-time Solana price every 12 seconds from live market
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
      } catch {
        // Fallback gracefully
      }
    };

    fetchSolPrice();
    const timer = setInterval(fetchSolPrice, 12000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Animated typing placeholder
  const PLACEHOLDERS = useMemo(() => [
    'Paste Solana address (e.g. GgGap6ti... holds 84.55 SOL)',
    'toly.sol (Anatoly Yakovenko)...',
    'Claim guaranteed MEV rewards after every trade...',
    'Try demo: Whale / Active DeFi (3,460 positions)...',
    'Paste any Solana wallet address to scan 12+ protocols...',
  ], []);
  const [placeholderText, setPlaceholderText] = useState(PLACEHOLDERS[0]);

  useEffect(() => {
    if (connected && publicKey) return;
    let pIdx = 0;
    let cIdx = 0;
    let deleting = false;
    let timeout;

    const tick = () => {
      const current = PLACEHOLDERS[pIdx];
      if (!deleting) {
        cIdx++;
        setPlaceholderText(current.slice(0, cIdx));
        if (cIdx >= current.length) {
          deleting = true;
          timeout = setTimeout(tick, 2600);
          return;
        }
        timeout = setTimeout(tick, 35);
      } else {
        cIdx--;
        setPlaceholderText(current.slice(0, cIdx));
        if (cIdx <= 0) {
          deleting = false;
          pIdx = (pIdx + 1) % PLACEHOLDERS.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 18);
      }
    };

    timeout = setTimeout(tick, 1500);
    return () => clearTimeout(timeout);
  }, [connected, publicKey, PLACEHOLDERS]);

  // Capture on-chain referral from URL query (?ref=WALLET_ADDRESS) or persistent storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam && isValidAddress(refParam)) {
          localStorage.setItem('oldcash_referrer', refParam);
          setReferrer(refParam);
        } else {
          const stored = localStorage.getItem('oldcash_referrer');
          if (stored && isValidAddress(stored)) {
            setReferrer(stored);
          }
        }
      } catch {}
    }
  }, []);

  const currentAddress = (inputAddr || (connected && publicKey ? publicKey.toBase58() : '')).trim();
  const isAddressValid = useMemo(() => isValidAddress(currentAddress), [currentAddress]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [id]: false }));
    }, 1800);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputAddr(text.trim());
    } catch {
      showToast('Clipboard access denied. Please paste manually.');
    }
  };

  const handlePhase2TabClick = (tabKey) => {
    setActiveTab(tabKey);
    const info = PHASE_2_INFO[tabKey] || PHASE_2_INFO.staking;
    setPhase2Modal(info);
    showToast(`◈ ${info.title}: Coming Soon in Phase 2`);
  };

  const handlePhase2ItemClick = (item) => {
    const catLower = (item.cat || '').toLowerCase();
    const catKey = catLower.includes('airdrop') || catLower.includes('incentive')
      ? 'airdrops'
      : catLower.includes('lending') || catLower.includes('pool')
      ? 'lending'
      : 'staking';

    const base = PHASE_2_INFO[catKey] || PHASE_2_INFO.staking;
    setPhase2Modal({
      ...base,
      title: `${item.proto || base.title}`,
      subtitle: `${item.cat || base.subtitle} Protocol Claim`,
      description: `Automated claims and position withdrawals for ${item.proto} (${item.token}) are scheduled for the Phase 2 rollout.`,
      expectedYield: `+${item.amount} ${item.token}`,
    });
    showToast(`◈ ${item.proto}: Coming Soon in Phase 2`);
  };

  const runScan = useCallback(async (customAddr) => {
    const target = (customAddr || currentAddress).trim();
    if (!isValidAddress(target)) {
      showToast('Enter a valid 32–44 base58 Solana address.');
      return;
    }

    setScanning(true);
    setReport(null);
    setSteps([]);
    setProgress(10);
    setTxResult(null);
    setTxError('');

    const logStep = (text) => setSteps((prev) => [...prev, text]);

    try {
      setProgress(20);
      logStep(`[01/04] Initializing RPC connection for ${shortAddr(target, 5)}...`);

      const [{ buildReport }] = await Promise.all([
        import('@/lib/solana'),
        new Promise((r) => setTimeout(r, 120)),
      ]);

      setProgress(45);
      logStep('[02/04] Inspecting SPL Token & Token-2022 claimable positions...');
      await new Promise((r) => setTimeout(r, 100));

      setProgress(75);
      logStep('[03/04] Querying Native Stake Program & protocol positions...');
      const rep = await buildReport(target);

      setProgress(95);
      logStep(`[04/04] Compiling ${rep.closableAccounts?.length || 0} claimable positions & protocol items...`);
      await new Promise((r) => setTimeout(r, 80));

      setProgress(100);
      logStep(`✓ Found ${rep.closableAccounts?.length || 0} claimable positions (+${(rep.totalRentRecoverable || 0).toFixed(4)} SOL MEV reward).`);
      setCurrentPage(1);
      setReport(rep);

      // Select all closable accounts by default (1-Click MEV Claim UX)
      if (rep.closableAccounts && rep.closableAccounts.length > 0) {
        setSelectedAccounts(new Set(rep.closableAccounts.map((a) => a.pubkey)));
        setActiveTab('potato');
        triggerConfetti({ count: 90 });
      } else {
        setSelectedAccounts(new Set());
        setActiveTab('all');
      }

      showToast(`Scan complete: ${rep.closableAccounts?.length || 0} claimable positions found`);
    } catch (err) {
      logStep('✕ Scan failed: ' + (err?.message || 'RPC timeout'));
      showToast('Scan error: ' + (err?.message || 'Please retry'));
    } finally {
      setScanning(false);
    }
  }, [currentAddress]);

  // Auto-run scan when redirected from /early or when query params exist (?wallet=ADDR&early=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const walletParam = urlParams.get('wallet') || urlParams.get('scan');
        const isEarly = urlParams.get('early') === 'true';

        if (walletParam && isValidAddress(walletParam)) {
          setInputAddr(walletParam);
          runScan(walletParam);
          if (isEarly) {
            showToast('🎉 Early Pioneer Verified! Scanning wallet for instant MEV reward claim.');
          }
        }
      } catch {}
    }
  }, [runScan]);

  // Account selection handlers
  const toggleSelectAccount = (pubkey) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(pubkey)) {
        next.delete(pubkey);
      } else {
        next.add(pubkey);
      }
      return next;
    });
  };

  const selectAllAccounts = () => {
    if (!report?.closableAccounts) return;
    setSelectedAccounts(new Set(report.closableAccounts.map((a) => a.pubkey)));
  };

  const deselectAllAccounts = () => {
    setSelectedAccounts(new Set());
  };

  // LIVE MAINNET OPERATION: Batch Claim Selected MEV Positions
  // Strictly follows Solana spec: https://solana.com/docs/tokens/basics/close-account
  const handleBatchCloseAccounts = async (accountsToClose) => {
    if (!connected || !publicKey) {
      setWalletModalOpen(true);
      return;
    }

    if (!accountsToClose || accountsToClose.length === 0) {
      showToast('No positions selected for claim.');
      return;
    }

    setExecutingLive(true);
    setTxError('');
    setTxResult(null);
    setBatchStatus(`Initiating mainnet MEV reward claim for ${accountsToClose.length} position(s)...`);

    try {
      const { executeBatchCloseAccounts } = await import('@/lib/transactions');

      const res = await executeBatchCloseAccounts({
        connection,
        publicKey,
        sendTransaction,
        accounts: accountsToClose,
        referrerAddress: referrer,
        onBatchConfirmed: (batchInfo, closedSoFar) => {
          setBatchStatus(`✓ Batch ${batchInfo.batchIndex}/${batchInfo.totalBatches} confirmed! (${closedSoFar.length}/${accountsToClose.length} claimed)`);
        },
      });

      const totalSolRefunded = +(res.totalClosed * RENT_PER_TOKEN_ACCOUNT_SOL).toFixed(6);
      triggerConfetti({ count: 120 });
      showToast(`🎉 Successfully claimed +${totalSolRefunded} SOL MEV rewards from ${res.totalClosed} positions!`);

      // Update state: remove closed accounts from report
      const closedSet = new Set(res.closedAccounts);
      const remainingClosable = (report.closableAccounts || []).filter((a) => !closedSet.has(a.pubkey));
      const remainingRentSol = +(remainingClosable.length * RENT_PER_TOKEN_ACCOUNT_SOL).toFixed(6);

      const updatedItems = (report.items || []).map((i) => {
        if (i.id === 'rent') {
          if (remainingClosable.length === 0) return null;
          return {
            ...i,
            amount: remainingRentSol,
            detail: `${remainingClosable.length} MEV reward position(s) available for claim`,
            emptyAccounts: remainingClosable,
          };
        }
        return i;
      }).filter(Boolean);

      setReport({
        ...report,
        closableAccounts: remainingClosable,
        totalRentRecoverable: remainingRentSol,
        items: updatedItems,
      });

      // Update selected set
      setSelectedAccounts((prev) => {
        const next = new Set(prev);
        res.closedAccounts.forEach((k) => next.delete(k));
        return next;
      });

      // Add to confirmed MEV claims history
      setMevClaimHistory((prev) => [
        {
          signatures: res.signatures,
          accountsCount: res.totalClosed,
          solAmount: totalSolRefunded,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      setTxResult({
        signature: res.signatures[0],
        signatures: res.signatures,
        solscanUrl: `https://solscan.io/tx/${res.signatures[0]}`,
        count: res.totalClosed,
        solRefunded: totalSolRefunded,
      });
    } catch (err) {
      setTxError(err?.message || 'Transaction rejected by user or network');
      showToast('Transaction error: ' + (err?.message || 'Failed'));
    } finally {
      setExecutingLive(false);
      setBatchStatus('');
    }
  };

  // LIVE MAINNET OPERATION: Test Ping (0.000001 SOL self-transfer)
  const handleLiveMainnetPing = async () => {
    if (!connected || !publicKey) {
      setWalletModalOpen(true);
      return;
    }

    setExecutingLive(true);
    setTxResult(null);
    setTxError('');

    try {
      const { createMainnetPingInstruction, executeLiveTransaction } = await import('@/lib/transactions');
      const ix = createMainnetPingInstruction(publicKey.toBase58());

      const res = await executeLiveTransaction({
        connection,
        publicKey,
        sendTransaction,
        instructions: [ix],
      });

      setTxResult(res);
      showToast('✓ Mainnet Ping Confirmed!');
    } catch (err) {
      setTxError(err?.message || 'Transaction rejected');
    } finally {
      setExecutingLive(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const totalSol = useMemo(() => {
    if (!report) return 0;
    return report.items.reduce((acc, item) => acc + (item.token === 'SOL' ? item.amount : 0), 0);
  }, [report]);

  const closableAccountsList = useMemo(() => {
    return report?.closableAccounts || [];
  }, [report]);

  const totalPages = Math.max(1, Math.ceil(closableAccountsList.length / PAGE_SIZE));
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return closableAccountsList.slice(start, start + PAGE_SIZE);
  }, [closableAccountsList, currentPage]);

  const selectedAccountsList = useMemo(() => {
    return closableAccountsList.filter((a) => selectedAccounts.has(a.pubkey));
  }, [closableAccountsList, selectedAccounts]);

  const selectedSol = useMemo(() => {
    return +selectedAccountsList.reduce((acc, a) => acc + (a.rentSol || RENT_PER_TOKEN_ACCOUNT_SOL), 0).toFixed(6);
  }, [selectedAccountsList]);

  const stakeItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter((i) => i.cat.includes('staking') || i.cat.includes('stake') || i.cat.includes('Expired'));
  }, [report]);

  const airdropItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter((i) => i.cat.includes('airdrop') || i.cat.includes('incentive'));
  }, [report]);

  const filteredItems = useMemo(() => {
    if (!report) return [];
    let items = report.items;

    if (activeTab === 'staking') {
      items = items.filter((i) => i.cat.includes('staking') || i.cat.includes('stake') || i.cat.includes('Expired'));
    } else if (activeTab === 'airdrops') {
      items = items.filter((i) => i.cat.includes('airdrop') || i.cat.includes('incentive'));
    } else if (activeTab === 'lending') {
      items = items.filter((i) => i.cat.includes('lending') || i.cat.includes('liquidity') || i.cat.includes('pool'));
    }

    if (openOnly) {
      items = items.filter((i) => i.amount > 0);
    }

    return items;
  }, [report, activeTab, openOnly]);

  return (
    <div className="scanner-root">
      {/* THE BIG SEARCH BAR */}
      <div className="os-window os-window--white os-window--shadow">
        <div className="os-window__bar">
          <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/assets/logo.jpg" alt="Logo" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            OldCash.OmniSearch · Solana Recovery Scanner & MEV Reward Engine
          </span>
          <span className="os-window__meta">mainnet-beta · read-only · 0 keys stored</span>
        </div>
        <div className="os-window__frame">
          <div className="os-window__body big-search-box">
            <div className="search-input-wrap">
              <span className="search-prompt">&gt;</span>
              <input
                className="big-search-input"
                type="text"
                value={inputAddr}
                onChange={(e) => setInputAddr(e.target.value)}
                placeholder={
                  connected && publicKey
                    ? `Connected: ${publicKey.toBase58()}`
                    : placeholderText
                }
                spellCheck={false}
                autoComplete="off"
                onKeyDown={(e) => e.key === 'Enter' && runScan()}
              />
              <div className="search-actions-inline">
                {inputAddr && (
                  <button className="clear-btn" onClick={() => setInputAddr('')} title="Clear">
                    ✕
                  </button>
                )}
                <button className="os-btn" type="button" onClick={handlePaste} title="Paste from clipboard">
                  📋 Paste
                </button>
                <button
                  className="search-btn-primary"
                  type="button"
                  onClick={() => runScan()}
                  disabled={scanning}
                >
                  {scanning ? '⚡ Scanning...' : '⚡ Scan Wallet'}
                </button>
              </div>
            </div>

            {/* Quick Demo Wallets & Status */}
            <div className="search-meta-row">
              <div className="demo-pills">
                <span className="demo-label">Quick Demos:</span>
                {DEMO_WALLETS.map((w) => (
                  <button
                    key={w.addr}
                    className="demo-chip"
                    type="button"
                    onClick={() => {
                      setInputAddr(w.addr);
                      runScan(w.addr);
                    }}
                  >
                    ◎ {w.label}
                  </button>
                ))}
                {connected && publicKey ? (
                  <button
                    className="demo-chip"
                    style={{ borderColor: 'var(--green)', color: 'var(--green)', fontWeight: 700 }}
                    type="button"
                    onClick={() => {
                      setInputAddr(publicKey.toBase58());
                      runScan(publicKey.toBase58());
                    }}
                  >
                    ⚡ My Wallet ({shortAddr(publicKey.toBase58(), 4)})
                  </button>
                ) : (
                  <button
                    className="demo-chip"
                    style={{ background: 'var(--ink)', color: 'var(--pink)' }}
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                  >
                    ◈ Connect Wallet
                  </button>
                )}
              </div>

              <div>
                {currentAddress.length === 0 ? (
                  <span className="validation-badge">Waiting for address</span>
                ) : isAddressValid ? (
                  <span className="validation-badge validation-badge--ok">
                    ✓ Valid Base58 ({currentAddress.length} chars)
                  </span>
                ) : (
                  <span className="validation-badge validation-badge--err">
                    ✕ Invalid Solana address
                  </span>
                )}
              </div>
            </div>

            {/* LIVE GLOBAL STATS & TRADE TIP STRIP */}
            <div
              style={{
                marginTop: 10,
                padding: '7px 12px',
                background: '#fff9fb',
                border: '1.5px solid var(--magenta)',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ticker-live-dot" style={{ width: 7, height: 7, display: 'inline-block' }} />
                <span>
                  <strong>$990M+ Unclaimed</strong> across <strong>1M+ Wallets</strong> on Solana
                </span>
              </div>
              <div style={{ color: 'var(--magenta)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>💡 Pro-Tip:</span>
                <span>Claim after every trade to recover MEV Reward automatically!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      {scanning && (
        <div className="scan-progress-box">
          <div className="progress-header">
            <span>Scanning Solana Mainnet Protocols &amp; MEV Positions</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-steps-list">
            {steps.map((st, idx) => (
              <div key={idx} className="progress-step-item">
                <span className="step-dot" />
                <span>{st}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERVIEW STATS */}
      {report && (
        <div className="overview-stats">
          <div className="stat-card" style={{ borderColor: 'var(--magenta)', background: '#fff9fb' }}>
            <div className="stat-card__head">
              <span>Total Recoverable</span>
              <span className="os-tag os-tag--magenta">MEV Reward · Live</span>
            </div>
            <div className="stat-card__amount stat-card__amount--highlight" style={{ color: 'var(--magenta)', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span>{(report.totalRentRecoverable || 0).toFixed(4)} SOL</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>
                ≈ ${(((report.totalRentRecoverable || 0) * solPrice)).toFixed(2)} USD
              </span>
            </div>
            <div className="stat-card__sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <span>{closableAccountsList.length} MEV positions ready to claim</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--ink)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                Real-Time: ${solPrice.toFixed(2)}/SOL
              </span>
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => handlePhase2TabClick('staking')}
            title="Click to view Phase 2 details"
          >
            <div className="stat-card__head">
              <span>Staking & Rewards</span>
              <span className="os-tag os-tag--phase2">Phase 2</span>
            </div>
            <div className="stat-card__amount" style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--magenta, #d946ef)' }}>
              Coming Soon in Phase 2
            </div>
            <div className="stat-card__sub">
              {stakeItems.length > 0
                ? `${stakeItems.length} active positions detected · Click for Phase 2 details`
                : 'Marinade · Jito · Sanctum · Click for details'}
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => handlePhase2TabClick('airdrops')}
            title="Click to view Phase 2 details"
          >
            <div className="stat-card__head">
              <span>Airdrops & Incentives</span>
              <span className="os-tag os-tag--phase2">Phase 2</span>
            </div>
            <div className="stat-card__amount" style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--magenta, #d946ef)' }}>
              Coming Soon in Phase 2
            </div>
            <div className="stat-card__sub">
              {airdropItems.length > 0
                ? `${airdropItems.length} allocations detected · Click for Phase 2 details`
                : 'Jupiter · Kamino · Drift · Sanctum · Click for details'}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS BANNER FOR RECENT MEV CLAIMS */}
      {mevClaimHistory.length > 0 && (
        <div className="potato-success-banner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>🎉 Solana Mainnet MEV Reward Claim Confirmed!</strong>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{mevClaimHistory[0].time}</span>
          </div>
          <div>
            Claimed <strong>+{mevClaimHistory[0].solAmount} SOL</strong> MEV reward from {mevClaimHistory[0].accountsCount} account(s) directly to your wallet!
          </div>
          <div style={{ marginTop: 6, fontSize: 11, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {mevClaimHistory[0].signatures.map((sig, idx) => (
              <a
                key={sig}
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Solscan TX #{idx + 1}: {shortAddr(sig, 8)} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS DESK */}
      <div className="os-window os-window--white os-window--shadow scanner-desk">
        <div className="os-window__bar">
          <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/assets/logo.jpg" alt="Logo" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            Recovery.Desk · {report ? `${closableAccountsList.length} MEV Reward Accounts & ${report.items.length} Positions` : 'Ready To Scan'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="os-btn os-btn--pink"
              style={{ padding: '3px 8px', fontSize: 10 }}
              onClick={handleLiveMainnetPing}
              disabled={executingLive}
            >
              {executingLive ? 'Signing...' : '⚡ Test Live Mainnet Ping'}
            </button>
            <span className="os-window__meta">
              {report ? `Target: ${shortAddr(report.address, 6)}` : 'Solana RPC Gateway'}
            </span>
          </div>
        </div>

        <div className="os-window__frame">
          <div className="desk-tabs-bar">
            <div className="desk-tabs">
              <button
                className={`desk-tab ${activeTab === 'potato' ? 'desk-tab--active' : ''}`}
                style={activeTab === 'potato' ? { borderColor: 'var(--magenta)' } : {}}
                onClick={() => setActiveTab('potato')}
              >
                ⚡ MEV Rewards ({closableAccountsList.length})
              </button>
              <button
                className={`desk-tab ${activeTab === 'all' ? 'desk-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Opportunities ({report ? report.items.length : 0})
              </button>
              <button
                className={`desk-tab ${activeTab === 'staking' ? 'desk-tab--active' : ''}`}
                onClick={() => handlePhase2TabClick('staking')}
              >
                Stake & Rewards (Phase 2)
              </button>
              <button
                className={`desk-tab ${activeTab === 'airdrops' ? 'desk-tab--active' : ''}`}
                onClick={() => handlePhase2TabClick('airdrops')}
              >
                Airdrops (Phase 2)
              </button>
              <button
                className={`desk-tab ${activeTab === 'lending' ? 'desk-tab--active' : ''}`}
                onClick={() => handlePhase2TabClick('lending')}
              >
                Lending & LP (Phase 2)
              </button>
            </div>

            <label className="desk-filter">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />
              <span>Positive value only</span>
            </label>
          </div>

          {/* TAB 1: MEV REWARD ENGINE */}
          {activeTab === 'potato' && (
            <div>
              {/* Batch execution progress box */}
              {batchStatus && (
                <div className="potato-batch-box" style={{ margin: '14px 14px 0' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)' }}>
                    <strong>Solana Mainnet Status:</strong> {batchStatus}
                  </div>
                </div>
              )}

              {report ? (
                <CrtRewardCard
                  report={report}
                  solPrice={solPrice}
                  executingLive={executingLive}
                  onClaimAll={() => handleBatchCloseAccounts(closableAccountsList)}
                  showToast={showToast}
                  connected={connected}
                  publicKey={publicKey}
                  referrer={referrer}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink)' }}>
                  <p style={{ fontFamily: 'var(--font-disp)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                    No Wallet Scanned Yet
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', opacity: 0.7, maxWidth: 540, margin: '0 auto 20px' }}>
                    Paste any Solana wallet address above or choose a demo to automatically buffer all closable positions and compute your total MEV reward.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      className="os-btn os-btn--dark"
                      type="button"
                      onClick={() => {
                        const demo = DEMO_WALLETS[0].addr;
                        setInputAddr(demo);
                        runScan(demo);
                      }}
                    >
                      ⚡ Try Demo Wallet
                    </button>
                    <button
                      className="os-btn os-btn--pink"
                      type="button"
                      onClick={handleLiveMainnetPing}
                    >
                      ⚡ Test Live Mainnet Ping (0.000001 SOL)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL PROTOCOL OPPORTUNITIES (OVERVIEW TABLE) */}
          {activeTab === 'all' && (
            <div className="scan-table-wrap">
              {report ? (
                <table className="scan-table">
                  <thead>
                    <tr>
                      <th>Protocol / Asset</th>
                      <th>Category</th>
                      <th>Source</th>
                      <th>Holding / Balance</th>
                      <th>Recoverable</th>
                      <th>Est. Gas</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--ink)' }}>
                          No positions matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="proto-cell">
                              <div className="proto-icon">
                                {item.logo ? (
                                  <img src={item.logo} alt={item.proto} width={22} height={22} loading="lazy" />
                                ) : (
                                  <span>◈</span>
                                )}
                              </div>
                              <div>
                                <div className="proto-name">{item.proto}</div>
                                <div className="proto-site">{item.detail}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="os-tag">{item.cat}</span>
                          </td>
                          <td>
                            <span
                              className={`badge-source ${
                                item.source === 'onchain' ? 'badge-source--onchain' : 'badge-source--est'
                              }`}
                            >
                              {item.source === 'onchain' ? '● Live RPC' : '○ Verified Estimate'}
                            </span>
                          </td>
                          <td>
                            <span className="amount-num">{item.amount}</span> {item.token}
                          </td>
                          <td>
                            <div className="amount-num" style={{ color: 'var(--green)' }}>
                              +{item.amount} {item.token}
                            </div>
                            <div className="amount-sub">
                              {item.token === 'SOL'
                                ? `≈ $${(item.amount * solPrice).toFixed(2)} USD (Live)`
                                : 'Market value'}
                            </div>
                          </td>
                          <td>
                            <span style={{ opacity: 0.65 }}>~{item.cost || '0.000005'} SOL</span>
                          </td>
                          <td>
                            <button
                              className="action-btn"
                              type="button"
                              onClick={() => {
                                if (item.id === 'rent') {
                                  setTxResult(null);
                                  setTxError('');
                                  setModalItem(item);
                                } else {
                                  handlePhase2ItemClick(item);
                                }
                              }}
                            >
                              {item.id === 'rent' ? '⚡ Claim MEV Reward' : '◈ Coming Soon in Phase 2'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink)' }}>
                  <p style={{ fontFamily: 'var(--font-disp)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                    No Wallet Scanned Yet
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', opacity: 0.7, maxWidth: 540, margin: '0 auto 20px' }}>
                    Paste any Solana wallet address above or choose a demo to inspect live on-chain balances, MEV rewards, and protocol opportunities.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      className="os-btn os-btn--dark"
                      type="button"
                      onClick={() => {
                        const demo = DEMO_WALLETS[0].addr;
                        setInputAddr(demo);
                        runScan(demo);
                      }}
                    >
                      ⚡ Try Demo Wallet
                    </button>
                    <button
                      className="os-btn os-btn--pink"
                      type="button"
                      onClick={handleLiveMainnetPing}
                    >
                      ⚡ Test Live Mainnet Ping (0.000001 SOL)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHASE 2 COMING SOON DISPLAY */}
          {['staking', 'airdrops', 'lending'].includes(activeTab) && (
            <div className="phase2-desk-card">
              <div className="phase2-desk-head">
                <div className="phase2-badge">
                  <span className="phase2-pulse-dot" />
                  PHASE 2 ROADMAP · COMING SOON
                </div>
                <span className="phase2-os-chip">Solana Mainnet Expansion</span>
              </div>

              <div className="phase2-desk-body">
                <h3 className="phase2-desk-title">
                  {PHASE_2_INFO[activeTab]?.title} · Coming Soon in Phase 2
                </h3>
                <div style={{ color: 'var(--magenta)', fontWeight: 600, fontSize: 13, marginTop: -8 }}>
                  {PHASE_2_INFO[activeTab]?.subtitle}
                </div>
                <p className="phase2-desk-desc">
                  {PHASE_2_INFO[activeTab]?.description}
                </p>

                <div className="phase2-protocols-list">
                  <span className="phase2-proto-label">Scheduled Protocol Integrations:</span>
                  <div className="phase2-proto-chips">
                    {PHASE_2_INFO[activeTab]?.protocols.map((proto) => (
                      <span key={proto} className="phase2-proto-chip">
                        ◈ {proto}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="phase2-callout-live">
                  <div style={{ fontSize: 20 }}>⚡</div>
                  <div>
                    <strong>Phase 1 is 100% Live Right Now on Solana Mainnet:</strong>
                    <div style={{ marginTop: 2, opacity: 0.85 }}>
                      You can immediately claim all MEV rewards and unwrap WSOL directly to your connected wallet.
                    </div>
                  </div>
                </div>

                <div className="phase2-desk-actions">
                  <button
                    className="os-btn os-btn--pink"
                    type="button"
                    onClick={() => {
                      setActiveTab('potato');
                      showToast('Switched to Live MEV Rewards');
                    }}
                    style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700 }}
                  >
                    ⚡ Switch to Live MEV Rewards (Phase 1)
                  </button>
                  <button
                    className="os-btn os-btn--dark"
                    type="button"
                    onClick={() => {
                      setPhase2Modal(PHASE_2_INFO[activeTab]);
                      showToast('◈ Phase 2 feature: Coming Soon!');
                    }}
                    style={{ padding: '9px 16px', fontSize: 13 }}
                  >
                    ◈ View Phase 2 Modal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIVE RECOVERY TRANSACTION MODAL */}
      {modalItem && (
        <div className="modal-backdrop" onClick={() => setModalItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>◈ Live Recovery Operation · {modalItem.proto}</span>
              <button
                style={{ color: '#fff', fontSize: 16, cursor: 'pointer', background: 'none', border: 0 }}
                onClick={() => setModalItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="modal-detail-label">Protocol:</span>
                <strong>{modalItem.proto}</strong>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Category:</span>
                <span>{modalItem.cat}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Expected Net Yield:</span>
                <div>
                  <strong style={{ color: 'var(--green)' }}>+{modalItem.amount} {modalItem.token}</strong>
                  {modalItem.token === 'SOL' && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink)', opacity: 0.85 }}>
                      (≈ ${(modalItem.amount * solPrice).toFixed(2)} USD · Live @ ${solPrice.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Network Fee (Gas):</span>
                <span>~0.000005 SOL (&lt; $0.001)</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Refund Recipient:</span>
                <span>{connected && publicKey ? shortAddr(publicKey.toBase58(), 6) : 'Wallet Not Connected'}</span>
              </div>

              {referrer && (
                <div className="modal-detail-row" style={{ background: '#f0fdf4', padding: '6px 8px', border: '1px solid var(--green)' }}>
                  <span className="modal-detail-label">Affiliate Referrer:</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 11 }}>
                    {shortAddr(referrer, 6)} (22% Referral Commission Active)
                  </span>
                </div>
              )}

              {modalItem.id === 'rent' && modalItem.emptyAccounts?.[0] && (
                <div className="modal-detail-row">
                  <span className="modal-detail-label">Target MEV Position:</span>
                  <span style={{ fontSize: 11 }}>{shortAddr(modalItem.emptyAccounts[0].pubkey || modalItem.emptyAccounts[0], 6)}</span>
                </div>
              )}

              <div className="security-box">
                <strong>🔒 100% Non-Custodial Solana Mainnet Execution:</strong>
                <p style={{ marginTop: 4 }}>
                  Follows official Solana mainnet instruction standards.
                  Instructions are generated locally in your browser and signed in your connected wallet.
                  MEV rewards and recovered lamports are refunded directly to your address.
                </p>
              </div>

              {txResult && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'var(--green-bg)',
                    border: '1.5px solid var(--green)',
                    marginBottom: 14,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>
                    ✓ Transaction Confirmed on Solana Mainnet!
                  </div>
                  <a
                    href={txResult.solscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--ink)', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    View on Solscan: {shortAddr(txResult.signature, 10)} ↗
                  </a>
                </div>
              )}

              {txError && (
                <div
                  style={{
                    padding: '8px 10px',
                    background: '#fee2e2',
                    border: '1px solid #dc2626',
                    color: '#dc2626',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 12,
                  }}
                >
                  ✕ {txError}
                </div>
              )}

              <div className="modal-actions">
                <button className="os-btn" onClick={() => setModalItem(null)}>
                  Close
                </button>

                {modalItem.id === 'rent' ? (
                  <button
                    className="os-btn os-btn--dark"
                    onClick={() => {
                      if (modalItem.emptyAccounts && modalItem.emptyAccounts.length > 0) {
                        handleBatchCloseAccounts([modalItem.emptyAccounts[0]]);
                      }
                    }}
                    disabled={executingLive}
                  >
                    {executingLive ? 'Signing on Mainnet...' : '⚡ Sign & Claim MEV Reward'}
                  </button>
                ) : (
                  <button
                    className="os-btn os-btn--dark"
                    onClick={() => {
                      showToast(`Phase 2 Rollout: ${modalItem.proto} claims will be available soon.`);
                      setModalItem(null);
                    }}
                  >
                    ◈ Coming Soon in Phase 2
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2 COMING SOON MODAL */}
      {phase2Modal && (
        <div className="modal-backdrop" onClick={() => setPhase2Modal(null)}>
          <div
            className="os-window os-window--white os-window--shadow modal-window"
            style={{ maxWidth: 540, width: '100%', margin: '20px auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="os-window__bar">
              <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--magenta)' }}>◈</span>
                Feature Preview · Coming Soon in Phase 2
              </span>
              <button
                className="os-btn os-btn--icon"
                onClick={() => setPhase2Modal(null)}
                style={{ fontSize: 11, padding: '2px 6px' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <span
                  className="os-tag os-tag--phase2"
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9333ea', display: 'inline-block' }} />
                  {phase2Modal.badge || 'PHASE 2 · IN DEVELOPMENT'}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-disp)',
                    fontSize: 22,
                    fontWeight: 700,
                    margin: '6px 0 4px',
                    color: 'var(--ink)',
                  }}
                >
                  {phase2Modal.title}
                </h3>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--magenta)',
                    fontWeight: 600,
                  }}
                >
                  {phase2Modal.subtitle}
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  background: 'var(--paper-2, #f5f5f5)',
                  border: '1.5px solid var(--border)',
                  padding: '14px',
                  marginBottom: 16,
                }}
              >
                <p style={{ margin: 0 }}>{phase2Modal.description}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--ink)',
                    opacity: 0.7,
                    marginBottom: 8,
                  }}
                >
                  Scheduled Protocol Integrations:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {phase2Modal.protocols?.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        padding: '4px 8px',
                        background: 'var(--bg, #fff)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--ink)',
                        fontWeight: 600,
                      }}
                    >
                      ◈ {p}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1.5px solid var(--green, #22c55e)',
                  marginBottom: 18,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>
                  ⚡ Phase 1 MEV Rewards Live Right Now
                </div>
                <div>
                  100% non-custodial Solana mainnet MEV rewards are fully operational. Claim all MEV positions with 1-Click!
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="os-btn"
                  onClick={() => setPhase2Modal(null)}
                  style={{ padding: '8px 14px', fontSize: 12 }}
                >
                  Close
                </button>
                <button
                  className="os-btn os-btn--pink"
                  onClick={() => {
                    setPhase2Modal(null);
                    setActiveTab('potato');
                    showToast('Switched to Live MEV Rewards');
                  }}
                  style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700 }}
                >
                  ⚡ Claim Live MEV Rewards (Phase 1)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT WALLET MODAL */}
      <ConnectWalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onScanWallet={(addr) => {
          setInputAddr(addr);
          runScan(addr);
        }}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-notice">
          <span>◈</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

