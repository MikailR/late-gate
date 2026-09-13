/**
 * USD cents ↔ native USDC (6 decimals). Prize till only.
 * 1 cent = 10_000 atomic units. Do not import tinybar / Redis pot types here.
 * // status: implemented
 */

import { USDC_DECIMALS } from "./chain";

/** 10^(6-2) — one USD cent in USDC atomic units. */
export const USDC_UNITS_PER_CENT = 10_000n;

export const USDC_UNITS_PER_DOLLAR = 1_000_000n;

export type UsdcAmountError = "INVALID_AMOUNT";

export class UsdcAmountException extends Error {
  readonly code: UsdcAmountError = "INVALID_AMOUNT";

  constructor(message: string) {
    super(message);
    this.name = "UsdcAmountException";
  }
}

function assertIntegerCents(cents: number): void {
  if (typeof cents !== "number" || !Number.isInteger(cents) || !Number.isSafeInteger(cents)) {
    throw new UsdcAmountException("cents must be a safe integer");
  }
  if (cents < 0) {
    throw new UsdcAmountException("cents must be >= 0");
  }
}

/** Quote / payout cents → USDC atomic units (6 decimals). */
export function centsToUsdcUnits(cents: number): bigint {
  assertIntegerCents(cents);
  return BigInt(cents) * USDC_UNITS_PER_CENT;
}

/** USDC atomic units → USD cents. Rejects dust that is not a whole cent. */
export function usdcUnitsToCents(units: bigint): number {
  if (typeof units !== "bigint") {
    throw new UsdcAmountException("units must be a bigint");
  }
  if (units < 0n) {
    throw new UsdcAmountException("units must be >= 0");
  }
  if (units % USDC_UNITS_PER_CENT !== 0n) {
    throw new UsdcAmountException("units must map to a whole cent (no leftover 6-decimal dust)");
  }
  const cents = units / USDC_UNITS_PER_CENT;
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new UsdcAmountException("cents overflow safe integer");
  }
  return Number(cents);
}

export function dollarsToUsdcUnits(dollars: number): bigint {
  if (typeof dollars !== "number" || !Number.isFinite(dollars)) {
    throw new UsdcAmountException("dollars must be a finite number");
  }
  return centsToUsdcUnits(Math.round(dollars * 100));
}

export function usdcUnitsToDollars(units: bigint): number {
  return usdcUnitsToCents(units) / 100;
}

export function formatUsdcUnits(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / USDC_UNITS_PER_DOLLAR;
  const frac = (abs % USDC_UNITS_PER_DOLLAR).toString().padStart(USDC_DECIMALS, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${frac}`;
}
