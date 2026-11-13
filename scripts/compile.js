// Compile all contracts with solc-js (no external deps).
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");
const OUT_DIR = path.join(__dirname, "..", "artifacts");
const FILES = ["ERC20.sol", "Tokens.sol", "StockOracle.sol", "StockExchange.sol", "AgentVault.sol"];

function main() {
  const sources = {};
  for (const f of FILES) {
    sources[f] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8") };
  }
  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    for (const e of output.errors) console.log(`[${e.severity}] ${e.formattedMessage}`);
    if (fatal.length) process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const wanted = ["MockUSDC", "MockStockToken", "StockOracle", "StockExchange", "AgentVault"];
  for (const file of Object.keys(output.contracts)) {
    for (const [name, c] of Object.entries(output.contracts[file])) {
      if (!wanted.includes(name)) continue;
      fs.writeFileSync(
        path.join(OUT_DIR, `${name}.json`),
        JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
      );
      console.log(`compiled ${name} (${file})`);
    }
  }
}

main();
