// ============================================================
// lib/rpcPool.js — High-Performance Solana RPC Load Balancer
// Multi-endpoint racing, circuit breaker, adaptive timeouts & error management
// 100% Non-custodial. Zero private keys handled.
// ============================================================

export const DEFAULT_RPC_ENDPOINTS = [
  process.env.SOLANA_RPC,
  process.env.NEXT_PUBLIC_SOLANA_RPC,
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
].filter(Boolean);

// In-memory circuit breaker and latency statistics
const endpointStats = new Map();

function getStats(url) {
  if (!endpointStats.has(url)) {
    endpointStats.set(url, {
      url,
      consecutiveFailures: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      latencyMs: 200,
    });
  }
  return endpointStats.get(url);
}

const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;
const MAX_FAILURES_BEFORE_BREAK = 3;

/**
 * Returns prioritized list of endpoints based on health, circuit breaker and latency
 */
export function getHealthyEndpoints(customEndpoints = DEFAULT_RPC_ENDPOINTS) {
  const now = Date.now();
  const endpoints = [...new Set(customEndpoints.filter(Boolean))];
  if (endpoints.length === 0) return [];

  return endpoints.sort((a, b) => {
    const sA = getStats(a);
    const sB = getStats(b);

    const aBroken =
      sA.consecutiveFailures >= MAX_FAILURES_BEFORE_BREAK &&
      now - sA.lastFailureTime < CIRCUIT_BREAKER_COOLDOWN_MS;
    const bBroken =
      sB.consecutiveFailures >= MAX_FAILURES_BEFORE_BREAK &&
      now - sB.lastFailureTime < CIRCUIT_BREAKER_COOLDOWN_MS;

    if (aBroken && !bBroken) return 1;
    if (!aBroken && bBroken) return -1;

    // Prioritize endpoints with fewer recent failures
    if (sA.consecutiveFailures !== sB.consecutiveFailures) {
      return sA.consecutiveFailures - sB.consecutiveFailures;
    }

    // Secondary priority: lower recorded latency
    return sA.latencyMs - sB.latencyMs;
  });
}

/**
 * Execute a single RPC call to a specific endpoint with timeout
 */
