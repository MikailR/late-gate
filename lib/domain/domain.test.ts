import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getFixtureByKind } from "@/lib/flights/fixtures";
import { toFlightQuery } from "@/lib/flights/flight-key";
import { quoteFlight, quoteSnapshot } from "./quote";
import { quoteFlight as day1QuoteFlight } from "@/lib/pricing/quote";
import {
  CLEAN_DEMO_PRIOR_BY_MINUTES_LATE,
  P_MAX_AT_TARGET_LAMBDA,
  TARGET_LAMBDA,
} from "@/lib/pricing/constants";
import { exceedsUnderwriteCap, houseEvUsd, pHatFor, pMaxFor } from "@/lib/pricing/underwrite";
import { applyCredit, applyDebit, dollarsToCents, emptyPot } from "./pot";
import { decideSettlement } from "./observe";
import { humanKeyFromNullifier, ticketNumberFromPolicyId } from "./keys";
import { travelerStatus } from "./policy";
import { REFUSAL_CODES, REFUSAL_COPY } from "./refusal";

const frozen = new Date("2026-09-12T16:00:00.000Z");

describe("quoteFlight Day-1 paths", () => {
  it("quotes UA837 SFO–NRT at $9 / arrival / 60", () => {
    const clean = getFixtureByKind("clean", frozen);
    assert.equal(clean.snapshot.carrier, "UA");
    assert.equal(clean.snapshot.flightNumber, "837");
    assert.equal(clean.snapshot.origin, "SFO");
    assert.equal(clean.snapshot.destination, "NRT");
    assert.equal(clean.flightKey, "UA837|2026-09-19|SFO");
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
    assert.equal(quote.flightKey, "UA837|2026-09-19|SFO");
    assert.equal(quote.premium, 9);
    assert.equal(quote.premiumCents, 900);
    assert.equal(quote.payoutCents, 20_000);
    assert.equal(quote.maxPayout, 200);
    assert.equal(quote.configure.minutesLate, 60);
    assert.equal(quote.product, "arrival");
    const hoursToDepart =
      (new Date(clean.snapshot.scheduledDeparture).getTime() - frozen.getTime()) /
      3_600_000;
    assert.ok(hoursToDepart > 6, "clean hero must sit outside demo CUTOFF (6h)");
  });

  it("still quotes domestic UA472 as a secondary clean fixture", () => {
    const domestic = getFixtureByKind("domestic", frozen);
    assert.equal(domestic.snapshot.carrier, "UA");
    assert.equal(domestic.snapshot.flightNumber, "472");
    assert.equal(domestic.snapshot.origin, "EWR");
    const quote = quoteFlight({
      carrier: domestic.snapshot.carrier,
      flightNumber: domestic.snapshot.flightNumber,
      serviceDate: domestic.snapshot.serviceDate,
      origin: domestic.snapshot.origin,
    }, frozen);
    assert.equal(quote.ok, true);
    if (!quote.ok) return;
    assert.equal(quote.premium, 9);
    assert.equal(quote.maxPayout, 200);
  });

  it("locks UA837 arrival $9 and takeoff $14; payout scales 100/150/200", () => {
    const clean = getFixtureByKind("clean", frozen);
    const base = {
      carrier: clean.snapshot.carrier,
      flightNumber: clean.snapshot.flightNumber,
      serviceDate: clean.snapshot.serviceDate,
      origin: clean.snapshot.origin,
    };

    const arrival30 = quoteFlight({ ...base, product: "arrival", minutesLate: 30 }, frozen);
    assert.equal(arrival30.ok, true);
    if (!arrival30.ok) return;
    assert.equal(arrival30.premium, 9);
    assert.equal(arrival30.premiumCents, 900);
    assert.equal(arrival30.payoutCents, 10_000);
    assert.equal(arrival30.maxPayout, 100);

    const arrival45 = quoteFlight({ ...base, product: "arrival", minutesLate: 45 }, frozen);
    assert.equal(arrival45.ok, true);
    if (!arrival45.ok) return;
    assert.equal(arrival45.premium, 9);
    assert.equal(arrival45.payoutCents, 15_000);
    assert.equal(arrival45.maxPayout, 150);

    const takeoff60 = quoteFlight({ ...base, product: "takeoff", minutesLate: 60 }, frozen);
    assert.equal(takeoff60.ok, true);
    if (!takeoff60.ok) return;
    assert.equal(takeoff60.premium, 14);
    assert.equal(takeoff60.premiumCents, 1_400);
    assert.equal(takeoff60.payoutCents, 20_000);
    assert.equal(takeoff60.maxPayout, 200);

    const takeoff30 = quoteFlight({ ...base, product: "takeoff", minutesLate: 30 }, frozen);
    assert.equal(takeoff30.ok, true);
    if (!takeoff30.ok) return;
    assert.equal(takeoff30.premium, 14);
    assert.equal(takeoff30.payoutCents, 10_000);

    const takeoff45 = quoteFlight({ ...base, product: "takeoff", minutesLate: 45 }, frozen);
    assert.equal(takeoff45.ok, true);
    if (!takeoff45.ok) return;
    assert.equal(takeoff45.premium, 14);
    assert.equal(takeoff45.payoutCents, 15_000);

    const ignoredOverride = quoteFlight({ ...base, minutesLate: 60, maxPayout: 50 }, frozen);
    assert.equal(ignoredOverride.ok, true);
    if (!ignoredOverride.ok) return;
    assert.equal(ignoredOverride.premium, 9);
    assert.equal(ignoredOverride.payoutCents, 20_000);

    const day1 = day1QuoteFlight({ ...base, tauMinutes: 30 }, frozen);
    assert.equal(day1.ok, true);
    if (!day1.ok) return;
    assert.equal(day1.premium, 9);
    assert.equal(day1.maxPayout, 100);

    assert.equal(arrival30.p, CLEAN_DEMO_PRIOR_BY_MINUTES_LATE[30]);
    assert.equal(arrival45.p, CLEAN_DEMO_PRIOR_BY_MINUTES_LATE[45]);
    assert.equal(takeoff60.p, CLEAN_DEMO_PRIOR_BY_MINUTES_LATE[60]);
    assert.equal(houseEvUsd("takeoff", 30, 0.08), 6);
    assert.equal(houseEvUsd("takeoff", 45, 0.05), 6.5);
    assert.equal(houseEvUsd("takeoff", 60, 0.035), 7);
    assert.equal(houseEvUsd("arrival", 30, 0.08), 1);
    assert.equal(houseEvUsd("arrival", 45, 0.05), 1.5);
    assert.equal(houseEvUsd("arrival", 60, 0.035), 2);
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

  it("refuses UNDERWRITE_REJECT on pool-average p, not on UA837 clean_demo_prior", () => {
    const pool = getFixtureByKind("pool", frozen);
    const poolQuote = quoteSnapshot(pool.snapshot, {
      carrier: pool.snapshot.carrier,
      flightNumber: pool.snapshot.flightNumber,
      serviceDate: pool.snapshot.serviceDate,
      origin: pool.snapshot.origin,
      product: "arrival",
      minutesLate: 60,
    }, frozen);
    assert.equal(poolQuote.ok, false);
    if (poolQuote.ok) return;
    assert.equal(poolQuote.refusal, "UNDERWRITE_REJECT");

    const takeoffPool = quoteSnapshot(pool.snapshot, {
      carrier: pool.snapshot.carrier,
      flightNumber: pool.snapshot.flightNumber,
      serviceDate: pool.snapshot.serviceDate,
      origin: pool.snapshot.origin,
      product: "takeoff",
      minutesLate: 30,
    }, frozen);
    assert.equal(takeoffPool.ok, false);
    if (takeoffPool.ok) return;
    assert.equal(takeoffPool.refusal, "UNDERWRITE_REJECT");

    const clean = getFixtureByKind("clean", frozen);
    const singleP = {
      ...clean.snapshot,
      historicalDelayProb: 0.07,
      historicalDelayProbByMinutesLate: undefined,
    };
    const stale = quoteSnapshot(singleP, {
      carrier: singleP.carrier,
      flightNumber: singleP.flightNumber,
      serviceDate: singleP.serviceDate,
      origin: singleP.origin,
      product: "arrival",
      minutesLate: 60,
    }, frozen);
    assert.equal(stale.ok, false);
    if (stale.ok) return;
    assert.equal(stale.refusal, "UNDERWRITE_REJECT");
  });

  it("keeps TARGET_LAMBDA and p_max tables, plus EXPOSURE_CAP copy", () => {
    assert.equal(TARGET_LAMBDA, 1.45);
    assert.equal(pMaxFor("takeoff", 30), 0.0966);
    assert.equal(pMaxFor("takeoff", 45), 0.0644);
    assert.equal(pMaxFor("takeoff", 60), 0.0483);
    assert.equal(pMaxFor("arrival", 30), 0.0621);
    assert.equal(pMaxFor("arrival", 45), 0.0414);
    assert.equal(pMaxFor("arrival", 60), 0.0310);
    assert.deepEqual(P_MAX_AT_TARGET_LAMBDA.takeoff, { 30: 0.0966, 45: 0.0644, 60: 0.0483 });
    assert.equal(pHatFor(getFixtureByKind("clean", frozen).snapshot, 45), 0.05);
    assert.equal(exceedsUnderwriteCap(0.18, "arrival", 30), true);
    assert.equal(exceedsUnderwriteCap(0.08, "arrival", 30), false);
    assert.ok(REFUSAL_CODES.includes("UNDERWRITE_REJECT"));
    assert.ok(REFUSAL_CODES.includes("EXPOSURE_CAP"));
    assert.equal(REFUSAL_COPY.EXPOSURE_CAP.title, "The book is at its line.");
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
    const settle = getFixtureByKind("hot", frozen);
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
    const a = humanKeyFromNullifier(1n, "UA837|2026-09-19|SFO");
    const b = humanKeyFromNullifier(1n, "UA837|2026-09-19|SFO");
    const c = humanKeyFromNullifier(1n, "B6148|2026-09-08|BOS");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(ticketNumberFromPolicyId(1n), "LG-1");
    assert.equal(travelerStatus(null), "NOT_ISSUED");
  });
});
