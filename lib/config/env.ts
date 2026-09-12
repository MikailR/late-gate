/**
 * Env grouping. Machine till (HBAR) and human till (USD pot) stay separate.
 * Never reuse a Hedera key as a pot credential or the reverse.
 */

import {
  DEFAULT_MAX_OPEN_PER_FLIGHT,
  DEMO_MAX_OPEN_PER_FLIGHT,
} from "@/lib/pricing/constants";

export type FlightDataMode = "demo" | "live";

function read(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return undefined;
  return value.trim();
}

function flag(name: string, fallback = false): boolean {
  const value = read(name);
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

export function flightDataMode(): FlightDataMode {
  return read("FLIGHT_DATA_MODE") === "live" ? "live" : "demo";
}

export function aviationstackKey(): string | undefined {
  return read("AVIATIONSTACK_KEY");
}

/** Human till — USD pot in Redis / Upstash. Not HBAR. */
export type HumanTillEnv = {
  upstashUrl?: string;
  upstashToken?: string;
  demoGrantCents: number;
  houseMaxOpenPerFlight: number;
};

export function humanTillEnv(): HumanTillEnv {
  const grant = Number(read("DEMO_POT_GRANT_CENTS") ?? "5000");
  const demo = flag("DEMO_MODE", true);
  const fallback = demo ? DEMO_MAX_OPEN_PER_FLIGHT : DEFAULT_MAX_OPEN_PER_FLIGHT;
  const cap = Number(read("HOUSE_MAX_OPEN_PER_FLIGHT") ?? String(fallback));
  return {
    upstashUrl: read("UPSTASH_REDIS_REST_URL"),
    upstashToken: read("UPSTASH_REDIS_REST_TOKEN"),
    demoGrantCents: Number.isFinite(grant) && grant > 0 ? Math.round(grant) : 5_000,
    houseMaxOpenPerFlight: Number.isFinite(cap) && cap > 0 ? Math.round(cap) : fallback,
  };
}

export function isHumanTillStoreConfigured(): boolean {
  const env = humanTillEnv();
  return Boolean(env.upstashUrl && env.upstashToken);
}

/** Machine till — HBAR via Blocky402. Not USD. */
export type MachineTillEnv = {
  blocky402Url: string;
  houseAccountId?: string;
  housePrivateKey?: string;
  hcsTopicId?: string;
  agentAccountId?: string;
  agentPrivateKey?: string;
  snapshotPriceTinybar: bigint;
  receiptPriceTinybar: bigint;
};

export function machineTillEnv(): MachineTillEnv {
  const snapshot = Number(read("X402_SNAPSHOT_TINYBAR") ?? "100000");
  const receipt = Number(read("X402_RECEIPT_TINYBAR") ?? "500000");
  return {
    blocky402Url: read("BLOCKY402_URL") ?? "https://api.testnet.blocky402.com",
    houseAccountId: read("HOUSE_HEDERA_ACCOUNT_ID"),
    housePrivateKey: read("HOUSE_HEDERA_PRIVATE_KEY"),
    hcsTopicId: read("HCS_TOPIC_ID"),
    agentAccountId: read("AGENT_HEDERA_ACCOUNT_ID"),
    agentPrivateKey: read("AGENT_HEDERA_PRIVATE_KEY"),
    snapshotPriceTinybar: BigInt(Number.isFinite(snapshot) ? snapshot : 100_000),
    receiptPriceTinybar: BigInt(Number.isFinite(receipt) ? receipt : 500_000),
  };
}

export function isMachineTillConfigured(): boolean {
  const env = machineTillEnv();
  return Boolean(env.houseAccountId && env.housePrivateKey);
}

export type WorldEnv = {
  appId?: string;
  rpId?: string;
  signingKey?: string;
  action: string;
  environment: "sandbox" | "staging";
  sessionSecret?: string;
  /** selfieCheckLegacy when TFH enables the flag; orbLegacy until then. */
  preset: "orbLegacy" | "selfieCheckLegacy";
};

export function worldEnv(): WorldEnv {
  const rawPreset = read("WORLD_PRESET");
  return {
    appId: read("NEXT_PUBLIC_WORLD_APP_ID") ?? read("WORLD_APP_ID"),
    rpId: read("NEXT_PUBLIC_WORLD_RP_ID") ?? read("WORLD_RP_ID"),
    signingKey: read("WORLD_RP_SIGNING_KEY"),
    action: read("WORLD_ACTION") ?? "late-gate-ticket",
    environment: read("WORLD_ENV") === "staging" ? "staging" : "sandbox",
    sessionSecret: read("WORLD_SESSION_SECRET"),
    preset: rawPreset === "selfieCheckLegacy" ? "selfieCheckLegacy" : "orbLegacy",
  };
}

export function isWorldConfigured(): boolean {
  const env = worldEnv();
  return Boolean(env.appId && env.rpId);
}

export type LedgerEnv = {
  rpcUrl: string;
  housePrivateKey?: string;
  ledgerAddress?: string;
  subgraphUrl?: string;
  graphApiKey?: string;
};

export function ledgerEnv(): LedgerEnv {
  return {
    rpcUrl: read("BASE_SEPOLIA_RPC_URL") ?? "https://sepolia.base.org",
    housePrivateKey: read("HOUSE_EVM_PRIVATE_KEY"),
    ledgerAddress: read("LEDGER_ADDRESS"),
    subgraphUrl: read("SUBGRAPH_URL"),
    graphApiKey: read("GRAPH_API_KEY"),
  };
}

export function isLedgerConfigured(): boolean {
  const env = ledgerEnv();
  return Boolean(env.housePrivateKey && env.ledgerAddress);
}

export function baseUrl(): string {
  return read("BASE_URL") ?? "http://127.0.0.1:47210";
}

export function demoMode(): boolean {
  return flag("DEMO_MODE", true);
}

export function workerKey(): string | undefined {
  return read("WORKER_KEY");
}
