/**
 * Env grouping.
 * Prize till = USDC on World Chain Sepolia (lib/usdc).
 * Memory USD pot = labeled demo fallback, not the locked prize path.
 * Redis USD pot = leftover, not prize-critical.
 * Hedera x402 + Base ledger = PARKED / not prize-critical.
 */

import {
  DEFAULT_MAX_OPEN_PER_FLIGHT,
  DEMO_MAX_OPEN_PER_FLIGHT,
} from "@/lib/pricing/constants";
import {
  USDC_SEPOLIA_ADDRESS,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  WORLDCHAIN_SEPOLIA_EXPLORER,
  WORLDCHAIN_SEPOLIA_PUBLIC_RPC,
} from "@/lib/usdc/chain";
import { isAddress, type Address } from "viem";

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

/**
 * Leftover store / inventory env. Redis pot is NOT the prize money path.
 * Demo grant still seeds the memory-pot fallback.
 */
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

/**
 * PARKED — Hedera x402 / Blocky402 machine till. Not prize-critical.
 * Keep vars so the stub still boots. Do not treat as the traveler payout path.
 */
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
  /**
   * Shippable default is orbLegacy (Sandbox). selfieCheckLegacy is the
   * Selfie Check (Beta) preset and needs the TFH app flag — ETHOnline
   * teams cannot self-enable it.
   */
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

/**
 * Prize till — World Chain Sepolia USDC (6 decimals).
 * HOUSE_EVM_PRIVATE_KEY is reused from the parked Base ledger section.
 */
export type UsdcTillEnv = {
  rpcUrl: string;
  chainId: typeof WORLDCHAIN_SEPOLIA_CHAIN_ID;
  usdcAddress: Address;
  housePrivateKey?: string;
  vaultAddress?: Address;
  explorerUrl: string;
};

export function usdcTillEnv(): UsdcTillEnv {
  const rawAddress = read("USDC_ADDRESS") ?? USDC_SEPOLIA_ADDRESS;
  const rawVault = read("LP_VAULT_ADDRESS");
  const rawChain = Number(read("WORLDCHAIN_CHAIN_ID") ?? String(WORLDCHAIN_SEPOLIA_CHAIN_ID));
  // Demo/testnet is pinned to 4801 even if someone sets 480. Mainnet is docs-only.
  void rawChain;
  return {
    rpcUrl: read("WORLDCHAIN_RPC") ?? WORLDCHAIN_SEPOLIA_PUBLIC_RPC,
    chainId: WORLDCHAIN_SEPOLIA_CHAIN_ID,
    usdcAddress: isAddress(rawAddress) ? rawAddress : USDC_SEPOLIA_ADDRESS,
    housePrivateKey: read("HOUSE_EVM_PRIVATE_KEY"),
    vaultAddress: rawVault && isAddress(rawVault) ? rawVault : undefined,
    explorerUrl: WORLDCHAIN_SEPOLIA_EXPLORER,
  };
}

/** House signer present. Vault may still be empty (stub deposits refuse until set). */
export function isUsdcTillConfigured(): boolean {
  return Boolean(usdcTillEnv().housePrivateKey);
}

/**
 * Live ERC-20 path. All three must be set — public RPC default does not count.
 * Missing any one keeps stub receipts (`implemented: false`).
 */
export function isUsdcLiveEnv(input: {
  rpcUrl?: string;
  housePrivateKey?: string;
  vaultAddress?: string;
}): boolean {
  return Boolean(input.rpcUrl && input.housePrivateKey && input.vaultAddress && isAddress(input.vaultAddress));
}

export function isUsdcLiveConfigured(): boolean {
  return isUsdcLiveEnv({
    rpcUrl: read("WORLDCHAIN_RPC"),
    housePrivateKey: read("HOUSE_EVM_PRIVATE_KEY"),
    vaultAddress: read("LP_VAULT_ADDRESS"),
  });
}

/** PARKED — Base Sepolia LateGateLedger dual-write. Not prize-critical. */
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
