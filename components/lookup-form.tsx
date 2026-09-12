"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DemoKind } from "@/lib/flights/types";
import { quoteSearchParams } from "@/lib/quote-request";

export type DemoChip = {
  kind: DemoKind;
  label: string;
  hint: string;
  flightKey: string;
  carrier: string;
  flightNumber: string;
  serviceDate: string;
  origin: string;
};

export function LookupForm({ demos }: { demos: DemoChip[] }) {
  const clean = demos.find((demo) => demo.kind === "clean");
  const [carrier, setCarrier] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState(clean?.serviceDate ?? "");
  const [origin, setOrigin] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <form action="/quote" method="get" className="paper-card flex flex-col gap-4 p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] tracking-[0.22em] text-ink/45 uppercase">
            Flight lookup
          </p>
          <p className="font-mono text-[10px] text-ink/35">τ = 60 min</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Carrier" htmlFor="carrier">
            <Input
              id="carrier"
              name="carrier"
              inputMode="text"
              autoComplete="off"
              maxLength={2}
              placeholder="UA"
              value={carrier}
              onChange={(event) =>
                setCarrier(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              className="h-12 border-ink/15 bg-paper font-mono text-base tracking-[0.18em] uppercase"
              required
            />
          </Field>
          <Field label="Flight no." htmlFor="flightNumber">
            <Input
              id="flightNumber"
              name="flightNumber"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="472"
              value={flightNumber}
              onChange={(event) =>
                setFlightNumber(event.target.value.replace(/\D/g, ""))
              }
              className="h-12 border-ink/15 bg-paper font-mono text-base tracking-wide"
              required
            />
          </Field>
        </div>

        <Field label="Date" htmlFor="date">
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 border-ink/15 bg-paper font-mono text-base"
            required
          />
        </Field>

        <Field label="Origin (optional)" htmlFor="origin">
          <Input
            id="origin"
            name="origin"
            inputMode="text"
            autoComplete="off"
            maxLength={3}
            placeholder="EWR"
            value={origin}
            onChange={(event) => setOrigin(event.target.value.toUpperCase())}
            className="h-12 border-ink/15 bg-paper font-mono text-base tracking-[0.18em] uppercase"
          />
        </Field>

        <SubmitButton />
      </form>

      <div>
        <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
          Demo flights
        </p>
        <div className="flex flex-col gap-2">
          {demos.map((demo) => (
            <Link
              key={demo.kind}
              href={`/${demo.kind === "clean" ? "quote" : "refuse"}?${quoteSearchParams(demo)}`}
              className="paper-card flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-paper-hot"
            >
              <span>
                <span className="block font-mono text-[11px] tracking-[0.14em] text-ink uppercase">
                  {demo.label}
                </span>
                <span className="mt-0.5 block font-serif text-[13px] text-ink/55">
                  {demo.hint}
                </span>
                <span className="mt-1 block font-mono text-[10px] text-ink/35">
                  {demo.flightKey}
                </span>
              </span>
              <span className="font-mono text-[9px] tracking-[0.16em] text-ink/35 uppercase">
                {demo.kind}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      nativeButton
      className="h-12 w-full rounded-sm bg-navy text-[13px] tracking-[0.16em] text-paper uppercase hover:bg-navy/90"
    >
      {pending ? "Checking the board…" : "Look up"}
    </Button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="font-mono text-[10px] tracking-[0.18em] text-ink/45 uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
