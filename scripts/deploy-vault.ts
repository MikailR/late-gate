/**
 * Deploy LateGateVault to World Chain Sepolia (4801).
 *
 *   npm run deploy:vault
 *
 * Requires WORLDCHAIN_RPC + HOUSE_EVM_PRIVATE_KEY (and optional USDC_ADDRESS).
 * CI must not run this as a required step — there is no house key in CI.
 * On success, prints the env line to set LP_VAULT_ADDRESS.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, createWalletClient, http, isAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { worldchainSepolia } from "viem/chains";
import {
  USDC_SEPOLIA_ADDRESS,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
} from "../lib/usdc/chain";
import { LATE_GATE_VAULT_ABI } from "../lib/usdc/vault-abi";
import { normalizePrivateKey } from "../lib/usdc/live";

const ARTIFACT_CANDIDATES = [
  resolve("forge-out/LateGateVault.sol/LateGateVault.json"),
  resolve("out/LateGateVault.sol/LateGateVault.json"),
  resolve("contracts/artifacts/LateGateVault.json"),
];

type Artifact = { abi: unknown; bytecode: { object?: string } | string };

function read(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

function loadArtifact(): Artifact {
  if (commandExists("forge")) {
    execFileSync("forge", ["build"], { stdio: "inherit" });
  }
  for (const path of ARTIFACT_CANDIDATES) {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf8")) as Artifact;
    }
  }
  throw new Error(
    "No LateGateVault artifact. Install Foundry (`foundryup`) and run `forge build`, or keep contracts/artifacts/LateGateVault.json in tree.",
  );
}

function commandExists(bin: string): boolean {
  try {
    execFileSync("which", [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function bytecodeOf(artifact: Artifact): Hex {
  const raw = typeof artifact.bytecode === "string" ? artifact.bytecode : artifact.bytecode.object;
  if (!raw || !raw.startsWith("0x")) {
    throw new Error("Artifact is missing creation bytecode.");
  }
  return raw as Hex;
}

async function main(): Promise<void> {
  const rpc = read("WORLDCHAIN_RPC");
  const key = read("HOUSE_EVM_PRIVATE_KEY");
  const rawUsdc = read("USDC_ADDRESS") ?? USDC_SEPOLIA_ADDRESS;
  if (!isAddress(rawUsdc)) {
    throw new Error(`USDC_ADDRESS is not a valid address: ${rawUsdc}`);
  }
  const usdc: Address = rawUsdc;

  console.log("LateGateVault deploy — World Chain Sepolia");
  console.log(`  chain id:     ${WORLDCHAIN_SEPOLIA_CHAIN_ID}`);
  console.log(`  USDC:         ${usdc}`);
  console.log(`  WORLDCHAIN_RPC:          ${rpc ? "set" : "MISSING"}`);
  console.log(`  HOUSE_EVM_PRIVATE_KEY:   ${key ? "set" : "MISSING"}`);
  console.log(`  LP_VAULT_ADDRESS (now):  ${read("LP_VAULT_ADDRESS") ?? "(empty)"}`);

  if (!rpc || !key) {
    console.log("");
    console.log("No live deploy. CI is not expected to have a house key.");
    console.log("When you have a funded Sepolia house wallet:");
    console.log("");
    console.log("  WORLDCHAIN_RPC=... HOUSE_EVM_PRIVATE_KEY=... npm run deploy:vault");
    console.log("");
    console.log("Or with Foundry:");
    console.log("");
    console.log("  forge script script/DeployLateGateVault.s.sol:DeployLateGateVault \\");
    console.log("    --rpc-url $WORLDCHAIN_RPC --broadcast --private-key $HOUSE_EVM_PRIVATE_KEY -vv");
    console.log("");
    console.log("After deploy, set:");
    console.log("  LP_VAULT_ADDRESS=<deployed vault>");
    process.exitCode = 0;
    return;
  }

  const account = privateKeyToAccount(normalizePrivateKey(key));
  const artifact = loadArtifact();
  const wallet = createWalletClient({
    account,
    chain: worldchainSepolia,
    transport: http(rpc),
  });
  const publicClient = createPublicClient({
    chain: worldchainSepolia,
    transport: http(rpc),
  });

  console.log(`  house:        ${account.address}`);
  const hash = await wallet.deployContract({
    abi: LATE_GATE_VAULT_ABI,
    bytecode: bytecodeOf(artifact),
    args: [usdc, account.address],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const vault = receipt.contractAddress;
  if (!vault) {
    throw new Error(`Deploy tx ${hash} produced no contract address.`);
  }

  console.log("");
  console.log("=== LateGateVault deployed ===");
  console.log(`  tx:     ${hash}`);
  console.log(`  vault:  ${vault}`);
  console.log("");
  console.log("Set this in .env.local (and the host env):");
  console.log("");
  console.log(`LP_VAULT_ADDRESS=${vault}`);
  console.log("");
  console.log("Live sends also need WORLDCHAIN_RPC + HOUSE_EVM_PRIVATE_KEY (already set).");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
