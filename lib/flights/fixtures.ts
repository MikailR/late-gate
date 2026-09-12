import { addHours, formatServiceDate, minutesBetween } from "@/lib/time";
import { buildFlightKey } from "./flight-key";
import type { AviationstackFlight, DemoKind, FlightSnapshot } from "./types";

type FixtureSeed = {
  kind: DemoKind;
  carrier: string;
  airlineName: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  timeZone: string;
  /** Hours from `now` to scheduled departure. */
  departInHours: number;
  blockHours: number;
  estimatedDelayMinutes: number;
  historicalDelayProb: number;
  status: AviationstackFlight["flight_status"];
};

/**
 * Three live-demo fixtures. Times are offset from `now` so the HOT / CUTOFF /
 * clean paths stay true throughout ETHOnline — keys therefore include the
 * computed service date (e.g. `UA472|2026-09-12|EWR` on Day 1).
 */
const SEEDS: FixtureSeed[] = [
  {
    kind: "clean",
    carrier: "UA",
    airlineName: "United Airlines",
    flightNumber: "472",
    origin: "EWR",
    originCity: "Newark",
    destination: "SFO",
    destinationCity: "San Francisco",
    timeZone: "America/New_York",
    departInHours: 7 * 24 + 8,
    blockHours: 6.25,
    estimatedDelayMinutes: 8,
    historicalDelayProb: 0.07,
    status: "scheduled",
  },
  {
    kind: "hot",
    carrier: "B6",
    airlineName: "JetBlue",
    flightNumber: "148",
    origin: "BOS",
    originCity: "Boston",
    destination: "MCO",
    destinationCity: "Orlando",
    timeZone: "America/New_York",
    departInHours: 3 * 24 + 12,
    blockHours: 3.4,
    estimatedDelayMinutes: 95,
    historicalDelayProb: 0.41,
    status: "scheduled",
  },
  {
    kind: "cutoff",
    carrier: "AA",
    airlineName: "American Airlines",
    flightNumber: "100",
    origin: "JFK",
    originCity: "New York",
    destination: "LAX",
    destinationCity: "Los Angeles",
    timeZone: "America/New_York",
    departInHours: 2,
    blockHours: 6.1,
    estimatedDelayMinutes: 6,
    historicalDelayProb: 0.12,
    status: "scheduled",
  },
];

export type HydratedFixture = {
  kind: DemoKind;
  flightKey: string;
  snapshot: FlightSnapshot;
  aviationstack: AviationstackFlight;
};

function hydrate(seed: FixtureSeed, now: Date): HydratedFixture {
  const departure = addHours(now, seed.departInHours);
  const arrival = addHours(departure, seed.blockHours);
  const estimatedArrival = addHours(arrival, seed.estimatedDelayMinutes / 60);
  const serviceDate = formatServiceDate(departure, seed.timeZone);
  const flightKey = buildFlightKey(
    seed.carrier,
    seed.flightNumber,
    serviceDate,
    seed.origin,
  );

  const snapshot: FlightSnapshot = {
    carrier: seed.carrier,
    flightNumber: seed.flightNumber,
    serviceDate,
    origin: seed.origin,
    destination: seed.destination,
    originCity: seed.originCity,
    destinationCity: seed.destinationCity,
    scheduledDeparture: departure.toISOString(),
    scheduledArrival: arrival.toISOString(),
    estimatedArrival: estimatedArrival.toISOString(),
    estimatedDelayMinutes: minutesBetween(
      estimatedArrival.toISOString(),
      arrival.toISOString(),
    ),
    historicalDelayProb: seed.historicalDelayProb,
    timeZone: seed.timeZone,
    demoKind: seed.kind,
  };

  const aviationstack: AviationstackFlight = {
    flight_date: serviceDate,
    flight_status: seed.status,
    departure: {
      iata: seed.origin,
      airport: seed.originCity,
      timezone: seed.timeZone,
      scheduled: departure.toISOString(),
      estimated: departure.toISOString(),
    },
    arrival: {
      iata: seed.destination,
      airport: seed.destinationCity,
      timezone: seed.timeZone,
      scheduled: arrival.toISOString(),
      estimated: estimatedArrival.toISOString(),
    },
    airline: {
      iata: seed.carrier,
      name: seed.airlineName,
    },
    flight: {
      iata: `${seed.carrier}${seed.flightNumber}`,
      number: seed.flightNumber,
    },
  };

  return { kind: seed.kind, flightKey, snapshot, aviationstack };
}

export function listFixtures(now = new Date()): HydratedFixture[] {
  return SEEDS.map((seed) => hydrate(seed, now));
}

export function getFixtureByKind(
  kind: DemoKind,
  now = new Date(),
): HydratedFixture {
  return hydrate(SEEDS.find((seed) => seed.kind === kind) ?? SEEDS[0], now);
}
