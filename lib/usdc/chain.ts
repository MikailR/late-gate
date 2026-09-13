/**
 * World Chain + native USDC. Demo/testnet target is Sepolia (4801) only.
 * Mainnet (480) addresses are documented — do not send prize txs there.
 * // status: implemented (config). Live RPC is lib/usdc/live.ts when env is set.
 */

import type { Address, Hex } from "viem";

/** Locked demo / testnet. */
export const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801 as const;

/** Documented only. Do not target. */
export const WORLDCHAIN_MAINNET_CHAIN_ID = 480 as const;

export const USDC_DECIMALS = 6 as const;

/**
 * Circle native USDC on World Chain Sepolia.
 * Verified 2026-09-13 against Circle contract list + World docs.
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 * https://docs.world.org/world-chain/tokens/usdc
 */
export const USDC_SEPOLIA_ADDRESS =
  "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88" as Address;

/** Circle native USDC on World Chain mainnet. Docs only — not a prize target. */
export const USDC_MAINNET_ADDRESS =
  "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1" as Address;

/** World docs public RPC. Mikail should still set WORLDCHAIN_RPC. */
export const WORLDCHAIN_SEPOLIA_PUBLIC_RPC =
  "https://worldchain-sepolia.g.alchemy.com/public";

export const WORLDCHAIN_SEPOLIA_EXPLORER = "https://worldchain-sepolia.explorer.alchemy.com";

export const WORLDSCAN_SEPOLIA_EXPLORER = "https://sepolia.worldscan.org";

export const CIRCLE_USDC_FAUCET = "https://faucet.circle.com";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

/** Placeholder when Mini App has not sent a traveler wallet yet. */
export const STUB_TRAVELER_ADDRESS = "0x000000000000000000000000000000000000dEaD" as Address;

export type WorldchainNetwork = {
  name: "worldchain-sepolia";
  chainId: typeof WORLDCHAIN_SEPOLIA_CHAIN_ID;
  rpcUrl: string;
  explorerUrl: string;
  testnet: true;
};

export function explorerTxUrl(txHash: Hex, explorerUrl = WORLDCHAIN_SEPOLIA_EXPLORER): string {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
