import { listFixtures } from "./fixtures";
import {
  normalizeAirport,
  normalizeCarrier,
  normalizeFlightNumber,
} from "./flight-key";
import type { AviationstackFlight, FlightQuery, FlightSnapshot } from "./types";

/**
 * Fake Aviationstack layer. Swap `lookupAviationstack` for a live fetch in Day 2+.
 * No API key required on Day 1.
 */
export function lookupAviationstack(
  query: FlightQuery,
  now = new Date(),
): AviationstackFlight | null {
  const fixtures = listFixtures(now);
  const carrier = normalizeCarrier(query.carrier);
  const flightNumber = normalizeFlightNumber(query.flightNumber);
  const origin = query.origin ? normalizeAirport(query.origin) : undefined;

  const match = fixtures.find((fixture) => {
    const row = fixture.aviationstack;
    if (row.airline.iata !== carrier) return false;
    if (row.flight.number !== flightNumber) return false;
    if (row.flight_date !== query.serviceDate) return false;
    if (origin && row.departure.iata !== origin) return false;
    return true;
  });

  return match?.aviationstack ?? null;
}

export function snapshotFromAviationstack(
  row: AviationstackFlight,
  extras: Pick<FlightSnapshot, "historicalDelayProb" | "demoKind" | "originCity" | "destinationCity">,
): FlightSnapshot {
  const scheduledArrival = row.arrival.scheduled;
  const estimatedArrival = row.arrival.estimated ?? scheduledArrival;
  const delayMinutes = Math.round(
    (new Date(estimatedArrival).getTime() - new Date(scheduledArrival).getTime()) /
      60_000,
  );

  return {
    carrier: row.airline.iata,
    flightNumber: row.flight.number,
    serviceDate: row.flight_date,
    origin: row.departure.iata,
    destination: row.arrival.iata,
    originCity: extras.originCity,
    destinationCity: extras.destinationCity,
    scheduledDeparture: row.departure.scheduled,
    scheduledArrival,
    estimatedArrival,
    estimatedDelayMinutes: delayMinutes,
    historicalDelayProb: extras.historicalDelayProb,
    timeZone: row.departure.timezone,
    demoKind: extras.demoKind,
  };
}

export function lookupFlight(
  query: FlightQuery,
  now = new Date(),
): FlightSnapshot | null {
  const fixtures = listFixtures(now);
  const carrier = normalizeCarrier(query.carrier);
  const flightNumber = normalizeFlightNumber(query.flightNumber);
  const origin = query.origin ? normalizeAirport(query.origin) : undefined;

  const match = fixtures.find((fixture) => {
    const flight = fixture.snapshot;
    if (flight.carrier !== carrier) return false;
    if (flight.flightNumber !== flightNumber) return false;
    if (flight.serviceDate !== query.serviceDate) return false;
    if (origin && flight.origin !== origin) return false;
    return true;
  });

  return match?.snapshot ?? null;
}

export function lookupFlightByKey(
  flightKey: string,
  now = new Date(),
): FlightSnapshot | null {
  return listFixtures(now).find((fixture) => fixture.flightKey === flightKey)
    ?.snapshot ?? null;
}
