// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LateGateVault
/// @notice Shared USDC pot on World Chain Sepolia (4801). House is operator.
/// LPs and the house deposit USDC for pro-rata ERC-20 shares.
/// Traveler premiums (`payPremium` / `collect`) increase assets without minting shares.
/// Delay `payout` decreases assets without burning shares.
/// `withdraw` is house-gated. Pause stops money movement.
/// PARKED files (LateGateLedger / x402 / Graph) are unrelated — do not delete them.
contract LateGateVault {
    string public constant name = "Late Gate LP";
    string public constant symbol = "lgUSDC";
    uint8 public constant decimals = 6;

    address public immutable usdc;
    address public house;
    bool public paused;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event PremiumPaid(address indexed from, uint256 amount, bool pulled);
    event PayoutSent(address indexed to, uint256 amount);
    event LpDeposited(address indexed from, uint256 assets, uint256 shares);
    event LpWithdrawn(address indexed to, uint256 assets, uint256 shares);
    event Paused(bool paused);
    event HouseTransferred(address indexed previousHouse, address indexed nextHouse);

    error NotHouse();
    error PausedError();
    error InvalidAddress();
    error InvalidAmount();
    error TransferFailed();
    error InsufficientShares();
    error InsufficientAssets();
    error Insolvent();

    modifier onlyHouse() {
        if (msg.sender != house) revert NotHouse();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert PausedError();
        _;
    }

    constructor(address usdc_, address house_) {
        if (usdc_ == address(0) || house_ == address(0)) revert InvalidAddress();
        usdc = usdc_;
        house = house_;
    }

    function totalAssets() public view returns (uint256) {
        return _balanceOf(usdc, address(this));
    }

    function assetsOf(address account) external view returns (uint256) {
        uint256 supply = totalSupply;
        if (supply == 0) return 0;
        return (balanceOf[account] * totalAssets()) / supply;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply;
        uint256 vaultAssets = totalAssets();
        if (supply == 0 || vaultAssets == 0) return assets;
        return (assets * supply) / vaultAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply;
        if (supply == 0) return shares;
        return (shares * totalAssets()) / supply;
    }

    /// @notice Traveler (or house relayer) pulls USDC via prior `approve`.
    function payPremium(address from, uint256 amount) external whenNotPaused {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        _pull(from, amount);
        emit PremiumPaid(from, amount, true);
    }

    /// @notice House attests a traveler already transferred USDC into the vault.
    function collect(address from, uint256 amount) external onlyHouse whenNotPaused {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        emit PremiumPaid(from, amount, false);
    }

    /// @notice House settlement credit — USDC to the traveler. Does not burn LP shares.
    function payout(address to, uint256 amount) external onlyHouse whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (totalAssets() < amount) revert InsufficientAssets();
        _push(to, amount);
        emit PayoutSent(to, amount);
    }

    /// @notice LP or house deposits their own USDC. Mints pro-rata shares to `msg.sender`.
    function deposit(uint256 assets) external whenNotPaused returns (uint256 shares) {
        return _deposit(msg.sender, assets);
    }

    /// @notice Pull USDC from `from` (needs allowance) and mint shares to `from`.
    function depositFor(address from, uint256 assets) external whenNotPaused returns (uint256 shares) {
        if (from == address(0)) revert InvalidAddress();
        return _deposit(from, assets);
    }

    /// @notice House-only withdraw. Burns `to`'s shares and sends USDC to `to`.
    function withdraw(address to, uint256 assets) external onlyHouse whenNotPaused returns (uint256 shares) {
        if (to == address(0)) revert InvalidAddress();
        if (assets == 0) revert InvalidAmount();
        uint256 vaultAssets = totalAssets();
        if (vaultAssets < assets) revert InsufficientAssets();
        uint256 supply = totalSupply;
        if (supply == 0) revert InsufficientShares();
        shares = (assets * supply) / vaultAssets;
        if (shares == 0) revert InvalidAmount();
        if (balanceOf[to] < shares) revert InsufficientShares();
        _burn(to, shares);
        _push(to, assets);
        emit LpWithdrawn(to, assets, shares);
    }

    function setPaused(bool paused_) external onlyHouse {
        paused = paused_;
        emit Paused(paused_);
    }

    function transferHouse(address nextHouse) external onlyHouse {
        if (nextHouse == address(0)) revert InvalidAddress();
        address previous = house;
        house = nextHouse;
        emit HouseTransferred(previous, nextHouse);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert InvalidAddress();
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientShares();
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _deposit(address from, uint256 assets) internal returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();
        uint256 vaultAssets = totalAssets();
        uint256 supply = totalSupply;
        if (supply > 0 && vaultAssets == 0) revert Insolvent();
        shares = (supply == 0 || vaultAssets == 0) ? assets : (assets * supply) / vaultAssets;
        if (shares == 0) revert InvalidAmount();
        _pull(from, assets);
        _mint(from, shares);
        emit LpDeposited(from, assets, shares);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientShares();
        balanceOf[from] = bal - value;
        totalSupply -= value;
        emit Transfer(from, address(0), value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert InvalidAddress();
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientShares();
        balanceOf[from] = bal - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _pull(address from, uint256 amount) internal {
        _safeCall(usdc, abi.encodeWithSelector(0x23b872dd, from, address(this), amount)); // transferFrom
    }

    function _push(address to, uint256 amount) internal {
        _safeCall(usdc, abi.encodeWithSelector(0xa9059cbb, to, amount)); // transfer
    }

    function _balanceOf(address token, address account) internal view returns (uint256) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSelector(0x70a08231, account));
        if (!ok || data.length < 32) revert TransferFailed();
        return abi.decode(data, (uint256));
    }

    function _safeCall(address token, bytes memory payload) internal {
        (bool ok, bytes memory data) = token.call(payload);
        if (!ok) revert TransferFailed();
        if (data.length > 0 && !abi.decode(data, (bool))) revert TransferFailed();
    }
}
