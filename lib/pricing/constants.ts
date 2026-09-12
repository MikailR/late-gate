/**
 * Locked demo money + Financial Research underwriting constants.
 * Premium is a fixed USD number per product. Payout is a fixed USD number
 * per minutesLate. Same payout table for both products.
 * Do not derive these from p * B * (1 + λ) — p_hat and λ are display / risk
 * copy and the listing gate, not a re-price.
 * Human till only — never mix with HBAR x402.
 *
 * Source of truth: docs/pricing/rails-pricing-constants.json
 * (version 2026-09-12.eng-lock.v1).
 */

import type { MinutesLate, StubProduct } from "@/lib/domain/types";

/** Kept on the quote payload for risk copy. Not used to compute premium or payout. */
export const LAMBDA = 0.2;

/**
 * Financial Research target load. p_max tables are inverted from locked π, B,
 * and this λ. Internal — never show in traveler UI.
 */
export const TARGET_LAMBDA = 1.45;

/** Soft underwriting floor from the same pack. Not the quote-time gate. */
export const MIN_LAMBDA_UNDERWRITING = 1.25;

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

/**
 * p_max at TARGET_LAMBDA=1.45. p_max = π / (B * λ).
 * TAKEOFF 30/45/60: 0.0966 / 0.0644 / 0.0483
 * ARRIVAL 30/45/60: 0.0621 / 0.0414 / 0.0310
 * Internal τ — UI-facing configure is still minutesLate 30|45|60.
 */
export const P_MAX_AT_TARGET_LAMBDA: Record<StubProduct, Record<MinutesLate, number>> = {
  takeoff: { 30: 0.0966, 45: 0.0644, 60: 0.0483 },
  arrival: { 30: 0.0621, 45: 0.0414, 60: 0.0310 },
};

/**
 * Recommended clean FOMO demo prior per τ (minutesLate).
 * House EV at locked π: Takeoff +$6/+6.5/+7; Arrival +$1/+1.5/+2.
 * Arrival sits slightly above conservative p_max; the approved prior is what
 * the UA472 demo lists so the FOMO path still quotes.
 */
export const CLEAN_DEMO_PRIOR_BY_MINUTES_LATE: Record<MinutesLate, number> = {
  30: 0.08,
  45: 0.05,
  60: 0.035,
};

/**
 * US pool-average p (BTS Jan+Jul 2024, rounded). Locked π is underwater here.
 * High-p fixture uses this table so quote returns UNDERWRITE_REJECT.
 */
export const POOL_AVERAGE_PRIOR_BY_MINUTES_LATE: Record<MinutesLate, number> = {
  30: 0.18,
  45: 0.14,
  60: 0.11,
};

/** Inventory: default 10 stubs / flight / product. */
export const DEFAULT_MAX_OPEN_PER_FLIGHT = 10;

/** Demo inventory. HOUSE_MAX_OPEN_PER_FLIGHT env overrides; default 5. */
export const DEMO_MAX_OPEN_PER_FLIGHT = 5;

export const MIN_OPEN_PER_FLIGHT = 3;
export const MAX_OPEN_PER_FLIGHT = 20;

/** Max payout exposure ≈ inventory_cap * max(B). Default 10 × $200. */
export const MAX_PAYOUT_EXPOSURE_PER_FLIGHT_PRODUCT_USD = 2_000;

/**
 * Portfolio caps — constants only. Quote route does not enforce these yet.
 * EXPOSURE_CAP refusal type is wired; the check is TODO.
 */
export const PORTFOLIO_CAP_USD = {
  airportDay: 25_000,
  airlineDay: 40_000,
  bookDay: 150_000,
  correlationCluster: 15_000,
} as const;

export const WEATHER_WATCH_AIRPORT_MULTIPLIER = 0.35;

/** Gate-lateness threshold τ in minutes. Internal alias of minutesLate. */
export const DEFAULT_TAU_MINUTES = 60;

/** Live / default: refuse CUTOFF when now is past scheduled departure − 4h. */
export const DEFAULT_CUTOFF_HOURS = 4;

/** Demo cutoff. Day-1 was 8h — now 6h before STD. */
export const DEMO_CUTOFF_HOURS = 6;

/**
 * Resolved cutoff used by quote / issue when callers import a number.
 * Demo is the app default (`DEMO_MODE` falls back to true) so this is 6h.
 * Prefer `cutoffHours()` when live vs demo must differ.
 */
export const CUTOFF_HOURS = DEMO_CUTOFF_HOURS;
