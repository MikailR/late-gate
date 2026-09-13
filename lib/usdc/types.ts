/**
 * Prize till — USDC on World Chain Sepolia.
 * Traveler Mini App / Proto 3 pays premium here. Settlement credit is a USDC transfer.
 * LP deposits (house + users) share the same vault. House stays operator.
 * // status: types implemented. Live ERC-20 transfers are TODO in client.ts.
 */

import type { Address, Hex } from "viem";

export type UsdcOp = "payPremium" | "payout" | "lpDeposit" | "lpWithdraw";

export type LpRole = "house" | "lp";

export type UsdcOpError =
  | "INVALID_AMOUNT"
  | "INVALID_ADDRESS"
  | "MISSING_VAULT"
  | "NOT_IMPLEMENTED";

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
  /** Always true until live transfer is wired. */
  stub: true;
  /** Live ERC-20 send is not implemented. */
  implemented: false;
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
  /** What a live implementation must still do. */
  todo: string;
};

export type UsdcFailure = {
  ok: false;
  stub: true;
  implemented: false;
  op: UsdcOp;
  error: UsdcOpError;
  reason: string;
};

export type UsdcResult = UsdcReceipt | UsdcFailure;

export interface UsdcTill {
  payPremium(input: PayPremiumInput): Promise<UsdcResult>;
  payout(input: PayoutInput): Promise<UsdcResult>;
  lpDeposit(input: LpDepositInput): Promise<UsdcResult>;
  lpWithdraw(input: LpWithdrawInput): Promise<UsdcResult>;
}
