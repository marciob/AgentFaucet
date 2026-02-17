// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {FaucetPool} from "../src/FaucetPool.sol";

contract DeployFaucetPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress = vm.envAddress("RELAYER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        FaucetPool pool = new FaucetPool(relayerAddress);

        vm.stopBroadcast();

        console.log("FaucetPool deployed at:", address(pool));
        console.log("Relayer:", relayerAddress);
        console.log("Max claim amount:", pool.maxClaimAmount());
    }
}
