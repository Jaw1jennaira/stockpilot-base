// On-chain executor: oracle updates + vault trades on Base Sepolia (ethers v6).
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { CONFIG, loadDeployment, loadKey } = require("./config");
const { toBytes32 } = require("./prices");

function loadArtifact(name) {
  return JSON.parse(fs.readFileSync(path.join(CONFIG.stateDir, "..", "artifacts", `${name}.json`), "utf8"));
}

function connect() {
  const dep = loadDeployment();
  if (!dep) throw new Error("No deployment found — run scripts/deploy.js first.");
  const key = loadKey();
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(key.privateKey, provider);
  const oracle = new ethers.Contract(dep.oracle, loadArtifact("StockOracle").abi, wallet);
  const exchange = new ethers.Contract(dep.exchange, loadArtifact("StockExchange").abi, wallet);
  const vault = new ethers.Contract(dep.vault, loadArtifact("AgentVault").abi, wallet);
  const usdc = new ethers.Contract(dep.usdc, loadArtifact("MockUSDC").abi, wallet);
  return { dep, provider, wallet, oracle, exchange, vault, usdc };
}

async function getEthBalance(provider, address) {
  return await provider.getBalance(address);
}

/// Post NAV prices (USD, 8 decimals) to the oracle. prices: { ticker: priceUSD }.
async function postPrices(ctx, prices) {
  const tickers = [];
  const values = [];
  for (const [ticker, price] of Object.entries(prices)) {
    if (!Number.isFinite(price) || price <= 0) continue;
    tickers.push(toBytes32(ticker));
    values.push(BigInt(Math.round(price * 1e8)));
  }
  if (!tickers.length) return null;
  const tx = await ctx.oracle.postPrices(tickers, values);
  const receipt = await tx.wait();
  return receipt.hash;
}

/// Current vault allocation. prices: { ticker: priceUSD }.
/// Returns { navUsd, weights: { ticker: w }, cashUsd, holdings }.
async function getAllocation(ctx, prices) {
  const holdings = {};
  let stockValue = 0;
  for (const t of CONFIG.tickers) {
    const [usdcBal, stockBal] = await ctx.vault.balances(toBytes32(t.ticker));
    const price = prices[t.ticker];
    const stockUnits = Number(stockBal) / 1e8;
    const value = price ? stockUnits * price : 0;
    holdings[t.ticker] = { stockBal: stockBal.toString(), stockUnits, valueUsd: value };
    stockValue += value;
  }
  const [usdcBal] = await ctx.vault.balances(toBytes32(CONFIG.tickers[0].ticker));
  const cashUsd = Number(usdcBal) / 1e6;
  const nav = stockValue + cashUsd;
  const weights = {};
  for (const t of CONFIG.tickers) weights[t.ticker] = nav > 0 ? holdings[t.ticker].valueUsd / nav : 0;
  return { navUsd: nav, cashUsd, weights, holdings };
}

/// Execute one vault trade. For buys, amountUsdc is in mock USDC units (6 dec).
/// For sells, amountStock is in stock units (8 dec).
async function executeTrade(ctx, ticker, isBuy, amount) {
  const tx = await ctx.vault.trade(toBytes32(ticker), isBuy, BigInt(amount));
  const receipt = await tx.wait();
  return receipt.hash;
}

function logTrade(entry) {
  fs.appendFileSync(CONFIG.tradesFile, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

module.exports = { connect, getEthBalance, postPrices, getAllocation, executeTrade, logTrade };
