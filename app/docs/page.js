'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import ThemeBackground from '@/components/ThemeBackground';
import CreativeFooter from '@/components/CreativeFooter';
import { shortAddr, SOL_USD_PRICE } from '@/lib/config';

const PROTOCOLS_DOCS = [
  {
    id: 'pumpfun',
    name: 'pump.fun',
    category: 'Bonding Curve & Launchpad',
    badge: 'LIVE · HIGH VOLUME',
    desc: 'The leading Solana bonding curve launchpad. Every token bought, traded, or graduated on pump.fun creates an account initialized with SOL lamports. When traders sell or rotate out of a memecoin, that account remains open with lamports held on-chain.',
    recoveryMechanism: 'Old Cash scans all historical token mints from pump.fun, filters out empty balances, and compiles them into a single 1-click batch transaction that closes the account and returns all SOL directly to your main wallet.',
    impact: 'Active pump.fun degens typically accumulate +0.10 to +0.85 SOL in forgotten MEV lamports every month across 50-200 memecoin trades.',
    apiSupport: 'Full RPC auto-detection via GET /api/scan?wallet={address}',
  },
  {
    id: 'axiom',
    name: 'axiom.trade',
    category: 'High-Speed DEX Terminal',
    badge: 'TERMINAL & BOT INTEGRATION',
    desc: 'The professional high-speed Solana trading terminal. Pro snipers, automated volume bots, and copy-traders on axiom.trade execute hundreds of swaps every hour, generating hundreds of temporary positions that trap SOL lamports.',
    recoveryMechanism: 'Old Cash exposes lightweight REST APIs and WebSocket stream hooks designed for seamless integration into axiom.trade automated post-trade sweeps, returning SOL directly to your active trading balance.',
    impact: 'Automated post-trade sweeps on axiom.trade recover 100% of trading buffer lamports, boosting net PnL by up to 1.5% across high-frequency strategies.',
    apiSupport: 'WebSocket subscriptions & POST /api/v1/build-claim-tx',
  },
  {
    id: 'fomo',
    name: 'fomo.family',
    category: 'Social Alpha & Whitelist Network',
    badge: 'COMMUNITY RECOVERY',
    desc: 'The social alpha and copy-trading collective for Solana degens. Community syndicates, shared vaults, and wallet groups often execute collective snipes across dozens of secondary wallets where forgotten funds sit unclaimed.',
    recoveryMechanism: 'Using Old Cash bulk scan endpoints, fomo.family communities can track collective unclaimed MEV rewards across hundreds of member wallets and execute non-custodial batch recoveries with built-in 22% affiliate reward splits.',
    impact: 'Social syndicates can locate thousands of dollars in forgotten MEV lamports across all member addresses.',
    apiSupport: 'Batch scan endpoint & 22% affiliate referral revenue share',
  },
  {
    id: 'raydium',
    name: 'Raydium & Orca',
    category: 'Automated Market Makers & CLMM',
    badge: 'DEX SWAPS & LP SWEEP',
    desc: 'Raydium AMM, CPMM, and Orca Whirlpools power the majority of Solana swap routing. Liquidity providers and swappers frequently leave behind empty open-orders accounts and inactive tick positions with deposited SOL.',
    recoveryMechanism: 'Identifies unclosed OpenOrders and pool positions, preparing non-custodial close instructions directly to the owner.',
    impact: 'Standard swap routing accounts store ~0.002039 SOL per unique token paired.',
    apiSupport: 'Supported on mainnet via universal scanner',
  },
  {
    id: 'jupiter',
    name: 'Jupiter Exchange',
    category: 'DEX Aggregator & Airdrop Merkle',
    badge: 'AIRDROP & LIMIT ORDERS',
    desc: 'The leading Solana swap aggregator. Truncated limit orders, dollar-cost averaging (DCA) escrow accounts, and unclaimed Merkle airdrop allocations accumulate across active wallets.',
    recoveryMechanism: 'Phase 1 supports immediate MEV reward refunds for all swap routing accounts; Phase 2 roadmap introduces 1-click Merkle tree claim execution for unclaimed allocations.',
    impact: 'Unclaimed governance allocations & escrow balances.',
    apiSupport: 'Phase 1 Live · Phase 2 Expansion Scheduled',
  },
  {
    id: 'uniswap',
    name: 'Uniswap (SVM)',
    category: 'Cross-Chain SVM DEX',
    badge: 'SVM LIQUIDITY & SWAPS',
    desc: 'Uniswap on the Solana Virtual Machine (app.uniswap.org). Liquidity providers, cross-chain swappers, and automated market makers leave uncollected fee rebates and temporary routing escrow accounts holding native SOL.',
    recoveryMechanism: 'Old Cash detects empty SVM routing positions and compiles automated reclamation instructions into 1-click non-custodial batch transactions.',
    impact: 'Recovers swap routing buffers and uncollected fee lamports across all SVM pools.',
    apiSupport: 'Supported via GET /api/scan?wallet={address}',
  },
  {
    id: 'meteora',
    name: 'Meteora DLMM',
    category: 'Dynamic Liquidity Market Maker',
    badge: 'DLMM & ACTIVE BINS',
    desc: 'Meteora dynamic liquidity pools (meteora.ag). Out-of-range DLMM positions, uncollected fee yields, and dynamic vault accounts store deposited lamports that can be claimed directly back to the LP owner.',
    recoveryMechanism: 'Identifies inactive DLMM bins and empty token vault routing accounts, preparing client-signed recovery instructions.',
    impact: 'Recovers idle bin lamports and unharvested trading fees across all DLMM pairs.',
    apiSupport: 'Supported via GET /api/scan & Phase 2 LP sweeps',
  },
  {
    id: 'staking',
    name: 'Marinade & Jito MEV',
    category: 'Liquid Staking & Validator Pools',
    badge: 'LST & MEV TIPS',
    desc: 'Marinade Finance (mSOL), Jito (JitoSOL), and native validator stake accounts. Inactive stakes and uncollected MEV validator tips often remain forgotten after epochs end.',
    recoveryMechanism: 'Automated stake pool account deactivation, validator stake withdrawal, and Jito MEV tip recovery rolling out in Phase 2.',
    impact: 'Deactivated validator stake accounts holding recoverable SOL.',
    apiSupport: 'Phase 2 Roadmap',
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X GET "https://oldcash.fun/api/scan?wallet=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" \\
  -H "Accept: application/json"`,

  typescript: `import { Connection, PublicKey } from '@solana/web3.js';

// 1. Scan any Solana wallet for claimable MEV rewards
async function checkMevReward(walletAddress: string) {
  const res = await fetch(\`https://oldcash.fun/api/scan?wallet=\${walletAddress}\`);
  const data = await res.json();

  console.log(\`Found \${data.closableAccounts.length} claimable positions\`);
  console.log(\`Total MEV Recoverable: +\${data.totalRentRecoverable} SOL\`);
  console.log(\`Live USD Value: $\${(data.totalRentRecoverable * data.solPrice).toFixed(2)} USD\`);

  return data;
}

// 2. Example for automated bot sweep (axiom.trade / pump.fun)
checkMevReward('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');`,

  python: `import requests

def scan_solana_wallet(wallet_address: str):
    """Scan any wallet for claimable MEV rewards across Solana mainnet."""
    url = f"https://oldcash.fun/api/scan?wallet={wallet_address}"
    resp = requests.get(url, headers={"Accept": "application/json"})
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"Wallet: {data.get('address')}")
        print(f"Total MEV Reward: +{data.get('totalRentRecoverable')} SOL")
        print(f"Claimable Accounts: {len(data.get('closableAccounts', []))}")
        return data
    else:
        raise Exception(f"API Error {resp.status_code}: {resp.text}")

# Run scan
scan_solana_wallet("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM")`,
};

export default function DocsPage() {
  const [activeCodeTab, setActiveCodeTab] = useState('curl');
  const [consoleInput, setConsoleInput] = useState('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
  const [consoleRes, setConsoleRes] = useState(null);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live test against local /api/scan
  const handleTestApi = async () => {
    const trimmed = consoleInput.trim();
    if (!trimmed) return;
    setConsoleLoading(true);
    try {
      const res = await fetch(`/api/scan?wallet=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      setConsoleRes(json);
    } catch (e) {
      setConsoleRes({ error: 'Network error or invalid address', details: String(e) });
    } finally {
      setConsoleLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(CODE_EXAMPLES[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <>
      <ThemeBackground />

      {/* ============================================================
          TOP NAV BAR FOR DOCS
          ============================================================ */}
      <header className="docs-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" className="docs-brand">
            <img src="/assets/logo.jpg" alt="Old Cash" className="docs-brand-logo" />
            <div>
              <div className="docs-brand-title">oldcash.fun</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                DEVELOPER DOCS &amp; API PORTAL
              </div>
            </div>
          </Link>

          <nav className="docs-nav-links" style={{ display: 'none' /* hidden on mobile, shown via media */ }}>
            <a href="#overview" className="docs-nav-link">Overview</a>
            <a href="#protocols" className="docs-nav-link">Protocols</a>
            <a href="#api" className="docs-nav-link">API Reference</a>
            <a href="#sdks" className="docs-nav-link">SDKs</a>
            <a href="#console" className="docs-nav-link">Live Console</a>
          </nav>
        </div>

        <div className="docs-nav-right">
          <ThemeToggle />
          <Link href="/early" className="early-simple-back-btn" style={{ borderColor: 'var(--magenta)', color: 'var(--magenta)' }}>
            <span>⚡</span>
            <span>Early Access</span>
          </Link>
          <Link href="/" className="early-simple-back-btn">
            <span>←</span>
            <span>Scanner</span>
          </Link>
        </div>
      </header>

      {/* ============================================================
          MAIN DOCS CONTAINER (SIDEBAR + CONTENT)
          ============================================================ */}
      <div className="docs-container">
        {/* Sticky Sidebar */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">Getting Started</div>
            <ul className="docs-sidebar-list">
              <li><a href="#overview" className="docs-sidebar-item docs-sidebar-item--active">Architecture Overview</a></li>
              <li><a href="#economics" className="docs-sidebar-item">MEV Lamport Economics</a></li>
              <li><a href="#rule" className="docs-sidebar-item">Claim After Every Trade</a></li>
            </ul>
          </div>

          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">Protocol Integrations</div>
            <ul className="docs-sidebar-list">
              <li><a href="#pumpfun" className="docs-sidebar-item">pump.fun Bonding Curves</a></li>
              <li><a href="#axiom" className="docs-sidebar-item">axiom.trade Terminals</a></li>
              <li><a href="#fomo" className="docs-sidebar-item">fomo.family Alpha</a></li>
              <li><a href="#uniswap" className="docs-sidebar-item">Uniswap (SVM)</a></li>
              <li><a href="#meteora" className="docs-sidebar-item">Meteora DLMM</a></li>
              <li><a href="#dexs" className="docs-sidebar-item">Raydium, Orca &amp; Jupiter</a></li>
              <li><a href="#staking" className="docs-sidebar-item">Liquid Staking (LST)</a></li>
            </ul>
          </div>

          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">Developer API Reference</div>
            <ul className="docs-sidebar-list">
              <li><a href="#endpoint-scan" className="docs-sidebar-item">GET /api/scan</a></li>
              <li><a href="#endpoint-prices" className="docs-sidebar-item">GET /api/prices</a></li>
              <li><a href="#endpoint-claim" className="docs-sidebar-item">POST /v1/build-claim-tx</a></li>
              <li><a href="#endpoint-ws" className="docs-sidebar-item">WebSocket Live Streams</a></li>
              <li><a href="#console" className="docs-sidebar-item">Interactive Dev Console</a></li>
            </ul>
          </div>

          <div className="docs-sidebar-group">
            <div className="docs-sidebar-title">SDKs &amp; Community</div>
            <ul className="docs-sidebar-list">
              <li><a href="#sdks" className="docs-sidebar-item">TypeScript &amp; Python SDK</a></li>
              <li><a href="#affiliate" className="docs-sidebar-item">22% Affiliate API Split</a></li>
              <li><a href="https://x.com/oldcashdotfun" target="_blank" rel="noopener noreferrer" className="docs-sidebar-item">Official 𝕏 (@oldcashdotfun) ↗</a></li>
              <li><a href="https://t.me/oldcashdotfun" target="_blank" rel="noopener noreferrer" className="docs-sidebar-item">Telegram (t.me/oldcashdotfun) ↗</a></li>
            </ul>
          </div>
        </aside>

        {/* Documentation Content */}
        <main className="docs-content">
          {/* Hero Header */}
          <div className="docs-hero-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="os-tag os-tag--magenta">CORE DEVELOPER SPECIFICATION</span>
              <span className="os-tag os-tag--green">SOLANA MAINNET-BETA</span>
            </div>
            <h1 className="docs-hero-title">
              Old Cash Protocol Documentation &amp; API Portal
            </h1>
            <p className="docs-hero-desc">
              The official technical guide to the <strong>Old Cash Recovery Engine</strong>. Discover how Solana on-chain account lifecycle economics work, integrate automated post-trade sweeps into trading terminals like <strong>axiom.trade</strong> and <strong>pump.fun</strong>, and programmatically query wallet MEV rewards via our public REST APIs.
            </p>

            <div className="docs-hero-stats">
              <span className="docs-hero-stat-pill">
                <span className="ticker-live-dot" />
                <span>Sub-150ms RPC Latency</span>
              </span>
              <span className="docs-hero-stat-pill">
                <span>🔒 100% Non-Custodial</span>
              </span>
              <span className="docs-hero-stat-pill">
                <span>⚡ 1-Click Multi-Instruction Batching</span>
              </span>
              <span className="docs-hero-stat-pill">
                <span>🤝 22% Referral Split Protocol</span>
              </span>
            </div>
          </div>

          {/* ============================================================
              SECTION 1: ARCHITECTURE OVERVIEW
              ============================================================ */}
          <section id="overview" className="docs-section">
            <h2 className="docs-section-h2">
              <span>◈</span>
              <span>Architecture &amp; On-Chain Lifecycle</span>
            </h2>
            <p className="docs-section-desc">
              On the Solana blockchain, storing state requires allocating storage space measured in bytes. Whenever a user interacts with a decentralized application (e.g. swapping on <strong>pump.fun</strong>, sniping on <strong>axiom.trade</strong>, or participating in a <strong>fomo.family</strong> alpha pool), a temporary account is initialized and funded with native SOL lamports as a storage deposit.
            </p>

            <div className="os-window os-window--white os-window--shadow" style={{ marginBottom: 20 }}>
              <div className="os-window__bar">
                <span className="os-window__title">How Accounts Accumulate MEV Rewards on Solana</span>
              </div>
              <div className="os-window__frame" style={{ padding: 18, fontSize: 13, lineHeight: 1.6 }}>
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 10 }}>
                    <strong>Account Creation:</strong> You buy a token on <code>pump.fun</code> or <code>Raydium</code>. Your wallet creates an Associated Token Account (ATA) and locks <strong>~0.00203928 SOL</strong> from your wallet to fund the account state.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <strong>Trade Exit:</strong> You sell 100% of the token or transfer it. Your token balance is now <strong>0</strong>. However, the empty account remains active on-chain, and your ~0.00203928 SOL remains trapped inside it forever unless explicitly closed.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <strong>The Cumulative Leak:</strong> If you trade 50 tokens a week, you leak <strong>~0.1019 SOL</strong>. Over a year of active trading, this amounts to <strong>5.2+ SOL</strong> in forgotten lamports.
                  </li>
                  <li>
                    <strong>Old Cash Recovery Engine:</strong> We crawl your account history on Solana mainnet RPC nodes, identify every 0-balance position, construct a non-custodial batch transaction containing <code>CloseAccount</code> instructions, and return <strong>100% of the lamports</strong> directly to your connected wallet.
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* ============================================================
              SECTION 2: THE CLAIM AFTER EVERY TRADE RULE
              ============================================================ */}
          <section id="rule" className="docs-section">
            <h2 className="docs-section-h2">
              <span style={{ color: 'var(--magenta)' }}>⚡</span>
              <span>The Core Rule: Claim After Every Trade</span>
            </h2>
            <div style={{ background: '#fdf4ff', border: '1.5px solid var(--magenta)', padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--magenta)', marginBottom: 6 }}>
                💡 PRO-TRADER PROTOCOL MANDATE: CLAIM AFTER EVERY TRADE
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                Whether you scalp memecoins on <strong>pump.fun</strong>, execute algorithmic strategies on <strong>axiom.trade</strong>, or follow whale wallets on <strong>fomo.family</strong>, every completed trade leaves behind an empty on-chain position. Making it a routine to scan and claim MEV rewards after every trading session guarantees zero capital leakage and maximizes your net compounding returns.
              </p>
            </div>
          </section>

          {/* ============================================================
              SECTION 3: PROTOCOL INTEGRATIONS (FOMO.FAMILY, AXIOM.TRADE, PUMP.FUN)
              ============================================================ */}
          <section id="protocols" className="docs-section">
            <h2 className="docs-section-h2">
              <span>◈</span>
              <span>Supported Protocols &amp; Trading Ecosystems</span>
            </h2>
            <p className="docs-section-desc">
              The Old Cash Recovery Engine provides deep, tailored support across high-volume Solana platforms. Below are the key platforms actively integrated into our scanning matrix:
            </p>

            <div className="docs-proto-grid">
              {PROTOCOLS_DOCS.map((proto) => (
                <div key={proto.id} id={proto.id} className="docs-proto-card">
                  <div>
                    <div className="docs-proto-head">
                      <div className="docs-proto-name">
                        <span>◈</span>
                        <span>{proto.name}</span>
                      </div>
                      <span className="os-tag os-tag--magenta" style={{ fontSize: 9 }}>
                        {proto.badge}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--magenta)', fontWeight: 700, marginBottom: 8 }}>
                      {proto.category}
                    </div>

                    <p className="docs-proto-body">
                      {proto.desc}
                    </p>

                    <div style={{ background: 'var(--paper, #fdfbf7)', padding: 10, border: '1px solid var(--rule, #e2e8f0)', fontSize: 11.5, marginBottom: 10 }}>
                      <strong>Recovery Pipeline:</strong> {proto.recoveryMechanism}
                    </div>
                  </div>

                  <div className="docs-proto-footer">
                    <span>{proto.apiSupport}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>● Active</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================
              SECTION 4: DEVELOPER API REFERENCE (DEV PORTAL)
              ============================================================ */}
          <section id="api" className="docs-section">
            <h2 className="docs-section-h2">
              <span style={{ color: 'var(--green)' }}>●</span>
              <span>Developer API Portal &amp; REST Specifications</span>
            </h2>
            <p className="docs-section-desc">
              Integrate Old Cash recovery metrics directly into your trading terminal, Telegram bot, analytics dashboard, or portfolio tracker using our high-performance REST APIs.
            </p>

            {/* ENDPOINT 1: GET /api/scan */}
            <div id="endpoint-scan" className="docs-endpoint-card">
              <div className="docs-endpoint-header">
                <div className="docs-endpoint-route">
                  <span className="docs-method-tag docs-method-tag--get">GET</span>
                  <span>/api/scan</span>
                </div>
                <span className="os-tag os-tag--green">Public RPC Aggregator</span>
              </div>

              <div className="docs-endpoint-body">
                <p style={{ fontSize: 13, margin: '0 0 12px' }}>
                  Scans any Solana base58 wallet address across mainnet RPC clusters, locates all 0-balance claimable accounts, calculates total recoverable MEV lamports, and aggregates protocol opportunities.
                </p>

                <div style={{ fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                  Query Parameters:
                </div>
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>wallet</code></td>
                      <td>string</td>
                      <td>Yes</td>
                      <td>Valid Solana base58 public key (32–44 chars).</td>
                    </tr>
                    <tr>
                      <td><code>refresh</code></td>
                      <td>boolean</td>
                      <td>No</td>
                      <td>Force bypass cache and query fresh RPC state (default: <code>false</code>).</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 14, marginBottom: 4 }}>
                  Sample JSON Response:
                </div>
                <div className="docs-code-wrap">
                  <div className="docs-code-header">
                    <span>HTTP 200 OK · application/json</span>
                    <span>~120ms</span>
                  </div>
                  <pre className="docs-code-pre">{`{
  "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "scannedAt": "2026-11-18T10:45:00.000Z",
  "totalRentRecoverable": 0.089728,
  "wsolRecoverable": 0.0,
  "solPrice": 72.05,
  "totalRecoverableUsd": 6.46,
  "closableAccounts": [
    {
      "pubkey": "2NpE7LBphYGMwXz4K9v7U3Q8mZ...3a",
      "mint": "DoGEfm7R...pump",
      "program": "SPL Token",
      "balance": "0",
      "lamports": 2039280,
      "solRefund": 0.00203928,
      "origin": "pump.fun"
    },
    {
      "pubkey": "8SkraboHN6FwE2m1Y9z...kP",
      "mint": "USDT...sol",
      "program": "SPL Token",
      "balance": "0",
      "lamports": 2039280,
      "solRefund": 0.00203928,
      "origin": "Raydium"
    }
  ],
  "items": [
    {
      "id": "rent",
      "proto": "MEV Rewards (SOL lamports)",
      "cat": "MEV Reward",
      "amount": 0.089728,
      "token": "SOL",
      "source": "onchain",
      "detail": "44 claimable positions automatically buffered"
    }
  ]
}`}</pre>
                </div>
              </div>
            </div>

            {/* ENDPOINT 2: GET /api/prices */}
            <div id="endpoint-prices" className="docs-endpoint-card">
              <div className="docs-endpoint-header">
                <div className="docs-endpoint-route">
                  <span className="docs-method-tag docs-method-tag--get">GET</span>
                  <span>/api/prices</span>
                </div>
                <span className="os-tag">Real-Time Oracle</span>
              </div>

              <div className="docs-endpoint-body">
                <p style={{ fontSize: 13, margin: '0 0 12px' }}>
                  Returns real-time spot prices and 24h percentage changes for key Solana ecosystem assets (SOL, BTC, ETH, JUP, BONK, WIF, RAY, PYTH, RENDER, DRIFT, KMNO). Cached for 10 seconds.
                </p>

                <div className="docs-code-wrap">
                  <div className="docs-code-header">
                    <span>GET /api/prices · application/json</span>
                    <span>Cached 10s</span>
                  </div>
                  <pre className="docs-code-pre">{`{
  "prices": [
    { "symbol": "SOL", "price": 72.05, "change24h": 1.96 },
    { "symbol": "JUP", "price": 0.2523, "change24h": -2.01 },
    { "symbol": "BONK", "price": 0.00000237, "change24h": 2.72 }
  ],
  "timestamp": 1731926700000
}`}</pre>
                </div>
              </div>
            </div>

            {/* ENDPOINT 3: POST /api/v1/build-claim-tx */}
            <div id="endpoint-claim" className="docs-endpoint-card">
              <div className="docs-endpoint-header">
                <div className="docs-endpoint-route">
                  <span className="docs-method-tag docs-method-tag--post">POST</span>
                  <span>/api/v1/build-claim-tx</span>
                </div>
                <span className="os-tag os-tag--magenta">Non-Custodial Builder</span>
              </div>

              <div className="docs-endpoint-body">
                <p style={{ fontSize: 13, margin: '0 0 12px' }}>
                  Constructs an unsigned, serialized Solana transaction containing up to 20 <code>CloseAccount</code> instructions per batch, automatically routing lamports back to the destination wallet while applying the 22% affiliate fee distribution.
                </p>

                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Body Field</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>owner</code></td>
                      <td>string</td>
                      <td>Solana public key of the account authority.</td>
                    </tr>
                    <tr>
                      <td><code>accountPubkeys</code></td>
                      <td>string[]</td>
                      <td>Array of account pubkeys to be closed (max 20 per tx).</td>
                    </tr>
                    <tr>
                      <td><code>referrer</code></td>
                      <td>string (optional)</td>
                      <td>Affiliate referrer wallet for 22% commission distribution.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ============================================================
              SECTION 5: INTERACTIVE DEVELOPER CONSOLE
              ============================================================ */}
          <section id="console" className="docs-section">
            <h2 className="docs-section-h2">
              <span style={{ color: '#00ffa3' }}>⚡</span>
              <span>Interactive Dev Console (Live RPC Test)</span>
            </h2>
            <p className="docs-section-desc">
              Test live API calls directly against Solana mainnet RPC from your browser. Enter any Solana wallet address or select a preset:
            </p>

            <div className="docs-console-card">
              <div className="docs-console-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ticker-live-dot" />
                  <span style={{ fontFamily: 'var(--font-disp)', fontWeight: 800 }}>
                    API CONSOLE // GET /api/scan
                  </span>
                </div>
                <span style={{ fontSize: 11, opacity: 0.75 }}>Endpoint: https://oldcash.fun/api/scan</span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>Test Presets:</span>
                {[
                  { label: 'Solana Whale', addr: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
                  { label: 'Foundation', addr: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg' },
                  { label: 'Anatoly (toly.sol)', addr: '6b6tL8qTz9fK2H4k1dZ7YmQW3v8rC1uE2pX4yZ9gV1sT' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="demo-chip"
                    onClick={() => setConsoleInput(preset.addr)}
                    style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="docs-console-input-row">
                <input
                  type="text"
                  className="docs-console-input"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  placeholder="Paste Solana address..."
                />
                <button
                  type="button"
                  className="os-btn os-btn--pink"
                  disabled={consoleLoading}
                  onClick={handleTestApi}
                  style={{ minWidth: 120 }}
                >
                  {consoleLoading ? 'Scanning...' : '⚡ Send Request'}
                </button>
              </div>

              <div className="docs-console-res">
                {consoleLoading ? (
                  <div>⚡ Querying Solana Mainnet RPC nodes...</div>
                ) : consoleRes ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(consoleRes, null, 2)}
                  </pre>
                ) : (
                  <div style={{ opacity: 0.6 }}>
                    // Click "Send Request" to test live RPC response output...
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ============================================================
              SECTION 6: SDK QUICKSTARTS & CODE EXAMPLES
              ============================================================ */}
          <section id="sdks" className="docs-section">
            <h2 className="docs-section-h2">
              <span>◈</span>
              <span>Client SDKs &amp; Implementation Guides</span>
            </h2>
            <p className="docs-section-desc">
              Select your preferred language to view drop-in client code:
            </p>

            <div className="docs-code-wrap">
              <div className="docs-code-header">
                <div className="docs-code-tabs">
                  {['curl', 'typescript', 'python'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`docs-code-tab ${activeCodeTab === tab ? 'docs-code-tab--active' : ''}`}
                      onClick={() => setActiveCodeTab(tab)}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {copiedCode ? '✓ Copied' : '📋 Copy Code'}
                </button>
              </div>
              <pre className="docs-code-pre">{CODE_EXAMPLES[activeCodeTab]}</pre>
            </div>
          </section>

          {/* ============================================================
              SECTION 7: 22% AFFILIATE REVENUE SHARE API
              ============================================================ */}
          <section id="affiliate" className="docs-section">
            <h2 className="docs-section-h2">
              <span style={{ color: 'var(--magenta)' }}>🤝</span>
              <span>22% Affiliate Referral Revenue Share API</span>
            </h2>
            <div className="os-window os-window--white os-window--shadow">
              <div className="os-window__bar">
                <span className="os-window__title">Automated Referral Commission Protocol</span>
              </div>
              <div className="os-window__frame" style={{ padding: 18, fontSize: 13, lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 12px' }}>
                  Every claim executed through the Old Cash Recovery Engine can include an optional <code>referrer</code> parameter. When present, the on-chain settlement automatically routes:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, margin: '14px 0' }}>
                  <div style={{ padding: 12, background: '#fdf4ff', border: '1px solid var(--magenta)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--magenta)' }}>22%</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Affiliate Commission</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Instant on-chain transfer</div>
                  </div>
                  <div style={{ padding: 12, background: '#f0fdf4', border: '1px solid var(--green)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--green)' }}>100%</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Non-Custodial</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Signed in claimant wallet</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--paper, #fdfbf7)', border: '1px solid var(--ink)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>~400ms</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Atomic Settlement</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Solana Mainnet-Beta</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
                  To generate an affiliate link, share <code>https://oldcash.fun/?ref=YOUR_WALLET_ADDRESS</code> or append <code>&amp;ref=YOUR_WALLET_ADDRESS</code> in API builder requests.
                </p>
              </div>
            </div>
          </section>

          {/* Footer Navigation */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: 'var(--border) solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>
              ◈ OLDCASH.FUN PROTOCOL // DOCS V1.4.0 · SOLANA MAINNET
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/" className="os-btn os-btn--dark" style={{ fontSize: 12 }}>
                ⚡ Launch Scanner
              </Link>
              <Link href="/early" className="os-btn os-btn--pink" style={{ fontSize: 12 }}>
                ⚡ Early Access (Phase 0)
              </Link>
              <Link href="/referral" className="os-btn" style={{ fontSize: 12 }}>
                🤝 Referral Program (22%)
              </Link>
            </div>
          </div>
        </main>
      </div>

      <CreativeFooter />
    </>
  );
}
