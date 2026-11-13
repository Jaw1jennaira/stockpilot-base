// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC20.sol";
import "./Tokens.sol";
import "./StockOracle.sol";

/// @notice Simple on-chain market for mirror tokenized stocks (testnet only).
/// Buys/sells execute at the oracle NAV price +/- a small fee (default 10 bps).
/// Trades are rejected when the oracle price is stale (> MAX_PRICE_AGE).
/// The exchange holds stock inventory (minted by itself as minter) and
/// mock USDC received from buys; the owner funds USDC liquidity for sells.
contract StockExchange {
    ERC20 public immutable usdc;
    StockOracle public immutable oracle;
    address public owner;
    uint256 public feeBps = 10; // 0.10%
    bool public paused;

    uint256 public constant MAX_PRICE_AGE = 129600; // 36 hours (covers weekends / market-closed NAV gaps)
    uint256 public constant MAX_FEE_BPS = 100; // 1%

    mapping(bytes32 => address) public stockToken;
    bytes32[] public tickers;

    event TickerAdded(bytes32 indexed ticker, address token);
    event Trade(
        bytes32 indexed ticker,
        address indexed trader,
        bool isBuy,
        uint256 usdcAmount,
        uint256 stockAmount,
        uint256 price
    );
    event FeeSet(uint256 feeBps);
    event Paused(bool paused);

    modifier onlyOwner() {
        require(msg.sender == owner, "Exchange: not owner");
        _;
    }

    constructor(address _usdc, address _oracle) {
        require(_usdc != address(0) && _oracle != address(0), "Exchange: zero addr");
        usdc = ERC20(_usdc);
        oracle = StockOracle(_oracle);
        owner = msg.sender;
    }

    function addTicker(bytes32 ticker, address token) external onlyOwner {
        require(token != address(0), "Exchange: zero token");
        require(stockToken[ticker] == address(0), "Exchange: exists");
        stockToken[ticker] = token;
        tickers.push(ticker);
        emit TickerAdded(ticker, token);
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Exchange: fee too high");
        feeBps = _feeBps;
        emit FeeSet(_feeBps);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /// @notice Mint stock inventory to this exchange (it is the token minter).
    function fundInventory(bytes32 ticker, uint256 amount) external onlyOwner {
        address token = stockToken[ticker];
        require(token != address(0), "Exchange: unknown ticker");
        MockStockToken(token).mint(address(this), amount);
    }

    /// @notice Buy stock with mock USDC at oracle price. Caller must approve USDC first.
    function buy(bytes32 ticker, uint256 usdcAmount) external returns (uint256 stockOut) {
        require(!paused, "Exchange: paused");
        address token = stockToken[ticker];
        require(token != address(0), "Exchange: unknown ticker");
        require(usdcAmount > 0, "Exchange: amount zero");
        (uint256 px, uint256 updatedAt) = (oracle.price(ticker), oracle.updatedAt(ticker));
        require(px > 0 && block.timestamp - updatedAt <= MAX_PRICE_AGE, "Exchange: stale price");
        // stock (8 dec) = usdc (6 dec) * 1e10 / price(8 dec), minus fee
        stockOut = (usdcAmount * 1e10) / px;
        stockOut = (stockOut * (10000 - feeBps)) / 10000;
        require(ERC20(token).balanceOf(address(this)) >= stockOut, "Exchange: low inventory");
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "Exchange: usdc in");
        require(ERC20(token).transfer(msg.sender, stockOut), "Exchange: stock out");
        emit Trade(ticker, msg.sender, true, usdcAmount, stockOut, px);
    }

    /// @notice Sell stock for mock USDC at oracle price. Caller must approve stock first.
    function sell(bytes32 ticker, uint256 stockAmount) external returns (uint256 usdcOut) {
        require(!paused, "Exchange: paused");
        address token = stockToken[ticker];
        require(token != address(0), "Exchange: unknown ticker");
        require(stockAmount > 0, "Exchange: amount zero");
        (uint256 px, uint256 updatedAt) = (oracle.price(ticker), oracle.updatedAt(ticker));
        require(px > 0 && block.timestamp - updatedAt <= MAX_PRICE_AGE, "Exchange: stale price");
        // usdc (6 dec) = stock (8 dec) * price(8 dec) / 1e10, minus fee
        usdcOut = (stockAmount * px) / 1e10;
        usdcOut = (usdcOut * (10000 - feeBps)) / 10000;
        require(usdc.balanceOf(address(this)) >= usdcOut, "Exchange: low usdc");
        require(ERC20(token).transferFrom(msg.sender, address(this), stockAmount), "Exchange: stock in");
        require(usdc.transfer(msg.sender, usdcOut), "Exchange: usdc out");
        emit Trade(ticker, msg.sender, false, usdcOut, stockAmount, px);
    }

    function tickerCount() external view returns (uint256) {
        return tickers.length;
    }
}
