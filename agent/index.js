// StockPilot agent — one cycle: price -> oracle -> strategy -> trade.
// Usage: node agent/index.js --once | --loop
// Testnet only. Never touches user wallets or mainnet.
const fs = require("fs");
const { CONFIG, loadDeployment, loadKey } = require("./config");
const { fetchBaseApiPrices, fetchYahooLatest, fetchYahooHistory } = require("./prices");
const { planTargets } = require("./strategy");
const { connect, getEthBalance, postPrices, getAllocation, executeTrade, logTrade } = require("./executor");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadHistories() {
  if (!fs.existsSync(CONFIG.pricesFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG.pricesFile, "utf8"));
  } catch {
    return {};
  }
}

function saveHistories(hist) {
  fs.writeFileSync(CONFIG.pricesFile, JSON.stringify(hist, null, 2));
}

async function runCycle() {
  const started = new Date().toISOString();
  console.log(`[cycle] start ${started}`);
  const dep = loadDeployment();
  if (!dep) {
    console.error("[cycle] no deployment — run scripts/deploy.js first.");
    return { ok: false, error: "no-deployment" };
  }
  const ctx = connect();
  const key = loadKey();
  const ethBal = await getEthBalance(ctx.provider, key.address);
  console.log(`[cycle] agent ${key.address} ETH=${ethersFormat(ethBal)}`);
  if (ethBal === 0n) {
    console.error("[cycle] agent has 0 Sepolia ETH — get faucet funds first (see docs).");
    return { ok: false, error: "no-gas" };
  }

  // 1. Prices: Base API NAV is canonical, but NAV only updates on market
  // deviation/heartbeat (24/5) — it can go stale overnight/weekends.
  // Fall back per-ticker to the Yahoo latest close when NAV is older than 36h.
  let priceRes = await fetchBaseApiPrices().catch((e) => ({ source: "base-api", error: String(e), prices: {} }));
  const yahooRes = await fetchYahooLatest().catch(() => ({ source: "yahoo", prices: {} }));
  const prices = {};
  const priceSource = {};
  const nowMs = Date.now();
  for (const t of CONFIG.tickers) {
    const nav = (priceRes.prices || {})[t.ticker];
    const navAgeMs = nav?.updatedAt ? nowMs - new Date(nav.updatedAt).getTime() : Infinity;
    if (nav && navAgeMs <= 36 * 3600 * 1000) {
      prices[t.ticker] = nav.price;
      priceSource[t.ticker] = "base-nav";
    } else if (yahooRes.prices?.[t.ticker]) {
      prices[t.ticker] = yahooRes.prices[t.ticker].price;
      priceSource[t.ticker] = "yahoo-close";
    }
  }
  console.log(`[cycle] prices (${priceRes.source}+yahoo):`, prices, "sources:", priceSource);
  if (Object.keys(prices).length === 0) {
    console.error("[cycle] no prices at all — aborting cycle.");
    return { ok: false, error: "no-prices" };
  }

  // 2. Post prices to the on-chain oracle
  const oracleTx = await postPrices(ctx, prices);
  console.log(`[cycle] oracle updated tx=${oracleTx}`);

  // 3. Histories for the strategy (Yahoo daily closes, persisted locally)
  const histories = loadHistories();
  for (const t of CONFIG.tickers) {
    try {
      const hist = await fetchYahooHistory(t.stooq);
      const closes = hist.map((h) => h.close);
      histories[t.ticker] = closes;
    } catch (e) {
      console.warn(`[cycle] history failed for ${t.ticker}: ${e.message} (using saved)`);
    }
  }
  saveHistories(histories);

  // 4. Current allocation + plan
  const alloc = await getAllocation(ctx, prices);
  console.log(`[cycle] NAV=$${alloc.navUsd.toFixed(2)} cash=$${alloc.cashUsd.toFixed(2)} weights=`, alloc.weights);
  const { targets, signals, plan } = planTargets(histories, alloc.weights);
  console.log("[cycle] targets:", targets);
  console.log("[cycle] plan:", plan);

  // 5. Execute planned trades (max 3, vault-enforced)
  const executed = [];
  for (const item of plan) {
    const price = prices[item.ticker];
    if (!price) continue;
    try {
      if (item.action === "BUY") {
        let usdcAmount = Math.floor(Math.abs(item.diff) * alloc.navUsd * 1e6);
        usdcAmount = Math.min(usdcAmount, Math.floor(alloc.cashUsd * 1e6));
        if (usdcAmount <= 0) continue;
        const tx = await executeTrade(ctx, item.ticker, true, usdcAmount);
        executed.push({ ticker: item.ticker, action: "BUY", usdcAmount, tx });
        logTrade({ ticker: item.ticker, action: "BUY", usdcAmount, price, tx, navUsd: alloc.navUsd });
        console.log(`[cycle] BUY ${item.ticker} $${(usdcAmount / 1e6).toFixed(2)} tx=${tx}`);
      } else {
        const holding = alloc.holdings[item.ticker];
        let stockAmount = Math.floor((Math.abs(item.diff) * alloc.navUsd) / price * 1e8);
        stockAmount = Math.min(stockAmount, Number(holding.stockBal));
        if (stockAmount <= 0) continue;
        const tx = await executeTrade(ctx, item.ticker, false, stockAmount);
        executed.push({ ticker: item.ticker, action: "SELL", stockAmount, tx });
        logTrade({ ticker: item.ticker, action: "SELL", stockAmount, price, tx, navUsd: alloc.navUsd });
        console.log(`[cycle] SELL ${item.ticker} ${stockAmount / 1e8} shares tx=${tx}`);
      }
    } catch (e) {
      console.error(`[cycle] trade failed ${item.ticker}: ${e.message}`);
      logTrade({ ticker: item.ticker, action: item.action, error: String(e), price });
    }
  }

  const summary = { ok: true, started, pricesSource: priceRes.source, navUsd: alloc.navUsd, targets, plan, executed, oracleTx };
  console.log("[cycle] done", JSON.stringify(summary, null, 2));
  return summary;
}

function ethersFormat(bn) {
  return (Number(bn) / 1e18).toFixed(6);
}

async function main() {
  const loop = process.argv.includes("--loop");
  const intervalMin = Number(process.env.AGENT_INTERVAL_MIN || 60);
  await runCycle();
  if (loop) {
    console.log(`[agent] looping every ${intervalMin} min (Ctrl+C to stop)`);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(intervalMin * 60 * 1000);
      await runCycle().catch((e) => console.error("[cycle] error", e));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
