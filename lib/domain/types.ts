/**
 * Shared product types for Late Gate rails.
 * Extracted from Day-1 `lib/flights/types.ts` and extended in place —
 * this is the same ticket, not a second model.
 *
 * Traveler-facing copy never says insurance, bet, prediction, or gamble.
 * τ lives only as `tauMinutes` on internal Quote / Policy objects.
 */

import type { FlightQuery, FlightSnapshot } from "@/lib/flights/types";

/** Demo fixtures vs live Aviationstack. Lookup path, not a UI chrome change. */
export type FlightDataMode = "demo" | "live";

export type FlightLookup = {
  query: FlightQuery;
  mode: FlightDataMode;
};

export type FlightLookupResult =
  | { ok: true; mode: FlightDataMode; snapshot: FlightSnapshot; flightKey: string }
  | {
      ok: false;
      mode: FlightDataMode;
      refusal: "NOT_FOUND";
      title: string;
      reason: string;
      detail: string;
    };

/** Takeoff delay and arrival delay are the only two products. */
export type StubProduct = "takeoff" | "arrival";

/** UI-facing lateness threshold. Never expose raw τ under another name. */
export type MinutesLate = 30 | 45 | 60;

export const MINUTES_LATE_OPTIONS: readonly MinutesLate[] = [30, 45, 60];

export type Configure = {
  product: StubProduct;
  minutesLate: MinutesLate;
};

export const DEFAULT_CONFIGURE: Configure = {
  product: "arrival",
  minutesLate: 60,
};

export function isMinutesLate(value: unknown): value is MinutesLate {
  return value === 30 || value === 45 || value === 60;
}

export function isStubProduct(value: unknown): value is StubProduct {
  return value === "takeoff" || value === "arrival";
}

/**
 * Traveler-facing ticket states. NOT ISSUED is a refusal, not a Policy row.
 * On-chain Outcome uses PAID | EXPIRED | VOID only.
 */
export type TicketStatus = "NOT_ISSUED" | "OPEN" | "PAID" | "EXPIRED";

export type PolicyStatus = "OPEN" | "PAID" | "EXPIRED" | "VOID";

export type Outcome = "PAID" | "EXPIRED" | "VOID";

export const OUTCOME_ONCHAIN = {
  PAID: 1,
  EXPIRED: 2,
  VOID: 3,
} as const;

export type Hex = `0x${string}`;

export type PolicyId = bigint;

export type HumanKey = Hex;
export type FlightKeyHash = Hex;
export type SnapshotHash = Hex;
