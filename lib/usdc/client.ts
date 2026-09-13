/**
 * USDC prize till. Stub transfers only — no live broadcast yet.
 * // status: stub implemented. TODO: viem walletClient on World Chain Sepolia
 *           + ERC-20 transfer / transferFrom once LP_VAULT_ADDRESS + house key exist.
 */

import { isAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isUsdcTillConfigured, usdcTillEnv, type UsdcTillEnv } from "@/lib/config/env";
import { centsToUsdcUnits, UsdcAmountException } from "./amount";
import {
  ERC20_TRANSFER_ABI,
  explorerTxUrl,
  STUB_TRAVELER_ADDRESS,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  ZERO_ADDRESS,
} from "./chain";
import type {
  LpDepositInput,
  LpWithdrawInput,
  PayPremiumInput,
  PayoutInput,
  UsdcFailure,
  UsdcOp,
  UsdcReceipt,
  UsdcResult,
  UsdcTill,
} from "./types";

export { isUsdcTillConfigured };

const LIVE_TRANSFER_TODO =
  "TODO(usdc): broadcast ERC-20 transfer on World Chain Sepolia (4801) with HOUSE_EVM_PRIVATE_KEY → LP_VAULT_ADDRESS. Do not send mainnet (480).";

function asAddress(value: string | undefined, fallback: Address): Address {
  if (value && isAddress(value)) return value;
  return fallback;
}

function fail(op: UsdcOp, error: UsdcFailure["error"], reason: string): UsdcFailure {
  return { ok: false, stub: true, implemented: false, op, error, reason };
}

function stubTx(op: UsdcOp): Hex {
  return `0xstub${op}${Date.now().toString(16).padStart(8, "0")}` as Hex;
}

function houseAddress(env: UsdcTillEnv): Address | null {
  if (!env.housePrivateKey) return null;
  try {
    return privateKeyToAccount(env.housePrivateKey as Hex).address;
  } catch {
    return null;
  }
}

function receipt(args: {
  op: UsdcOp;
  env: UsdcTillEnv;
  from: Address;
  to: Address;
  amountCents: number;
  amountUnits: bigint;
  txHash: Hex;
  role?: UsdcReceipt["role"];
  flightKey?: string;
  policyId?: string;
  ticketNumber?: string;
}): UsdcReceipt {
  return {
    ok: true,
    stub: true,
    implemented: false,
    op: args.op,
    asset: "USDC",
    decimals: 6,
    chainId: WORLDCHAIN_SEPOLIA_CHAIN_ID,
    network: "worldchain-sepolia",
    token: args.env.usdcAddress,
    vault: args.env.vaultAddress ?? null,
    from: args.from,
    to: args.to,
    amountCents: args.amountCents,
    amountUnits: args.amountUnits.toString(),
    txHash: args.txHash,
    explorerUrl: explorerTxUrl(args.txHash, args.env.explorerUrl),
    role: args.role,
    flightKey: args.flightKey,
    policyId: args.policyId,
    ticketNumber: args.ticketNumber,
    recordedAt: new Date().toISOString(),
    todo: LIVE_TRANSFER_TODO,
  };
}

function parseAmount(op: UsdcOp, cents: number): { ok: true; units: bigint } | UsdcFailure {
  if (!Number.isInteger(cents) || cents <= 0) {
    return fail(op, "INVALID_AMOUNT", "amountCents must be a positive integer (USD cents).");
  }
  try {
    return { ok: true, units: centsToUsdcUnits(cents) };
  } catch (error) {
    const reason = error instanceof UsdcAmountException ? error.message : "invalid USDC amount";
    return fail(op, "INVALID_AMOUNT", reason);
  }
}

function requireAddress(op: UsdcOp, value: string | undefined, label: string): Address | UsdcFailure {
  if (!value || !isAddress(value) || value === ZERO_ADDRESS) {
    return fail(op, "INVALID_ADDRESS", `${label} must be a non-zero World Chain address.`);
  }
  return value;
}

