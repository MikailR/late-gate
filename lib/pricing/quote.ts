/**
 * Day-1 import path. Quote math lives in `lib/domain/quote`.
 * Configure changes payout, not premium — this file must not re-price.
 */
export {
  PAYOUT_USD_BY_MINUTES_LATE,
  payoutUsdForMinutesLate,
  pricePremium,
  quoteFlight,
  quoteSnapshot,
  type DomainQuoteResponse as QuoteResponse,
  type QuoteInput,
} from "@/lib/domain/quote";
