import { isLedgerConfigured, ledgerEnv } from "@/lib/config/env";
import type { LedgerEvent } from "@/lib/domain/events";
import { OUTCOME_ONCHAIN } from "@/lib/domain/types";
import { REFUSAL_ONCHAIN } from "@/lib/domain/refusal";
import { LATE_GATE_LEDGER_ABI } from "./abi";

export { isLedgerConfigured, LATE_GATE_LEDGER_ABI };

export type LedgerWriteResult = {
  ok: true;
  stub: boolean;
  txHash: string;
  event: LedgerEvent;
};

const recent: LedgerWriteResult[] = [];

function stubTx(kind: string): string {
  return `0xstub${kind}${Date.now().toString(16)}`;
}

/**
 * Dual-write client. House is the only writer. Traveler never signs.
 * Live: TODO viem walletClient(HOUSE_EVM_PRIVATE_KEY, baseSepolia) + nonce queue.
 * // status: stub implemented; live write TODO until BASE_SEPOLIA_RPC_URL + key + LEDGER_ADDRESS
 */
export async function writeLedger(event: LedgerEvent): Promise<LedgerWriteResult> {
  const live = isLedgerConfigured();
  if (live) {
    // TODO(ledger): encode event.kind against LATE_GATE_LEDGER_ABI and sendTransaction.
    void ledgerEnv();
    void OUTCOME_ONCHAIN;
    void REFUSAL_ONCHAIN;
  }
  const result: LedgerWriteResult = {
    ok: true,
    stub: !live,
    txHash: live ? stubTx("pending") : stubTx(event.kind),
    event,
  };
  recent.unshift(result);
  if (recent.length > 50) recent.length = 50;
  return result;
}

export function recentLedgerWrites(): LedgerWriteResult[] {
  return [...recent];
}

export async function writeRefused(
  event: Extract<LedgerEvent, { kind: "PolicyRefused" }>,
): Promise<LedgerWriteResult> {
  return writeLedger(event);
}

export async function writeOpened(
  event: Extract<LedgerEvent, { kind: "PolicyOpened" }>,
): Promise<LedgerWriteResult> {
  return writeLedger(event);
}

export async function writeObservation(
  event: Extract<LedgerEvent, { kind: "ObservationPosted" }>,
): Promise<LedgerWriteResult> {
  return writeLedger(event);
}

export async function writeSettled(
  event: Extract<LedgerEvent, { kind: "PolicySettled" }>,
): Promise<LedgerWriteResult> {
  return writeLedger(event);
}

export async function writeX402Receipt(
  event: Extract<LedgerEvent, { kind: "X402Receipt" }>,
): Promise<LedgerWriteResult> {
  return writeLedger(event);
}
