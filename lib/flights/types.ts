export type RefusalCode = "HOT" | "CUTOFF" | "NOT_FOUND";

export type DemoKind = "clean" | "hot" | "cutoff";

export type FlightQuery = {
  carrier: string;
  flightNumber: string;
  serviceDate: string;
  origin?: string;
};

export type FlightSnapshot = {
  carrier: string;
  flightNumber: string;
  serviceDate: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  estimatedArrival: string;
  estimatedDelayMinutes: number;
  historicalDelayProb: number;
  timeZone: string;
  demoKind: DemoKind;
};

/** Aviationstack-shaped row. Day 2+ can map the live API into this. */
export type AviationstackFlight = {
  flight_date: string;
  flight_status: "scheduled" | "active" | "landed" | "cancelled" | "incident" | "diverted";
  departure: {
    iata: string;
    airport: string;
    timezone: string;
    scheduled: string;
    estimated: string | null;
  };
  arrival: {
    iata: string;
    airport: string;
    timezone: string;
    scheduled: string;
    estimated: string | null;
  };
  airline: {
    iata: string;
    name: string;
  };
  flight: {
    iata: string;
    number: string;
  };
};

export type QuoteSuccess = {
  ok: true;
  flightKey: string;
  premium: number;
  tauMinutes: number;
  maxPayout: number;
  lambda: number;
  p: number;
  currency: "USD";
  flight: FlightSnapshot;
};

export type QuoteRefusal = {
  ok: false;
  refusal: RefusalCode;
  title: string;
  reason: string;
  detail: string;
  flightKey?: string;
  tauMinutes: number;
  cutoffHours: number;
  flight?: FlightSnapshot;
};

export type QuoteResponse = QuoteSuccess | QuoteRefusal;
