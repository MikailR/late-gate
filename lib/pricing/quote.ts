import { lookupFlight } from "@/lib/flights/oracle";
import { buildFlightKey } from "@/lib/flights/flight-key";
import type {
  FlightQuery,
  FlightSnapshot,
  QuoteRefusal,
  QuoteResponse,
} from "@/lib/flights/types";
import { addHours, formatClock, formatDelay } from "@/lib/time";
import { roundCents } from "@/lib/money";
import {
  CUTOFF_HOURS,
  DEFAULT_PAYOUT_USD,
  DEFAULT_TAU_MINUTES,
  LAMBDA,
} from "./constants";

export type QuoteInput = FlightQuery & {
  tauMinutes?: number;
  maxPayout?: number;
};

function flightLabel(flight: FlightSnapshot): string {
  return `${flight.carrier} ${flight.flightNumber}`;
}

function refuseHot(flight: FlightSnapshot, tauMinutes: number): QuoteRefusal {
  const delay = formatDelay(flight.estimatedDelayMinutes);
  return {
    ok: false,
    refusal: "HOT",
    title: "This one is already late.",
    reason: `The live estimate has ${flightLabel(flight)} arriving ${delay} — past the ${tauMinutes}-minute gate threshold this ticket pays on.`,
    detail:
      "We only write a ticket while the delay is still an open question. Once the board already shows the miss, there is nothing left to buy.",
    flightKey: buildFlightKey(
      flight.carrier,
      flight.flightNumber,
      flight.serviceDate,
      flight.origin,
    ),
    tauMinutes,
    cutoffHours: CUTOFF_HOURS,
    flight,
  };
}

function refuseCutoff(flight: FlightSnapshot, tauMinutes: number): QuoteRefusal {
  const cutoffAt = addHours(new Date(flight.scheduledDeparture), -CUTOFF_HOURS);
  return {
    ok: false,
    refusal: "CUTOFF",
    title: "The window is closed.",
    reason: `${flightLabel(flight)} leaves ${flight.origin} at ${formatClock(flight.scheduledDeparture, flight.timeZone)}. Tickets stop ${CUTOFF_HOURS} hours before departure — that was ${formatClock(cutoffAt.toISOString(), flight.timeZone)}.`,
    detail:
      "Come earlier next time. After the cutoff, lateness is no longer something you can still be on the right side of.",
    flightKey: buildFlightKey(
      flight.carrier,
      flight.flightNumber,
      flight.serviceDate,
      flight.origin,
    ),
    tauMinutes,
    cutoffHours: CUTOFF_HOURS,
    flight,
  };
}

function refuseNotFound(query: FlightQuery, tauMinutes: number): QuoteRefusal {
  const label = `${query.carrier} ${query.flightNumber}`;
  const origin = query.origin ? ` out of ${query.origin}` : "";
  return {
    ok: false,
    refusal: "NOT_FOUND",
    title: "That flight is not on our board.",
    reason: `No live estimate for ${label} on ${query.serviceDate}${origin}.`,
    detail:
      "Try one of the three demo flights on the home desk, or check the carrier, number, and date.",
    tauMinutes,
    cutoffHours: CUTOFF_HOURS,
  };
}

/**
 * Fair premium π = p * B * (1 + λ).
 * Day 2: this number becomes the x402 charge into a Hedera escrow.
 */
export function pricePremium(p: number, maxPayout: number, lambda = LAMBDA): number {
  return roundCents(p * maxPayout * (1 + lambda));
}

export function quoteFlight(input: QuoteInput, now = new Date()): QuoteResponse {
  const tauMinutes = input.tauMinutes ?? DEFAULT_TAU_MINUTES;
  const maxPayout = input.maxPayout ?? DEFAULT_PAYOUT_USD;
  const flight = lookupFlight(input, now);

  if (!flight) {
    return refuseNotFound(input, tauMinutes);
  }

  // HOT first so the "already a mess" fixture stays HOT even after its own cutoff.
  if (flight.estimatedDelayMinutes >= tauMinutes) {
    return refuseHot(flight, tauMinutes);
  }

  const cutoffAt = addHours(new Date(flight.scheduledDeparture), -CUTOFF_HOURS);
  if (now.getTime() >= cutoffAt.getTime()) {
    return refuseCutoff(flight, tauMinutes);
  }

  // Day 2: persist this quote as a Hedera escrow keyed by flightKey;
  // collect `premium` via x402; index OPEN on The Graph.
  return {
    ok: true,
    flightKey: buildFlightKey(
      flight.carrier,
      flight.flightNumber,
      flight.serviceDate,
      flight.origin,
    ),
    premium: pricePremium(flight.historicalDelayProb, maxPayout),
    tauMinutes,
    maxPayout,
    lambda: LAMBDA,
    p: flight.historicalDelayProb,
    currency: "USD",
    flight,
  };
}
