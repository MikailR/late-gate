import type { Quote } from "@/lib/domain/quote";
import type { Policy } from "@/lib/domain/policy";
import type { Hex, PolicyId } from "@/lib/domain/types";
import type { Pot } from "@/lib/domain/pot";
import type { X402ReceiptEvent } from "@/lib/domain/events";

export const QUOTE_LOCK_MS = 10 * 60 * 1000;

export type QuoteLock = {
  flightKey: string;
  quote: Quote;
  lockedAt: string;
  expiresAt: string;
};

export type HumanBinding = {
  humanKey: Hex;
  flightKey: string;
  policyId: string;
  ticketNumber: string;
  boundAt: string;
};

export type PendingX402Receipt = X402ReceiptEvent & {
  id: string;
};

/**
 * Off-chain house ledger (policies, bindings, leftover pot).
 * Redis / memory USD pot is a labeled demo fallback — not the USDC prize path.
 * Never store tinybar / HBAR here. Hedera x402 enqueue is PARKED.
 * // status: interface implemented. memory.ts is complete. redis.ts talks to Upstash when env is set.
 */
export interface Store {
  lockQuote(quote: Quote, ttlMs?: number): Promise<QuoteLock>;
  getLockedQuote(flightKey: string): Promise<QuoteLock | null>;

  getPot(ownerKey: string): Promise<Pot>;
  debitPot(ownerKey: string, cents: number, reason: string): Promise<Pot>;
  creditPot(ownerKey: string, cents: number, reason: string): Promise<Pot>;

  getHumanBinding(humanKey: Hex): Promise<HumanBinding | null>;
  putHumanBinding(binding: HumanBinding): Promise<void>;

  nextPolicyId(): Promise<PolicyId>;
  putPolicy(policy: Policy): Promise<void>;
  getPolicy(policyId: PolicyId | string): Promise<Policy | null>;
  listOpenPolicies(): Promise<Policy[]>;

  enqueueX402Receipt(receipt: PendingX402Receipt): Promise<void>;
  dequeueX402Receipts(limit: number): Promise<PendingX402Receipt[]>;
}
