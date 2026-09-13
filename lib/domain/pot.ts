/**
 * Demo fallback pot — USD cents in memory (or leftover Redis).
 * NOT the locked prize path. Prize money is USDC on World Chain Sepolia (`lib/usdc`).
 * Never import HBAR / tinybar types here. Hedera x402 is PARKED.
 * // status: implemented (pure debit/credit). Labeled fallback only.
 */

export const POT_CURRENCY = "USD" as const;

export type Pot = {
  ownerKey: string;
  balanceCents: number;
  currency: typeof POT_CURRENCY;
};

export type PotTxn =
  | {
      ok: true;
      pot: Pot;
      deltaCents: number;
      reason: string;
    }
  | {
      ok: false;
      error: "INSUFFICIENT" | "INVALID_AMOUNT" | "CURRENCY_MIX";
      pot: Pot;
      reason: string;
    };

export function emptyPot(ownerKey: string): Pot {
  return { ownerKey, balanceCents: 0, currency: POT_CURRENCY };
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatPotUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsToDollars(cents));
}

/** Demo grant: $50.00 on first verified human. */
export const DEMO_POT_GRANT_CENTS = 5_000;

export function applyCredit(pot: Pot, cents: number, reason: string): PotTxn {
  if (!Number.isInteger(cents) || cents <= 0) {
    return { ok: false, error: "INVALID_AMOUNT", pot, reason };
  }
  if (pot.currency !== POT_CURRENCY) {
    return { ok: false, error: "CURRENCY_MIX", pot, reason };
  }
  return {
    ok: true,
    pot: { ...pot, balanceCents: pot.balanceCents + cents },
    deltaCents: cents,
    reason,
  };
}

export function applyDebit(pot: Pot, cents: number, reason: string): PotTxn {
  if (!Number.isInteger(cents) || cents <= 0) {
    return { ok: false, error: "INVALID_AMOUNT", pot, reason };
  }
  if (pot.currency !== POT_CURRENCY) {
    return { ok: false, error: "CURRENCY_MIX", pot, reason };
  }
  if (pot.balanceCents < cents) {
    return { ok: false, error: "INSUFFICIENT", pot, reason };
  }
  return {
    ok: true,
    pot: { ...pot, balanceCents: pot.balanceCents - cents },
    deltaCents: -cents,
    reason,
  };
}
