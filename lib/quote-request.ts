import { toFlightQuery } from "@/lib/flights/flight-key";
import { isMinutesLate, isStubProduct } from "@/lib/domain/types";
import type { QuoteInput } from "@/lib/pricing/quote";

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function optionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseQuoteInput(params: RawParams): QuoteInput | null {
  const query = toFlightQuery({
    carrier: first(params.carrier),
    flightNumber: first(params.flightNumber),
    date: first(params.date) ?? first(params.serviceDate),
    origin: first(params.origin),
  });
  if (!query) return null;

  const minutesLateRaw = optionalNumber(first(params.minutesLate));
  const productRaw = first(params.product);

  return {
    ...query,
    tauMinutes: optionalNumber(first(params.tau) ?? first(params.tauMinutes)),
    minutesLate: isMinutesLate(minutesLateRaw) ? minutesLateRaw : undefined,
    product: isStubProduct(productRaw) ? productRaw : undefined,
    // Parsed for Day-1 query compat. Quote math ignores this — payout comes from minutesLate.
    maxPayout: optionalNumber(first(params.payout) ?? first(params.maxPayout)),
  };
}

export function quoteSearchParams(input: {
  carrier: string;
  flightNumber: string;
  serviceDate: string;
  origin?: string;
}): string {
  const params = new URLSearchParams({
    carrier: input.carrier,
    flightNumber: input.flightNumber,
    date: input.serviceDate,
  });
  if (input.origin) params.set("origin", input.origin);
  return params.toString();
}
