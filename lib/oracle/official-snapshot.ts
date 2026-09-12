import { privateKeyToAccount } from "viem/accounts";
import { ledgerEnv } from "@/lib/config/env";
import {
  canonicalSnapshotJson,
  flightKeyHash,
  snapshotHash as hashSnapshot,
} from "@/lib/domain/keys";
import { lookupFlightByKey } from "@/lib/flights/oracle";
import type { FlightSnapshot } from "@/lib/flights/types";

export type OfficialSnapshot = {
  flightKey: string;
  flightKeyHash: `0x${string}`;
  snapshot: FlightSnapshot;
  snapshotHash: `0x${string}`;
  houseSig: string;
  observedAt: string;
};

/**
 * Same snapshot the worker will settle on. Sold via x402 on /api/oracle/snapshot.
 * // status: implemented (hash + optional house sig). Signing needs HOUSE_EVM_PRIVATE_KEY.
 */
export async function officialSnapshot(
  flightKey: string,
  now = new Date(),
): Promise<OfficialSnapshot | null> {
  const snapshot = lookupFlightByKey(flightKey, now);
  if (!snapshot) return null;

  const snapshotHash = hashSnapshot(snapshot);
  const observedAt = now.toISOString();
  const houseSig = await signSnapshot(snapshotHash, observedAt);

  return {
    flightKey,
    flightKeyHash: flightKeyHash(flightKey),
    snapshot,
    snapshotHash,
    houseSig,
    observedAt,
  };
}

async function signSnapshot(snapshotHash: `0x${string}`, observedAt: string): Promise<string> {
  const key = ledgerEnv().housePrivateKey;
  if (!key) return "stub:unsigned";
  try {
    const account = privateKeyToAccount(key as `0x${string}`);
    return account.signMessage({
      message: `${snapshotHash}:${observedAt}`,
    });
  } catch {
    return "stub:bad-house-key";
  }
}

export { canonicalSnapshotJson };