/**
 * Traveler Mini App / Proto 3 pays the locked premium in USDC to the LP vault.
 * Stub records the intended transfer. Live: traveler `transfer` or `approve` + house `transferFrom`.
 */
export async function payPremium(input: PayPremiumInput): Promise<UsdcResult> {
  const env = usdcTillEnv();
  const amount = parseAmount("payPremium", input.amountCents);
  if (!amount.ok) return amount;

  const from = requireAddress("payPremium", input.from, "from");
  if (typeof from !== "string") return from;

  const vault = env.vaultAddress ?? houseAddress(env);
  const to = asAddress(vault ?? undefined, STUB_TRAVELER_ADDRESS);

  void ERC20_TRANSFER_ABI;
  void isUsdcTillConfigured();

  return receipt({
    op: "payPremium",
    env,
    from,
    to,
    amountCents: input.amountCents,
    amountUnits: amount.units,
    txHash: input.txHash && input.txHash.startsWith("0x") ? input.txHash : stubTx("payPremium"),
    flightKey: input.flightKey,
    policyId: input.policyId,
  });
}

/**
 * House settlement credit — USDC from the vault to the traveler.
 * Stub records the intended transfer. Live: house signer `transfer` from vault / operator wallet.
 */
export async function payout(input: PayoutInput): Promise<UsdcResult> {
  const env = usdcTillEnv();
  const amount = parseAmount("payout", input.amountCents);
  if (!amount.ok) return amount;

  const to = requireAddress("payout", input.to, "to");
  if (typeof to !== "string") return to;

  const from = asAddress(env.vaultAddress ?? houseAddress(env) ?? undefined, STUB_TRAVELER_ADDRESS);

  return receipt({
    op: "payout",
    env,
    from,
    to,
    amountCents: input.amountCents,
    amountUnits: amount.units,
    txHash: stubTx("payout"),
    policyId: input.policyId,
    ticketNumber: input.ticketNumber,
  });
}

/**
 * House or a user deposits USDC into the shared pot / vault. House remains operator.
 */
export async function lpDeposit(input: LpDepositInput): Promise<UsdcResult> {
  const env = usdcTillEnv();
  const amount = parseAmount("lpDeposit", input.amountCents);
  if (!amount.ok) return amount;

  const from = requireAddress("lpDeposit", input.from, "from");
  if (typeof from !== "string") return from;

  if (!env.vaultAddress) {
    return fail(
      "lpDeposit",
      "MISSING_VAULT",
      "LP_VAULT_ADDRESS is empty. Stub will not invent a vault; set it before live deposits.",
    );
  }

  return receipt({
    op: "lpDeposit",
    env,
    from,
    to: env.vaultAddress,
    amountCents: input.amountCents,
    amountUnits: amount.units,
    txHash: input.txHash && input.txHash.startsWith("0x") ? input.txHash : stubTx("lpDeposit"),
    role: input.role,
  });
}

/**
 * House-operated withdraw from the vault back to an LP (or house).
 */
export async function lpWithdraw(input: LpWithdrawInput): Promise<UsdcResult> {
  const env = usdcTillEnv();
  const amount = parseAmount("lpWithdraw", input.amountCents);
  if (!amount.ok) return amount;

  const to = requireAddress("lpWithdraw", input.to, "to");
  if (typeof to !== "string") return to;

  if (!env.vaultAddress) {
    return fail(
      "lpWithdraw",
      "MISSING_VAULT",
      "LP_VAULT_ADDRESS is empty. House cannot withdraw until a vault is set.",
    );
  }

  return receipt({
    op: "lpWithdraw",
    env,
    from: env.vaultAddress,
    to,
    amountCents: input.amountCents,
    amountUnits: amount.units,
    txHash: stubTx("lpWithdraw"),
    role: input.role,
  });
}

export const usdcTill: UsdcTill = {
  payPremium,
  payout,
  lpDeposit,
  lpWithdraw,
};
