import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { QuoteSuccess } from "@/lib/flights/types";
import { formatUsd } from "@/lib/money";
import { formatGateTime, formatTicketDate } from "@/lib/time";
import { issueTicketNumber, ticketStatus } from "@/lib/ticket";
import { cn } from "@/lib/utils";

export function TicketStub({ quote }: { quote: QuoteSuccess }) {
  const { flight } = quote;
  const number = issueTicketNumber(quote.flightKey);
  const status = ticketStatus();

  return (
    <div className="flex flex-col gap-6">
      <article className="ticket">
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
              Ticket stub
            </p>
            <p className="mt-2 font-mono text-lg tracking-[0.14em] text-ink">
              {number}
            </p>
          </div>
          <span className="rounded-[2px] border border-navy px-2 py-1 font-mono text-[11px] tracking-[0.22em] text-navy uppercase">
            {status}
          </span>
        </div>

        <div className="px-5 pb-4">
          <p className="font-mono text-sm tracking-[0.12em] text-ink">
            {flight.carrier} {flight.flightNumber}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <p className="font-serif text-[36px] leading-none text-ink">
              {flight.origin}
            </p>
            <span className="mb-1 font-mono text-[10px] text-ink/35">→</span>
            <p className="font-serif text-[36px] leading-none text-ink">
              {flight.destination}
            </p>
          </div>
          <p className="mt-3 font-mono text-[11px] text-ink/50">
            {formatTicketDate(flight.scheduledDeparture, flight.timeZone)} ·{" "}
            {formatGateTime(flight.scheduledDeparture, flight.timeZone)} dep
          </p>
        </div>

        <div className="ticket-perf" aria-hidden />

        <div className="px-5 pt-4 pb-5">
          <div className="barcode" aria-hidden />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
                Paid
              </p>
              <p className="font-serif text-2xl text-ink">
                {formatUsd(quote.premium)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
                Pays
              </p>
              <p className="font-serif text-2xl text-ink">
                {formatUsd(quote.maxPayout)}
              </p>
            </div>
          </div>
          <p className="mt-4 font-serif text-[15px] leading-6 text-ink/70">
            Keep this receipt. If the aircraft reaches the gate more than{" "}
            {quote.tauMinutes} minutes late, the payout posts on its own.
          </p>
          <p className="mt-3 font-mono text-[10px] text-ink/35">
            {quote.flightKey}
          </p>
        </div>
      </article>

      <Link
        href="/quote"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-12 w-full rounded-sm border-ink/20 bg-transparent text-[13px] tracking-[0.16em] text-ink uppercase",
        )}
      >
        Another flight
      </Link>
    </div>
  );
}
