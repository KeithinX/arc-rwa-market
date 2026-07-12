// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RWAToken — 代表真实世界资产的 ERC-20 代币
contract RWAToken is ERC20, Ownable {
    string public assetType;
    string public metadataURI;
    uint256 public totalAssetValue; // 以 USDC 最小单位计（6 位小数）

    constructor(
        string memory name_,
        string memory symbol_,
        string memory assetType_,
        string memory metadataURI_,
        uint256 totalAssetValue_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        assetType = assetType_;
        metadataURI = metadataURI_;
        totalAssetValue = totalAssetValue_;
        // 初始铸造 1,000,000 份份额
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    /// @notice 发行方铸造新份额（需合规审批后调用）
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
