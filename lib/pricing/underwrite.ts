/**
 * Selective underwriting. Locked π is not re-derived — this module only
 * decides whether the desk will list a stub.
 *
 * UNDERWRITE_REJECT when flight-level p_hat exceeds the listing cap for
 * (product, minutesLate). Internal τ === minutesLate.
 */

import type { FlightSnapshot } from "@/lib/flights/types";
import type { MinutesLate, StubProduct } from "@/lib/domain/types";
import { demoMode } from "@/lib/config/env";
import {
  CLEAN_DEMO_PRIOR_BY_MINUTES_LATE,
  DEFAULT_CUTOFF_HOURS,
  DEFAULT_MAX_OPEN_PER_FLIGHT,
  DEMO_CUTOFF_HOURS,
  DEMO_MAX_OPEN_PER_FLIGHT,
  P_MAX_AT_TARGET_LAMBDA,
  PAYOUT_USD_BY_MINUTES_LATE,
  PREMIUM_USD_BY_PRODUCT,
} from "./constants";

export function pMaxFor(product: StubProduct, minutesLate: MinutesLate): number {
  return P_MAX_AT_TARGET_LAMBDA[product][minutesLate];
}

export function cleanDemoPriorFor(minutesLate: MinutesLate): number {
  return CLEAN_DEMO_PRIOR_BY_MINUTES_LATE[minutesLate];
}

/**
 * Listing cap for quote-time UNDERWRITE_REJECT.
 *
 * Spec: refuse when p_hat > p_max(product, minutesLate) at TARGET_LAMBDA.
 * Arrival clean_demo_prior (0.08 / 0.05 / 0.035) sits slightly above arrival
 * p_max (0.0621 / 0.0414 / 0.0310) but house EV is still positive — that
 * approved prior is what the FOMO demo lists. Cap is therefore
 * max(p_max, clean_demo_prior) so UA472 still quotes and pool-average rejects.
 */
export function underwriteCap(product: StubProduct, minutesLate: MinutesLate): number {
  return Math.max(pMaxFor(product, minutesLate), cleanDemoPriorFor(minutesLate));
}

/** Flight-level p_hat for the chosen minutesLate. Single-p snapshots fall back. */
export function pHatFor(flight: FlightSnapshot, minutesLate: MinutesLate): number {
  const byTau = flight.historicalDelayProbByMinutesLate;
  if (byTau && typeof byTau[minutesLate] === "number") {
    return byTau[minutesLate];
  }
  return flight.historicalDelayProb;
}

export function exceedsUnderwriteCap(
  pHat: number,
  product: StubProduct,
  minutesLate: MinutesLate,
): boolean {
  return pHat > underwriteCap(product, minutesLate);
}

/** House EV in USD: π − p_hat × B. Display / test helper, not a re-price. */
export function houseEvUsd(
  product: StubProduct,
  minutesLate: MinutesLate,
  pHat: number,
): number {
  return PREMIUM_USD_BY_PRODUCT[product] - pHat * PAYOUT_USD_BY_MINUTES_LATE[minutesLate];
}

/** Demo 6h (Day-1 was 8h). Live default 4h. */
export function cutoffHours(demo = demoMode()): number {
  return demo ? DEMO_CUTOFF_HOURS : DEFAULT_CUTOFF_HOURS;
}

/** Demo 5 stubs. Live default 10. Env HOUSE_MAX_OPEN_PER_FLIGHT overrides. */
export function defaultMaxOpenPerFlight(demo = demoMode()): number {
  return demo ? DEMO_MAX_OPEN_PER_FLIGHT : DEFAULT_MAX_OPEN_PER_FLIGHT;
}
