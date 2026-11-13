// Price provider: official Base Tokenized Stocks API (primary) + Yahoo (fallback).
// No API keys anywhere. All sources are public, read-only.
// Verified 12 Nov 2026: Base API = https://api.coinbase.com/v1/tokenized-stocks
// (found in docs HTML; /chains confirms mainnet-only, chain 8453).
// Stooq was tried first but returns HTTP 403 via this VM's egress — dropped.
const { CONFIG } = require("./config");

function toBytes32(ticker) {
  return "0x" + Buffer.from(ticker, "utf8").toString("hex").padEnd(64, "0");
}

async function fetchJson(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (StockPilot/1.0)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/// Primary: Base Tokenized Stocks API — returns nav_price per ticker.
/// Returns { source, prices: { ticker: { price, updatedAt, contractAddress } } }.
/// NAV is only published for minted/tradable tokens; tokens without NAV are skipped.
async function fetchBaseApiPrices() {
  const base = CONFIG.baseStocksApiUrl;
  const prices = {};
  let pageToken = "";
  // Paginate (max 3 pages — our 6 tickers span the first 3 pages).
  for (let page = 0; page < 3; page++) {
    const url = `${base}?page_size=100${pageToken ? `&page_token=${pageToken}` : ""}`;
    const data = await fetchJson(url);
    for (const tok of data.tokens || []) {
      const symbol = (tok.symbol || "").trim();
      if (!symbol || !tok.nav_price) continue;
      prices[symbol] = {
        price: Number(tok.nav_price),
        updatedAt: tok.nav_price_updated_at || null,
        contractAddress: tok.contract_address || null,
      };
    }
    pageToken = data.next_page_token || "";
    if (!pageToken) break;
    // Stop early once all our tickers are found.
    if (CONFIG.tickers.every((t) => prices[t.ticker])) break;
  }
  return { source: "base-api", prices };
}

/// Fallback: Yahoo Finance chart API (free, no key) — daily closes.
/// Returns { source, prices: { ticker: { price, date } } }.
async function fetchYahooLatest() {
  const prices = {};
  for (const t of CONFIG.tickers) {
    const sym = t.stooq.replace(/\.us$/, ""); // "nvda.us" -> "NVDA"
    try {
      const data = await fetchJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=5d&interval=1d`
      );
      const result = data.chart?.result?.[0];
      const closes = result?.indicators?.quote?.[0]?.close || [];
      const times = result?.timestamp || [];
      // Last non-null close.
      for (let i = closes.length - 1; i >= 0; i--) {
        if (closes[i] != null) {
          prices[t.ticker] = {
            price: closes[i],
            date: new Date(times[i] * 1000).toISOString().slice(0, 10),
          };
          break;
        }
      }
    } catch (e) {
      console.warn(`[prices] Yahoo failed for ${t.ticker}: ${e.message}`);
    }
  }
  return { source: "yahoo", prices };
}

/// Daily close history (ascending) for one ticker via Yahoo, for the strategy.
async function fetchYahooHistory(stooqSymbol) {
  const sym = stooqSymbol.replace(/\.us$/, "");
  const data = await fetchJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=3mo&interval=1d`
  );
  const result = data.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const times = result?.timestamp || [];
  const out = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null && times[i]) {
      out.push({ date: new Date(times[i] * 1000).toISOString().slice(0, 10), close: closes[i] });
    }
  }
  return out;
}

module.exports = { toBytes32, fetchBaseApiPrices, fetchYahooLatest, fetchYahooHistory };
