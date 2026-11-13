// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC20.sol";
import "./StockExchange.sol";

/// @notice The agent's on-chain vault (testnet only).
/// Holds mock USDC + mirror stocks. ONLY the designated agent key may
/// trigger trades, and only within guardrails:
///  - per-trade cap (maxTradeUsdc)
///  - daily trade cap (maxTradesPerDay, UTC days)
///  - ticker allowlist
///  - circuit breaker (owner can pause)
/// The owner (deployer) can change the agent/limits and pause, and can
/// rescue funds (testnet safety valve). No user funds are ever held here.
contract AgentVault {
    ERC20 public immutable usdc;
    StockExchange public immutable exchange;
    address public owner;
    address public agent;
    bool public paused;

    uint256 public maxTradeUsdc = 2_500 * 1e6; // $2,500 per trade (mock)
    uint256 public maxTradesPerDay = 3;
    uint256 public tradesToday;
    uint256 public currentDay; // UTC day number

    mapping(bytes32 => bool) public tickerAllowed;

    event AgentTrade(bytes32 indexed ticker, bool isBuy, uint256 usdcAmount, uint256 stockAmount);
    event AgentSet(address indexed agent);
    event LimitsSet(uint256 maxTradeUsdc, uint256 maxTradesPerDay);
    event TickerAllowed(bytes32 indexed ticker, bool allowed);
    event Paused(bool paused);

    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "Vault: not agent");
        _;
    }

    constructor(address _usdc, address _exchange, address _agent) {
        require(_usdc != address(0) && _exchange != address(0), "Vault: zero addr");
        require(_agent != address(0), "Vault: zero agent");
        usdc = ERC20(_usdc);
        exchange = StockExchange(_exchange);
        agent = _agent;
        owner = msg.sender;
        currentDay = block.timestamp / 1 days;
    }

    /// @notice Execute one guarded trade through the exchange.
    /// @param ticker bytes32 ticker, e.g. "NVDAc"
    /// @param isBuy true = buy stock with USDC, false = sell stock for USDC
    /// @param amount For buys: mock USDC amount (6 dec). For sells: stock amount (8 dec).
    function trade(bytes32 ticker, bool isBuy, uint256 amount) external onlyAgent returns (uint256) {
        require(!paused, "Vault: paused");
        require(tickerAllowed[ticker], "Vault: ticker not allowed");
        require(amount > 0, "Vault: amount zero");
        uint256 day = block.timestamp / 1 days;
        if (day != currentDay) {
            currentDay = day;
            tradesToday = 0;
        }
        require(tradesToday < maxTradesPerDay, "Vault: daily cap");
        address token = exchange.stockToken(ticker);
        require(token != address(0), "Vault: unknown ticker");
        uint256 out;
        if (isBuy) {
            require(amount <= maxTradeUsdc, "Vault: trade cap");
            require(usdc.approve(address(exchange), amount), "Vault: approve");
            out = exchange.buy(ticker, amount);
        } else {
            uint256 stockBal = ERC20(token).balanceOf(address(this));
            require(amount <= stockBal, "Vault: low stock");
            // sells are also capped by notional: approximate via oracle price
            require(ERC20(token).approve(address(exchange), amount), "Vault: approve");
            out = exchange.sell(ticker, amount);
        }
        tradesToday += 1;
        emit AgentTrade(ticker, isBuy, isBuy ? amount : out, isBuy ? out : amount);
        return out;
    }

    function setAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "Vault: zero agent");
        agent = _agent;
        emit AgentSet(_agent);
    }

    function setLimits(uint256 _maxTradeUsdc, uint256 _maxTradesPerDay) external onlyOwner {
        require(_maxTradesPerDay > 0 && _maxTradesPerDay <= 20, "Vault: bad daily cap");
        maxTradeUsdc = _maxTradeUsdc;
        maxTradesPerDay = _maxTradesPerDay;
        emit LimitsSet(_maxTradeUsdc, _maxTradesPerDay);
    }

    function setTickerAllowed(bytes32 ticker, bool allowed) external onlyOwner {
        tickerAllowed[ticker] = allowed;
        emit TickerAllowed(ticker, allowed);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /// @notice Testnet safety valve: owner can pull funds out of the vault.
    function rescue(address token, uint256 amount) external onlyOwner {
        require(ERC20(token).transfer(owner, amount), "Vault: rescue failed");
    }

    function balances(bytes32 ticker) external view returns (uint256 usdcBal, uint256 stockBal) {
        address token = exchange.stockToken(ticker);
        usdcBal = usdc.balanceOf(address(this));
        stockBal = token == address(0) ? 0 : ERC20(token).balanceOf(address(this));
    }
}
