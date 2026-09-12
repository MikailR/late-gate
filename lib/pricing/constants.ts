/**
 * Locked demo money. Premium is a fixed USD number per product.
 * Payout is a fixed USD number per minutesLate. Same payout table for both products.
 * Do not derive these from p * B * (1 + λ) — historicalDelayProb and λ are display/risk copy only.
 * Human till only — never mix with HBAR x402.
 */

/** Kept on the quote payload for risk copy. Not used to compute premium or payout. */
export const LAMBDA = 0.2;

/** Arrival / 60 locked payout. Day-1 `maxPayout` default. */
export const DEFAULT_PAYOUT_USD = 200;

/** Locked premium by product. Changing minutesLate does not re-price. */
export const PREMIUM_USD_BY_PRODUCT = {
  takeoff: 14,
  arrival: 9,
} as const;

/**
 * USD payout by minutesLate. Same table for takeoff and arrival.
 * Payout rises as the bar gets harder: 30 → $100, 45 → $150, 60 → $200.
 */
export const PAYOUT_USD_BY_MINUTES_LATE = {
  30: 100,
  45: 150,
  60: DEFAULT_PAYOUT_USD,
} as const;

export type PayoutMinutesLate = keyof typeof PAYOUT_USD_BY_MINUTES_LATE;

export function premiumUsdForProduct(
  product: keyof typeof PREMIUM_USD_BY_PRODUCT,
): number {
  return PREMIUM_USD_BY_PRODUCT[product];
}

export function payoutUsdForMinutesLate(minutesLate: PayoutMinutesLate): number {
  return PAYOUT_USD_BY_MINUTES_LATE[minutesLate];
}

/** Gate-lateness threshold τ in minutes. */
export const DEFAULT_TAU_MINUTES = 60;

/** Refuse CUTOFF when now is past scheduled departure − T. */
export const CUTOFF_HOURS = 8;
