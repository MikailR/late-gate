import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getFixtureByKind } from "@/lib/flights/fixtures";
import { toFlightQuery } from "@/lib/flights/flight-key";
import { quoteFlight, quoteSnapshot } from "./quote";
import { applyCredit, applyDebit, dollarsToCents, emptyPot } from "./pot";
import { decideSettlement } from "./observe";
import { humanKeyFromNullifier, ticketNumberFromPolicyId } from "./keys";
import { travelerStatus } from "./policy";

const frozen = new Date("2026-09-12T16:00:00.000Z");

describe("quoteFlight Day-1 paths", () => {
  it("quotes UA472 at $8.40 / arrival / 60", () => {
    const clean = getFixtureByKind("clean", frozen);
    const parsed = toFlightQuery({
      carrier: clean.snapshot.carrier,
      flightNumber: clean.snapshot.flightNumber,
      date: clean.snapshot.serviceDate,
      origin: clean.snapshot.origin,
    });
    assert.ok(parsed);
    const quote = quoteFlight(parsed, frozen);
    assert.equal(quote.ok, true);
    if (!quote.ok) return;
    assert.equal(quote.premium, 8.4);
    assert.equal(quote.premiumCents, 840);
    assert.equal(quote.payoutCents, 10_000);
    assert.equal(quote.configure.minutesLate, 60);
    assert.equal(quote.product, "arrival");
  });

  it("refuses HOT then CUTOFF then NOT_FOUND", () => {
    const hot = getFixtureByKind("hot", frozen);
    const cutoff = getFixtureByKind("cutoff", frozen);
    const hotQuote = quoteSnapshot(hot.snapshot, {
      carrier: hot.snapshot.carrier,
      flightNumber: hot.snapshot.flightNumber,
      serviceDate: hot.snapshot.serviceDate,
      origin: hot.snapshot.origin,
    }, frozen);
    assert.equal(hotQuote.ok, false);
    if (hotQuote.ok) return;
    assert.equal(hotQuote.refusal, "HOT");

    const cutoffQuote = quoteSnapshot(cutoff.snapshot, {
      carrier: cutoff.snapshot.carrier,
      flightNumber: cutoff.snapshot.flightNumber,
      serviceDate: cutoff.snapshot.serviceDate,
      origin: cutoff.snapshot.origin,
    }, frozen);
    assert.equal(cutoffQuote.ok, false);
    if (cutoffQuote.ok) return;
    assert.equal(cutoffQuote.refusal, "CUTOFF");

    const missing = quoteFlight({
      carrier: "XX",
      flightNumber: "999",
      serviceDate: "2026-09-12",
    }, frozen);
    assert.equal(missing.ok, false);
    if (missing.ok) return;
    assert.equal(missing.refusal, "NOT_FOUND");
  });

  it("refuses FULL when the book is at cap", () => {
    const clean = getFixtureByKind("clean", frozen);
    const quote = quoteSnapshot(clean.snapshot, {
      carrier: clean.snapshot.carrier,
      flightNumber: clean.snapshot.flightNumber,
      serviceDate: clean.snapshot.serviceDate,
      origin: clean.snapshot.origin,
      book: { openCount: 5, maxOpenPerFlight: 5 },
    }, frozen);
    assert.equal(quote.ok, false);
    if (quote.ok) return;
    assert.equal(quote.refusal, "FULL");
  });
});

describe("pot math", () => {
  it("credits, debits, and refuses a short pot", () => {
    const granted = applyCredit(emptyPot("human-1"), 5_000, "demo-grant");
    assert.equal(granted.ok, true);
    if (!granted.ok) return;
    const paid = applyDebit(granted.pot, 840, "ticket");
    assert.equal(paid.ok, true);
    if (!paid.ok) return;
    assert.equal(paid.pot.balanceCents, 4_160);
    const short = applyDebit(paid.pot, 10_000, "payout-too-soon");
    assert.equal(short.ok, false);
    if (short.ok) return;
    assert.equal(short.error, "INSUFFICIENT");
    assert.equal(dollarsToCents(8.4), 840);
  });
});

describe("observe", () => {
  it("pays when observed delay ≥ minutesLate, else expires", () => {
    const settle = getFixtureByKind("settle", frozen);
    const paid = decideSettlement(
      settle.snapshot,
      { product: "arrival", minutesLate: 60 },
      10_000,
      frozen,
    );
    assert.equal(paid.outcome, "PAID");
    assert.equal(paid.payoutCents, 10_000);

    const expired = decideSettlement(
      settle.snapshot,
      { product: "takeoff", minutesLate: 45 },
      10_000,
      frozen,
    );
    assert.equal(expired.outcome, "EXPIRED");
    assert.equal(expired.payoutCents, 0);
  });
});

describe("keys and status", () => {
  it("builds a stable humanKey and LG ticket number", () => {
    const a = humanKeyFromNullifier(1n, "UA472|2026-09-12|EWR");
    const b = humanKeyFromNullifier(1n, "UA472|2026-09-12|EWR");
    const c = humanKeyFromNullifier(1n, "B6148|2026-09-08|BOS");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(ticketNumberFromPolicyId(1n), "LG-1");
    assert.equal(travelerStatus(null), "NOT_ISSUED");
  });
});
