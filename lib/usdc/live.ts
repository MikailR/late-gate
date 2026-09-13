/**
 * Live viem path for LateGateVault on World Chain Sepolia (4801).
 * Only used when WORLDCHAIN_RPC + HOUSE_EVM_PRIVATE_KEY + LP_VAULT_ADDRESS are set.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { worldchainSepolia } from "viem/chains";
import type { UsdcTillEnv } from "@/lib/config/env";
import { ERC20_TRANSFER_ABI } from "./chain";
import type { VaultSender, VaultWriteCall } from "./types";
import { LATE_GATE_VAULT_ABI } from "./vault-abi";

export function normalizePrivateKey(key: string): Hex {
  const hex = (key.startsWith("0x") ? key : `0x${key}`) as Hex;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("HOUSE_EVM_PRIVATE_KEY must be a 32-byte hex key.");
  }
  return hex;
}

export function houseAccountFromKey(key: string): Account {
  return privateKeyToAccount(normalizePrivateKey(key));
}

/** Real 32-byte hash. Stub prefixes (`0xstub…`) are not live. */
export function isLiveTxHash(value: string | undefined): value is Hex {
  if (!value) return false;
  if (value.startsWith("0xstub") || value.startsWith("0xSTUB")) return false;
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export function createViemVaultSender(env: UsdcTillEnv): VaultSender {
  if (!env.housePrivateKey) {
    throw new Error("HOUSE_EVM_PRIVATE_KEY is required for live vault sends.");
  }
  if (!env.vaultAddress) {
    throw new Error("LP_VAULT_ADDRESS is required for live vault sends.");
  }

  const account = houseAccountFromKey(env.housePrivateKey);
  const vault = env.vaultAddress;
  const transport = http(env.rpcUrl);
  const publicClient = createPublicClient({
    chain: worldchainSepolia,
    transport,
  });
  const walletClient = createWalletClient({
    account,
    chain: worldchainSepolia,
    transport,
  });

  return {
    async readHouse() {
      return publicClient.readContract({
        address: vault,
        abi: LATE_GATE_VAULT_ABI,
        functionName: "house",
      });
    },
    async write(call: VaultWriteCall) {
      const hash = await walletClient.writeContract({
        address: vault,
        abi: LATE_GATE_VAULT_ABI,
        functionName: call.functionName,
        args: call.args as never,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error(`vault ${call.functionName} reverted (${hash})`);
      }
      return hash;
    },
    async approveUsdc(amount: bigint) {
      const hash = await walletClient.writeContract({
        address: env.usdcAddress,
        abi: ERC20_TRANSFER_ABI,
        functionName: "approve",
        args: [vault, amount],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error(`USDC approve reverted (${hash})`);
      }
      return hash;
    },
  };
}

export async function assertHouseSigner(sender: VaultSender, signer: Address): Promise<void> {
  const onchain = await sender.readHouse();
  if (onchain.toLowerCase() !== signer.toLowerCase()) {
    throw new HouseSignerError(signer, onchain);
  }
}

export class HouseSignerError extends Error {
  readonly signer: Address;
  readonly onchainHouse: Address;

  constructor(signer: Address, onchainHouse: Address) {
    super(`House withdraw requires the vault house signer. got ${signer}, vault.house ${onchainHouse}`);
    this.name = "HouseSignerError";
    this.signer = signer;
    this.onchainHouse = onchainHouse;
  }
}
