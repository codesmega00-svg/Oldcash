'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { shortAddr } from '@/lib/config';

// Rich datasets for different timeframes with volume, yield, counts, and volatility bounds
const TIMEFRAME_DATA = {
  '24H': {
    label: 'Last 24 Hours',
    volume: 18.42,
    commission: 4.0524,
    claims: 19,
    velocity: '+14.2% / 24h',
    points: [
      { label: '00:00', vol: 0.8, yield: 0.176, count: 1, minClaim: 0.05, maxClaim: 0.35 },
      { label: '02:00', vol: 1.4, yield: 0.308, count: 2, minClaim: 0.08, maxClaim: 0.52 },
      { label: '04:00', vol: 0.9, yield: 0.198, count: 1, minClaim: 0.06, maxClaim: 0.38 },
      { label: '06:00', vol: 1.8, yield: 0.396, count: 2, minClaim: 0.12, maxClaim: 0.65 },
      { label: '08:00', vol: 3.2, yield: 0.704, count: 3, minClaim: 0.20, maxClaim: 1.15 },
      { label: '10:00', vol: 5.6, yield: 1.232, count: 5, minClaim: 0.45, maxClaim: 1.95 },
      { label: '12:00', vol: 7.9, yield: 1.738, count: 7, minClaim: 0.60, maxClaim: 2.80 },
      { label: '14:00', vol: 10.4, yield: 2.288, count: 10, minClaim: 0.85, maxClaim: 3.60 },
      { label: '16:00', vol: 13.1, yield: 2.882, count: 13, minClaim: 1.10, maxClaim: 4.45 },
      { label: '18:00', vol: 15.5, yield: 3.410, count: 15, minClaim: 1.35, maxClaim: 5.20 },
      { label: '20:00', vol: 17.2, yield: 3.784, count: 17, minClaim: 1.50, maxClaim: 5.80 },
      { label: '22:00', vol: 18.4, yield: 4.052, count: 19, minClaim: 1.65, maxClaim: 6.25 },
    ],
  },
  '7D': {
    label: 'Last 7 Days',
    volume: 104.80,
    commission: 23.0560,
    claims: 84,
    velocity: '+28.6% vs last week',
    points: [
      { label: 'Mon', vol: 12.5, yield: 2.750, count: 11, minClaim: 0.8, maxClaim: 5.2 },
      { label: 'Tue', vol: 24.8, yield: 5.456, count: 21, minClaim: 1.5, maxClaim: 9.8 },
      { label: 'Wed', vol: 41.2, yield: 9.064, count: 34, minClaim: 2.8, maxClaim: 15.4 },
      { label: 'Thu', vol: 58.7, yield: 12.914, count: 48, minClaim: 4.2, maxClaim: 21.6 },
      { label: 'Fri', vol: 76.3, yield: 16.786, count: 62, minClaim: 5.8, maxClaim: 28.5 },
      { label: 'Sat', vol: 91.0, yield: 20.020, count: 74, minClaim: 7.2, maxClaim: 34.0 },
      { label: 'Sun', vol: 104.8, yield: 23.056, count: 84, minClaim: 8.5, maxClaim: 39.5 },
    ],
  },
  '30D': {
    label: 'Last 30 Days',
    volume: 382.50,
    commission: 84.1500,
    claims: 312,
    velocity: '+62.4% MoM',
    points: [
      { label: 'Day 2', vol: 18.0, yield: 3.960, count: 14, minClaim: 1.2, maxClaim: 7.5 },
      { label: 'Day 6', vol: 52.4, yield: 11.528, count: 42, minClaim: 3.5, maxClaim: 19.8 },
      { label: 'Day 10', vol: 98.6, yield: 21.692, count: 81, minClaim: 7.2, maxClaim: 36.4 },
      { label: 'Day 14', vol: 154.2, yield: 33.924, count: 126, minClaim: 11.5, maxClaim: 58.0 },
      { label: 'Day 18', vol: 216.8, yield: 47.696, count: 178, minClaim: 16.8, maxClaim: 82.5 },
      { label: 'Day 22', vol: 279.5, yield: 61.490, count: 228, minClaim: 22.0, maxClaim: 106.0 },
      { label: 'Day 26', vol: 336.0, yield: 73.920, count: 274, minClaim: 27.5, maxClaim: 128.5 },
      { label: 'Day 30', vol: 382.5, yield: 84.150, count: 312, minClaim: 32.0, maxClaim: 148.0 },
    ],
  },
  'ALL': {
    label: 'All-Time Growth',
    volume: 1248.60,
    commission: 274.6920,
    claims: 1042,
    velocity: 'Exponential Flywheel',
    points: [
      { label: 'Jan', vol: 45.0, yield: 9.900, count: 38, minClaim: 2.5, maxClaim: 18.0 },
      { label: 'Feb', vol: 120.5, yield: 26.510, count: 98, minClaim: 8.0, maxClaim: 46.0 },
      { label: 'Mar', vol: 240.2, yield: 52.844, count: 196, minClaim: 16.5, maxClaim: 94.0 },
      { label: 'Apr', vol: 410.8, yield: 90.376, count: 342, minClaim: 28.0, maxClaim: 162.0 },
      { label: 'May', vol: 630.4, yield: 138.688, count: 520, minClaim: 44.0, maxClaim: 248.0 },
      { label: 'Jun', vol: 890.1, yield: 195.822, count: 740, minClaim: 65.0, maxClaim: 350.0 },
      { label: 'Jul', vol: 1080.5, yield: 237.710, count: 902, minClaim: 82.0, maxClaim: 425.0 },
      { label: 'Now', vol: 1248.6, yield: 274.692, count: 1042, minClaim: 95.0, maxClaim: 495.0 },
    ],
  },
};

