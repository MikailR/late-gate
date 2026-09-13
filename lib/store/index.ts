import { isHumanTillStoreConfigured } from "@/lib/config/env";
import { getMemoryStore } from "./memory";
import { createRedisStore } from "./redis";
import type { Store } from "./types";

export type { Store, QuoteLock, HumanBinding, PendingX402Receipt } from "./types";
export { QUOTE_LOCK_MS } from "./types";
export { MemoryStore, getMemoryStore } from "./memory";
export { RedisStore, createRedisStore } from "./redis";

/**
 * Memory by default. Upstash when UPSTASH_REDIS_REST_URL + TOKEN are set.
 * Store holds policies / bindings. USD pot methods are leftover fallback only —
 * prize money is `lib/usdc`, never this Redis pot.
 * // status: implemented
 */
export function getStore(): Store {
  if (isHumanTillStoreConfigured()) {
    const redis = createRedisStore();
    if (redis) return redis;
  }
  return getMemoryStore();
}

/** Labeled demo fallback pot. Never the Redis leftover as prize money. */
export function getFallbackPotStore(): Store {
  return getMemoryStore();
}
