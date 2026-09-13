import { concat, keccak256, pad, stringToBytes, toBytes, toHex } from "viem";
import type { FlightSnapshot } from "@/lib/flights/types";
import type { FlightKeyHash, Hex, HumanKey, PolicyId, SnapshotHash } from "./types";

/** `UA837|2026-09-19|SFO` → indexed topic. // status: implemented */
export function flightKeyHash(flightKey: string): FlightKeyHash {
  return keccak256(toBytes(flightKey));
}

/**
 * One-human-per-flight key. Raw nullifier never leaves the server.
 * humanKey = keccak256(nullifier_be32 ‖ utf8(flightKey))
 * // status: implemented
 */
export function humanKeyFromNullifier(nullifier: bigint | string, flightKey: string): HumanKey {
  const asBigInt = typeof nullifier === "bigint" ? nullifier : BigInt(nullifier);
  const be32 = pad(toHex(asBigInt), { size: 32 });
  return keccak256(concat([be32, toHex(stringToBytes(flightKey))]));
}

/** Canonical JSON: sorted keys. Demo-only prior tables omitted so demo/live hash the same facts. */
export function canonicalSnapshotJson(snapshot: FlightSnapshot): string {
  const {
    demoKind: _demoKind,
    historicalDelayProbByMinutesLate: _priors,
    ...rest
  } = snapshot;
  const keys = Object.keys(rest).sort();
  const ordered: Record<string, unknown> = {};
  for (const key of keys) {
    ordered[key] = rest[key as keyof typeof rest];
  }
  return JSON.stringify(ordered);
}

/** snapshotHash = keccak256(canonicalJSON(FlightSnapshot without demoKind)). // status: implemented */
export function snapshotHash(snapshot: FlightSnapshot): SnapshotHash {
  return keccak256(stringToBytes(canonicalSnapshotJson(snapshot)));
}

/** Display ticket number from the ledger policy id. Day-1 hash id stays in lib/ticket.ts for the current stub. */
export function ticketNumberFromPolicyId(policyId: PolicyId | number | string): string {
  const value = typeof policyId === "bigint" ? policyId : BigInt(policyId);
  return `LG-${value.toString(36).toUpperCase()}`;
}

export function parsePolicyId(value: string): PolicyId | null {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return BigInt(trimmed);
  const fromTicket = trimmed.replace(/^LG-/i, "");
  if (/^[0-9A-Z]+$/i.test(fromTicket)) {
    try {
      return BigInt(parseInt(fromTicket, 36));
    } catch {
      return null;
    }
  }
  return null;
}

export function asHex(value: string): Hex {
  return (value.startsWith("0x") ? value : `0x${value}`) as Hex;
}
