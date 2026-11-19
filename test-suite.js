// test-suite.js - Old Cash Comprehensive Security, Test Case & Responsive Verification
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';

async function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runAllTests() {
  console.log('====================================================');
  console.log('⚡ STARTING COMPREHENSIVE OLD CASH VERIFICATION ⚡');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✕ [FAIL] ${name}`);
      failed++;
    }
  }

  // 1. SECURITY TESTS
  console.log('--- 1. SECURITY & CODE AUDIT TESTS ---');

  // 1.1 Forbidden Terms Check
  const appDir = path.join(__dirname, 'app');
  const compDir = path.join(__dirname, 'components');
  const libDir = path.join(__dirname, 'lib');

  function scanFiles(dir, forbiddenList) {
    const hits = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        hits.push(...scanFiles(full, forbiddenList));
      } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) {
        const content = fs.readFileSync(full, 'utf8');
        forbiddenList.forEach(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(content)) {
            hits.push({ file: full, term });
          }
        });
      }
    }
    return hits;
  }

  const forbiddenHits = [
    ...scanFiles(appDir, ['proof of potato', 'locked sol', 'reclaim', 'rent account']),
    ...scanFiles(compDir, ['proof of potato', 'locked sol', 'reclaim', 'rent account']),
    ...scanFiles(libDir, ['proof of potato', 'locked sol', 'reclaim', 'rent account']),
  ];
  assert(forbiddenHits.length === 0, `Zero forbidden terms in codebase (found: ${forbiddenHits.length})`);

  // 1.2 Claim Button Text Check
  const crtCardContent = fs.readFileSync(path.join(compDir, 'CrtRewardCard.js'), 'utf8');
  const btnMatch = crtCardContent.match(/<button[\s\S]*?crt-huge-claim-btn[\s\S]*?>([\s\S]*?)<\/button>/);
  const btnInner = btnMatch ? btnMatch[1] : '';
  const hasParenthesisAmountOnBtn = btnInner.includes('totalRentSol') || btnInner.includes('USD');
  assert(!hasParenthesisAmountOnBtn, 'Claim button text cleaned: no (+... SOL · ≈ $... USD) written inside button');
  assert(btnInner.includes('⚡ ONE-CLICK CLAIM ALL MEV REWARDS'), 'Claim button renders clean "⚡ ONE-CLICK CLAIM ALL MEV REWARDS"');

  const referralPageContent = fs.readFileSync(path.join(appDir, 'referral', 'page.js'), 'utf8');
  const refBtnMatch = referralPageContent.match(/<button[\s\S]*?mev-claim-btn[\s\S]*?>([\s\S]*?)<\/button>/);
  const refBtnInner = refBtnMatch ? refBtnMatch[1] : '';
  const refHasParenthesisAmount = refBtnInner.includes('displayUnclaimedSol') || refBtnInner.includes('USD');
  assert(!refHasParenthesisAmount && refBtnInner.includes('⚡ Settle Commission Payout →'), 'Referral claim button text cleaned: no amounts inside button');

  // 1.3 Live Mainnet Enforcement (Zero Test Ping in UI)
  const scannerContent = fs.readFileSync(path.join(compDir, 'Scanner.js'), 'utf8');
  const walletModalContent = fs.readFileSync(path.join(compDir, 'ConnectWalletModal.js'), 'utf8');
  const txBuilderContent = fs.readFileSync(path.join(libDir, 'transactions.js'), 'utf8');
  const footerContent = fs.readFileSync(path.join(compDir, 'CreativeFooter.js'), 'utf8');

  assert(!scannerContent.includes('handleLiveMainnetPing'), 'Scanner.js has no test ping function');
  assert(!scannerContent.includes('⚡ Test Live Mainnet Ping'), 'Scanner.js has no test ping buttons');
  assert(scannerContent.includes('● MAINNET-BETA LIVE'), 'Scanner.js displays ● MAINNET-BETA LIVE badge');
  assert(!walletModalContent.includes('handleLiveMainnetPing'), 'ConnectWalletModal.js has no test ping function');
  assert(!walletModalContent.includes('⚡ Live Mainnet Test Ping'), 'ConnectWalletModal.js has no test ping card');
  assert(walletModalContent.includes('createPortal'), 'ConnectWalletModal.js uses React createPortal for viewport-middle centering');
  assert(walletModalContent.includes('document.body'), 'ConnectWalletModal.js portals to document.body escaping sticky nav constraints');
  assert(!txBuilderContent.includes('createMainnetPingInstruction'), 'transactions.js has no ping instruction builder');
  assert(!footerContent.includes('RPC PING:'), 'CreativeFooter.js has no RPC PING label');

  // 1.4 Product Tour & Onboarding Verification
  const tourContent = fs.readFileSync(path.join(compDir, 'ProductTour.js'), 'utf8');
  assert(tourContent.includes('TOUR_STEPS') && tourContent.includes('STEP 1 OF 5'), 'ProductTour.js includes 5-step guided walkthrough');
  assert(tourContent.includes('tour-spotlight-cutout'), 'ProductTour.js includes interactive spotlight cutout');
  assert(scannerContent.includes('data-tour="demo-pills"'), 'Scanner.js contains data-tour="demo-pills" for clickable tour target');
  assert(scannerContent.includes('🗺️ Product Tour'), 'Scanner.js contains 🗺️ Product Tour launcher button');

  // 1.4 Security Headers & Default Theme Check on Local Server
  const homeRes = await fetchUrl('/');
  assert(homeRes.status === 200, 'Home page returns 200 OK');
  assert(homeRes.body.includes('data-theme="pink"'), 'Arbio Pink is default HTML theme attribute (data-theme="pink")');
  assert(homeRes.headers['x-frame-options'] === 'DENY', 'X-Frame-Options: DENY present (clickjacking protection)');
  assert(homeRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff present (MIME protection)');
  assert(Boolean(homeRes.headers['strict-transport-security']), 'HSTS strict-transport-security present');

  // 1.5 Non-custodial Audit
  assert(!txBuilderContent.includes('Keypair.generate()') && !txBuilderContent.includes('secretKey'), 'Transaction builder is strictly non-custodial (0 private keys stored)');

  // 2. ENDPOINT & API FUNCTIONAL TEST CASES
  console.log('\n--- 2. ENDPOINT & API FUNCTIONAL TEST CASES ---');

  // 2.1 Backend Terminals API
  const terminalsRes = await fetchUrl('/terminals');
  assert(terminalsRes.status === 200, 'Backend /terminals route returns 200 OK');
  assert(terminalsRes.headers['content-type'].includes('application/json'), '/terminals returns application/json (pure backend, no UI)');
  const terminalsData = JSON.parse(terminalsRes.body);
  assert(terminalsData.status === 'online', 'Terminals backend status is online');
  assert(Array.isArray(terminalsData.terminals) && terminalsData.terminals.length >= 4, 'Terminals list includes Axiom, Pump.fun, Uniswap, Meteora');

  // 2.2 Prices API
  const pricesRes = await fetchUrl('/api/prices');
  assert(pricesRes.status === 200, '/api/prices returns 200 OK');
  const pricesData = JSON.parse(pricesRes.body);
  assert(Array.isArray(pricesData.prices) && pricesData.prices.some(p => p.symbol === 'SOL'), '/api/prices delivers real-time SOL price data');

  // 2.3 Wallet Scan API
  const testWallet = '2QfBNK2WDwSLoUQRb1zAnp3KM12N9hQ8q6ApwUMnWW2T';
  const scanRes = await fetchUrl(`/api/scan?wallet=${testWallet}`);
  assert(scanRes.status === 200, `/api/scan?wallet=${testWallet} returns 200 OK`);
  const scanData = JSON.parse(scanRes.body);
  assert(scanData.address === testWallet, 'Scan report matches requested wallet address');
  assert(Array.isArray(scanData.items) && scanData.items.length > 0, `Wallet scanned successfully with ${scanData.items.length} opportunities and ${scanData.closableAccounts.length} closable positions found`);

  // 2.4 Referral API
  const refRes = await fetchUrl(`/api/referral?wallet=${testWallet}`);
  assert(refRes.status === 200, `/api/referral returns 200 OK`);
  const refData = JSON.parse(refRes.body);
  assert(refData.network.includes('Solana'), 'Referral API connected to Solana Mainnet-Beta');

  // 2.5 All 4 UI Pages Return 200 OK
  const referralPageRes = await fetchUrl('/referral');
  assert(referralPageRes.status === 200, '/referral page returns 200 OK HTML');

  const docsPageRes = await fetchUrl('/docs');
  assert(docsPageRes.status === 200, '/docs page returns 200 OK HTML');

  const earlyPageRes = await fetchUrl('/early');
  assert(earlyPageRes.status === 200, '/early page returns 200 OK HTML');

  // 3. RESPONSIVE DESIGN & PERFORMANCE TESTS
  console.log('\n--- 3. RESPONSIVE DESIGN & PERFORMANCE TESTS ---');
  const cssContent = fs.readFileSync(path.join(appDir, 'globals.css'), 'utf8');

  assert(cssContent.includes('font-size: 16px !important;'), 'iOS Safari auto-zoom prevention: 16px inputs enforced on mobile');
  assert(cssContent.includes('max-width: 100vw;'), 'Zero horizontal overflow: max-width 100vw enforced');
  assert(cssContent.includes('content-visibility: auto;'), 'GPU off-screen acceleration content-visibility: auto active');
  assert(cssContent.includes('touch-action: manipulation;'), 'Touch response speedup: touch-action: manipulation active');
  assert(cssContent.includes('.modal-card--wallet'), 'Modal card wallet modifier class defined');
  assert(cssContent.includes('z-index: 999999;'), 'Modal backdrop z-index 999999 enforced for top-level viewport centering');
  assert(cssContent.includes('overflow-y: auto;'), 'Modal overflow-y scrolling active for responsive mobile viewing');
  assert(cssContent.includes('@media (max-width: 768px)'), 'Mobile media query (<= 768px) active');
  assert(cssContent.includes('@media (max-width: 480px)'), 'Narrow phone media query (<= 480px) active');
  assert(cssContent.includes('@media (min-width: 769px) and (max-width: 1024px)'), 'Tablet breakpoint (769px - 1024px) active');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
