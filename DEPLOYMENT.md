# StockPilot — Deployment Proof (Base Sepolia testnet)

Deployed **12 Nov 2026, 10:09 UTC** (`2026-11-12T10:09:00.419Z`).
Network: **Base Sepolia, chainId 84532** — testnet only, no real funds.
Explorer: https://sepolia.basescan.org

## Contracts

| Contract | Address |
|---|---|
| MockUSDC | `0x1E1e4bcEAbC93199358aD3aeC3D2841913e933Cb` |
| StockOracle | `0x653C5C051Cd9830292AbA62dFdc7bc88fF20De0C` |
| StockExchange | `0x162da2Cee3E3a0388226e7623D6692d1Bc8cE1F2` |
| AgentVault | `0xa8dD0028001CAC9258083f150728586f3d6F9678` |
| Deployer / agent | `0x757cc1A5925be5532d241ED707cB213D3Ebf1F40` |

## Mirror stock tokens (MockStockToken, 8 decimals)

| Ticker | Address |
|---|---|
| NVDAc | `0x329156865C92e47be5Bf59850A81b5cDD88a6cF6` |
| AAPLc | `0xe892820E253b6531112a657FF4bFe836c84dc0a6` |
| TSLAc | `0x5e6Fe3340AFe401194046a490aA72fC8c94Ea3C1` |
| MSFTc | `0x5D2eB4485A317752a196b498356C322FAA9E727A` |
| GOOGLc | `0x952eCa69aC002BD0Afa9f56Ac1b65A92A2941FF2` |
| AMZNc | `0x900eB49ABd410298D91e6aF67D271335A6Ca85B1` |

## First agent cycle — 12 Nov 2026 (3 on-chain BUY trades, mock USDC)

Vault seeded with $10,000 mock USDC; exchange seeded with $50,000 mock USDC
liquidity + 1,000 shares inventory per ticker. All three trades executed by
`AgentVault.trade()` in the first agent cycle:

| # | Time (UTC) | Ticker | Side | Amount | Price (USD) | Tx |
|---|---|---|---|---|---|---|
| 1 | 10:09:40 | AAPLc | BUY | $2,500.00 | 356.55 | [0x8e33618c…a38f8b](https://sepolia.basescan.org/tx/0x8e33618cd40a7ef447b77a87f223cd5616086f1324153c0f49f96d2a77a38f8b) |
| 2 | 10:09:45 | TSLAc | BUY | $1,284.63 | 389.105 | [0x7dd26959…3d24f4c](https://sepolia.basescan.org/tx/0x7dd26959adcf04ac5b5986dadc854fb7fb4a59996d51c7a460479af7b3d24f4c) |
| 3 | 10:09:50 | AMZNc | BUY | $2,500.00 | 266.77 | [0xe9a65cef…eb292d](https://sepolia.basescan.org/tx/0xe9a65cef22915d89aae697eaac0fad5fea3f2d46891789275a697d7dc4eb292d) |

Prices for the cycle came from the official Base Tokenized Stocks API
(NAV) via `StockOracle.postPrices()`. Portfolio NAV after cycle 1: $10,000
mock USDC (cash + holdings).

## How to verify

- Open any contract address above on https://sepolia.basescan.org
- Open the dashboard: serve `frontend/` statically (e.g. `npx serve frontend`)
  — it reads vault balances, oracle prices, and `Trade` events live from the
  public Base Sepolia RPC, no backend needed.
- Run the agent yourself: `node scripts/gen-key.js` → fund with faucet ETH →
  `npm run deploy` (fresh deployment) → `node agent/index.js --once`.
