import type { FlightSnapshot } from "@/lib/flights/types";
import { ticketNumberFromPolicyId } from "@/lib/domain/keys";
import { travelerStatus, type Policy } from "@/lib/domain/policy";
import type { TicketStatus } from "@/lib/domain/types";

/**
 * Day-1 local receipt id (hash of flightKey). Keep for the current stub page.
 * Issued policies use `ticketNumberFromPolicyId` → `LG-` + policyId base36.
 */
export function issueTicketNumber(flightKey: string): string {
  let hash = 0;
  for (let i = 0; i < flightKey.length; i += 1) {
    hash = (hash * 33 + flightKey.charCodeAt(i)) >>> 0;
  }
  return `LG-${hash.toString(16).toUpperCase().padStart(4, "0").slice(0, 4)}`;
}

export { ticketNumberFromPolicyId };

/** Day-1 UI: always OPEN. Rails: pass a Policy from the store / subgraph. */
export function ticketStatus(policy?: Policy | null): TicketStatus {
  if (!policy) return "OPEN";
  return travelerStatus(policy);
}

export function flightLine(flight: FlightSnapshot): string {
  return `${flight.carrier} ${flight.flightNumber}`;
}
