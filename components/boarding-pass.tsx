import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { QuoteSuccess } from "@/lib/flights/types";
import { formatUsd } from "@/lib/money";
import { formatGateTime, formatTicketDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export function BoardingPass({
  quote,
  action = "buy",
}: {
  quote: QuoteSuccess;
  action?: "buy" | "none";
}) {
  const { flight } = quote;

  return (
    <article className="ticket">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
              Gate receipt
            </p>
            <p className="mt-1 font-mono text-xl tracking-[0.08em] text-ink">
              {flight.carrier}
              {flight.flightNumber}
            </p>
          </div>
          <p className="text-right font-mono text-[10px] leading-4 text-ink/45">
            {formatTicketDate(flight.scheduledDeparture, flight.timeZone)}
            <br />
            {flight.serviceDate}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Airport code={flight.origin} city={flight.originCity} align="left" />
          <span className="mb-1 font-mono text-[10px] text-ink/35">→</span>
          <Airport
            code={flight.destination}
            city={flight.destinationCity}
            align="right"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-dashed border-ink/15 pt-4">
          <Meta
            label="Departs"
            value={formatGateTime(flight.scheduledDeparture, flight.timeZone)}
          />
          <Meta
            label="Est. arrival"
            value={formatGateTime(flight.estimatedArrival, flight.timeZone)}
          />
        </div>
      </div>

      <div className="ticket-perf" aria-hidden />

      <div className="px-5 pt-4 pb-5">
        <p className="font-serif text-[17px] leading-6 text-ink">
          Pays if this flight reaches the gate more than{" "}
          <span className="whitespace-nowrap">{quote.tauMinutes} minutes</span>{" "}
          late.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-ink/40 uppercase">
              You pay
            </p>
            <p className="font-serif text-[34px] leading-none tracking-tight text-ink">
              {formatUsd(quote.premium)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-[0.18em] text-ink/40 uppercase">
              Payout
            </p>
            <p className="font-serif text-[34px] leading-none tracking-tight text-ink">
              {formatUsd(quote.maxPayout)}
            </p>
          </div>
        </div>

        <p className="mt-4 font-mono text-[10px] leading-4 tracking-wide text-ink/40">
          {quote.flightKey}
        </p>

        {action === "buy" ? (
          <Link
            href={`/ticket?flightKey=${encodeURIComponent(quote.flightKey)}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 h-12 w-full rounded-sm bg-navy text-[13px] tracking-[0.16em] text-paper uppercase hover:bg-navy/90",
            )}
          >
            Get ticket
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Airport({
  code,
  city,
  align,
}: {
  code: string;
  city: string;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <p className="font-serif text-[32px] leading-none tracking-tight text-ink">
        {code}
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-ink/45 uppercase">
        {city}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm text-ink">{value}</p>
    </div>
  );
}
