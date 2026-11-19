import Link from 'next/link';
import Scanner from '@/components/Scanner';
import WalletBar from '@/components/WalletBar';
import ThemeToggle from '@/components/ThemeToggle';
import LiveCryptoTicker from '@/components/LiveCryptoTicker';
import ThemeBackground from '@/components/ThemeBackground';
import MascotWidget from '@/components/MascotWidget';
import ProductTour from '@/components/ProductTour';
import AnimatedNewsTicker from '@/components/AnimatedNewsTicker';
import AnimatedTypewriterBanner from '@/components/AnimatedTypewriterBanner';
import LiveNetworkStats from '@/components/LiveNetworkStats';
import SocialLinks from '@/components/SocialLinks';
import FaqDropdown from '@/components/FaqDropdown';
import CreativeFooter from '@/components/CreativeFooter';

const OPPOSITE = [
  { no: '01', t: 'Read-Only Inspection', p: 'Old Cash inspects accounts and protocol state. It never moves funds, never holds custody, and never asks for your private keys.' },
  { no: '02', t: 'Live Solana Mainnet', p: 'Balance, SPL assets, MEV rewards and stake are read straight from Solana mainnet RPC in one call — real on-chain values.' },
  { no: '03', t: 'Seven Recovery Categories', p: 'Staking rewards, incentives, lending deposits, LP fees, expired positions, airdrops and MEV rewards — every forgotten path.' },
  { no: '04', t: 'Quoted Exactly', p: 'Every recovery shows its estimated network gas fee and net-to-wallet yield before you sign anything.' },
  { no: '05', t: 'Recover Or Nothing', p: 'If there is nothing to recover, zero transactions are executed. You approve every transaction inside your own wallet.' },
];

const PROTOCOLS = [
  { name: 'Pump.fun', logo: '/assets/pumpfun.svg', site: 'jup.ag/spot/launchpads/pump.fun', url: 'https://jup.ag/spot/launchpads/pump.fun', prio: 'Phase 1', items: ['Bonding curve MEV rewards (Dynamic Yield)', 'Creator fee distributions & claims', 'Graduated curve LP shares', 'Unclaimed trading rebates'] },
  { name: 'Raydium', logo: '/assets/raydium.png', site: 'raydium.io', url: 'https://raydium.io/', prio: 'Phase 1', items: ['AMM & CPMM liquidity withdrawals', 'OpenBook market MEV rewards (0.024 SOL)', 'Unclaimed farming rewards', 'Withdrawable pool positions'] },
  { name: 'Axiom Trade', logo: '/assets/axiom.svg', site: 'axiom.trade', url: 'https://axiom.trade/', prio: 'Phase 1', items: ['High-speed trading terminal sweeps', 'DEX execution fee rebates & escrow', 'Limit order settlement balances', 'Automated post-trade MEV sweeps'] },
  { name: 'FOMO Family', logo: '/assets/fomo.svg', site: 'fomo.family', url: 'https://fomo.family', prio: 'Phase 1', items: ['Alpha tracking reward allocations', 'Community token rewards & incentives', 'Whale follow-trade position sweeps', 'Ecosystem staking distributions'] },
  { name: 'Uniswap (SVM)', logo: '/assets/uniswap.svg', site: 'app.uniswap.org', url: 'https://app.uniswap.org/', prio: 'Phase 1', items: ['Cross-chain SVM liquidity positions', 'Uncollected swap fee rebates', 'Expired LP pool positions', 'SVM incentive distributions'] },
  { name: 'Jupiter', logo: '/assets/jupiter.png', site: 'jup.ag', url: 'https://jup.ag/', prio: 'Phase 1', items: ['Historical JUP airdrop allocations', 'Staking rewards & distributions', 'Limit order deposits', 'Historical incentive pools'] },
  { name: 'Meteora', logo: '/assets/meteora.png', site: 'meteora.ag', url: 'https://www.meteora.ag/', prio: 'Phase 1', items: ['DLMM dynamic liquidity positions', 'Unclaimed fee revenue & LP yield', 'Withdrawable active bin liquidity', 'Dynamic vault rewards'] },
  { name: 'Kamino Finance', logo: '/assets/kamino.png', site: 'kamino.com', url: 'https://kamino.com/', prio: 'Phase 1', items: ['Unclaimed incentives and rewards', 'Withdrawable lending deposits', 'Expired liquidity positions', 'Vault withdrawals'] },
  { name: 'Marinade Finance', logo: '/assets/marinade.png', site: 'marinade.finance', url: 'https://marinade.finance/', prio: 'Phase 1', items: ['Native stake accounts', 'Deactivated stake accounts', 'mSOL staking rewards', 'Withdrawable staking balances'] },
  { name: 'Jito', logo: '/assets/jito.png', site: 'jito.network', url: 'https://jito.network/', prio: 'Phase 1', items: ['Unclaimed MEV tip distributions', 'Staking rewards', 'JitoSOL positions', 'Claimable incentives'] },
  { name: 'Orca', logo: '/assets/orca.png', site: 'orca.so', url: 'https://www.orca.so/', prio: 'Phase 1', items: ['Withdrawable Whirlpool liquidity', 'Uncollected trading fees', 'Unclaimed liquidity incentives'] },
  { name: 'Drift Protocol', logo: '/assets/drift.png', site: 'drift.trade', url: 'https://www.drift.trade/', prio: 'Phase 1', items: ['Withdrawable collateral deposits', 'Claimable insurance rewards', 'Unsettled PnL balances', 'Vault positions'] },
];

