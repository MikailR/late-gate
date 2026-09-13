/**
 * USDC prize till. Stub receipts when live env is missing.
 * Live viem sends when WORLDCHAIN_RPC + HOUSE_EVM_PRIVATE_KEY + LP_VAULT_ADDRESS exist.
 */

import { isAddress, type Address, type Hex } from "viem";
import {
  isUsdcLiveConfigured,
  isUsdcLiveEnv,
  isUsdcTillConfigured,
  usdcTillEnv,
  type UsdcTillEnv,
} from "@/lib/config/env";
import { centsToUsdcUnits, UsdcAmountException } from "./amount";
import {
  STUB_TRAVELER_ADDRESS,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  ZERO_ADDRESS,
  explorerTxUrl,
} from "./chain";
import {
  HouseSignerError,
  assertHouseSigner,
  createViemVaultSender,
  houseAccountFromKey,
  isLiveTxHash,
} from "./live";
import type {
  LpDepositInput,
  LpWithdrawInput,
  PayPremiumInput,
  PayoutInput,
  UsdcExecOptions,
  UsdcFailure,
  UsdcOp,
  UsdcReceipt,
  UsdcResult,
  UsdcTill,
  VaultSender,
} from "./types";

export { isUsdcLiveConfigured, isUsdcLiveEnv, isUsdcTillConfigured };

const LIVE_TRANSFER_TODO =
  "TODO(usdc): broadcast ERC-20 transfer on World Chain Sepolia (4801) with HOUSE_EVM_PRIVATE_KEY → LP_VAULT_ADDRESS. Do not send mainnet (480).";

function asAddress(value: string | undefined, fallback: Address): Address {
  if (value && isAddress(value)) return value;
  return fallback;
}

function fail(op: UsdcOp, error: UsdcFailure["error"], reason: string, stub = true): UsdcFailure {
  return { ok: false, stub, implemented: false, op, error, reason };
}

function stubTx(op: UsdcOp): Hex {
  return `0xstub${op}${Date.now().toString(16).padStart(8, "0")}` as Hex;
}

function houseAddress(env: UsdcTillEnv): Address | null {
  if (!env.housePrivateKey) return null;
  try {
    return houseAccountFromKey(env.housePrivateKey).address;
  } catch {
    return null;
  }
}

function resolveExec(options?: UsdcExecOptions): { env: UsdcTillEnv; live: boolean } {
  return {
    env: options?.env ?? usdcTillEnv(),
    live: options?.live ?? isUsdcLiveConfigured(),
  };
}

function resolveSender(env: UsdcTillEnv, options?: UsdcExecOptions): VaultSender {
  if (options?.sender) return options.sender;
  return createViemVaultSender(env);
}

