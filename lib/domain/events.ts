/**
 * TypeScript mirror of LateGateLedger.sol events.
 * Single place for the app and (later) subgraph mapping.ts.
 * // status: implemented (types). Writes go through lib/ledger (stub unless Base key is set).
 */

import type { Hex, Outcome } from "./types";
import type { RefusalCode } from "./refusal";

export type PolicyRefusedEvent = {
  kind: "PolicyRefused";
  flightKeyHash: Hex;
  flightKey: string;
  code: RefusalCode;
  estDelayMin: number;
  at: number;
};

export type PolicyOpenedEvent = {
  kind: "PolicyOpened";
  policyId: string;
  flightKeyHash: Hex;
  flightKey: string;
  humanKey: Hex;
  premiumCents: number;
  payoutCents: number;
  tauMinutes: number;
  scheduledArrival: number;
  cutoffAt: number;
};

export type ObservationPostedEvent = {
  kind: "ObservationPosted";
  policyId: string;
  observedDelayMin: number;
  snapshotHash: Hex;
  observedAt: number;
};

export type PolicySettledEvent = {
  kind: "PolicySettled";
  policyId: string;
  outcome: Outcome;
  payoutCents: number;
  /** Optional Hedera tx / HCS seq cited as a string. Traveler never sees this. */
  hcsRef: string;
};

export type X402ReceiptEvent = {
  kind: "X402Receipt";
  resource: "snapshot" | "receipt";
  flightKey: string;
  amountTinybar: string;
  hederaTxId: string;
  payer: string;
  at: number;
};

export type LedgerEvent =
  | PolicyRefusedEvent
  | PolicyOpenedEvent
  | ObservationPostedEvent
  | PolicySettledEvent
  | X402ReceiptEvent;
