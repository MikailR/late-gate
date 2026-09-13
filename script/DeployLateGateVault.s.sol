// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LateGateVault} from "../contracts/LateGateVault.sol";

/// @notice World Chain Sepolia deploy helper.
/// Prefer `npm run deploy:vault` (prints LP_VAULT_ADDRESS, no key required in CI).
/// With Foundry + a funded house key:
///   forge script script/DeployLateGateVault.s.sol:DeployLateGateVault \
///     --rpc-url $WORLDCHAIN_RPC --broadcast --private-key $HOUSE_EVM_PRIVATE_KEY -vv
///
/// This file is intentionally forge-std-free so `forge build` works without lib-sol.
/// The TS script is the supported deployer; this is a compile-checked constructor wrapper.
contract DeployLateGateVault {
    function deploy(address usdc, address house) external returns (LateGateVault vault) {
        vault = new LateGateVault(usdc, house);
    }
}
