import { decideSettlement, isPastGrace } from "@/lib/domain/observe";
import { snapshotHash } from "@/lib/domain/keys";
import { officialSnapshot } from "@/lib/oracle";
import { getFallbackPotStore, getStore } from "@/lib/store";
import { writeObservation, writeSettled } from "@/lib/ledger";
import type { Policy } from "@/lib/domain/policy";
import { demoMode } from "@/lib/config/env";
import { isUsdcLiveConfigured, payout, STUB_TRAVELER_ADDRESS } from "@/lib/usdc";
import { isAddress, type Address } from "viem";

export type TickResult = {
  scanned: number;
  settled: Policy[];
  skipped: string[];
};

/**
 * Observe OPEN policies past scheduledArrival + grace, then PAID | EXPIRED.
 * PAID credits USDC (locked prize path, stub OK). Memory pot credit is fallback only.
 * PARKED: ledger dual-write + HCS. Machine till is not involved.
 * // status: implemented against USDC stub or live vault when env is set. Memory pot = fallback.
 */
export async function settleOpenPolicies(now = new Date()): Promise<TickResult> {
  const store = getStore();
  const fallbackPot = getFallbackPotStore();
  const open = await store.listOpenPolicies();
  const settled: Policy[] = [];
  const skipped: string[] = [];

  for (const policy of open) {
    if (!isPastGrace(policy.scheduledArrival, now) && !demoMode()) {
      skipped.push(policy.ticketNumber);
      continue;
    }
    if (!isPastGrace(policy.scheduledArrival, now)) {
      skipped.push(policy.ticketNumber);
      continue;
    }

    const official = await officialSnapshot(policy.flightKey, now);
    if (!official) {
      skipped.push(policy.ticketNumber);
      continue;
    }

    const decision = decideSettlement(
      official.snapshot,
      policy.configure,
      policy.payoutCents,
      now,
    );

    const hash = official.snapshotHash ?? snapshotHash(official.snapshot);
    await writeObservation({
      kind: "ObservationPosted",
      policyId: policy.policyId.toString(),
      observedDelayMin: decision.observation.observedDelayMinutes,
      snapshotHash: hash,
      observedAt: Math.floor(now.getTime() / 1000),
    });

    const traveler: Address =
      policy.travelerAddress && isAddress(policy.travelerAddress)
        ? policy.travelerAddress
        : STUB_TRAVELER_ADDRESS;

    let usdcTx = policy.usdcTx;
    if (decision.outcome === "PAID" && decision.payoutCents > 0) {
      const credit = await payout({
        to: traveler,
        amountCents: decision.payoutCents,
        policyId: policy.policyId.toString(),
        ticketNumber: policy.ticketNumber,
      });
      if (!credit.ok && isUsdcLiveConfigured()) {
        skipped.push(policy.ticketNumber);
        continue;
      }
      if (credit.ok) {
        usdcTx = credit.txHash;
      }
      // Labeled fallback — do not credit leftover Redis USD as prize money.
      await fallbackPot.creditPot(
        policy.humanKey,
        decision.payoutCents,
        `settle-fallback:${policy.ticketNumber}`,
      );
    }

    const write = await writeSettled({
      kind: "PolicySettled",
      policyId: policy.policyId.toString(),
      outcome: decision.outcome,
      payoutCents: decision.payoutCents,
      hcsRef: "",
    });

    const next: Policy = {
      ...policy,
      status: decision.outcome,
      outcome: decision.outcome,
      snapshotHash: hash,
      observedDelayMinutes: decision.observation.observedDelayMinutes,
      settledAt: now.toISOString(),
      ledgerTx: write.txHash,
      usdcTx,
    };
    await store.putPolicy(next);
    settled.push(next);
  }

  return { scanned: open.length, settled, skipped };
}
