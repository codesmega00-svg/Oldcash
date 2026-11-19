import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    version: '1.0.0',
    description: 'Old Cash Terminal Backend Integration Protocol',
    network: 'Solana Mainnet-Beta',
    terminals: [
      {
        id: 'axiom',
        name: 'Axiom Trade Terminal',
        url: 'https://axiom.trade/',
        capabilities: ['high_speed_sweeps', 'post_trade_settlement', 'routing_escrow_settlement'],
        status: 'active',
      },
      {
        id: 'pumpfun',
        name: 'Pump.fun Launchpad',
        url: 'https://jup.ag/spot/launchpads/pump.fun',
        capabilities: ['bonding_curve_mev', 'creator_fee_distributions', 'lp_position_sweeps'],
        status: 'active',
      },
      {
        id: 'uniswap',
        name: 'Uniswap (SVM)',
        url: 'https://app.uniswap.org/',
        capabilities: ['cross_chain_liquidity', 'uncollected_fee_rebates', 'svm_routing_escrow'],
        status: 'active',
      },
      {
        id: 'meteora',
        name: 'Meteora DLMM',
        url: 'https://www.meteora.ag/',
        capabilities: ['dynamic_active_bins', 'unharvested_yield_sweeps', 'vault_settlement'],
        status: 'active',
      },
    ],
    endpoints: {
      scan: '/api/scan?wallet={address}',
      referral: '/api/referral?wallet={address}',
      prices: '/api/prices',
      docs: '/docs#apis',
    },
    latencyMs: 14,
    finality: 'atomic (~400ms)',
  });
}