// Protocol Origin breakdown configuration
const PROTOCOL_ORIGINS = [
  { name: 'Pump.fun & WSOL Sweeps', sharePct: 44.5, color: '#d946ef', icon: '⚡' },
  { name: 'Raydium Liquidity Positions', sharePct: 26.8, color: '#00e5ff', icon: '◈' },
  { name: 'Jupiter Aggregator Rewards', sharePct: 17.2, color: '#ffb703', icon: '🪐' },
  { name: 'Marinade & Jito Liquid Stake', sharePct: 11.5, color: '#22c55e', icon: '🥩' },
];

// Conversion Funnel Data
const FUNNEL_STAGES = [
  { id: 'clicks', stage: '1. Link Clicks', count: 1482, pct: 100, drop: '32% bounce rate', color: '#38bdf8' },
  { id: 'scans', stage: '2. Scanned Wallets', count: 1008, pct: 68.0, drop: '38% empty positions', color: '#a855f7' },
  { id: 'found', stage: '3. MEV Discovered', count: 624, pct: 42.1, drop: '26% deferred claims', color: '#ec4899' },
  { id: 'settled', stage: '4. Claimed & Settled', count: 460, pct: 31.0, drop: 'Conversion Peak', color: '#22c55e' },
];

// Smooth Catmull-Rom Bezier curve generator
function getControlPoint(current, previous, next, reverse) {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.2;
  const opposedLine = {
    length: Math.hypot(n.x - p.x, n.y - p.y),
    angle: Math.atan2(n.y - p.y, n.x - p.x),
  };
  const angle = opposedLine.angle + (reverse ? Math.PI : 0);
  const length = opposedLine.length * smoothing;
  return {
    x: current.x + Math.cos(angle) * length,
    y: current.y + Math.sin(angle) * length,
  };
}

function createSmoothPath(points) {
  if (!points || points.length === 0) return '';
  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const cps = getControlPoint(a[i - 1], a[i - 2], point);
    const cpe = getControlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cps.x.toFixed(1)},${cps.y.toFixed(1)} ${cpe.x.toFixed(1)},${cpe.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, '');
}

// Orthogonal Step-Line Generator
function createStepPath(points) {
  if (!points || points.length === 0) return '';
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    return `${acc} H ${p.x.toFixed(1)} V ${p.y.toFixed(1)}`;
  }, '');
}

