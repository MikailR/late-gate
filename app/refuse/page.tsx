import { redirect } from "next/navigation";
import { RefusalDesk } from "@/components/refusal-desk";
import { SiteShell } from "@/components/site-shell";
import { parseQuoteInput } from "@/lib/quote-request";
import { quoteFlight } from "@/lib/pricing/quote";

export const dynamic = "force-dynamic";

export default async function RefusePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const input = parseQuoteInput(params);

  if (!input) {
    redirect("/quote");
  }

  const quote = quoteFlight(input);
  if (quote.ok) {
    return redirect(
      `/quote?carrier=${input.carrier}&flightNumber=${input.flightNumber}&date=${input.serviceDate}${input.origin ? `&origin=${input.origin}` : ""}`,
    );
  }

  return (
    <SiteShell>
      <RefusalDesk result={quote} />
    </SiteShell>
  );
}
