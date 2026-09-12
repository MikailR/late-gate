import Link from "next/link";
import { redirect } from "next/navigation";
import { BoardingPass } from "@/components/boarding-pass";
import { RefusalDesk } from "@/components/refusal-desk";
import { SiteShell } from "@/components/site-shell";
import { parseQuoteInput } from "@/lib/quote-request";
import { quoteFlight } from "@/lib/pricing/quote";

export const dynamic = "force-dynamic";

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const input = parseQuoteInput(params);

  if (!input) {
    redirect("/");
  }

  const quote = quoteFlight(input);

  if (!quote.ok) {
    return (
      <SiteShell>
        <RefusalDesk result={quote} />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <p className="mb-5 font-serif text-[16px] leading-6 text-ink/70">
        One price. One threshold. One payout. House is the other side of this
        ticket.
      </p>
      <BoardingPass quote={quote} />
      <p className="mt-6 text-center">
        <Link
          href="/"
          className="font-mono text-[11px] tracking-[0.12em] text-ink/40 uppercase underline-offset-4 hover:underline"
        >
          Look up another
        </Link>
      </p>
    </SiteShell>
  );
}
