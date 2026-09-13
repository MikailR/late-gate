/**
 * PARKED — Hedera machine till (HBAR / tinybar). Not prize-critical.
 * Traveler premium + delay payout are USDC on World Chain Sepolia (`lib/usdc`).
 * Never import Pot / USD cents here.
 * // status: PARKED stub. Live Blocky402 verify remains TODO; do not treat as a prize path.
 */

export type X402Resource = "snapshot" | "receipt";

export type X402Accept = {
  scheme: "exact";
  network: "hedera:testnet";
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: "0.0.0";
  extra: {
    feePayer: string;
    price: { amount: string; asset: "0.0.0" };
  };
};

export type X402Challenge = {
  x402Version: 1;
  accepts: X402Accept[];
  stub: boolean;
};

export type X402Receipt = {
  resource: X402Resource;
  flightKey?: string;
  policyId?: string;
  amountTinybar: string;
  asset: "0.0.0";
  network: "hedera:testnet";
  hederaTxId: string;
  payer: string;
  hashscanUrl: string;
  stub: boolean;
  paidAt: string;
};

export const STUB_PAYMENT_HEADER = "x-late-gate-stub-pay";
export const X402_PAYMENT_HEADER = "payment-signature";
