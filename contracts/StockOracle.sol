// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice On-chain price oracle for mirror tokenized stocks.
/// The off-chain agent posts NAV/reference prices (USD, 8 decimals) sourced
/// from the official Base Tokenized Stocks API. Consumers must check
/// freshness — stale prices are rejected by StockExchange.
contract StockOracle {
    address public owner;
    // ticker (bytes32, e.g. "NVDAc") => price in USD with 8 decimals
    mapping(bytes32 => uint256) public price;
    mapping(bytes32 => uint256) public updatedAt;

    event PricePosted(bytes32 indexed ticker, uint256 price, uint256 updatedAt);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Oracle: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function postPrice(bytes32 ticker, uint256 _price) external onlyOwner {
        require(_price > 0, "Oracle: price zero");
        price[ticker] = _price;
        updatedAt[ticker] = block.timestamp;
        emit PricePosted(ticker, _price, block.timestamp);
    }

    function postPrices(bytes32[] calldata tickers, uint256[] calldata prices) external onlyOwner {
        require(tickers.length == prices.length, "Oracle: length");
        for (uint256 i = 0; i < tickers.length; i++) {
            require(prices[i] > 0, "Oracle: price zero");
            price[tickers[i]] = prices[i];
            updatedAt[tickers[i]] = block.timestamp;
            emit PricePosted(tickers[i], prices[i], block.timestamp);
        }
    }

    function isFresh(bytes32 ticker, uint256 maxAgeSeconds) external view returns (bool) {
        if (price[ticker] == 0) return false;
        return block.timestamp - updatedAt[ticker] <= maxAgeSeconds;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Oracle: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
