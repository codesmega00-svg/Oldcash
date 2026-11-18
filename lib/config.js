// ============================================================
// lib/config.js — Lightweight constants & formatters
// ZERO external dependencies. Keeps RootLayout & initial page fast.
// ============================================================

export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const RENT_PER_TOKEN_ACCOUNT_SOL = 0.00203928;
export const SOL_USD_PRICE = 72.05;

// Referral Economics: 22% to Referrer, 28% to Protocol Treasury Wallet (50% if non-referral)
export const REFERRAL_COMMISSION_PERCENT = 22;
export const PROTOCOL_TREASURY_PERCENT = 28;
export const PROTOCOL_NON_REFERRAL_PERCENT = 50;
export const PROTOCOL_WALLET = process.env.NEXT_PUBLIC_PROTOCOL_WALLET || '8u8RApCj6Y15Yta54shdzefkVXWvbgvAfyocWDNY26X3';

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidAddress(a) {
  return BASE58_RE.test((a || '').trim());
}

export function shortAddr(a, n = 4) {
  if (!a) return '';
  return a.slice(0, n) + '…' + a.slice(-n);
}

export const KNOWN_MINTS = {
  // Common Solana Mints & Staking Tokens
  'So11111111111111111111111111111111111111112': { symbol: 'WSOL', name: 'Wrapped SOL', proto: 'Solana Native', cat: 'Native Position', dec: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', proto: 'Circle', cat: 'Stablecoin Account', dec: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', proto: 'Tether', cat: 'Stablecoin Account', dec: 6 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', proto: 'Bonk DAO', cat: 'Ecosystem Asset', dec: 5 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', proto: 'Jupiter', cat: 'Unclaimed airdrops & distributions', dec: 6 },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', name: 'dogwifhat', proto: 'Community', cat: 'Ecosystem Asset', dec: 6 },
  'HZ1JovNiRvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', name: 'Pyth Network', proto: 'Pyth', cat: 'Oracle Token', dec: 6 },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium', proto: 'Raydium', cat: 'Liquidity Account', dec: 6 },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': { symbol: 'ORCA', name: 'Orca', proto: 'Orca', cat: 'Liquidity Account', dec: 6 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL', proto: 'Marinade Finance', cat: 'Unclaimed staking rewards', dec: 9 },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', name: 'BlazeStake SOL', proto: 'BlazeStake', cat: 'Unclaimed staking rewards', dec: 9 },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', name: 'Jito Staked SOL', proto: 'Jito', cat: 'Unclaimed staking rewards', dec: 9 },
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': { symbol: 'RENDER', name: 'Render Token', proto: 'Render', cat: 'Ecosystem Asset', dec: 8 },
  'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS': { symbol: 'KMNO', name: 'Kamino Token', proto: 'Kamino Finance', cat: 'Unclaimed protocol incentives', dec: 6 },
  'DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7': { symbol: 'DRIFT', name: 'Drift', proto: 'Drift Protocol', cat: 'Trading Protocol Account', dec: 6 },
  'WENWENvqqNya429ubCdXr81ZmD69brwQaaDzY62JmtHS': { symbol: 'WEN', name: 'Wen', proto: 'Jupiter', cat: 'Unclaimed airdrops & distributions', dec: 5 },

  // Key-by-symbol mappings for backwards compatibility
  mSOL: { symbol: 'mSOL', name: 'Marinade Staked SOL', proto: 'Marinade Finance', cat: 'Unclaimed staking rewards', dec: 9 },
  jitoSOL: { symbol: 'jitoSOL', name: 'Jito Staked SOL', proto: 'Jito', cat: 'Unclaimed staking rewards', dec: 9 },
  JITOSOL: { symbol: 'jitoSOL', name: 'Jito Staked SOL', proto: 'Jito', cat: 'Unclaimed staking rewards', dec: 9 },
  INF: { symbol: 'INF', name: 'Sanctum Infinity', proto: 'Sanctum', cat: 'Unclaimed staking rewards', dec: 9 },
  bSOL: { symbol: 'bSOL', name: 'BlazeStake SOL', proto: 'BlazeStake', cat: 'Unclaimed staking rewards', dec: 9 },
  JUP: { symbol: 'JUP', name: 'Jupiter', proto: 'Jupiter', cat: 'Unclaimed airdrops & distributions', dec: 6 },
  WEN: { symbol: 'WEN', name: 'Wen', proto: 'Jupiter', cat: 'Unclaimed airdrops & distributions', dec: 5 },
};


