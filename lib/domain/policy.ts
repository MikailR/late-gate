import type { QuoteSuccess } from "@/lib/flights/types";
import type { UsdcResult } from "@/lib/usdc";
import { ticketNumberFromPolicyId } from "./keys";
import type { Configure, Hex, Outcome, PolicyId, PolicyStatus, StubProduct, TicketStatus } from "./types";

export type Policy = {
  policyId: PolicyId;
  ticketNumber: string;
  flightKey: string;
  humanKey: Hex;
  product: StubProduct;
  configure: Configure;
  /** Internal τ. Same number as configure.minutesLate. */
  tauMinutes: number;
  premiumCents: number;
  payoutCents: number;
  scheduledArrival: string;
  cutoffAt: string;
  status: PolicyStatus;
  outcome?: Outcome;
  snapshotHash?: Hex;
  observedDelayMinutes?: number;
  ledgerTx?: string;
  /** PARKED Hedera receipt id. Not prize-critical. */
  hederaTxId?: string;
  /** World Chain Sepolia USDC transfer (stub hash until live). */
  usdcTx?: string;
  /** Traveler / Mini App wallet that paid USDC premium. */
  travelerAddress?: Hex;
  openedAt: string;
  settledAt?: string;
};

export type TicketIssueRequest = {
  flightKey: string;
  worldSession: string;
  configure?: Configure;
  /** World Chain address the Mini App pays USDC from. */
  travelerAddress?: Hex;
  /** Optional already-broadcast premium tx. */
  usdcTxHash?: Hex;
};

export type TicketIssueSuccess = {
  ok: true;
  policy: Policy;
  ticketNumber: string;
  /** Labeled memory-pot fallback. Not the locked USDC prize path. */
  potBalanceCents: number;
  potSource: "memory-fallback";
  usdc: UsdcResult;
};

export type TicketIssueRefusal = {
  ok: false;
  status: "NOT_ISSUED";
  refusal:
    | "HOT"
    | "CUTOFF"
    | "NOT_FOUND"
    | "FULL"
    | "DUPLICATE"
    | "UNVERIFIED"
    | "UNDERWRITE_REJECT"
    | "EXPOSURE_CAP";
  title: string;
  reason: string;
  detail: string;
  flightKey?: string;
  existingPolicyId?: string;
};

export type TicketIssueResult = TicketIssueSuccess | TicketIssueRefusal;

export function policyFromQuote(
  quote: QuoteSuccess & { product?: StubProduct; configure?: Configure; premiumCents?: number; payoutCents?: number },
  args: {
    policyId: PolicyId;
    humanKey: Hex;
    now?: Date;
    cutoffAt: string;
    travelerAddress?: Hex;
  },
): Policy {
  const configure = quote.configure ?? {
    product: quote.product ?? "arrival",
    minutesLate: (quote.tauMinutes === 30 || quote.tauMinutes === 45 || quote.tauMinutes === 60
      ? quote.tauMinutes
      : 60) as 30 | 45 | 60,
  };
  const premiumCents = quote.premiumCents ?? Math.round(quote.premium * 100);
  const payoutCents = quote.payoutCents ?? Math.round(quote.maxPayout * 100);

  return {
    policyId: args.policyId,
    ticketNumber: ticketNumberFromPolicyId(args.policyId),
    flightKey: quote.flightKey,
    humanKey: args.humanKey,
    product: configure.product,
    configure,
    tauMinutes: configure.minutesLate,
    premiumCents,
    payoutCents,
    scheduledArrival: quote.flight.scheduledArrival,
    cutoffAt: args.cutoffAt,
    status: "OPEN",
    travelerAddress: args.travelerAddress,
    openedAt: (args.now ?? new Date()).toISOString(),
  };
}

export function travelerStatus(policy: Policy | null | undefined): TicketStatus {
  if (!policy) return "NOT_ISSUED";
  if (policy.status === "VOID") return "NOT_ISSUED";
  if (policy.status === "OPEN") return "OPEN";
  if (policy.status === "PAID") return "PAID";
  return "EXPIRED";
}
