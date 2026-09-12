/** House markup on the fair premium. π = p * B_ref * (1 + λ) */
export const LAMBDA = 0.2;

/**
 * 60-minute reference payout B_ref. Premium is always priced against this
 * number so 30 / 45 / 60 share one premium. Do not scale π with minutesLate.
 */
export const DEFAULT_PAYOUT_USD = 100;

/**
 * USD payout by minutesLate. Hypothesis: payout rises as the bar gets harder
 * (30 → $50, 45 → $75, 60 → $100). Premium stays on DEFAULT_PAYOUT_USD.
 * Human till only — never mix with HBAR x402.
 */
export const PAYOUT_USD_BY_MINUTES_LATE = {
  30: 50,
  45: 75,
  60: DEFAULT_PAYOUT_USD,
} as const;

export type PayoutMinutesLate = keyof typeof PAYOUT_USD_BY_MINUTES_LATE;

export function payoutUsdForMinutesLate(minutesLate: PayoutMinutesLate): number {
  return PAYOUT_USD_BY_MINUTES_LATE[minutesLate];
}

/** Gate-lateness threshold τ in minutes. */
export const DEFAULT_TAU_MINUTES = 60;

/** Refuse CUTOFF when now is past scheduled departure − T. */
export const CUTOFF_HOURS = 8;
