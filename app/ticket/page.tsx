import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { TicketStub } from "@/components/ticket-stub";
import { parseFlightKey } from "@/lib/flights/flight-key";
import { quoteFlight } from "@/lib/pricing/quote";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.flightKey;
  const flightKey = Array.isArray(raw) ? raw[0] : raw;
  const parsed = flightKey ? parseFlightKey(flightKey) : null;

  const quote = parsed
    ? quoteFlight({
        carrier: parsed.carrier,
        flightNumber: parsed.flightNumber,
        serviceDate: parsed.serviceDate,
        origin: parsed.origin,
      })
    : null;

  return (
    <SiteShell>
      {quote?.ok ? (
        <TicketStub quote={quote} />
      ) : (
        <div className="paper-card px-5 py-8">
          <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
            No stub
          </p>
          <h2 className="mt-3 font-serif text-[28px] leading-8 text-ink">
            We don&apos;t have that receipt.
          </h2>
          <p className="mt-3 font-serif text-[16px] leading-6 text-ink/65">
            Tickets are written from a quoted flight. Look one up first.
          </p>
          <Link
            href="/quote"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 h-12 w-full rounded-sm bg-navy text-[13px] tracking-[0.16em] text-paper uppercase hover:bg-navy/90",
            )}
          >
            Back to the desk
          </Link>
        </div>
      )}
    </SiteShell>
  );
}