const MATRIX = [
  ['MEV Positions', 'On-chain RPC', 'Token Program', 'Dynamic MEV yield per position claim'],
  ['Pump.fun Bonding Curves', 'On-chain RPC', 'Pump.fun (jup.ag)', 'Dynamic MEV yield / curve position'],
  ['Raydium AMM & CPMM Pools', 'Protocol Engine', 'Raydium Liquidity v4', 'Unclaimed farming + 0.024 SOL MEV reward'],
  ['Axiom Trade Terminal', 'Protocol Engine', 'Axiom Execution Engine', 'Routing escrow + post-trade sweeps'],
  ['FOMO Family Alpha Pools', 'Protocol Engine', 'FOMO Community Engine', 'Alpha tracking & staking rewards'],
  ['Uniswap SVM Liquidity', 'Protocol Engine', 'Uniswap v3 (app.uniswap.org)', 'Uncollected LP fees & incentives'],
  ['Meteora Dynamic DLMM Pools', 'Protocol Engine', 'Meteora DLMM Engine', 'Dynamic fee yield & active bin sweeps'],
  ['Deactivated stake accounts', 'On-chain RPC', 'Stake Program', 'Native withdrawable SOL'],
  ['Unclaimed staking rewards', 'Protocol Engine', 'Marinade · Jito · Sanctum', 'Liquid staking distributions'],
  ['Unclaimed airdrops', 'Merkle / API', 'Jupiter · Jito · Wormhole', 'Historical allocation claims'],
  ['LP & Whirlpool fees', 'Protocol Engine', 'Orca · Raydium · Meteora', 'Uncollected swap fees'],
  ['Lending withdrawals', 'Protocol Engine', 'Kamino · Drift · Save', 'Idle lending supply'],
  ['Vault withdrawals', 'Protocol Engine', 'Kamino Vaults · Drift', 'Matured vault capital'],
];

const FAQ = [
  ['What is Old Cash?', 'Old Cash is a public Solana recovery scanner modeled after modern decentralized financial engines. Connect a wallet (or paste an address) and it locates forgotten, unclaimed and recoverable funds — unclaimed rewards, idle deposits, unclosed positions, pending airdrops and claimable MEV rewards.'],
  ['Is it safe? Does it touch my keys?', 'No. Old Cash is 100% read-only and non-custodial. It never asks for, handles, or stores your seed phrase or private keys. Every recovery transaction is prepared for your review and signed exclusively inside your own wallet (Phantom, Solflare, Ledger).'],
  ['Which data is live on Solana mainnet?', 'The universal layer is live: SOL balance, SPL assets, MEV reward refunds, and deactivated stake accounts are read directly from Solana mainnet RPC nodes.'],
  ['What is the MEV reward mechanism?', 'On Solana, completed trades leave positions holding deposited lamports. When you sell or transfer an asset, the position remains on-chain. Claiming it returns that SOL directly to your main wallet as an MEV reward.'],
  ['What does it cost?', 'Scanning is free. You only pay Solana network transaction fees (typically less than $0.001) when you choose to execute a recovery transaction. Zero capital required to scan.'],
  ['What are the 7 recovery categories?', '1. Unclaimed staking rewards · 2. Protocol incentives · 3. Withdrawable lending deposits · 4. Liquidity-pool fees · 5. Expired / inactive positions · 6. Unclaimed airdrops & distributions · 7. Solana MEV rewards.'],
];

