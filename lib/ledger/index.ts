/** PARKED — Base ledger dual-write. Not prize-critical. Prize till is lib/usdc. */
export {
  LATE_GATE_LEDGER_ABI,
  isLedgerConfigured,
  recentLedgerWrites,
  writeLedger,
  writeObservation,
  writeOpened,
  writeRefused,
  writeSettled,
  writeX402Receipt,
  type LedgerWriteResult,
} from "./client";
export { LATE_GATE_LEDGER_ABI as ledgerAbi } from "./abi";
