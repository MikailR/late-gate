import { lookupFlight } from "@/lib/flights/oracle";
import { buildFlightKey } from "@/lib/flights/flight-key";
import type {
  FlightQuery,
  FlightSnapshot,
  QuoteRefusal,
  QuoteResponse,
  QuoteSuccess,
} from "@/lib/flights/types";
import { addHours } from "@/lib/time";
import { dollarsToCents } from "@/lib/domain/pot";
import {
  CUTOFF_HOURS,
  LAMBDA,
  payoutUsdForMinutesLate,
  premiumUsdForProduct,
} from "@/lib/pricing/constants";
import {
  refuseCutoff,
  refuseFull,
  refuseHot,
  refuseNotFound,
} from "./refusal";
import {
  DEFAULT_CONFIGURE,
  type Configure,
  type MinutesLate,
  type StubProduct,
} from "./types";

/**
 * House book snapshot used for the FULL refusal.
 * // status: TODO — wire from subgraph Flight.openCount. Callers may pass a stub count.
 */
export type HouseBook = {
  openCount: number;
  maxOpenPerFlight: number;
};

export type QuoteInput = FlightQuery & {
  /** @deprecated internal τ. Prefer `minutesLate`. Kept so Day-1 query strings still parse. */
  tauMinutes?: number;
  minutesLate?: MinutesLate;
  product?: StubProduct;
  /**
   * @deprecated ignored. Premium is the locked product dollar; payout comes from `minutesLate`.
   * Kept so Day-1 `?payout=` still parses.
   */
  maxPayout?: number;
  book?: HouseBook;
};

export type Quote = QuoteSuccess & {
  product: StubProduct;
  configure: Configure;
  premiumCents: number;
  payoutCents: number;
};

export type DomainQuoteResponse = Quote | QuoteRefusal;

function delayMinutesForProduct(flight: FlightSnapshot, product: StubProduct): number {
  if (product === "takeoff") {
    return flight.estimatedTakeoffDelayMinutes ?? 0;
  }
  return flight.estimatedDelayMinutes;
}

function resolveConfigure(input: QuoteInput): Configure {
  const product = input.product ?? DEFAULT_CONFIGURE.product;
  if (input.minutesLate) return { product, minutesLate: input.minutesLate };
  if (input.tauMinutes === 30 || input.tauMinutes === 45 || input.tauMinutes === 60) {
    return { product, minutesLate: input.tauMinutes };
  }
  return { product, minutesLate: DEFAULT_CONFIGURE.minutesLate };
}

/**
 * Locked premium for a product. minutesLate does not change this number.
 * `p` / λ stay on the quote for risk copy only — do not re-derive dollars from them.
 */
export function pricePremium(product: StubProduct): number {
  return premiumUsdForProduct(product);
}

/** Re-export so the UI rebuild can show locked dollars without re-quoting. */
export {
  PAYOUT_USD_BY_MINUTES_LATE,
  PREMIUM_USD_BY_PRODUCT,
  payoutUsdForMinutesLate,
  premiumUsdForProduct,
} from "@/lib/pricing/constants";

/**
 * Pure quote against an already-loaded snapshot.
 * Order is locked: NOT_FOUND (caller) → HOT → CUTOFF → FULL → quote.
 * Human till only — premium is USD. Do not send this number to the HBAR machine till.
 * // status: implemented
 */
export function quoteSnapshot(
  flight: FlightSnapshot,
  input: QuoteInput,
  now = new Date(),
): DomainQuoteResponse {
  const configure = resolveConfigure(input);
  const tauMinutes = configure.minutesLate;
  const delay = delayMinutesForProduct(flight, configure.product);

  // HOT first so the "already a mess" fixture stays HOT even after its own cutoff.
  // Compare live delay to the chosen minutesLate — threshold only, not the money.
  if (delay >= tauMinutes) {
    return refuseHot(flight, tauMinutes);
  }

  const cutoffAt = addHours(new Date(flight.scheduledDeparture), -CUTOFF_HOURS);
  if (now.getTime() >= cutoffAt.getTime()) {
    return refuseCutoff(flight, tauMinutes);
  }

  if (input.book && input.book.openCount >= input.book.maxOpenPerFlight) {
    return refuseFull(flight, tauMinutes, input.book.maxOpenPerFlight);
  }

  // Locked dollars: product → premium, minutesLate → payout. p is display-only.
  const premium = pricePremium(configure.product);
  const maxPayout = payoutUsdForMinutesLate(configure.minutesLate);
  const flightKey = buildFlightKey(
    flight.carrier,
    flight.flightNumber,
    flight.serviceDate,
    flight.origin,
  );

  return {
    ok: true,
    flightKey,
    premium,
    tauMinutes,
    maxPayout,
    lambda: LAMBDA,
    p: flight.historicalDelayProb,
    currency: "USD",
    flight,
    product: configure.product,
    configure,
    premiumCents: dollarsToCents(premium),
    payoutCents: dollarsToCents(maxPayout),
  };
}

/**
 * Day-1 entry: lookup fixture (or live wrapper) then quote.
 * Dual-write plan (do not mix tills):
 *   - lock this quote 10 minutes in lib/store (USD, human till)
 *   - later: PolicyOpened on Base Sepolia + optional HCS
 *   - never charge HBAR for a traveler ticket
 * // status: implemented (lookup + quote). Quote lock + FULL book are TODO at the route.
 */
export function quoteFlight(input: QuoteInput, now = new Date()): DomainQuoteResponse {
  const configure = resolveConfigure(input);
  const flight = lookupFlight(input, now);
  if (!flight) {
    return refuseNotFound(input, configure.minutesLate);
  }
  return quoteSnapshot(flight, input, now);
}
