/**
 * Named exports the Proto 3 UI rebuild should import.
 * Day-1 screens keep importing from `@/lib/flights/types` and `@/lib/pricing/quote`.
 */

export {
  DEFAULT_CONFIGURE,
  MINUTES_LATE_OPTIONS,
  OUTCOME_ONCHAIN,
  isMinutesLate,
  isStubProduct,
  type Configure,
  type FlightDataMode,
  type FlightKeyHash,
  type FlightLookup,
  type FlightLookupResult,
  type Hex,
  type HumanKey,
  type MinutesLate,
  type Outcome,
  type PolicyId,
  type PolicyStatus,
  type SnapshotHash,
  type StubProduct,
  type TicketStatus,
} from "./types";

export {
  REFUSAL_CODES,
  REFUSAL_COPY,
  REFUSAL_ONCHAIN,
  isRefusalCode,
  refuseCutoff,
  refuseDuplicate,
  refuseFull,
  refuseHot,
  refuseNotFound,
  refuseUnverified,
  type RefusalCode,
  type RefusalCopy,
} from "./refusal";

export {
  PAYOUT_USD_BY_MINUTES_LATE,
  PREMIUM_USD_BY_PRODUCT,
  payoutUsdForMinutesLate,
  premiumUsdForProduct,
  pricePremium,
  quoteFlight,
  quoteSnapshot,
  type DomainQuoteResponse,
  type HouseBook,
  type Quote,
  type QuoteInput,
} from "./quote";

export {
  DEMO_POT_GRANT_CENTS,
  POT_CURRENCY,
  applyCredit,
  applyDebit,
  centsToDollars,
  dollarsToCents,
  emptyPot,
  formatPotUsd,
  roundCents,
  type Pot,
  type PotTxn,
} from "./pot";

export {
  SETTLEMENT_GRACE_MINUTES,
  decideSettlement,
  isPastGrace,
  observedDelayForProduct,
  type Observation,
  type SettlementDecision,
} from "./observe";

export {
  policyFromQuote,
  travelerStatus,
  type Policy,
  type TicketIssueRefusal,
  type TicketIssueRequest,
  type TicketIssueResult,
  type TicketIssueSuccess,
} from "./policy";

export {
  asHex,
  canonicalSnapshotJson,
  flightKeyHash,
  humanKeyFromNullifier,
  parsePolicyId,
  snapshotHash,
  ticketNumberFromPolicyId,
} from "./keys";

export type {
  LedgerEvent,
  ObservationPostedEvent,
  PolicyOpenedEvent,
  PolicyRefusedEvent,
  PolicySettledEvent,
  X402ReceiptEvent,
} from "./events";
