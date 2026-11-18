# Old Cash · Solana Recovery & MEV Yield Engine

> The non-custodial Solana recovery engine modeled after modern decentralized financial protocols. Identifies and claims forgotten lamports, idle accounts, uncollected yields, and MEV rewards on Solana Mainnet.

---

## ⚡ Features

- **100% Non-Custodial**: Scanning is completely read-only. All recovery transactions are prepared for local client review and signed directly inside the user's wallet (Phantom, Solflare, Ledger). Zero private keys handled.
- **7 Recovery Categories**:
  1. Solana MEV rewards & idle token positions
  2. Bonding curve claims & creator fee distributions (Pump.fun)
  3. AMM & CPMM liquidity withdrawals & open position sweeps (Raydium)
  4. Routing escrow balances & post-trade execution rebates (Axiom Trade)
  5. Alpha pool allocations & community rewards (FOMO Family)
  6. Cross-chain SVM liquidity positions & uncollected swap fee rebates (Uniswap)
  7. Dynamic DLMM bins & active fee yield recovery (Meteora)
- **Real-Time Mainnet Telemetry**:
  - Live Solana Mainnet RPC slot progression tracking (~400ms).
  - Dynamic on-chain balance and token account scanning with fallback RPC endpoints.
  - Multi-tier in-memory caching for sub-50ms query latency.
- **Affiliate Protocol & Shareable Dashboard**:
  - Earn **22% lifetime commission** on all claimed MEV rewards.
  - Instant on-chain atomic settlement in the same block slot.
  - Shareable referral dashboard links (`/referral?wallet=<address>`) with 1-click social sharing (𝕏, Telegram, WhatsApp) and visual preview cards.
  - Multi-format analytics graphing (Smooth Area, Bar Histogram, Step-Ladder, Range Spread).
- **Security & Performance**:
  - Strict security headers (`HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  - Dual-port deployment ready (Default `:3000` with reverse proxy `:3100`).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

```bash
git clone https://github.com/codesmega00-svg/Oldcash.git
cd Oldcash
npm install
```

### Running Locally

```bash
# Start development server
npm run dev

# Or create an optimized production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔗 Architecture

```
old-cash-next/
├── app/
│   ├── page.js             # Main scanner & protocol matrix
│   ├── layout.js           # Root layout & providers
│   ├── referral/page.js    # 22% Affiliate protocol & shareable dashboard
│   ├── docs/page.js        # Detailed documentation & APIs dev portal
│   ├── early/page.js       # Phase 0 Early Access Pass
│   └── api/
│       ├── scan/route.js   # Live Solana mainnet scanner API
│       ├── referral/route.js# Real-time mainnet referral & analytics API
│       └── prices/route.js # Live crypto spot prices
├── components/             # Reusable UI widgets, OS windows, graphs & tickers
├── lib/
│   ├── config.js           # Network constants & program IDs
│   ├── solana.js           # RPC connection & account parsers
│   └── transactions.js     # Non-custodial transaction builders
└── public/                 # Protocol logos, brand assets & SVGs
```

---

## ⚖ License

MIT License. Open-source decentralized Solana tooling.