function receipt(args: {
  op: UsdcOp;
  env: UsdcTillEnv;
  from: Address;
  to: Address;
  amountCents: number;
  amountUnits: bigint;
  txHash: Hex;
  stub: boolean;
  implemented: boolean;
  role?: UsdcReceipt["role"];
  flightKey?: string;
  policyId?: string;
  ticketNumber?: string;
}): UsdcReceipt {
  return {
    ok: true,
    stub: args.stub,
    implemented: args.implemented,
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
    todo: args.implemented ? "" : LIVE_TRANSFER_TODO,
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

function broadcastError(op: UsdcOp, error: unknown): UsdcFailure {
  if (error instanceof HouseSignerError) {
    return fail(op, "NOT_HOUSE", error.message, false);
  }
  const reason = error instanceof Error ? error.message : "vault broadcast failed";
  return fail(op, "BROADCAST_FAILED", reason, false);
}

/**
 * Traveler Mini App / Proto 3 pays the locked premium in USDC to the LP vault.
 * Stub records the intended transfer. Live: traveler `approve` + house `payPremium` (transferFrom),
 * or a recorded `usdcTxHash` after the Mini App `transfer`s USDC to the vault.
 */
export async function payPremium(input: PayPremiumInput, options?: UsdcExecOptions): Promise<UsdcResult> {
  const { env, live } = resolveExec(options);
  const amount = parseAmount("payPremium", input.amountCents);
  if (!amount.ok) return amount;

  const from = requireAddress("payPremium", input.from, "from");
  if (typeof from !== "string") return from;

  if (!live) {
    const vault = env.vaultAddress ?? houseAddress(env);
    const to = asAddress(vault ?? undefined, STUB_TRAVELER_ADDRESS);
    return receipt({
      op: "payPremium",
      env,
      from,
      to,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash: input.txHash && input.txHash.startsWith("0x") ? input.txHash : stubTx("payPremium"),
      stub: true,
      implemented: false,
      flightKey: input.flightKey,
      policyId: input.policyId,
    });
  }

  if (!env.vaultAddress) {
    return fail("payPremium", "MISSING_VAULT", "LP_VAULT_ADDRESS is required for live payPremium.");
  }
  if (from === STUB_TRAVELER_ADDRESS) {
    return fail(
      "payPremium",
      "INVALID_ADDRESS",
      "Mini App must send a traveler wallet before live payPremium.",
    );
  }

  if (isLiveTxHash(input.txHash)) {
    return receipt({
      op: "payPremium",
      env,
      from,
      to: env.vaultAddress,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash: input.txHash,
      stub: false,
      implemented: true,
      flightKey: input.flightKey,
      policyId: input.policyId,
    });
  }

  try {
    const sender = resolveSender(env, options);
    const txHash = await sender.write({
      functionName: "payPremium",
      args: [from, amount.units],
    });
    return receipt({
      op: "payPremium",
      env,
      from,
      to: env.vaultAddress,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash,
      stub: false,
      implemented: true,
      flightKey: input.flightKey,
      policyId: input.policyId,
    });
  } catch (error) {
    return broadcastError("payPremium", error);
  }
}

/**
 * House settlement credit — USDC from the vault to the traveler.
 * Stub records the intended transfer. Live: house signer `payout` on the vault.
 */
export async function payout(input: PayoutInput, options?: UsdcExecOptions): Promise<UsdcResult> {
  const { env, live } = resolveExec(options);
  const amount = parseAmount("payout", input.amountCents);
  if (!amount.ok) return amount;

  const to = requireAddress("payout", input.to, "to");
  if (typeof to !== "string") return to;

  if (!live) {
    const from = asAddress(env.vaultAddress ?? houseAddress(env) ?? undefined, STUB_TRAVELER_ADDRESS);
    return receipt({
      op: "payout",
      env,
      from,
      to,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash: stubTx("payout"),
      stub: true,
      implemented: false,
      policyId: input.policyId,
      ticketNumber: input.ticketNumber,
    });
  }

  if (!env.vaultAddress) {
    return fail("payout", "MISSING_VAULT", "LP_VAULT_ADDRESS is required for live payout.");
  }
  if (to === STUB_TRAVELER_ADDRESS) {
    return fail("payout", "INVALID_ADDRESS", "Cannot payout to the stub traveler address on the live path.");
  }

  try {
    const sender = resolveSender(env, options);
    const txHash = await sender.write({
      functionName: "payout",
      args: [to, amount.units],
    });
    return receipt({
      op: "payout",
      env,
      from: env.vaultAddress,
      to,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash,
      stub: false,
      implemented: true,
      policyId: input.policyId,
      ticketNumber: input.ticketNumber,
    });
  } catch (error) {
    return broadcastError("payout", error);
  }
}

/**
 * House or a user deposits USDC into the shared pot / vault. House remains operator.
 */
export async function lpDeposit(input: LpDepositInput, options?: UsdcExecOptions): Promise<UsdcResult> {
  const { env, live } = resolveExec(options);
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

  if (!live) {
    return receipt({
      op: "lpDeposit",
      env,
      from,
      to: env.vaultAddress,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash: input.txHash && input.txHash.startsWith("0x") ? input.txHash : stubTx("lpDeposit"),
      stub: true,
      implemented: false,
      role: input.role,
    });
  }

  if (isLiveTxHash(input.txHash)) {
    return receipt({
      op: "lpDeposit",
      env,
      from,
      to: env.vaultAddress,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash: input.txHash,
      stub: false,
      implemented: true,
      role: input.role,
    });
  }

  try {
    const sender = resolveSender(env, options);
    const signer = houseAddress(env);
    if (input.role === "house" && signer && from.toLowerCase() === signer.toLowerCase() && sender.approveUsdc) {
      await sender.approveUsdc(amount.units);
      const txHash = await sender.write({
        functionName: "deposit",
        args: [amount.units],
      });
      return receipt({
        op: "lpDeposit",
        env,
        from,
        to: env.vaultAddress,
        amountCents: input.amountCents,
        amountUnits: amount.units,
        txHash,
        stub: false,
        implemented: true,
        role: input.role,
      });
    }

    const txHash = await sender.write({
      functionName: "depositFor",
      args: [from, amount.units],
    });
    return receipt({
      op: "lpDeposit",
      env,
      from,
      to: env.vaultAddress,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash,
      stub: false,
      implemented: true,
      role: input.role,
    });
  } catch (error) {
    return broadcastError("lpDeposit", error);
  }
}

/**
 * House-operated withdraw from the vault back to an LP (or house).
 * Live path checks the house signer against `vault.house()` before sending.
 */
export async function lpWithdraw(input: LpWithdrawInput, options?: UsdcExecOptions): Promise<UsdcResult> {
  const { env, live } = resolveExec(options);
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

  if (!live) {
    return receipt({
      op: "lpWithdraw",
      env,
      from: env.vaultAddress,
      to,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash: stubTx("lpWithdraw"),
      stub: true,
      implemented: false,
      role: input.role,
    });
  }

  const signer = houseAddress(env);
  if (!signer) {
    return fail("lpWithdraw", "NOT_HOUSE", "HOUSE_EVM_PRIVATE_KEY is missing or invalid. House-gated withdraw.");
  }

  try {
    const sender = resolveSender(env, options);
    await assertHouseSigner(sender, signer);
    const txHash = await sender.write({
      functionName: "withdraw",
      args: [to, amount.units],
    });
    return receipt({
      op: "lpWithdraw",
      env,
      from: env.vaultAddress,
      to,
      amountCents: input.amountCents,
      amountUnits: amount.units,
      txHash,
      stub: false,
      implemented: true,
      role: input.role,
    });
  } catch (error) {
    return broadcastError("lpWithdraw", error);
  }
}

export const usdcTill: UsdcTill = {
  payPremium,
  payout,
  lpDeposit,
  lpWithdraw,
};
