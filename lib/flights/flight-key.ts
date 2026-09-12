import type { FlightQuery } from "./types";

/** `carrier + flightNumber + serviceDate + origin` → `UA472|2026-09-12|EWR` */
export function buildFlightKey(
  carrier: string,
  flightNumber: string,
  serviceDate: string,
  origin: string,
): string {
  return `${normalizeCarrier(carrier)}${normalizeFlightNumber(flightNumber)}|${serviceDate}|${normalizeAirport(origin)}`;
}

export function parseFlightKey(flightKey: string): {
  carrier: string;
  flightNumber: string;
  serviceDate: string;
  origin: string;
} | null {
  const parts = flightKey.trim().toUpperCase().split("|");
  if (parts.length !== 3) return null;
  const [head, serviceDate, origin] = parts;
  const match = head.match(/^([A-Z][A-Z0-9])(\d{1,4})$/);
  if (!match || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !/^[A-Z]{3}$/.test(origin)) {
    return null;
  }
  return {
    carrier: match[1],
    flightNumber: match[2],
    serviceDate,
    origin,
  };
}

export function normalizeCarrier(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2);
}

export function normalizeFlightNumber(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(/^0+/, "") || value.trim();
}

export function normalizeAirport(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

export function toFlightQuery(input: {
  carrier?: string;
  flightNumber?: string;
  date?: string;
  serviceDate?: string;
  origin?: string;
}): FlightQuery | null {
  const carrier = normalizeCarrier(input.carrier ?? "");
  const flightNumber = normalizeFlightNumber(input.flightNumber ?? "");
  const serviceDate = (input.date ?? input.serviceDate ?? "").trim();
  const originRaw = (input.origin ?? "").trim();
  const origin = originRaw ? normalizeAirport(originRaw) : undefined;

  if (!/^[A-Z][A-Z0-9]$/.test(carrier)) return null;
  if (!/^\d{1,4}$/.test(flightNumber)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) return null;
  if (origin && origin.length !== 3) return null;

  return { carrier, flightNumber, serviceDate, origin };
}
