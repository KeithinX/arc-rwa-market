// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RWAToken — 自包含 RWA ERC-20 代币（不依赖 OpenZeppelin）
contract RWAToken {
    string public name;
    string public symbol;
    string public assetType;
    string public metadataURI;
    uint256 public totalAssetValue; // USDC 最小单位（6 位小数）
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    address public owner;
    bool private initialized;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory assetType_,
        string memory metadataURI_,
        uint256 totalAssetValue_,
        address initialOwner
    ) {
        require(initialOwner != address(0), "zero owner");
        name = name_;
        symbol = symbol_;
        assetType = assetType_;
        metadataURI = metadataURI_;
        totalAssetValue = totalAssetValue_;
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
        // 初始铸造 1,000,000 份份额
        uint256 supply = 1_000_000 * 10 ** uint256(decimals);
        _mint(initialOwner, supply);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address ownerAddr, address spender) external view returns (uint256) {
        return _allowances[ownerAddr][spender];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "insufficient allowance");
            unchecked {
                _approve(from, msg.sender, allowed - value);
            }
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "not owner");
        _mint(to, amount);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "not owner");
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(_balances[from] >= value, "insufficient balance");
        unchecked {
            _balances[from] -= value;
            _balances[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _approve(address ownerAddr, address spender, uint256 value) internal {
        _allowances[ownerAddr][spender] = value;
        emit Approval(ownerAddr, spender, value);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        unchecked {
            _balances[to] += value;
        }
        emit Transfer(address(0), to, value);
    }
}

/// @title RWAMarketplace — 自包含 RWA USDC 交易市场（不依赖 OpenZeppelin）
contract RWAMarketplace {
    struct Listing {
        address seller;
        address rwaToken;
        uint256 amount;       // RWA 代币数量（18 位小数）
        uint256 pricePerUnit; // 每单位 RWA 的 USDC 价格（6 位小数 × 1e12 缩放）
        bool active;
    }

    address public immutable usdc;
    address public owner;
    uint256 public listingCount;
    uint256 public platformFeeBps = 25; // 0.25%
    address public feeRecipient;

    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed id, address indexed seller, address rwaToken, uint256 amount, uint256 pricePerUnit);
    event Purchased(uint256 indexed id, address indexed buyer, uint256 amount, uint256 totalPaid);
    event Cancelled(uint256 indexed id);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address usdc_, address feeRecipient_) {
        require(usdc_ != address(0) && feeRecipient_ != address(0), "zero addr");
        usdc = usdc_;
        feeRecipient = feeRecipient_;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice 上架 RWA 资产。pricePerUnit 已 ×1e12 缩放，便于前端传 6 位小数×1e18
    function list(address rwaToken, uint256 amount, uint256 pricePerUnit) external returns (uint256 id) {
        require(amount > 0 && pricePerUnit > 0, "invalid params");
        require(_safeTransferFrom(rwaToken, msg.sender, address(this), amount), "transferFrom failed");

        id = ++listingCount;
        listings[id] = Listing({
            seller: msg.sender,
            rwaToken: rwaToken,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit Listed(id, msg.sender, rwaToken, amount, pricePerUnit);
    }

    /// @notice 购买挂牌资产
    function buy(uint256 id, uint256 amount) external {
        Listing storage listing = listings[id];
        require(listing.active, "not active");
        require(amount > 0 && amount <= listing.amount, "invalid amount");

        // totalPrice = amount(1e18) * pricePerUnit(1e18, 实为 USDC 6 位×1e12) / 1e18 -> USDC 6 位
        uint256 totalPrice = (amount * listing.pricePerUnit) / 1e18;
        uint256 fee = (totalPrice * platformFeeBps) / 10000;
        uint256 sellerProceeds = totalPrice - fee;

        require(_safeTransferFrom(usdc, msg.sender, listing.seller, sellerProceeds), "usdc to seller failed");
        if (fee > 0) {
            require(_safeTransferFrom(usdc, msg.sender, feeRecipient, fee), "usdc fee failed");
        }
        require(_safeTransfer(listing.rwaToken, msg.sender, amount), "rwa transfer failed");

        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        emit Purchased(id, msg.sender, amount, totalPrice);
    }

    /// @notice 取消挂牌并取回资产
    function cancel(uint256 id) external {
        Listing storage listing = listings[id];
        require(listing.active, "not active");
        require(msg.sender == listing.seller, "not seller");

        listing.active = false;
        uint256 amt = listing.amount;
        listing.amount = 0;
        require(_safeTransfer(listing.rwaToken, listing.seller, amt), "cancel transfer failed");

        emit Cancelled(id);
    }

    function setPlatformFee(uint256 feeBps) external {
        require(msg.sender == owner, "not owner");
        require(feeBps <= 500, "fee too high");
        platformFeeBps = feeBps;
    }

    function setFeeRecipient(address recipient) external {
        require(msg.sender == owner, "not owner");
        require(recipient != address(0), "zero addr");
        feeRecipient = recipient;
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "not owner");
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ===== 内部 ERC-20 调用（避免依赖 IERC20 接口） =====
    function _safeTransferFrom(address token, address from, address to, uint256 value) internal returns (bool ok) {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, value)
        );
        if (success && (data.length == 0 || abi.decode(data, (bool)))) {
            return true;
        }
        return false;
    }

    function _safeTransfer(address token, address to, uint256 value) internal returns (bool ok) {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, value)
        );
        if (success && (data.length == 0 || abi.decode(data, (bool)))) {
            return true;
        }
        return false;
    }
}

