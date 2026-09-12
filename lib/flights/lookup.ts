import { buildFlightKey } from "./flight-key";
import { lookupFlight } from "./oracle";
import type { FlightQuery, FlightSnapshot } from "./types";
import { aviationstackKey, flightDataMode } from "@/lib/config/env";
import type { FlightDataMode, FlightLookup, FlightLookupResult } from "@/lib/domain/types";
import { refuseNotFound } from "@/lib/domain/refusal";

/**
 * Demo vs live flight lookup.
 * Demo: Day-1 fixtures. Live: Aviationstack (TODO — key missing → NOT_FOUND).
 * // status: demo implemented; live is TODO until AVIATIONSTACK_KEY is set.
 */
export async function lookupSnapshot(
  lookup: FlightLookup,
  now = new Date(),
): Promise<FlightLookupResult> {
  const mode: FlightDataMode = lookup.mode ?? flightDataMode();

  if (mode === "live") {
    const live = await lookupLive(lookup.query, now);
    if (live) {
      return {
        ok: true,
        mode: "live",
        snapshot: live,
        flightKey: buildFlightKey(
          live.carrier,
          live.flightNumber,
          live.serviceDate,
          live.origin,
        ),
      };
    }
    const refusal = refuseNotFound(lookup.query, 60);
    return {
      ok: false,
      mode: "live",
      refusal: "NOT_FOUND",
      title: refusal.title,
      reason: aviationstackKey()
        ? refusal.reason
        : "Live flight data is not configured. Set AVIATIONSTACK_KEY or use FLIGHT_DATA_MODE=demo.",
      detail: refusal.detail,
    };
  }

  const snapshot = lookupFlight(lookup.query, now);
  if (!snapshot) {
    const refusal = refuseNotFound(lookup.query, 60);
    return {
      ok: false,
      mode: "demo",
      refusal: "NOT_FOUND",
      title: refusal.title,
      reason: refusal.reason,
      detail: refusal.detail,
    };
  }

  return {
    ok: true,
    mode: "demo",
    snapshot,
    flightKey: buildFlightKey(
      snapshot.carrier,
      snapshot.flightNumber,
      snapshot.serviceDate,
      snapshot.origin,
    ),
  };
}

/** // status: TODO — replace with a real Aviationstack fetch when the key lands. */
async function lookupLive(
  _query: FlightQuery,
  _now: Date,
): Promise<FlightSnapshot | null> {
  if (!aviationstackKey()) return null;
  return null;
}

export function defaultLookup(query: FlightQuery): FlightLookup {
  return { query, mode: flightDataMode() };
}
