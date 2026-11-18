import { NextResponse } from 'next/server';
import { Connection, PublicKey, StakeProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM,
  TOKEN_2022_PROGRAM,
  LAMPORTS_PER_SOL,
  RENT_PER_TOKEN_ACCOUNT_SOL,
  SOL_USD_PRICE,
  KNOWN_MINTS,
  isValidAddress,
  shortAddr,
} from '@/lib/config';

const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
  'https://solana-rpc.publicnode.com',
  'https://rpc.ankr.com/solana',
];

const WSOL_MINT = 'So11111111111111111111111111111111111111112';

// 15-second LRU-style cache to prevent RPC rate limits and provide sub-50ms responses
const scanCache = new Map();
const CACHE_TTL = 15_000;

async function fetchWithFallback(fn) {
  let lastErr;
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(rpc, 'confirmed');
      return await fn(conn);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All RPC endpoints failed');
}

async function executeScan(address) {
  const cleanAddr = (address || '').trim();
  if (!cleanAddr || !isValidAddress(cleanAddr)) {
    throw new Error('Invalid Solana base58 wallet address');
  }

  const now = Date.now();
  if (scanCache.has(cleanAddr)) {
    const cached = scanCache.get(cleanAddr);
    if (now - cached.time < CACHE_TTL) {
      return cached.data;
    }
  }

  const owner = new PublicKey(cleanAddr);

  const data = await fetchWithFallback(async (conn) => {
    const [lamports, splResp, t22Resp, stakeResp] = await Promise.all([
      conn.getBalance(owner).catch(() => 0),
      conn.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey(TOKEN_PROGRAM) }).catch(() => ({ value: [] })),
      conn.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey(TOKEN_2022_PROGRAM) }).catch(() => ({ value: [] })),
      conn.getParsedProgramAccounts(StakeProgram.programId, {
        filters: [{ memcmp: { offset: 12, bytes: owner.toBase58() } }],
      }).catch(() => []),
    ]);

    return { lamports, splResp, t22Resp, stakeResp };
  });

  const allRaw = [
    ...(data.splResp.value || []).map((v) => ({ v, progId: TOKEN_PROGRAM, progName: 'SPL Token' })),
    ...(data.t22Resp.value || []).map((v) => ({ v, progId: TOKEN_2022_PROGRAM, progName: 'Token-2022' })),
  ];

  const closableAccounts = [];
  let totalRentRecoverable = 0;
  let wsolRecoverable = 0;
  let emptyAccountsCount = 0;

  for (const item of allRaw) {
    const info = item.v.account.data.parsed.info;
    const mint = info.mint;
    const isWSOL = mint === WSOL_MINT;
    const isZero = (info.tokenAmount.uiAmount || 0) === 0 || info.tokenAmount.amount === '0';

    if (isWSOL) {
      const recoverableSol = item.v.account.lamports / LAMPORTS_PER_SOL;
      totalRentRecoverable += recoverableSol;
      wsolRecoverable += recoverableSol;
      closableAccounts.unshift({
        pubkey: item.v.pubkey.toBase58(),
        mint,
        symbol: 'WSOL',
        name: 'Wrapped SOL (Unwrap & Close)',
        programName: item.progName,
        programId: item.progId,
        uiAmount: info.tokenAmount.uiAmount || 0,
        decimals: info.tokenAmount.decimals || 9,
        rentSol: +recoverableSol.toFixed(6),
        rentUsd: +(recoverableSol * SOL_USD_PRICE).toFixed(2),
        isWSOL: true,
        isClosable: true,
        status: 'wsol',
      });
    } else if (isZero) {
      emptyAccountsCount++;
      totalRentRecoverable += RENT_PER_TOKEN_ACCOUNT_SOL;
      const known = KNOWN_MINTS[mint] || null;
      closableAccounts.push({
        pubkey: item.v.pubkey.toBase58(),
        mint,
        symbol: known?.symbol || shortAddr(mint, 4),
        name: known?.name || 'MEV Position',
        programName: item.progName,
        programId: item.progId,
        uiAmount: 0,
        decimals: info.tokenAmount.decimals || 6,
        rentSol: RENT_PER_TOKEN_ACCOUNT_SOL,
        rentUsd: +(RENT_PER_TOKEN_ACCOUNT_SOL * SOL_USD_PRICE).toFixed(2),
        isWSOL: false,
        isClosable: true,
        status: 'empty',
      });
    }
  }

  // Parse stake accounts
  const stakeAccounts = (data.stakeResp || []).map((v) => {
    const parsed = v.account.data.parsed;
    const info = parsed?.info || {};
    const stake = info.stake?.delegation?.stake || 0;
    const state = parsed?.info?.state ?? 'unknown';
    return {
      pubkey: v.pubkey.toBase58(),
      lamports: v.account.lamports,
      sol: v.account.lamports / LAMPORTS_PER_SOL,
      state,
      activeStakeSol: stake / LAMPORTS_PER_SOL,
    };
  });

  const items = [];

  // 1. MEV Reward Engine item
  if (closableAccounts.length > 0) {
    items.push({
      id: 'rent',
      cat: 'MEV Reward',
      proto: 'Solana MEV Reward Engine',
      logo: null,
      amount: +totalRentRecoverable.toFixed(6),
      token: 'SOL',
      cost: +(Math.min(closableAccounts.length, 100) * 0.000005).toFixed(6),
      detail: wsolRecoverable > 0
        ? `${closableAccounts.length} positions (${wsolRecoverable.toFixed(4)} WSOL + ${emptyAccountsCount} MEV positions)`
        : `${closableAccounts.length} MEV reward position(s) available for claim`,
      source: 'onchain',
      emptyAccounts: closableAccounts,
    });
  }

  // 2. Deactivated / withdrawable stake
  const deactivated = stakeAccounts.filter(
    (s) => s.state === 'deactivating' || s.state === 'deactivated' || s.state === 'inactive'
  );
  const withdrawableStake = deactivated.reduce((a, b) => a + b.sol, 0);
  if (withdrawableStake > 0) {
    items.push({
      id: 'stake',
      cat: 'Expired / withdrawable positions',
      proto: 'Native Stake Program',
      logo: null,
      amount: +withdrawableStake.toFixed(6),
      token: 'SOL',
      cost: 0.000005,
      detail: `${deactivated.length} deactivated stake account(s) · withdrawable`,
      source: 'onchain',
      stakeAccounts: deactivated,
    });
  }

  const result = {
    address: cleanAddr,
    scannedAt: new Date().toISOString(),
    balanceSol: data.lamports / LAMPORTS_PER_SOL,
    tokenAccounts: allRaw.length,
    stakeAccounts: stakeAccounts.length,
    closableAccounts,
    wsolRecoverable: +wsolRecoverable.toFixed(6),
    emptyAccountsCount,
    totalRentRecoverable: +totalRentRecoverable.toFixed(6),
    totalRentRecoverableUsd: +(totalRentRecoverable * SOL_USD_PRICE).toFixed(2),
    items,
  };

  scanCache.set(cleanAddr, { time: now, data: result });
  if (scanCache.size > 200) {
    const oldestKey = scanCache.keys().next().value;
    scanCache.delete(oldestKey);
  }

  return result;
}

export async function POST(req) {
  try {
    const { address } = await req.json();
    const data = await executeScan(address);
    return NextResponse.json(data);
  } catch (err) {
    const status = err?.message?.includes('Invalid') ? 400 : 500;
    return NextResponse.json({ error: err?.message || 'Failed to scan wallet' }, { status });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('wallet') || searchParams.get('address');
    const data = await executeScan(address);
    return NextResponse.json(data);
  } catch (err) {
    const status = err?.message?.includes('Invalid') ? 400 : 500;
    return NextResponse.json({ error: err?.message || 'Failed to scan wallet' }, { status });
  }
}
