/**
 * Prize till — USDC on World Chain Sepolia.
 * Traveler Mini App / Proto 3 pays premium here. Settlement credit is a USDC transfer.
 * LP deposits (house + users) share the same vault. House stays operator.
 * // status: types implemented. Live ERC-20 when WORLDCHAIN_RPC + HOUSE_EVM_PRIVATE_KEY + LP_VAULT_ADDRESS.
 */

import type { Address, Hex } from "viem";
import type { VaultWriteFn } from "./vault-abi";

/** Subset of `usdcTillEnv()` the live sender needs. Avoids importing config from types. */
export type UsdcExecEnv = {
  rpcUrl: string;
  chainId: 4801;
  usdcAddress: Address;
  housePrivateKey?: string;
  vaultAddress?: Address;
  explorerUrl: string;
};

export type UsdcOp = "payPremium" | "payout" | "lpDeposit" | "lpWithdraw";

export type LpRole = "house" | "lp";

export type UsdcOpError =
  | "INVALID_AMOUNT"
  | "INVALID_ADDRESS"
  | "MISSING_VAULT"
  | "NOT_IMPLEMENTED"
  | "NOT_HOUSE"
  | "BROADCAST_FAILED";

export type PayPremiumInput = {
  from: Address;
  amountCents: number;
  flightKey: string;
  policyId?: string;
  /** Mini App may already have broadcast the transfer. */
  txHash?: Hex;
};

export type PayoutInput = {
  to: Address;
  amountCents: number;
  policyId: string;
  ticketNumber?: string;
};

export type LpDepositInput = {
  from: Address;
  amountCents: number;
  role: LpRole;
  txHash?: Hex;
};

export type LpWithdrawInput = {
  to: Address;
  amountCents: number;
  role: LpRole;
};

export type UsdcReceipt = {
  ok: true;
  /** True when no live broadcast ran (env missing or recorded stub). */
  stub: boolean;
  /** True only after a real 32-byte tx hash from a live send or recorded live deposit. */
  implemented: boolean;
  op: UsdcOp;
  asset: "USDC";
  decimals: 6;
  chainId: 4801;
  network: "worldchain-sepolia";
  token: Address;
  vault: Address | null;
  from: Address;
  to: Address;
  amountCents: number;
  amountUnits: string;
  txHash: Hex;
  explorerUrl: string;
  role?: LpRole;
  flightKey?: string;
  policyId?: string;
  ticketNumber?: string;
  recordedAt: string;
  /** What a live implementation must still do. Empty after a live send. */
  todo: string;
};

export type UsdcFailure = {
  ok: false;
  stub: boolean;
  implemented: false;
  op: UsdcOp;
  error: UsdcOpError;
  reason: string;
};

export type UsdcResult = UsdcReceipt | UsdcFailure;

export type VaultWriteCall = {
  functionName: VaultWriteFn;
  args: readonly unknown[];
};

export type VaultSender = {
  write(call: VaultWriteCall): Promise<Hex>;
  readHouse(): Promise<Address>;
  approveUsdc?(amount: bigint): Promise<Hex | null>;
};

/** Test / inject hook. Production callers omit this. */
export type UsdcExecOptions = {
  env?: UsdcExecEnv;
  live?: boolean;
  sender?: VaultSender;
};

export interface UsdcTill {
  payPremium(input: PayPremiumInput, options?: UsdcExecOptions): Promise<UsdcResult>;
  payout(input: PayoutInput, options?: UsdcExecOptions): Promise<UsdcResult>;
  lpDeposit(input: LpDepositInput, options?: UsdcExecOptions): Promise<UsdcResult>;
  lpWithdraw(input: LpWithdrawInput, options?: UsdcExecOptions): Promise<UsdcResult>;
}
