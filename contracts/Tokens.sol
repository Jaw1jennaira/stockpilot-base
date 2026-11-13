// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC20.sol";

/// @notice Mock USDC (6 decimals) for Base Sepolia testnet ONLY.
/// Anyone may mint test USDC (capped per call). This is play money:
/// never use on mainnet, never treat as real USDC.
contract MockUSDC is ERC20 {
    uint256 public constant MINT_CAP = 100_000 * 1e6; // 100k test USDC per call

    constructor() ERC20("Mock USD Coin", "mUSDC", 6) {}

    function mint(uint256 amount) external {
        require(amount > 0 && amount <= MINT_CAP, "MockUSDC: cap");
        _mint(msg.sender, amount);
    }
}

/// @notice Mirror of a Coinbase B20 tokenized stock (8 decimals, like B20).
/// Only the designated minter (StockExchange) may mint. One token tracks
/// one share x multiplier; price comes from StockOracle (off-chain NAV).
contract MockStockToken is ERC20 {
    address public minter;

    constructor(string memory _name, string memory _symbol, address _minter)
        ERC20(_name, _symbol, 8)
    {
        require(_minter != address(0), "MockStock: zero minter");
        minter = _minter;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "MockStock: not minter");
        _mint(to, amount);
    }
}
