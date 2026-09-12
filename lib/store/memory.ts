import { applyCredit, applyDebit, emptyPot, type Pot } from "@/lib/domain/pot";
import type { Quote } from "@/lib/domain/quote";
import type { Policy } from "@/lib/domain/policy";
import type { Hex, PolicyId } from "@/lib/domain/types";
import {
  QUOTE_LOCK_MS,
  type HumanBinding,
  type PendingX402Receipt,
  type QuoteLock,
  type Store,
} from "./types";

const globalStore = globalThis as unknown as {
  __lateGateMemory?: MemoryStore;
};

/** In-process store for local dev. Survives HMR via globalThis. // status: implemented */
export class MemoryStore implements Store {
  private quotes = new Map<string, QuoteLock>();
  private pots = new Map<string, Pot>();
  private humans = new Map<string, HumanBinding>();
  private policies = new Map<string, Policy>();
  private x402: PendingX402Receipt[] = [];
  private policySeq = 1n;

  async lockQuote(quote: Quote, ttlMs = QUOTE_LOCK_MS): Promise<QuoteLock> {
    const now = Date.now();
    const lock: QuoteLock = {
      flightKey: quote.flightKey,
      quote,
      lockedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
    };
    this.quotes.set(quote.flightKey, lock);
    return lock;
  }

  async getLockedQuote(flightKey: string): Promise<QuoteLock | null> {
    const lock = this.quotes.get(flightKey);
    if (!lock) return null;
    if (Date.parse(lock.expiresAt) <= Date.now()) {
      this.quotes.delete(flightKey);
      return null;
    }
    return lock;
  }

  async getPot(ownerKey: string): Promise<Pot> {
    return this.pots.get(ownerKey) ?? emptyPot(ownerKey);
  }

  async debitPot(ownerKey: string, cents: number, reason: string): Promise<Pot> {
    const current = await this.getPot(ownerKey);
    const txn = applyDebit(current, cents, reason);
    if (!txn.ok) {
      throw new Error(`pot debit failed: ${txn.error}`);
    }
    this.pots.set(ownerKey, txn.pot);
    return txn.pot;
  }

  async creditPot(ownerKey: string, cents: number, reason: string): Promise<Pot> {
    const current = await this.getPot(ownerKey);
    const txn = applyCredit(current, cents, reason);
    if (!txn.ok) {
      throw new Error(`pot credit failed: ${txn.error}`);
    }
    this.pots.set(ownerKey, txn.pot);
    return txn.pot;
  }

  async getHumanBinding(humanKey: Hex): Promise<HumanBinding | null> {
    return this.humans.get(humanKey) ?? null;
  }

  async putHumanBinding(binding: HumanBinding): Promise<void> {
    this.humans.set(binding.humanKey, binding);
  }

  async nextPolicyId(): Promise<PolicyId> {
    const id = this.policySeq;
    this.policySeq += 1n;
    return id;
  }

  async putPolicy(policy: Policy): Promise<void> {
    this.policies.set(policy.policyId.toString(), policy);
  }

  async getPolicy(policyId: PolicyId | string): Promise<Policy | null> {
    return this.policies.get(policyId.toString()) ?? null;
  }

  async listOpenPolicies(): Promise<Policy[]> {
    return [...this.policies.values()].filter((policy) => policy.status === "OPEN");
  }

  async enqueueX402Receipt(receipt: PendingX402Receipt): Promise<void> {
    this.x402.push(receipt);
  }

  async dequeueX402Receipts(limit: number): Promise<PendingX402Receipt[]> {
    return this.x402.splice(0, limit);
  }
}

export function getMemoryStore(): MemoryStore {
  if (!globalStore.__lateGateMemory) {
    globalStore.__lateGateMemory = new MemoryStore();
  }
  return globalStore.__lateGateMemory;
}
