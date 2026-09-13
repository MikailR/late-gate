import { parseQuoteInput } from "@/lib/quote-request";
import { quoteFlight } from "@/lib/pricing/quote";
import { cutoffHours } from "@/lib/pricing/underwrite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = parseQuoteInput(Object.fromEntries(url.searchParams.entries()));

  if (!input) {
    return Response.json(
      {
        ok: false,
        refusal: "NOT_FOUND",
        title: "That lookup is incomplete.",
        reason: "Need a two-letter carrier, a flight number, and a service date.",
        detail: "Origin is optional. Example: UA 837 on 2026-09-19 out of SFO.",
        tauMinutes: 60,
        cutoffHours: cutoffHours(),
      },
      { status: 400 },
    );
  }

  const quote = quoteFlight(input);
  return Response.json(quote, { status: quote.ok ? 200 : 409 });
}
