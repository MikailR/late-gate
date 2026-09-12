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

export {
  CLEAN_DEMO_PRIOR_BY_MINUTES_LATE,
  CUTOFF_HOURS,
  DEFAULT_CUTOFF_HOURS,
  DEFAULT_MAX_OPEN_PER_FLIGHT,
  DEMO_CUTOFF_HOURS,
  DEMO_MAX_OPEN_PER_FLIGHT,
  P_MAX_AT_TARGET_LAMBDA,
  POOL_AVERAGE_PRIOR_BY_MINUTES_LATE,
  PORTFOLIO_CAP_USD,
  TARGET_LAMBDA,
} from "./constants";

export {
  cleanDemoPriorFor,
  cutoffHours,
  exceedsUnderwriteCap,
  houseEvUsd,
  pHatFor,
  pMaxFor,
  underwriteCap,
} from "./underwrite";
