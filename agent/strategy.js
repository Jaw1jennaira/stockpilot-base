// Strategy v1 — documented, explainable, no black box.
// Signal per ticker from daily closes:
//   momentum = close / SMA(20) - 1        (trend)
//   z        = (close - SMA(20)) / SD(20)  (mean-reversion; negative = oversold)
//   score    = 0.6 * momentum - 0.4 * z
// Target weight ∝ max(score, 0), capped at maxWeightPerTicker, with a cash floor.
// Stop-loss: exit a ticker entirely if it fell >= stopLossDailyDrop in one day.
// Rebalance only when |target - current| > rebalanceThreshold of NAV.
const { CONFIG } = require("./config");

function sma(values, n) {
  if (values.length < n) return null;
  const slice = values.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

function std(values, n) {
  if (values.length < n) return null;
  const slice = values.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / n;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}

function scoreTicker(closes) {
  const p = CONFIG.strategy;
  const close = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const s20 = sma(closes, p.smaLong);
  if (s20 === null || close === undefined) return null;
  const sd20 = std(closes, p.smaLong) || 0;
  const momentum = close / s20 - 1;
  const z = sd20 > 0 ? (close - s20) / sd20 : 0;
  // Normalize momentum by relative volatility so both terms are z-like
  // and comparable: momZ ~ +2 = strong uptrend, -2 = strong downtrend.
  const relVol = s20 > 0 ? sd20 / s20 : 0;
  const momZ = relVol > 0 ? momentum / relVol : 0;
  const score = p.momentumWeight * momZ - p.meanReversionWeight * z;
  const dailyDrop = prev !== undefined ? prev / close - 1 : 0; // >0 means price fell
  const stopLoss = prev !== undefined && close / prev - 1 <= -p.stopLossDailyDrop;
  return { close, momentum, z, momZ, score, dailyDrop, stopLoss };
}

/// histories: { ticker: [closes ascending] }
/// currentWeights: { ticker: weight (0..1) } + cash weight implied.
/// Returns { targets, signals, rationale }.
function planTargets(histories, currentWeights) {
  const p = CONFIG.strategy;
  const signals = {};
  let totalScore = 0;
  for (const t of CONFIG.tickers) {
    const closes = histories[t.ticker] || [];
    const s = scoreTicker(closes);
    signals[t.ticker] = s;
    if (s && !s.stopLoss && s.score > 0) totalScore += s.score;
  }
  // Raw weights from positive scores, capped per ticker.
  const raw = {};
  for (const t of CONFIG.tickers) {
    const s = signals[t.ticker];
    if (!s || s.stopLoss || s.score <= 0 || totalScore <= 0) raw[t.ticker] = 0;
    else raw[t.ticker] = Math.min(s.score / totalScore, p.maxWeightPerTicker);
  }
  // Enforce cash floor: scale stock weights down if they exceed 1 - minCash.
  let stockSum = Object.values(raw).reduce((a, b) => a + b, 0);
  const maxStock = 1 - p.minCashWeight;
  if (stockSum > maxStock) {
    const k = maxStock / stockSum;
    for (const key of Object.keys(raw)) raw[key] *= k;
    stockSum = maxStock;
  }
  const targets = { ...raw, __cash: 1 - stockSum };
  // Rebalance plan: which tickers need a trade.
  const plan = [];
  for (const t of CONFIG.tickers) {
    const target = targets[t.ticker] || 0;
    const current = currentWeights[t.ticker] || 0;
    const diff = target - current;
    if (Math.abs(diff) > p.rebalanceThreshold) {
      plan.push({ ticker: t.ticker, target, current, diff, action: diff > 0 ? "BUY" : "SELL" });
    }
  }
  return { targets, signals, plan: plan.slice(0, p.maxTradesPerCycle) };
}

module.exports = { sma, std, scoreTicker, planTargets };
