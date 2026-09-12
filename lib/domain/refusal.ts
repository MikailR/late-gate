import { buildFlightKey } from "@/lib/flights/flight-key";
import type { FlightQuery, FlightSnapshot, QuoteRefusal } from "@/lib/flights/types";
import { addHours, formatClock, formatDelay } from "@/lib/time";
import { CUTOFF_HOURS } from "@/lib/pricing/constants";
import type { MinutesLate } from "./types";

/**
 * Day-1 codes plus the three rails refusals.
 * On-chain `uint8` order is fixed: HOT, CUTOFF, NOT_FOUND, FULL, DUPLICATE, UNVERIFIED.
 * // status: implemented (copy + codes). Ledger write of refusals is stubbed in lib/ledger.
 */
export const REFUSAL_CODES = [
  "HOT",
  "CUTOFF",
  "NOT_FOUND",
  "FULL",
  "DUPLICATE",
  "UNVERIFIED",
] as const;

export type RefusalCode = (typeof REFUSAL_CODES)[number];

export const REFUSAL_ONCHAIN: Record<RefusalCode, number> = {
  HOT: 0,
  CUTOFF: 1,
  NOT_FOUND: 2,
  FULL: 3,
  DUPLICATE: 4,
  UNVERIFIED: 5,
};

export function isRefusalCode(value: unknown): value is RefusalCode {
  return typeof value === "string" && (REFUSAL_CODES as readonly string[]).includes(value);
}

function flightLabel(flight: FlightSnapshot): string {
  return `${flight.carrier} ${flight.flightNumber}`;
}

function withFlightKey(flight: FlightSnapshot): string {
  return buildFlightKey(
    flight.carrier,
    flight.flightNumber,
    flight.serviceDate,
    flight.origin,
  );
}

function base(tauMinutes: number): Pick<QuoteRefusal, "ok" | "tauMinutes" | "cutoffHours"> {
  return { ok: false, tauMinutes, cutoffHours: CUTOFF_HOURS };
}

/** Day-1 HOT copy. Live estimate already ≥ τ. */
export function refuseHot(flight: FlightSnapshot, tauMinutes: number): QuoteRefusal {
  const delay = formatDelay(flight.estimatedDelayMinutes);
  return {
    ...base(tauMinutes),
    refusal: "HOT",
    title: "This one is already late.",
    reason: `The live estimate has ${flightLabel(flight)} arriving ${delay} — past the ${tauMinutes}-minute gate threshold this ticket pays on.`,
    detail:
      "We only write a ticket while the delay is still an open question. Once the board already shows the miss, there is nothing left to buy.",
    flightKey: withFlightKey(flight),
    flight,
  };
}

/** Day-1 CUTOFF copy. Now is past scheduled departure − 8h. */
export function refuseCutoff(flight: FlightSnapshot, tauMinutes: number): QuoteRefusal {
  const cutoffAt = addHours(new Date(flight.scheduledDeparture), -CUTOFF_HOURS);
  return {
    ...base(tauMinutes),
    refusal: "CUTOFF",
    title: "The window is closed.",
    reason: `${flightLabel(flight)} leaves ${flight.origin} at ${formatClock(flight.scheduledDeparture, flight.timeZone)}. Tickets stop ${CUTOFF_HOURS} hours before departure — that was ${formatClock(cutoffAt.toISOString(), flight.timeZone)}.`,
    detail:
      "Come earlier next time. After the cutoff, lateness is no longer something you can still be on the right side of.",
    flightKey: withFlightKey(flight),
    flight,
  };
}

/** Day-1 NOT_FOUND copy. */
export function refuseNotFound(query: FlightQuery, tauMinutes: number): QuoteRefusal {
  const label = `${query.carrier} ${query.flightNumber}`;
  const origin = query.origin ? ` out of ${query.origin}` : "";
  return {
    ...base(tauMinutes),
    refusal: "NOT_FOUND",
    title: "That flight is not on our board.",
    reason: `No live estimate for ${label} on ${query.serviceDate}${origin}.`,
    detail:
      "Try one of the three demo flights on the home desk, or check the carrier, number, and date.",
  };
}

/** Exposure cap from the subgraph / house book. // status: implemented (copy). FULL check is TODO until Studio is live. */
export function refuseFull(flight: FlightSnapshot, tauMinutes: number, cap: number): QuoteRefusal {
  return {
    ...base(tauMinutes),
    refusal: "FULL",
    title: "This board is full.",
    reason: `The desk already carries ${cap} open tickets on ${flightLabel(flight)}. We do not write another seat on the same flight.`,
    detail: "Pick a different flight, or come back if a stub expires before departure.",
    flightKey: withFlightKey(flight),
    flight,
  };
}

/** One-human-per-flight. World nullifier × flightKey already bound. */
export function refuseDuplicate(
  flight: FlightSnapshot,
  tauMinutes: number,
  existingTicketNumber?: string,
): QuoteRefusal {
  const held = existingTicketNumber ? ` You already hold ${existingTicketNumber}.` : "";
  return {
    ...base(tauMinutes),
    refusal: "DUPLICATE",
    title: "One ticket per person per flight.",
    reason: `This flight already has a stub in your name.${held}`,
    detail:
      "The gate check is there so one person cannot take every seat on a hub that is already slipping.",
    flightKey: withFlightKey(flight),
    flight,
  };
}

/** Selfie / World proof failed or session missing. Eligibility, not a chain error. */
export function refuseUnverified(tauMinutes: MinutesLate | number, flightKey?: string): QuoteRefusal {
  return {
    ...base(tauMinutes),
    refusal: "UNVERIFIED",
    title: "Couldn't confirm it's you.",
    reason: "The gate check did not come back. Try again from your phone.",
    detail: "We only write a ticket after we know one person is buying this flight once.",
    flightKey,
  };
}

export type RefusalCopy = Pick<QuoteRefusal, "title" | "reason" | "detail">;

export const REFUSAL_COPY: Record<RefusalCode, RefusalCopy> = {
  HOT: {
    title: "This one is already late.",
    reason: "The live estimate is already past the gate threshold this ticket pays on.",
    detail:
      "We only write a ticket while the delay is still an open question. Once the board already shows the miss, there is nothing left to buy.",
  },
  CUTOFF: {
    title: "The window is closed.",
    reason: "Tickets stop eight hours before departure.",
    detail:
      "Come earlier next time. After the cutoff, lateness is no longer something you can still be on the right side of.",
  },
  NOT_FOUND: {
    title: "That flight is not on our board.",
    reason: "No live estimate for that lookup.",
    detail: "Try one of the three demo flights on the home desk, or check the carrier, number, and date.",
  },
  FULL: {
    title: "This board is full.",
    reason: "The desk carries a fixed number of open tickets per flight.",
    detail: "Pick a different flight, or come back if a stub expires before departure.",
  },
  DUPLICATE: {
    title: "One ticket per person per flight.",
    reason: "This flight already has a stub in your name.",
    detail:
      "The gate check is there so one person cannot take every seat on a hub that is already slipping.",
  },
  UNVERIFIED: {
    title: "Couldn't confirm it's you.",
    reason: "The gate check did not come back.",
    detail: "We only write a ticket after we know one person is buying this flight once.",
  },
};
