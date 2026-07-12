// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {RWAMarketplace} from "../src/RWAMarketplace.sol";

contract DeployScript is Script {
    // Arc Testnet USDC (6 decimals ERC-20)
    address constant USDC = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 部署示例 RWA 资产代币
        RWAToken treasuryBond = new RWAToken(
            "Arc Treasury Bond 2026",
            "aTREAS",
            "Government Bond",
            "ipfs://QmExample/treasury-bond-2026",
            10_000_000 * 1e6, // $10M
            deployer
        );

        RWAToken realEstate = new RWAToken(
            "Manhattan Office Tower",
            "aMOT",
            "Commercial Real Estate",
            "ipfs://QmExample/manhattan-tower",
            50_000_000 * 1e6, // $50M
            deployer
        );

        RWAToken carbonCredit = new RWAToken(
            "Verified Carbon Credits 2026",
            "aVCC",
            "Carbon Credit",
            "ipfs://QmExample/carbon-credits",
            2_000_000 * 1e6, // $2M
            deployer
        );

        RWAMarketplace marketplace = new RWAMarketplace(USDC, deployer);

        vm.stopBroadcast();

        console.log("Treasury Bond:", address(treasuryBond));
        console.log("Real Estate:", address(realEstate));
        console.log("Carbon Credit:", address(carbonCredit));
        console.log("Marketplace:", address(marketplace));
    }
}
