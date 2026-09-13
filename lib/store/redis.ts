import { applyCredit, applyDebit, emptyPot, type Pot } from "@/lib/domain/pot";
import type { Quote } from "@/lib/domain/quote";
import type { Policy } from "@/lib/domain/policy";
import type { Hex, PolicyId } from "@/lib/domain/types";
import { humanTillEnv } from "@/lib/config/env";
import {
  QUOTE_LOCK_MS,
  type HumanBinding,
  type PendingX402Receipt,
  type QuoteLock,
  type Store,
} from "./types";

const PREFIX = "lg:";

type RedisResult = { result: unknown };

/**
 * Upstash REST client. Policies / bindings. Leftover USD pot keys are NOT prize money.
 * Prize till is lib/usdc (World Chain Sepolia). Never write tinybar into these keys.
 * // status: implemented against Upstash REST. Unused until UPSTASH_* env is set.
 */
async function redis(
  url: string,
  token: string,
  command: Array<string | number>,
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Upstash ${response.status}: ${await response.text()}`);
  }
  const body = (await response.json()) as RedisResult;
  return body.result;
}

function serializePolicy(policy: Policy): string {
  return JSON.stringify(policy, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

function parsePolicy(raw: string): Policy {
  const row = JSON.parse(raw) as Omit<Policy, "policyId"> & { policyId: string };
  return { ...row, policyId: BigInt(row.policyId) };
}

export class RedisStore implements Store {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private cmd(command: Array<string | number>): Promise<unknown> {
    return redis(this.url, this.token, command);
  }

  async lockQuote(quote: Quote, ttlMs = QUOTE_LOCK_MS): Promise<QuoteLock> {
    const now = Date.now();
    const lock: QuoteLock = {
      flightKey: quote.flightKey,
      quote,
      lockedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
    };
    await this.cmd([
      "SET",
      `${PREFIX}quote:${quote.flightKey}`,
      JSON.stringify(lock),
      "PX",
      ttlMs,
    ]);
    return lock;
  }

  async getLockedQuote(flightKey: string): Promise<QuoteLock | null> {
    const raw = await this.cmd(["GET", `${PREFIX}quote:${flightKey}`]);
    if (typeof raw !== "string") return null;
    const lock = JSON.parse(raw) as QuoteLock;
    if (Date.parse(lock.expiresAt) <= Date.now()) return null;
    return lock;
  }

  async getPot(ownerKey: string): Promise<Pot> {
    const raw = await this.cmd(["GET", `${PREFIX}pot:${ownerKey}`]);
    if (typeof raw !== "string") return emptyPot(ownerKey);
    return JSON.parse(raw) as Pot;
  }

  async debitPot(ownerKey: string, cents: number, reason: string): Promise<Pot> {
    const current = await this.getPot(ownerKey);
    const txn = applyDebit(current, cents, reason);
    if (!txn.ok) throw new Error(`pot debit failed: ${txn.error}`);
    await this.cmd(["SET", `${PREFIX}pot:${ownerKey}`, JSON.stringify(txn.pot)]);
    return txn.pot;
  }

  async creditPot(ownerKey: string, cents: number, reason: string): Promise<Pot> {
    const current = await this.getPot(ownerKey);
    const txn = applyCredit(current, cents, reason);
    if (!txn.ok) throw new Error(`pot credit failed: ${txn.error}`);
    await this.cmd(["SET", `${PREFIX}pot:${ownerKey}`, JSON.stringify(txn.pot)]);
    return txn.pot;
  }

  async getHumanBinding(humanKey: Hex): Promise<HumanBinding | null> {
    const raw = await this.cmd(["GET", `${PREFIX}human:${humanKey}`]);
    if (typeof raw !== "string") return null;
    return JSON.parse(raw) as HumanBinding;
  }

  async putHumanBinding(binding: HumanBinding): Promise<void> {
    await this.cmd(["SET", `${PREFIX}human:${binding.humanKey}`, JSON.stringify(binding)]);
  }

  async nextPolicyId(): Promise<PolicyId> {
    const raw = await this.cmd(["INCR", `${PREFIX}policy:seq`]);
    return BigInt(typeof raw === "number" || typeof raw === "string" ? raw : 1);
  }

  async putPolicy(policy: Policy): Promise<void> {
    const id = policy.policyId.toString();
    await this.cmd(["SET", `${PREFIX}policy:${id}`, serializePolicy(policy)]);
    if (policy.status === "OPEN") {
      await this.cmd(["SADD", `${PREFIX}policies:open`, id]);
    } else {
      await this.cmd(["SREM", `${PREFIX}policies:open`, id]);
    }
  }

  async getPolicy(policyId: PolicyId | string): Promise<Policy | null> {
    const raw = await this.cmd(["GET", `${PREFIX}policy:${policyId.toString()}`]);
    if (typeof raw !== "string") return null;
    return parsePolicy(raw);
  }

  async listOpenPolicies(): Promise<Policy[]> {
    const ids = (await this.cmd(["SMEMBERS", `${PREFIX}policies:open`])) as string[] | null;
    if (!ids?.length) return [];
    const out: Policy[] = [];
    for (const id of ids) {
      const policy = await this.getPolicy(id);
      if (policy) out.push(policy);
    }
    return out;
  }

  async enqueueX402Receipt(receipt: PendingX402Receipt): Promise<void> {
    await this.cmd(["RPUSH", `${PREFIX}x402:queue`, JSON.stringify(receipt)]);
  }

  async dequeueX402Receipts(limit: number): Promise<PendingX402Receipt[]> {
    const out: PendingX402Receipt[] = [];
    for (let i = 0; i < limit; i += 1) {
      const raw = await this.cmd(["LPOP", `${PREFIX}x402:queue`]);
      if (typeof raw !== "string") break;
      out.push(JSON.parse(raw) as PendingX402Receipt);
    }
    return out;
  }
}

export function createRedisStore(): RedisStore | null {
  const env = humanTillEnv();
  if (!env.upstashUrl || !env.upstashToken) return null;
  return new RedisStore(env.upstashUrl, env.upstashToken);
}