/// @title RWAPredictionMarket — RWA 资产二元预测市场（USDC 结算）
contract RWAPredictionMarket {
    enum MarketStatus { Open, Resolved, Cancelled }
    enum Outcome { None, Yes, No }

    struct Market {
        string question;
        string assetSymbol;
        string category;
        uint256 endTime;
        uint256 yesPool;
        uint256 noPool;
        MarketStatus status;
        Outcome outcome;
    }

    address public immutable usdc;
    address public owner;
    uint256 public marketCount;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesShares;
    mapping(uint256 => mapping(address => uint256)) public noShares;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event MarketCreated(uint256 indexed id, string question, string assetSymbol, uint256 endTime);
    event PositionTaken(uint256 indexed id, address indexed user, bool isYes, uint256 amount);
    event MarketResolved(uint256 indexed id, Outcome outcome);
    event Claimed(uint256 indexed id, address indexed user, uint256 payout);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address usdc_) {
        require(usdc_ != address(0), "zero addr");
        usdc = usdc_;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice 创建预测市场（仅 owner，用于初始化 demo 市场）
    function createMarket(
        string calldata question,
        string calldata assetSymbol,
        string calldata category,
        uint256 endTime
    ) external returns (uint256 id) {
        require(msg.sender == owner, "not owner");
        require(endTime > block.timestamp, "end in past");

        id = ++marketCount;
        markets[id] = Market({
            question: question,
            assetSymbol: assetSymbol,
            category: category,
            endTime: endTime,
            yesPool: 0,
            noPool: 0,
            status: MarketStatus.Open,
            outcome: Outcome.None
        });

        emit MarketCreated(id, question, assetSymbol, endTime);
    }

    /// @notice 买入 YES 份额，amount 为 USDC 最小单位（6 位小数）
    function buyYes(uint256 id, uint256 amount) external {
        _takePosition(id, amount, true);
    }

    /// @notice 买入 NO 份额
    function buyNo(uint256 id, uint256 amount) external {
        _takePosition(id, amount, false);
    }

    /// @notice 结算市场（仅 owner）
    function resolve(uint256 id, Outcome outcome) external {
        require(msg.sender == owner, "not owner");
        Market storage m = markets[id];
        require(m.status == MarketStatus.Open, "not open");
        require(outcome == Outcome.Yes || outcome == Outcome.No, "invalid outcome");

        m.status = MarketStatus.Resolved;
        m.outcome = outcome;
        emit MarketResolved(id, outcome);
    }

    /// @notice 领取获胜奖励
    function claim(uint256 id) external {
        Market storage m = markets[id];
        require(m.status == MarketStatus.Resolved, "not resolved");
        require(!claimed[id][msg.sender], "already claimed");

        uint256 userShares;
        uint256 winningPool;
        uint256 totalWinningShares;

        if (m.outcome == Outcome.Yes) {
            userShares = yesShares[id][msg.sender];
            winningPool = m.yesPool;
            totalWinningShares = m.yesPool;
        } else {
            userShares = noShares[id][msg.sender];
            winningPool = m.noPool;
            totalWinningShares = m.noPool;
        }

        require(userShares > 0, "no shares");
        claimed[id][msg.sender] = true;

        uint256 totalPot = m.yesPool + m.noPool;
        uint256 payout = (userShares * totalPot) / totalWinningShares;

        require(_safeTransfer(usdc, msg.sender, payout), "payout failed");
        emit Claimed(id, msg.sender, payout);
    }

    function _takePosition(uint256 id, uint256 amount, bool isYes) internal {
        require(amount > 0, "zero amount");
        Market storage m = markets[id];
        require(m.status == MarketStatus.Open, "not open");
        require(block.timestamp < m.endTime, "ended");

        require(_safeTransferFrom(usdc, msg.sender, address(this), amount), "transfer failed");

        if (isYes) {
            yesShares[id][msg.sender] += amount;
            m.yesPool += amount;
        } else {
            noShares[id][msg.sender] += amount;
            m.noPool += amount;
        }

        emit PositionTaken(id, msg.sender, isYes, amount);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "not owner");
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal returns (bool ok) {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, value)
        );
        if (success && (data.length == 0 || abi.decode(data, (bool)))) {
            return true;
        }
        return false;
    }

    function _safeTransfer(address token, address to, uint256 value) internal returns (bool ok) {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, value)
        );
        if (success && (data.length == 0 || abi.decode(data, (bool)))) {
            return true;
        }
        return false;
    }
}
