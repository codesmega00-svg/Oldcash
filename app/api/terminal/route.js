import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    service: 'Old Cash Terminal Engine Backend',
    status: 'online',
    version: '1.0.0',
    network: 'Solana Mainnet-Beta',
    integrations: ['axiom.trade', 'pump.fun', 'app.uniswap.org', 'meteora.ag', 'raydium.io'],
    documentation: '/docs',
    endpoints: {
      scan: '/api/scan?wallet={address}',
      referral: '/api/referral?wallet={address}',
      prices: '/api/prices',
      terminals: '/api/terminals',
    },
    nonCustodial: true,
  });
}