export default function Page() {
  return (
    <>
      {/* Interactive 5-Step Product Tour Walkthrough */}
      <ProductTour />

      {/* Dynamic Animated Theme Background (Video / Cosmic / Ambient) */}
      <ThemeBackground />

      {/* Live Crypto Price Ticker (Moving Left-to-Right with live tick flashes) */}
      <LiveCryptoTicker />

      {/* ============================================================
          TOP NEWS TICKER
          ============================================================ */}
      <div className="site-news">
        <div className="wrap news-inner">
          <div className="news-left">
            <span className="news-chip animate-pulse-glow">SOLANA MAINNET</span>
            <AnimatedNewsTicker />
          </div>
          <div>
            <Link className="news-link" href="/early" style={{ marginRight: 10, color: 'var(--magenta)', fontWeight: 700 }}>⚡ Early Access (Phase 0) →</Link>
            <a className="news-link" href="#scanner">Launch Scanner →</a>
          </div>
        </div>
      </div>

      {/* ============================================================
          SITE NAVIGATION
          ============================================================ */}
      <header className="site-nav">
        <div className="wrap nav-inner">
          <div className="brand">
            <img src="/assets/logo.jpg" alt="Old Cash" className="brand-logo-img" />
            <span className="brand-text-glitch" data-text="Old Cash">Old Cash</span>
            <span className="os-tag os-tag--live-pulse" style={{ marginLeft: 6 }}>RECOVERY.OS1</span>
          </div>

          <nav className="nav-menu">
            <a href="#scanner">Scanner</a>
            <a href="#market">Live Market</a>
            <a href="#how">How It Works</a>
            <a href="#protocols">Protocols</a>
            <a href="#matrix">Coverage</a>
            <a href="#faq">FAQ</a>
            <Link href="/referral" className="nav-link-referral">🤝 Referrals (22%)</Link>
          </nav>

          <div className="nav-right">
            <span className="engine-pill">
              <span className="engine-pill__dot" />
              <span>Engine Live</span>
              <span className="nav-eq-bar" title="Live Solana Mainnet Stream">
                <span className="nav-eq-line" />
                <span className="nav-eq-line" />
                <span className="nav-eq-line" />
              </span>
            </span>
            <SocialLinks variant="nav" />
            <ThemeToggle />
            <WalletBar />
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN WRAPPER
          ============================================================ */}
      <main className="wrap">
        {/* ASCII Separator */}
        <div className="ascii-sep">
          <span>∵ ⩆</span>
          <span>....................................................................................</span>
          <span>⩆ ∵</span>
        </div>

        {/* HERO SECTION */}
        <section className="hero-head" id="scanner">
          <div className="h-kicker">
            <span>
              Introducing Old Cash
            </span>
          </div>

          <h1 className="hero-title">
            The First (Public) Solana Recovery Engine; Old Cash Finds Every{' '}
            <span className="tag-highlight text-shimmer-anim">Forgotten Dollar</span>
          </h1>

          <p className="hero-lead">
            Connect a wallet or paste any Solana address to discover money you <strong>forgot you had</strong> —
            unclaimed staking rewards, idle lending deposits, uncollected LP fees, pending airdrops, and
            MEV rewards locked in unclosed positions. <strong>Read-only, non-custodial, live on mainnet.</strong>
          </p>

          {/* Dynamic Animated Typewriter Telemetry Banner */}
          <AnimatedTypewriterBanner />

          {/* ============================================================
              LIVE NETWORK STATS ($990M UNCLAIMED & 1M WALLETS)
              ============================================================ */}
          <LiveNetworkStats />

          {/* ============================================================
              THE BIG SEARCH BAR AND SCANNER
              ============================================================ */}
          <Scanner />
        </section>

        {/* ============================================================
            HOW IT WORKS (Arbio Lineage Style)
            ============================================================ */}
        <section className="section-head" id="how">
          <div className="h-kicker">
            <span>Architecture Lineage <span className="h-kicker__dots">..................</span></span>
            <span>Non-Custodial Design</span>
          </div>

          <h2 className="section-h2">Recovery Without The Custody.</h2>
          <p className="section-lead" style={{ maxWidth: 800, marginBottom: 24 }}>
            Most recovery tools ask for custody or charge massive cuts. Old Cash takes the opposite approach:
            it reads the chain, prepares atomic recovery instructions, and gives you complete control to execute from your own wallet.
          </p>

          <div className="cards-grid-3">
            {OPPOSITE.slice(0, 3).map((op) => (
              <div className="step-card" key={op.no}>
                <div className="step-num">{op.no}</div>
                <h3 className="step-title">{op.t}</h3>
                <p className="step-desc">{op.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            PROTOCOL COVERAGE SECTION
            ============================================================ */}
        <section className="section-head" id="protocols">
          <div className="h-kicker">
            <span>Supported Ecosystem <span className="h-kicker__dots">..................</span></span>
            <span>Top Tier Solana Protocols</span>
          </div>

          <h2 className="section-h2">Where Old Cash Looks For Your Funds.</h2>
          <p className="section-lead" style={{ maxWidth: 800, marginBottom: 24 }}>
            Phase 1 covers the highest-capital DeFi primitives and staking providers on Solana. Phase 2 expands to Sanctum, Save, Tensor, and Parcl.
          </p>

          <div className="cards-grid-3">
            {PROTOCOLS.map((p) => (
              <div className="os-window os-window--white" key={p.name} style={{ marginBottom: 0 }}>
                <div className="os-window__bar">
                  <span className="os-window__title">{p.name}</span>
                  <span className="os-window__meta">{p.prio}</span>
                </div>
                <div className="os-window__frame">
                  <div className="os-window__body" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div className="proto-icon">
                        <img src={p.logo} alt={p.name} width={22} height={22} loading="lazy" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--magenta)', textDecoration: 'underline' }}>
                          {p.site} ↗
                        </a>
                      </div>
                    </div>
                    <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
                      {p.items.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            COVERAGE MATRIX TABLE
            ============================================================ */}
        <section className="section-head" id="matrix">
          <div className="h-kicker">
            <span>Detection Matrix <span className="h-kicker__dots">..................</span></span>
            <span>Full Spectrum Inspection</span>
          </div>

          <h2 className="section-h2">What Old Cash Inspects.</h2>
          <div className="os-window os-window--white" style={{ marginTop: 16 }}>
            <div className="os-window__bar">
              <span className="os-window__title">Inspection.Matrix · 7 Core Categories</span>
              <span className="os-window__meta">Universal Coverage</span>
            </div>
            <div className="os-window__frame">
              <div className="scan-table-wrap">
                <table className="scan-table">
                  <thead>
                    <tr>
                      <th>Recovery Category</th>
                      <th>Detection Method</th>
                      <th>Target Protocols</th>
                      <th>Typical Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX.map(([cat, meth, proto, yield_val], idx) => (
                      <tr key={idx}>
                        <td><strong>{cat}</strong></td>
                        <td><span className="os-tag">{meth}</span></td>
                        <td>{proto}</td>
                        <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{yield_val}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FAQ
            ============================================================ */}
        <section className="section-head" id="faq">
          <div className="h-kicker">
            <span>Frequently Answered <span className="h-kicker__dots">..................</span></span>
            <span>Operational FAQ</span>
          </div>

          <h2 className="section-h2">Questions &amp; Technical Answers.</h2>
          <FaqDropdown items={FAQ} />
        </section>
      </main>

      {/* ============================================================
          CREATIVE RETRO CRT FOOTER & DISPATCH CONSOLE
          ============================================================ */}
      <CreativeFooter />

      {/* Floating Retro TV-Head Recovery Agent Bot */}
      <MascotWidget />
    </>
  );
}
