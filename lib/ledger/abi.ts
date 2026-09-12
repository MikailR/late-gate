/**
 * Hand-written ABI matching contracts/LateGateLedger.sol.
 * // status: implemented as the TypeScript mirror. Regenerate from forge out/ when Foundry is added.
 */
export const LATE_GATE_LEDGER_ABI = [
  {
    type: "event",
    name: "PolicyRefused",
    inputs: [
      { name: "flightKeyHash", type: "bytes32", indexed: true },
      { name: "flightKey", type: "string", indexed: false },
      { name: "code", type: "uint8", indexed: false },
      { name: "estDelayMin", type: "int32", indexed: false },
      { name: "at", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PolicyOpened",
    inputs: [
      { name: "policyId", type: "uint256", indexed: true },
      { name: "flightKeyHash", type: "bytes32", indexed: true },
      { name: "flightKey", type: "string", indexed: false },
      { name: "humanKey", type: "bytes32", indexed: false },
      { name: "premiumCents", type: "uint32", indexed: false },
      { name: "payoutCents", type: "uint32", indexed: false },
      { name: "tauMinutes", type: "uint16", indexed: false },
      { name: "scheduledArrival", type: "uint64", indexed: false },
      { name: "cutoffAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ObservationPosted",
    inputs: [
      { name: "policyId", type: "uint256", indexed: true },
      { name: "observedDelayMin", type: "int32", indexed: false },
      { name: "snapshotHash", type: "bytes32", indexed: false },
      { name: "observedAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PolicySettled",
    inputs: [
      { name: "policyId", type: "uint256", indexed: true },
      { name: "outcome", type: "uint8", indexed: false },
      { name: "payoutCents", type: "uint32", indexed: false },
      { name: "hcsRef", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "X402Receipt",
    inputs: [
      { name: "resource", type: "bytes32", indexed: true },
      { name: "flightKey", type: "string", indexed: false },
      { name: "amountTinybar", type: "uint64", indexed: false },
      { name: "hederaTxId", type: "string", indexed: false },
      { name: "payer", type: "string", indexed: false },
      { name: "at", type: "uint64", indexed: false },
    ],
  },
] as const;
