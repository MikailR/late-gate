/**
 * Day-1 import path. Quote math lives in `lib/domain/quote`.
 * Product selects the locked premium; minutesLate selects payout. Do not re-price here.
 */
export {
  PAYOUT_USD_BY_MINUTES_LATE,
  PREMIUM_USD_BY_PRODUCT,
  payoutUsdForMinutesLate,
  premiumUsdForProduct,
  pricePremium,
  quoteFlight,
  quoteSnapshot,
  type DomainQuoteResponse as QuoteResponse,
  type QuoteInput,
} from "@/lib/domain/quote";
