import type { FlightSnapshot } from "@/lib/flights/types";
import type { Configure, Outcome, StubProduct } from "./types";

export const SETTLEMENT_GRACE_MINUTES = 15;

export type Observation = {
  flightKey: string;
  product: StubProduct;
  observedDelayMinutes: number;
  tauMinutes: number;
  observedAt: string;
};

export type SettlementDecision = {
  outcome: Exclude<Outcome, "VOID">;
  observation: Observation;
  payoutCents: number;
};

/**
 * Pick the delay the product pays on. Arrival uses the Day-1 field.
 * Takeoff uses the optional departure delay; missing → 0 (will EXPIRE).
 * // status: implemented
 */
export function observedDelayForProduct(
  snapshot: FlightSnapshot,
  product: StubProduct,
): number {
  if (product === "takeoff") {
    return snapshot.estimatedTakeoffDelayMinutes ?? 0;
  }
  return snapshot.estimatedDelayMinutes;
}

export function isPastGrace(
  scheduledArrivalIso: string,
  now: Date,
  graceMinutes = SETTLEMENT_GRACE_MINUTES,
): boolean {
  const readyAt =
    new Date(scheduledArrivalIso).getTime() + graceMinutes * 60_000;
  return now.getTime() >= readyAt;
}

/**
 * Worker rule: observedDelayMinutes ≥ τ → PAID, else EXPIRED.
 * τ is configure.minutesLate. Payout is the quoted USD cents (human till).
 * // status: implemented
 */
export function decideSettlement(
  snapshot: FlightSnapshot,
  configure: Configure,
  payoutCents: number,
  now = new Date(),
): SettlementDecision {
  const observedDelayMinutes = observedDelayForProduct(snapshot, configure.product);
  const tauMinutes = configure.minutesLate;
  const outcome: Exclude<Outcome, "VOID"> =
    observedDelayMinutes >= tauMinutes ? "PAID" : "EXPIRED";

  return {
    outcome,
    payoutCents: outcome === "PAID" ? payoutCents : 0,
    observation: {
      flightKey: `${snapshot.carrier}${snapshot.flightNumber}|${snapshot.serviceDate}|${snapshot.origin}`,
      product: configure.product,
      observedDelayMinutes,
      tauMinutes,
      observedAt: now.toISOString(),
    },
  };
}
