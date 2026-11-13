# StockPilot — Agentic Stock Finance (Base Stocks Maxxing Builder Quest)

Autonomous AI agent managing a tokenized-stock portfolio on **Base Sepolia
testnet** — 100% on-chain, zero real funds.

- **Quest:** Base Stocks Maxxing Builder Quest 2026, track **Agentic Stock Finance**
- **Deadline:** 5 Dec 2026 (UTC)
- **Prize:** $100,000+ USDC (Base track $50,000 + partners $48,000 + community $6,000)
- **Status:** ✅ Deployed to Base Sepolia 12 Nov 2026 — see [DEPLOYMENT.md](DEPLOYMENT.md)
  (oracle `0x653C…De0C`, exchange `0x162d…E1F2`, vault `0xa8dD…9678`).
  First agent cycle executed 3 on-chain BUY trades (AAPL, TSLA, AMZN).

## How it works
1. **StockOracle** — the agent posts stock NAV prices (from Base's official
   Tokenized Stocks API) on-chain, with timestamp + staleness check.
2. **StockExchange** — buy/sell mirror stock tokens (ERC-20, 8 decimals,
   following the B20 standard) at oracle price ± 10 bps fee. Every trade is
   an on-chain transaction.
3. **AgentVault** — mock-USDC vault. Only the agent key can trigger trades,
   with guardrails: per-trade cap, daily trade cap, ticker allowlist,
   circuit breaker if the oracle goes stale.
4. **Off-chain agent** (`agent/`) — each cycle: fetch prices → compute signals
   (5-day vs 20-day momentum + mean-reversion) → rebalance portfolio →
   execute via the vault. Every decision is logged to `state/trades.jsonl`.
5. **Dashboard** (`frontend/`) — static page reading directly from the public
   Base Sepolia RPC: vault balance, allocation, oracle prices, trade history.

Why mirror tokens instead of real B20? Coinbase B20 tokens are a native
**Base mainnet** precompile — they don't exist on testnet. The quest
explicitly allows testnet and scores it equally, so the MVP uses mirror
tokens priced from the same official API.

## Structure
```
contracts/   MockUSDC, MockStockToken, StockOracle, StockExchange, AgentVault
agent/       price provider, strategy, executor, oracle updater (Node + ethers v6)
frontend/    static dashboard (ethers CDN + public Base Sepolia RPC)
scripts/     compile.js, deploy.js, gen-key.js, faucet.md
docs/        research.md (official quest requirements), design.md,
             demo-script.md (video demo plan), tokens-mainnet.json
artifacts/   compiled ABIs + bytecode (solc 0.8.28)
DEPLOYMENT.md  live contract addresses + first-cycle trade proofs
```

## Quickstart
```bash
npm install
npm run compile          # compile contracts (solc-js, no external deps)
node scripts/gen-key.js  # fresh testnet-only agent key -> state/agent-key.json (gitignored)
# fund the printed address with free Sepolia ETH (see scripts/faucet.md)
npm run deploy           # deploy to Base Sepolia (writes state/deployment.json + frontend/config.js)
node agent/index.js --once   # one cycle: update oracle + evaluate + trade if needed
node agent/index.js --loop   # loop every 60 minutes
```

## Testnet keys
The agent key is **never in this repo**. Generate your own with
`node scripts/gen-key.js` (writes `state/agent-key.json`, gitignored), or set
the `AGENT_PRIVATE_KEY` env var. It must be a fresh keypair used only for
this testnet demo — never a real wallet, never send mainnet funds to it.

## Security
- No user funds. No mainnet. No user seed/private key anywhere.
- Vault: only the agent can trade; the owner (deployer) can pause & set limits.
- Exchange rejects trades if the oracle price is older than 1 hour.
- All strategy numbers are documented in `docs/design.md`.

## Submission (checklist in docs/research.md)
Post X video demo + tag @buildonbase → official form → public repo.
Video plan: `docs/demo-script.md`.