async function executeSingleRpc(endpoint, method, params, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();
  const stats = getStats(endpoint);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'solana-web3.js/1.95.3',
        'solana-client': 'js/1.95.3',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const isRateLimit = res.status === 429;
      const isForbidden = res.status === 403;
      stats.consecutiveFailures++;
      stats.totalFailures++;
      stats.lastFailureTime = Date.now();
      const err = new Error(`RPC HTTP ${res.status}: ${res.statusText}`);
      err.status = res.status;
      err.code = isRateLimit ? 'RPC_RATE_LIMIT' : isForbidden ? 'RPC_FORBIDDEN' : `RPC_HTTP_${res.status}`;
      err.isRateLimit = isRateLimit;
      err.isForbidden = isForbidden;
      err.endpoint = endpoint;
      throw err;
    }

    const json = await res.json();
    if (json.error) {
      stats.consecutiveFailures++;
      stats.totalFailures++;
      stats.lastFailureTime = Date.now();
      const err = new Error(json.error.message || `RPC Error ${json.error.code}`);
      err.code = json.error.code || 'RPC_JSON_ERROR';
      err.endpoint = endpoint;
      throw err;
    }

    // Success: update stats and smooth latency
    stats.consecutiveFailures = 0;
    stats.totalSuccesses++;
    stats.lastSuccessTime = Date.now();
    stats.latencyMs = Math.round(stats.latencyMs * 0.7 + elapsed * 0.3);

    return { result: json.result, endpoint, latencyMs: elapsed };
  } catch (err) {
    if (err.name === 'AbortError') {
      stats.consecutiveFailures++;
      stats.lastFailureTime = Date.now();
      const timeoutErr = new Error(`RPC call to ${endpoint} timed out after ${timeoutMs}ms`);
      timeoutErr.code = 'RPC_TIMEOUT';
      timeoutErr.isTimeout = true;
      timeoutErr.endpoint = endpoint;
      throw timeoutErr;
    }
    stats.consecutiveFailures++;
    stats.lastFailureTime = Date.now();
    if (!err.code) err.code = 'RPC_NETWORK_ERROR';
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * High-performance load balanced RPC call with speculative request hedging (parallel racing)
 */
export async function callRpcWithLoadBalancing(
  method,
  params,
  {
    timeoutMs = 4500,
    hedgeDelayMs = 800,
    endpoints = DEFAULT_RPC_ENDPOINTS,
    retryCount = 1,
  } = {}
) {
  const healthy = getHealthyEndpoints(endpoints);
  if (healthy.length === 0) {
    const err = new Error('No Solana RPC endpoints available in pool');
    err.code = 'NO_RPC_ENDPOINTS';
    throw err;
  }

  // Primary endpoint (lowest latency & highest health score)
  const primary = healthy[0];
  const secondary = healthy[1] || healthy[0];

  // Try speculative parallel hedge: start primary, if slow start secondary
  let hedgeTimeoutId = null;

  try {
    const hedgeRace = new Promise((resolve, reject) => {
      let resolved = false;

      // 1. Launch Primary
      executeSingleRpc(primary, method, params, timeoutMs)
        .then((data) => {
          if (!resolved) {
            resolved = true;
            if (hedgeTimeoutId) clearTimeout(hedgeTimeoutId);
            resolve(data);
          }
        })
        .catch((err) => {
          // If primary fails fast and secondary hasn't launched yet, launch secondary immediately
          if (!resolved && secondary && secondary !== primary) {
            executeSingleRpc(secondary, method, params, timeoutMs)
              .then((data) => {
                if (!resolved) {
                  resolved = true;
                  resolve(data);
                }
              })
              .catch(reject);
          } else {
            reject(err);
          }
        });

      // 2. Launch Secondary hedge after hedgeDelayMs if primary hasn't replied yet
      if (secondary && secondary !== primary) {
        hedgeTimeoutId = setTimeout(() => {
          if (!resolved) {
            executeSingleRpc(secondary, method, params, timeoutMs)
              .then((data) => {
                if (!resolved) {
                  resolved = true;
                  resolve(data);
                }
              })
              .catch(() => {});
          }
        }, hedgeDelayMs);
      }
    });

    const res = await hedgeRace;
    return res.result;
  } catch (firstPassError) {
    // Retry round-robin across remaining healthy nodes
    for (let i = 1; i < healthy.length && i <= retryCount + 1; i++) {
      const backupEndpoint = healthy[i];
      if (backupEndpoint === primary) continue;
      try {
        const backupRes = await executeSingleRpc(backupEndpoint, method, params, timeoutMs);
        return backupRes.result;
      } catch {}
    }
    const finalErr = new Error(`All load-balanced RPC nodes failed for ${method}: ${firstPassError.message}`);
    finalErr.code = firstPassError.code || 'ALL_RPC_FAILED';
    throw finalErr;
  }
}

/**
 * Returns current health status of all RPC pool nodes
 */
export function getRpcPoolHealth(endpoints = DEFAULT_RPC_ENDPOINTS) {
  const now = Date.now();
  return endpoints.map((ep) => {
    const s = getStats(ep);
    const inCooldown =
      s.consecutiveFailures >= MAX_FAILURES_BEFORE_BREAK &&
      now - s.lastFailureTime < CIRCUIT_BREAKER_COOLDOWN_MS;
    return {
      endpoint: ep.replace(/\/\?[^/]+/, '/?api-key=***'),
      status: inCooldown ? 'cooldown' : s.consecutiveFailures > 0 ? 'degraded' : 'healthy',
      latencyMs: s.latencyMs,
      consecutiveFailures: s.consecutiveFailures,
      totalSuccesses: s.totalSuccesses,
      lastSuccessAgeSec: s.lastSuccessTime ? Math.round((now - s.lastSuccessTime) / 1000) : null,
    };
  });
}
