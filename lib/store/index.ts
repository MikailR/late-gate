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
 * // status: implemented
 */
export function getStore(): Store {
  if (isHumanTillStoreConfigured()) {
    const redis = createRedisStore();
    if (redis) return redis;
  }
  return getMemoryStore();
}