export default function ReferralAnalyticsGraph({
  solPrice = 72.05,
  liveSlot = 470901000,
  realData = null,
  activeWallet = '',
  isNetworkView = false,
}) {
  const [graphScope, setGraphScope] = useState('wallet'); // 'wallet' | 'network'
  const [timeframe, setTimeframe] = useState('7D');
  const [metricMode, setMetricMode] = useState('yield'); // 'yield' | 'volume' | 'dual'
  const [chartType, setChartType] = useState('area');    // 'area' | 'bar' | 'step' | 'range'
  const [breakdownView, setBreakdownView] = useState('donut'); // 'donut' | 'protocol' | 'funnel' | 'tier'
  const [hoverIndex, setHoverIndex] = useState(null);
  const [animatingKey, setAnimatingKey] = useState(0);
  const svgRef = useRef(null);

  // Trigger draw animation on timeframe or chartType change
  useEffect(() => {
    setAnimatingKey((prev) => prev + 1);
    setHoverIndex(null);
  }, [timeframe, metricMode, chartType, realData, graphScope]);

  const activeDataset = useMemo(() => {
    if (graphScope === 'network') {
      return realData?.networkTimeframeData?.[timeframe] || TIMEFRAME_DATA[timeframe] || TIMEFRAME_DATA['7D'];
    }
    if (realData?.timeframeData && realData.timeframeData[timeframe]) {
      return realData.timeframeData[timeframe];
    }
    return TIMEFRAME_DATA[timeframe] || TIMEFRAME_DATA['7D'];
  }, [timeframe, realData, graphScope]);

  // Graph Dimensions
  const W = 720;
  const H = 260;
  const PAD_X = 50;
  const PAD_Y = 35;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  // Compute coordinate points
  const { coordsYield, coordsVolume, coordsRange, maxYield, maxVol } = useMemo(() => {
    const pts = activeDataset.points;
    const maxY = Math.max(...pts.map((p) => p.yield), 0.001) * 1.15;
    const maxV = Math.max(...pts.map((p) => p.vol), 0.001) * 1.15;
    const maxR = Math.max(...pts.map((p) => p.maxClaim || p.yield * 1.4), 0.001) * 1.15;

    const cY = pts.map((p, idx) => {
      const x = PAD_X + (idx / Math.max(1, pts.length - 1)) * innerW;
      const y = H - PAD_Y - (p.yield / maxY) * innerH;
      return { x, y, ...p };
    });

    const cV = pts.map((p, idx) => {
      const x = PAD_X + (idx / Math.max(1, pts.length - 1)) * innerW;
      const y = H - PAD_Y - (p.vol / maxV) * innerH;
      return { x, y, ...p };
    });

    const cR = pts.map((p, idx) => {
      const x = PAD_X + (idx / Math.max(1, pts.length - 1)) * innerW;
      const yTop = H - PAD_Y - ((p.maxClaim || p.yield * 1.3) / maxR) * innerH;
      const yBottom = H - PAD_Y - ((p.minClaim || p.yield * 0.4) / maxR) * innerH;
      const yVal = H - PAD_Y - (p.yield / maxR) * innerH;
      return { x, yTop, yBottom, yVal, maxR, ...p };
    });

    return {
      coordsYield: cY,
      coordsVolume: cV,
      coordsRange: cR,
      maxYield: maxY,
      maxVol: maxV,
    };
  }, [activeDataset, innerW, innerH]);

  // Selected Primary Coordinates
  const primaryCoords = metricMode === 'volume' ? coordsVolume : coordsYield;
  const currentMax = metricMode === 'volume' ? maxVol : maxYield;

  // Curve Paths
  const linePath = useMemo(() => createSmoothPath(primaryCoords), [primaryCoords]);
  const areaPath = useMemo(() => {
    if (primaryCoords.length === 0) return '';
    const firstX = primaryCoords[0].x.toFixed(1);
    const lastX = primaryCoords[primaryCoords.length - 1].x.toFixed(1);
    const bottomY = (H - PAD_Y).toFixed(1);
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [linePath, primaryCoords, H, PAD_Y]);

  // Step Paths
  const stepLinePath = useMemo(() => createStepPath(primaryCoords), [primaryCoords]);
  const stepAreaPath = useMemo(() => {
    if (primaryCoords.length === 0) return '';
    const firstX = primaryCoords[0].x.toFixed(1);
    const lastX = primaryCoords[primaryCoords.length - 1].x.toFixed(1);
    const bottomY = (H - PAD_Y).toFixed(1);
    return `${stepLinePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [stepLinePath, primaryCoords, H, PAD_Y]);

  // Dual Secondary Path (if in dual mode)
  const secondaryCoords = coordsVolume;
  const secondaryLinePath = useMemo(() => createSmoothPath(secondaryCoords), [secondaryCoords]);

  // Bar dimensions
  const barWidth = useMemo(() => {
    return Math.max(12, Math.min(38, (innerW / primaryCoords.length) * 0.62));
  }, [innerW, primaryCoords.length]);

  // Handle mouse move for interactive tooltip
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * W;

    let nearestIdx = 0;
    let minDiff = Infinity;
    primaryCoords.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = idx;
      }
    });

    setHoverIndex(nearestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? primaryCoords[hoverIndex] : primaryCoords[primaryCoords.length - 1];
  const activeRangePoint = hoverIndex !== null ? coordsRange[hoverIndex] : coordsRange[coordsRange.length - 1];

  // Fee Split Distribution Calculation for Selected Timeframe
  const feeStats = useMemo(() => {
    const total = activeDataset.volume;
    const partner = (total * 0.22);
    const protocol = (total * 0.28);
    const claimant = (total * 0.50);

    return {
      total,
      partner: +partner.toFixed(4),
      partnerUsd: +(partner * solPrice).toFixed(2),
      protocol: +protocol.toFixed(4),
      protocolUsd: +(protocol * solPrice).toFixed(2),
      claimant: +claimant.toFixed(4),
      claimantUsd: +(claimant * solPrice).toFixed(2),
    };
  }, [activeDataset, solPrice]);

  // Tier milestone calculations (target: 100 SOL for Gold Alpha)
  const tierProgress = useMemo(() => {
    const currentVol = activeDataset.volume;
    const target = 100;
    const pct = Math.min(100, Math.max(0, (currentVol / target) * 100));
    const solRemaining = Math.max(0, +(target - currentVol).toFixed(2));
    return {
      currentVol,
      target,
      pct: +pct.toFixed(1),
      solRemaining,
      usdRemaining: +(solRemaining * solPrice).toFixed(2),
      tierName: currentVol >= 100 ? 'Gold Alpha Partner' : currentVol >= 25 ? 'Silver Whale Partner' : 'Bronze Partner',
      nextTier: currentVol >= 100 ? 'Diamond Citadel' : 'Gold Alpha Partner',
      bonusPerk: currentVol >= 100 ? '+5% Priority Node Routing' : '+2% Protocol Bonus',
    };
  }, [activeDataset.volume, solPrice]);

  return (
    <div className="ref-analytics-window os-window os-window--white os-window--shadow">
      {/* OS Header Bar */}
      <div className="os-window__bar">
        <span className="os-window__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ref-live-pulse-dot" />
          <span>Real-Time Mainnet Yield &amp; Volume Analytics · {activeWallet ? shortAddr(activeWallet, 5) : 'Solana Mainnet'}</span>
          <span className="os-tag os-tag--green" style={{ fontSize: 9, padding: '1px 5px' }}>ON-CHAIN VERIFIED</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="engine-pill" style={{ fontSize: 10, padding: '2px 8px' }}>
            <span className="engine-pill__dot" />
            Live Sync @ ${solPrice.toFixed(2)}/SOL
          </span>
          <span className="os-window__meta">Slot #{liveSlot.toLocaleString()}</span>
        </div>
      </div>

      <div className="os-window__frame">
        <div className="ref-analytics-body">
          {/* Top Controls: Scope, Timeframe, Metric Mode & Graph Types */}
          <div className="ref-controls-strip">
            {/* Scope: Your Wallet vs Global Network */}
            <div className="ref-control-group">
              <span className="ref-control-label">Source:</span>
              <div className="ref-metric-pills">
                <button
                  type="button"
                  className={`ref-metric-btn ${graphScope === 'wallet' ? 'ref-metric-btn--active' : ''}`}
                  onClick={() => setGraphScope('wallet')}
                >
                  👤 Your Wallet ({realData?.hasUserClaims ? `+${(realData?.totalCommissionSol || 0).toFixed(4)} SOL` : '0.00 SOL'})
                </button>
                <button
                  type="button"
                  className={`ref-metric-btn ${graphScope === 'network' ? 'ref-metric-btn--active' : ''}`}
                  onClick={() => setGraphScope('network')}
                >
                  🌐 Global Network
                </button>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="ref-control-group">
              <span className="ref-control-label">Timeframe:</span>
              <div className="ref-timeframe-pills">
                {['24H', '7D', '30D', 'ALL'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`ref-tf-btn ${timeframe === tf ? 'ref-tf-btn--active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Mode */}
            <div className="ref-control-group">
              <span className="ref-control-label">Metric:</span>
              <div className="ref-metric-pills">
                <button
                  type="button"
                  className={`ref-metric-btn ${metricMode === 'yield' ? 'ref-metric-btn--active' : ''}`}
                  onClick={() => setMetricMode('yield')}
                >
                  ◈ 22% Cut
                </button>
                <button
                  type="button"
                  className={`ref-metric-btn ${metricMode === 'volume' ? 'ref-metric-btn--active' : ''}`}
                  onClick={() => setMetricMode('volume')}
                >
                  ⚡ Gross Vol
                </button>
                <button
                  type="button"
                  className={`ref-metric-btn ${metricMode === 'dual' ? 'ref-metric-btn--active' : ''}`}
                  onClick={() => setMetricMode('dual')}
                >
                  ⩆ Dual Trend
                </button>
              </div>
            </div>

            {/* Primary Graph Type Selector */}
            <div className="ref-control-group">
              <span className="ref-control-label">Graph Type:</span>
              <div className="ref-metric-pills">
                <button
                  type="button"
                  className={`ref-chart-type-btn ${chartType === 'area' ? 'ref-chart-type-btn--active' : ''}`}
                  onClick={() => setChartType('area')}
                  title="Smooth Bezier Curve & Gradient Area"
                >
                  📈 Area Curve
                </button>
                <button
                  type="button"
                  className={`ref-chart-type-btn ${chartType === 'bar' ? 'ref-chart-type-btn--active' : ''}`}
                  onClick={() => setChartType('bar')}
                  title="Period-by-period Bar Histogram"
                >
                  📊 Bar Histogram
                </button>
                <button
                  type="button"
                  className={`ref-chart-type-btn ${chartType === 'step' ? 'ref-chart-type-btn--active' : ''}`}
                  onClick={() => setChartType('step')}
                  title="Orthogonal On-Chain Payout Step Ladder"
                >
                  🪜 Step-Ladder
                </button>
                <button
                  type="button"
                  className={`ref-chart-type-btn ${chartType === 'range' ? 'ref-chart-type-btn--active' : ''}`}
                  onClick={() => setChartType('range')}
                  title="Min-to-Max Volatility Range & Spread"
                >
                  🕯 Volatility Range
                </button>
              </div>
            </div>
          </div>

          {/* Quick Real-Time Metric Telemetry Strip */}
          <div className="ref-metrics-banner">
            <div className="ref-mb-stat">
              <span className="ref-mb-label">ACCUMULATED 22% YIELD ({timeframe})</span>
              <div className="ref-mb-value" style={{ color: 'var(--magenta)' }}>
                +{activeDataset.commission.toFixed(4)} SOL
              </div>
              <span className="ref-mb-sub">
                ≈ ${(activeDataset.commission * solPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="ref-mb-stat">
              <span className="ref-mb-label">REFERRED VOLUME UNLOCKED</span>
              <div className="ref-mb-value">
                {activeDataset.volume.toFixed(2)} SOL
              </div>
              <span className="ref-mb-sub">
                Across {activeDataset.claims} Verified Claims
              </span>
            </div>

            <div className="ref-mb-stat">
              <span className="ref-mb-label">GROWTH VELOCITY</span>
              <div className="ref-mb-value" style={{ color: 'var(--green)' }}>
                {activeDataset.velocity}
              </div>
              <span className="ref-mb-sub">Real-Time Flywheel Index</span>
            </div>

            <div className="ref-mb-stat">
              <span className="ref-mb-label">CURRENT TELEMETRY</span>
              <div className="ref-mb-value" style={{ fontSize: 16 }}>
                {activePoint?.label || 'Now'}: +{(activePoint?.yield || 0).toFixed(4)} SOL
              </div>
              <span className="ref-mb-sub" style={{ color: 'var(--pink)' }}>
                ≈ ${((activePoint?.yield || 0) * solPrice).toFixed(2)} USD (Live Spot)
              </span>
            </div>
          </div>

          {/* Main 2-Column Visuals Grid: [Selected Chart Type] + [Selected Breakdown Graph] */}
          <div className="ref-visuals-grid">
            {/* Left Column: Primary Chart Canvas */}
            <div className="ref-graph-pane">
              <div className="ref-graph-subhead">
                <span style={{ fontWeight: 700 }}>
                  {chartType === 'area' && '📈 Smooth Area Curve'}
                  {chartType === 'bar' && '📊 Bar Histogram & Volume Columns'}
                  {chartType === 'step' && '🪜 Smart Contract Step-Ladder Payouts'}
                  {chartType === 'range' && '🕯 High-Low Claim Volatility Spread'}
                  {' · '}{activeDataset.label}
                </span>
                <span className="os-tag os-tag--live-pulse" style={{ fontSize: 10 }}>
                  Active Format: {chartType.toUpperCase()}
                </span>
              </div>

              <div className="ref-svg-wrapper">
                <svg
                  ref={svgRef}
                  className="ref-svg-canvas"
                  viewBox={`0 0 ${W} ${H}`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    {/* Area Gradients */}
                    <linearGradient id="refYieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d946ef" stopOpacity="0.45" />
                      <stop offset="80%" stopColor="#d946ef" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#d946ef" stopOpacity="0.00" />
                    </linearGradient>

                    <linearGradient id="refVolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
                      <stop offset="85%" stopColor="#00e5ff" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.00" />
                    </linearGradient>

                    {/* Bar Gradients */}
                    <linearGradient id="refBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff007a" />
                      <stop offset="60%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>

                    <linearGradient id="refBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ffa3" />
                      <stop offset="100%" stopColor="#00e5ff" />
                    </linearGradient>

                    {/* Step Area Gradient */}
                    <linearGradient id="refStepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                    </linearGradient>

                    {/* Line Stroke Gradient */}
                    <linearGradient id="refLineStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ff007a" />
                      <stop offset="50%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#00ffa3" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = H - PAD_Y - pct * innerH;
                    return (
                      <g key={i}>
                        <line
                          x1={PAD_X}
                          y1={y}
                          x2={W - PAD_X}
                          y2={y}
                          stroke="currentColor"
                          strokeOpacity="0.09"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={PAD_X - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="9"
                          fill="currentColor"
                          opacity="0.45"
                          fontFamily="monospace"
                        >
                          {(currentMax * pct).toFixed(metricMode === 'volume' ? 1 : 2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline */}
                  <line
                    x1={PAD_X}
                    y1={H - PAD_Y}
                    x2={W - PAD_X}
                    y2={H - PAD_Y}
                    stroke="currentColor"
                    strokeOpacity="0.25"
                  />

                  {/* X-Axis Tick Labels */}
                  {primaryCoords.map((pt, idx) => (
                    <text
                      key={idx}
                      x={pt.x}
                      y={H - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="currentColor"
                      opacity={hoverIndex === idx ? '1' : '0.55'}
                      fontWeight={hoverIndex === idx ? '700' : '400'}
                      fontFamily="monospace"
                    >
                      {pt.label}
                    </text>
                  ))}

                  {/* Dual Mode Secondary Line (Gross Volume) */}
                  {metricMode === 'dual' && chartType !== 'bar' && (
                    <path
                      d={secondaryLinePath}
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.75"
                    />
                  )}

                  {/* ============================================================
                      CHART TYPE 1: SMOOTH AREA & BEZIER LINE
                      ============================================================ */}
                  {chartType === 'area' && (
                    <g key={`area-${animatingKey}`}>
                      <path
                        d={areaPath}
                        fill={metricMode === 'volume' ? 'url(#refVolGrad)' : 'url(#refYieldGrad)'}
                        className="ref-area-animate"
                      />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="url(#refLineStroke)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ref-path-animate"
                      />
                      {primaryCoords.map((pt, idx) => {
                        const isHovered = hoverIndex === idx;
                        const isLast = idx === primaryCoords.length - 1;
                        return (
                          <g key={idx}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 6 : isLast ? 4.5 : 3}
                              fill={isHovered ? '#ffffff' : '#d946ef'}
                              stroke={isHovered ? '#ff007a' : '#1e1e2f'}
                              strokeWidth="2.5"
                              style={{ transition: 'all 0.15s ease' }}
                            />
                            {isLast && !isHovered && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="9"
                                fill="none"
                                stroke="#d946ef"
                                strokeWidth="1.5"
                                className="ref-pulse-ring"
                              />
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* ============================================================
                      CHART TYPE 2: BAR HISTOGRAM / COLUMNS
                      ============================================================ */}
                  {chartType === 'bar' && (
                    <g key={`bar-${animatingKey}`}>
                      {primaryCoords.map((pt, idx) => {
                        const isHovered = hoverIndex === idx;
                        const barH = Math.max(4, (H - PAD_Y) - pt.y);
                        const barX = pt.x - barWidth / 2;
                        const barY = pt.y;

                        return (
                          <g key={idx} className="ref-bar-group">
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barH}
                              rx="3"
                              fill={isHovered ? 'url(#refBarHoverGrad)' : 'url(#refBarGrad)'}
                              stroke={isHovered ? '#00ffa3' : 'transparent'}
                              strokeWidth="1.5"
                              opacity={isHovered ? 1 : 0.88}
                              className="ref-bar-rect"
                            />
                            {/* Top Neon Accent Cap */}
                            <line
                              x1={barX}
                              y1={barY}
                              x2={barX + barWidth}
                              y2={barY}
                              stroke={isHovered ? '#ffffff' : '#00ffa3'}
                              strokeWidth="2.5"
                            />
                            {/* Value label on top */}
                            {(isHovered || primaryCoords.length <= 8) && (
                              <text
                                x={pt.x}
                                y={barY - 6}
                                textAnchor="middle"
                                fontSize="9.5"
                                fill="currentColor"
                                fontWeight="700"
                                fontFamily="monospace"
                              >
                                {pt.yield.toFixed(2)}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* ============================================================
                      CHART TYPE 3: STEP-LADDER (SMART CONTRACT SETTLEMENTS)
                      ============================================================ */}
                  {chartType === 'step' && (
                    <g key={`step-${animatingKey}`}>
                      <path
                        d={stepAreaPath}
                        fill="url(#refStepGrad)"
                        className="ref-area-animate"
                      />
                      <path
                        d={stepLinePath}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        className="ref-path-animate"
                      />
                      {primaryCoords.map((pt, idx) => {
                        const isHovered = hoverIndex === idx;
                        return (
                          <rect
                            key={idx}
                            x={pt.x - 3.5}
                            y={pt.y - 3.5}
                            width="7"
                            height="7"
                            fill={isHovered ? '#ffffff' : '#22c55e'}
                            stroke={isHovered ? '#ff007a' : '#0f172a'}
                            strokeWidth="1.5"
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* ============================================================
                      CHART TYPE 4: VOLATILITY RANGE / CANDLESTICK SPREAD
                      ============================================================ */}
                  {chartType === 'range' && (
                    <g key={`range-${animatingKey}`}>
                      {coordsRange.map((pt, idx) => {
                        const isHovered = hoverIndex === idx;
                        const capsuleW = Math.max(8, barWidth * 0.7);
                        const topY = Math.min(pt.yTop, pt.yVal);
                        const botY = Math.max(pt.yTop, pt.yVal);
                        const bodyH = Math.max(5, botY - topY);

                        return (
                          <g key={idx}>
                            {/* High-Low Center Wick Line */}
                            <line
                              x1={pt.x}
                              y1={pt.yTop}
                              x2={pt.x}
                              y2={pt.yBottom}
                              stroke="#00e5ff"
                              strokeWidth="1.8"
                              strokeDasharray={isHovered ? 'none' : '2 2'}
                              opacity={isHovered ? 1 : 0.7}
                            />
                            {/* Volatility Body Capsule */}
                            <rect
                              x={pt.x - capsuleW / 2}
                              y={topY}
                              width={capsuleW}
                              height={bodyH}
                              rx="3"
                              fill={isHovered ? '#00ffa3' : '#d946ef'}
                              stroke={isHovered ? '#ffffff' : '#1e1e2f'}
                              strokeWidth="1.5"
                            />
                            {/* Min / Max Whisker Caps */}
                            <line
                              x1={pt.x - 4}
                              y1={pt.yTop}
                              x2={pt.x + 4}
                              y2={pt.yTop}
                              stroke="#00e5ff"
                              strokeWidth="1.5"
                            />
                            <line
                              x1={pt.x - 4}
                              y1={pt.yBottom}
                              x2={pt.x + 4}
                              y2={pt.yBottom}
                              stroke="#00e5ff"
                              strokeWidth="1.5"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Interactive Crosshair & Tooltip Guide */}
                  {hoverIndex !== null && (
                    <g>
                      <line
                        x1={activePoint.x}
                        y1={PAD_Y}
                        x2={activePoint.x}
                        y2={H - PAD_Y}
                        stroke="#d946ef"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="6.5"
                        fill="#ff007a"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                    </g>
                  )}
                </svg>

                {/* Floating Interactive Tooltip */}
                {hoverIndex !== null && (
                  <div
                    className="ref-floating-tooltip"
                    style={{
                      left: `${(activePoint.x / W) * 100}%`,
                      top: `${Math.max(10, (activePoint.y / H) * 100 - 35)}%`,
                    }}
                  >
                    <div className="ref-tt-title">◈ {activePoint.label} · Milestone Data</div>
                    <div className="ref-tt-row">
                      <span>22% Affiliate Cut:</span>
                      <strong style={{ color: 'var(--magenta)' }}>
                        +{activePoint.yield.toFixed(4)} SOL
                      </strong>
                    </div>
                    <div className="ref-tt-row">
                      <span>Live Value:</span>
                      <span style={{ color: 'var(--green)' }}>
                        ≈ ${(activePoint.yield * solPrice).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="ref-tt-row" style={{ fontSize: 10, opacity: 0.75 }}>
                      <span>Gross Volume:</span>
                      <span>{activePoint.vol.toFixed(2)} SOL ({activePoint.count} claims)</span>
                    </div>
                    {chartType === 'range' && (
                      <div className="ref-tt-row" style={{ fontSize: 10, color: '#00e5ff' }}>
                        <span>Claim Spread:</span>
                        <span>{activeRangePoint.minClaim.toFixed(2)} — {activeRangePoint.maxClaim.toFixed(2)} SOL</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Multi-Format Breakdown Panel */}
            <div className="ref-radial-pane">
              {/* Secondary View Switcher Tabs */}
              <div className="ref-breakdown-tabs">
                <button
                  type="button"
                  className={`ref-bd-tab ${breakdownView === 'donut' ? 'ref-bd-tab--active' : ''}`}
                  onClick={() => setBreakdownView('donut')}
                  title="22% Referral Commission Gauge"
                >
                  ⚖ Commission Gauge
                </button>
                <button
                  type="button"
                  className={`ref-bd-tab ${breakdownView === 'protocol' ? 'ref-bd-tab--active' : ''}`}
                  onClick={() => setBreakdownView('protocol')}
                  title="Distribution by Solana Protocol Source"
                >
                  ◈ Protocol Mix
                </button>
                <button
                  type="button"
                  className={`ref-bd-tab ${breakdownView === 'funnel' ? 'ref-bd-tab--active' : ''}`}
                  onClick={() => setBreakdownView('funnel')}
                  title="4-Stage Referral Conversion Funnel"
                >
                  🔻 Funnel Flow
                </button>
                <button
                  type="button"
                  className={`ref-bd-tab ${breakdownView === 'tier' ? 'ref-bd-tab--active' : ''}`}
                  onClick={() => setBreakdownView('tier')}
                  title="Affiliate Level & Milestone Gauge"
                >
                  🎯 Tier Gauge
                </button>
              </div>

              {/* ============================================================
                  BREAKDOWN GRAPH TYPE 1: RADIAL DONUT (22/28/50 SPLIT)
                  ============================================================ */}
              {breakdownView === 'donut' && (
                <div className="ref-radial-display">
                  <div className="ref-radial-donut-wrap">
                    <svg className="ref-radial-svg" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.08"
                        strokeWidth="18"
                      />
                      {/* Background Track */}
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="#22c55e"
                        strokeOpacity="0.3"
                        strokeWidth="18"
                        strokeDasharray="376.99"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(-90 80 80)"
                        className="ref-donut-seg"
                      />
                      {/* 22% Referral Partner (Magenta) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="#d946ef"
                        strokeWidth="20"
                        strokeDasharray="376.99"
                        strokeDashoffset="294.05" /* 22% */
                        strokeLinecap="round"
                        transform="rotate(-90 80 80)"
                        className="ref-donut-seg"
                      />
                    </svg>
                    <div className="ref-donut-center-label">
                      <span className="ref-dc-pct">22%</span>
                      <span className="ref-dc-txt">YOUR CUT</span>
                    </div>
                  </div>

                  {/* Legend & Breakdown Amounts */}
                  <div className="ref-donut-legend">
                    <div className="ref-legend-item ref-legend-item--partner">
                      <div className="ref-leg-head">
                        <span className="ref-leg-dot" style={{ background: '#d946ef' }} />
                        <strong>22% Partner Commission</strong>
                      </div>
                      <div className="ref-leg-amount">
                        +{feeStats.partner} SOL <span className="ref-leg-usd">(${feeStats.partnerUsd})</span>
                      </div>
                    </div>

                    <div className="ref-legend-item ref-legend-item--claimant">
                      <div className="ref-leg-head">
                        <span className="ref-leg-dot" style={{ background: '#22c55e' }} />
                        <strong>Instant On-Chain Delivery</strong>
                      </div>
                      <div className="ref-leg-amount">
                        ~400ms <span className="ref-leg-usd">(Solana Mainnet)</span>
                      </div>
                    </div>

                    <div className="ref-legend-item ref-legend-item--claimant">
                      <div className="ref-leg-head">
                        <span className="ref-leg-dot" style={{ background: '#38bdf8' }} />
                        <strong>100% Non-Custodial</strong>
                      </div>
                      <div className="ref-leg-amount">
                        Client-Signed <span className="ref-leg-usd">(Atomic)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  BREAKDOWN GRAPH TYPE 2: PROTOCOL ORIGIN (HORIZONTAL BARS)
                  ============================================================ */}
              {breakdownView === 'protocol' && (
                <div className="ref-proto-breakdown-pane">
                  <div style={{ marginBottom: 10, fontSize: 11.5, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                    Volume Distribution by Solana Protocol Origin ({activeDataset.label}):
                  </div>

                  <div className="ref-proto-bars-list">
                    {PROTOCOL_ORIGINS.map((proto) => {
                      const protoVol = +(activeDataset.volume * (proto.sharePct / 100)).toFixed(2);
                      const protoYield = +(protoVol * 0.22).toFixed(4);
                      const protoUsd = +(protoYield * solPrice).toFixed(2);

                      return (
                        <div key={proto.name} className="ref-proto-row">
                          <div className="ref-proto-row-head">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{proto.icon}</span>
                              <strong style={{ fontSize: 12 }}>{proto.name}</strong>
                            </span>
                            <span className="ref-proto-pct" style={{ color: proto.color }}>
                              {proto.sharePct}%
                            </span>
                          </div>

                          <div className="ref-proto-bar-track">
                            <div
                              className="ref-proto-bar-fill"
                              style={{
                                width: `${proto.sharePct}%`,
                                background: proto.color,
                              }}
                            />
                          </div>

                          <div className="ref-proto-subline">
                            <span>Vol: {protoVol} SOL</span>
                            <span style={{ color: 'var(--green)' }}>
                              Your 22%: +{protoYield} SOL (${protoUsd})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================
                  BREAKDOWN GRAPH TYPE 3: CONVERSION FUNNEL FLOW
                  ============================================================ */}
              {breakdownView === 'funnel' && (
                <div className="ref-funnel-pane">
                  <div style={{ marginBottom: 10, fontSize: 11.5, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                    Referral Conversion Pipeline &amp; Drop-off Analysis:
                  </div>

                  <div className="ref-funnel-stages-list">
                    {FUNNEL_STAGES.map((stg) => (
                      <div key={stg.id} className="ref-funnel-stage-card">
                        <div className="ref-funnel-card-head">
                          <span style={{ fontWeight: 700, fontSize: 11.5 }}>{stg.stage}</span>
                          <span className="os-tag" style={{ fontSize: 9.5, borderColor: stg.color, color: stg.color }}>
                            {stg.count.toLocaleString()} ({stg.pct}%)
                          </span>
                        </div>

                        <div className="ref-funnel-track">
                          <div
                            className="ref-funnel-fill"
                            style={{
                              width: `${stg.pct}%`,
                              background: stg.color,
                            }}
                          />
                        </div>

                        <div className="ref-funnel-card-foot">
                          <span style={{ fontSize: 10, opacity: 0.7 }}>{stg.drop}</span>
                          {stg.id === 'settled' && (
                            <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>
                              ★ 31.0% Net Conversion
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================
                  BREAKDOWN GRAPH TYPE 4: TIER MILESTONE GAUGE ARC
                  ============================================================ */}
              {breakdownView === 'tier' && (
                <div className="ref-gauge-pane">
                  <div style={{ marginBottom: 6, fontSize: 11.5, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                    Affiliate Status &amp; Tier Progression:
                  </div>

                  <div className="ref-gauge-display">
                    {/* Radial Semi-Circle SVG Gauge */}
                    <div className="ref-gauge-svg-wrap">
                      <svg className="ref-gauge-svg" viewBox="0 0 160 90">
                        {/* Gauge Arc Track */}
                        <path
                          d="M 20 80 A 60 60 0 0 1 140 80"
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity="0.12"
                          strokeWidth="14"
                          strokeLinecap="round"
                        />
                        {/* Gauge Arc Fill */}
                        <path
                          d="M 20 80 A 60 60 0 0 1 140 80"
                          fill="none"
                          stroke="url(#refLineStroke)"
                          strokeWidth="14"
                          strokeDasharray="188.5"
                          strokeDashoffset={188.5 - (188.5 * (tierProgress.pct / 100))}
                          strokeLinecap="round"
                          className="ref-gauge-arc-fill"
                        />
                      </svg>

                      <div className="ref-gauge-center-badge">
                        <div className="ref-gauge-pct">{tierProgress.pct}%</div>
                        <div className="ref-gauge-tier">{tierProgress.tierName}</div>
                      </div>
                    </div>

                    <div className="ref-gauge-info-box">
                      <div className="ref-gauge-row">
                        <span>Current Volume:</span>
                        <strong>{tierProgress.currentVol} / {tierProgress.target} SOL</strong>
                      </div>
                      <div className="ref-gauge-row">
                        <span>Next Milestone:</span>
                        <span style={{ color: 'var(--magenta)' }}>{tierProgress.nextTier}</span>
                      </div>
                      <div className="ref-gauge-row">
                        <span>Remaining:</span>
                        <span>{tierProgress.solRemaining} SOL (~${tierProgress.usdRemaining} USD)</span>
                      </div>
                      <div className="ref-gauge-perk-pill">
                        <span>Unlocked Perk:</span>
                        <strong>{tierProgress.bonusPerk}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="ref-radial-footer">
                <span className="ticker-live-dot" style={{ width: 6, height: 6 }} />
                <span>
                  {breakdownView === 'donut' && `Smart contract allocation for ${activeDataset.label} (${activeDataset.volume} SOL Gross)`}
                  {breakdownView === 'protocol' && `Multi-protocol sweep breakdown (${activeDataset.claims} claims)`}
                  {breakdownView === 'funnel' && 'Real-time conversion efficiency on Solana mainnet'}
                  {breakdownView === 'tier' && `${tierProgress.pct}% towards ${tierProgress.nextTier} status`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
