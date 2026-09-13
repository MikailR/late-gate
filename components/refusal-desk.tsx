"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { QuoteRefusal } from "@/lib/flights/types";
import { formatClock, formatDelay, formatGateTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export function RefusalDesk({ result }: { result: QuoteRefusal }) {
  useEffect(() => {
    void fetch("/api/refuse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flightKey: result.flightKey,
        refusal: result.refusal,
        reason: result.reason,
      }),
    });
  }, [result.flightKey, result.reason, result.refusal]);

  const flight = result.flight;

  return (
    <div className="flex flex-col gap-6">
      <article className="paper-card relative overflow-hidden px-5 pt-6 pb-6">
        <Stamp code={result.refusal} />

        <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
          Desk decision
        </p>
        <h2 className="mt-3 max-w-[16ch] font-serif text-[32px] leading-9 tracking-tight text-ink">
          {result.title}
        </h2>
        <p className="mt-4 font-serif text-[17px] leading-6 text-ink/80">
          {result.reason}
        </p>
        <p className="mt-3 font-serif text-[15px] leading-6 text-ink/60">
          {result.detail}
        </p>

        {flight ? (
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-dashed border-ink/15 pt-4">
            <Row
              label="Flight"
              value={`${flight.carrier} ${flight.flightNumber}`}
            />
            <Row label="Route" value={`${flight.origin} → ${flight.destination}`} />
            <Row
              label="Departs"
              value={formatClock(flight.scheduledDeparture, flight.timeZone)}
            />
            <Row
              label={result.refusal === "HOT" ? "Live estimate" : "Est. arrival"}
              value={
                result.refusal === "HOT"
                  ? formatDelay(flight.estimatedDelayMinutes)
                  : formatGateTime(flight.estimatedArrival, flight.timeZone)
              }
            />
          </dl>
        ) : null}

        {result.flightKey ? (
          <p className="mt-4 font-mono text-[10px] text-ink/35">
            {result.flightKey}
          </p>
        ) : null}
      </article>

      <Link
        href="/quote"
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 w-full rounded-sm bg-navy text-[13px] tracking-[0.16em] text-paper uppercase hover:bg-navy/90",
        )}
      >
        Look up another
      </Link>
    </div>
  );
}

function Stamp({ code }: { code: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-7 right-4 rotate-[-11deg] rounded-[2px] border-[3px] border-stamp px-2.5 py-1 text-stamp"
    >
      <p className="font-serif text-[11px] leading-none tracking-[0.20em] uppercase">
        Not issued
      </p>
      <p className="mt-1 text-center font-mono text-[16px] leading-none tracking-[0.18em]">
        {code}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm text-ink">{value}</dd>
    </div>
  );
}
