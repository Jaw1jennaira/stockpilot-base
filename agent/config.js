// StockPilot agent config — Base Sepolia testnet ONLY. No mainnet, no user funds.
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const ROOT = path.join(__dirname, "..");
const STATE = path.join(ROOT, "state");

const TICKERS = [
  // symbol (B20) -> Stooq symbol for price history fallback
  { ticker: "NVDAc", stooq: "nvda.us", name: "NVIDIA" },
  { ticker: "AAPLc", stooq: "aapl.us", name: "Apple" },
  { ticker: "TSLAc", stooq: "tsla.us", name: "Tesla" },
  { ticker: "MSFTc", stooq: "msft.us", name: "Microsoft" },
  { ticker: "GOOGLc", stooq: "goog.us", name: "Alphabet" },
  { ticker: "AMZNc", stooq: "amzn.us", name: "Amazon" },
];

const CONFIG = {
  rpcUrl: process.env.BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com",
  chainId: 84532,
  // Official Base Tokenized Stocks API base URL — verified 12 Nov 2026
  // (extracted from docs HTML; /chains confirms mainnet-only, chain 8453).
  // Fallback price source is Yahoo Finance chart API (no key).
  baseStocksApiUrl: process.env.BASE_STOCKS_API_URL || "https://api.coinbase.com/v1/tokenized-stocks",
  tickers: TICKERS,
  // Strategy params (see docs/design.md)
  strategy: {
    smaShort: 5,
    smaLong: 20,
    momentumWeight: 0.6,
    meanReversionWeight: 0.4,
    maxWeightPerTicker: 0.25, // 25% of portfolio
    minCashWeight: 0.2, // keep >= 20% in mock USDC
    rebalanceThreshold: 0.05, // trade only if |target-current| > 5% of NAV
    stopLossDailyDrop: 0.1, // exit ticker if -10% in one day
    maxTradesPerCycle: 3, // matches vault daily cap
  },
  // Vault funding (mock USDC, testnet only)
  vaultSeedUsdc: 10_000,
  exchangeSeedUsdc: 50_000,
  inventoryPerTicker: 1_000, // shares of each mirror stock
  oracleMaxAgeSeconds: 3600,
  stateDir: STATE,
  pricesFile: path.join(STATE, "prices.json"),
  tradesFile: path.join(STATE, "trades.jsonl"),
  deploymentFile: path.join(STATE, "deployment.json"),
  keyFile: path.join(STATE, "agent-key.json"),
};

function loadDeployment() {
  if (!fs.existsSync(CONFIG.deploymentFile)) return null;
  return JSON.parse(fs.readFileSync(CONFIG.deploymentFile, "utf8"));
}

function loadKey() {
  // 1) Env var (recommended for public repos / CI): AGENT_PRIVATE_KEY.
  //    Address is derived from the key, so no second variable is needed.
  if (process.env.AGENT_PRIVATE_KEY) {
    const w = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY);
    return { address: w.address, privateKey: process.env.AGENT_PRIVATE_KEY };
  }
  // 2) Local file state/agent-key.json — gitignored, NEVER committed.
  //    Generate it with: node scripts/gen-key.js
  if (!fs.existsSync(CONFIG.keyFile)) {
    throw new Error(
      "No agent key: set AGENT_PRIVATE_KEY or run `node scripts/gen-key.js` " +
        "(creates state/agent-key.json, gitignored — see agent-key.example.json)."
    );
  }
  return JSON.parse(fs.readFileSync(CONFIG.keyFile, "utf8"));
}

module.exports = { CONFIG, loadDeployment, loadKey, ROOT };
