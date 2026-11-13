// Generate a fresh testnet-only agent keypair into state/agent-key.json.
// The file is gitignored — it NEVER goes into the repo.
// Usage: node scripts/gen-key.js
// Then fund the printed address with free Base Sepolia ETH (see scripts/faucet.md).
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const out = path.join(__dirname, "..", "state", "agent-key.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
const w = ethers.Wallet.createRandom();
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      address: w.address,
      privateKey: w.privateKey,
      mnemonic: w.mnemonic.phrase,
      network: "Base Sepolia (84532) — TESTNET ONLY",
      note: "Fresh keypair for StockPilot demo. Holds ONLY faucet Sepolia ETH (valueless) + mock tokens. NEVER send mainnet funds here. NOT a user wallet.",
    },
    null,
    2
  )
);
fs.chmodSync(out, 0o600);
console.log(`agent key written to ${out} (chmod 600, gitignored)`);
console.log(`address: ${w.address}`);
console.log("Fund it with free Sepolia ETH first — see scripts/faucet.md");
