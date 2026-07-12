// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RWAMarketplace — RWA 资产 USDC 交易市场
contract RWAMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        address rwaToken;
        uint256 amount;      // RWA 代币数量
        uint256 pricePerUnit; // 每单位 RWA 的 USDC 价格（6 位小数）
        bool active;
    }

    IERC20 public immutable usdc;
    uint256 public listingCount;
    uint256 public platformFeeBps = 25; // 0.25% 平台费
    address public feeRecipient;

    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed id, address indexed seller, address rwaToken, uint256 amount, uint256 pricePerUnit);
    event Purchased(uint256 indexed id, address indexed buyer, uint256 amount, uint256 totalPaid);
    event Cancelled(uint256 indexed id);

    constructor(address usdc_, address feeRecipient_) Ownable(msg.sender) {
        usdc = IERC20(usdc_);
        feeRecipient = feeRecipient_;
    }

    /// @notice 上架 RWA 资产
    function list(address rwaToken, uint256 amount, uint256 pricePerUnit) external nonReentrant returns (uint256 id) {
        require(amount > 0 && pricePerUnit > 0, "invalid params");
        IERC20(rwaToken).transferFrom(msg.sender, address(this), amount);

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
    function buy(uint256 id, uint256 amount) external nonReentrant {
        Listing storage listing = listings[id];
        require(listing.active, "not active");
        require(amount > 0 && amount <= listing.amount, "invalid amount");

        uint256 totalPrice = (amount * listing.pricePerUnit) / 1e18;
        uint256 fee = (totalPrice * platformFeeBps) / 10000;
        uint256 sellerProceeds = totalPrice - fee;

        usdc.transferFrom(msg.sender, listing.seller, sellerProceeds);
        if (fee > 0) {
            usdc.transferFrom(msg.sender, feeRecipient, fee);
        }
        IERC20(listing.rwaToken).transfer(msg.sender, amount);

        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        emit Purchased(id, msg.sender, amount, totalPrice);
    }

    /// @notice 取消挂牌并取回资产
    function cancel(uint256 id) external nonReentrant {
        Listing storage listing = listings[id];
        require(listing.active, "not active");
        require(msg.sender == listing.seller, "not seller");

        listing.active = false;
        IERC20(listing.rwaToken).transfer(listing.seller, listing.amount);
        listing.amount = 0;

        emit Cancelled(id);
    }

    function setPlatformFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 500, "fee too high"); // 最高 5%
        platformFeeBps = feeBps;
    }
}
