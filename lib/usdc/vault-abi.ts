/**
 * LateGateVault ABI + events the Mini App / Proto 3 needs.
 * Traveler path: USDC.approve(vault, units) then backend `payPremium`,
 * or USDC.transfer(vault, units) and pass `usdcTxHash` (recorded collect).
 */

export const LATE_GATE_VAULT_ABI = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "usdc_", type: "address" },
      { name: "house_", type: "address" },
    ],
  },
  {
    type: "function",
    name: "usdc",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "house",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
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
    name: "assetsOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToShares",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "payPremium",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "collect",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "payout",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    type: "function",
    name: "depositFor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "assets", type: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "assets", type: "uint256" }],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    type: "function",
    name: "setPaused",
    stateMutability: "nonpayable",
    inputs: [{ name: "paused_", type: "bool" }],
    outputs: [],
  },
  {
    type: "function",
    name: "transferHouse",
    stateMutability: "nonpayable",
    inputs: [{ name: "nextHouse", type: "address" }],
    outputs: [],
  },
  {
    type: "event",
    name: "PremiumPaid",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "pulled", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PayoutSent",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LpDeposited",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LpWithdrawn",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Paused",
    inputs: [{ name: "paused", type: "bool", indexed: false }],
  },
  {
    type: "event",
    name: "HouseTransferred",
    inputs: [
      { name: "previousHouse", type: "address", indexed: true },
      { name: "nextHouse", type: "address", indexed: true },
    ],
  },
] as const;

export type VaultWriteFn =
  | "payPremium"
  | "collect"
  | "payout"
  | "deposit"
  | "depositFor"
  | "withdraw";
