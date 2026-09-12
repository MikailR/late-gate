import { addHours } from "@/lib/time";
import { cutoffHours } from "@/lib/pricing/underwrite";
import { parseFlightKey } from "@/lib/flights/flight-key";
import { humanTillEnv } from "@/lib/config/env";
import { quoteFlight } from "@/lib/domain/quote";
import { DEFAULT_CONFIGURE, type Configure } from "@/lib/domain/types";
import { flightKeyHash } from "@/lib/domain/keys";
import { policyFromQuote, type TicketIssueRequest, type TicketIssueResult } from "@/lib/domain/policy";
import { refuseUnverified } from "@/lib/domain/refusal";
import { DEMO_POT_GRANT_CENTS } from "@/lib/domain/pot";
import { getStore } from "@/lib/store";
import { writeOpened } from "@/lib/ledger";
import { readWorldSession } from "@/lib/world";

/**
 * Buy rail: re-quote → World session → pot debit (USD) → pending Policy → ledger stub.
 * Traveler never signs a chain tx. HBAR is not touched.
 * // status: implemented against store + stubs. Live ledger / World still env-gated.
 */
export async function issueTicket(
  input: TicketIssueRequest,
  now = new Date(),
): Promise<TicketIssueResult> {
  const parsed = parseFlightKey(input.flightKey);
  if (!parsed) {
    const refusal = refuseUnverified(60, input.flightKey);
    return {
      ok: false,
      status: "NOT_ISSUED",
      refusal: "NOT_FOUND",
      title: refusal.title,
      reason: refusal.reason,
      detail: refusal.detail,
      flightKey: input.flightKey,
    };
  }

  const session = readWorldSession(input.worldSession, now);
  if (!session || session.flightKey !== input.flightKey) {
    const refusal = refuseUnverified(
      input.configure?.minutesLate ?? DEFAULT_CONFIGURE.minutesLate,
      input.flightKey,
    );
    return {
      ok: false,
      status: "NOT_ISSUED",
      refusal: "UNVERIFIED",
      title: refusal.title,
      reason: refusal.reason,
      detail: refusal.detail,
      flightKey: input.flightKey,
    };
  }

  const configure: Configure = input.configure ?? DEFAULT_CONFIGURE;
  const quote = quoteFlight(
    {
      ...parsed,
      product: configure.product,
      minutesLate: configure.minutesLate,
    },
    now,
  );

  if (!quote.ok) {
    return {
      ok: false,
      status: "NOT_ISSUED",
      refusal: quote.refusal,
      title: quote.title,
      reason: quote.reason,
      detail: quote.detail,
      flightKey: quote.flightKey,
    };
  }

  const store = getStore();
  const existing = await store.getHumanBinding(session.humanKey);
  if (existing) {
    return {
      ok: false,
      status: "NOT_ISSUED",
      refusal: "DUPLICATE",
      title: "One ticket per person per flight.",
      reason: `This flight already has a stub in your name. You already hold ${existing.ticketNumber}.`,
      detail:
        "The gate check is there so one person cannot take every seat on a hub that is already slipping.",
      flightKey: input.flightKey,
      existingPolicyId: existing.policyId,
    };
  }

  const ownerKey = session.humanKey;
  let pot = await store.getPot(ownerKey);
  const grant = humanTillEnv().demoGrantCents || DEMO_POT_GRANT_CENTS;
  if (pot.balanceCents === 0) {
    pot = await store.creditPot(ownerKey, grant, "demo-grant");
  }

  const premiumCents = quote.premiumCents;
  try {
    pot = await store.debitPot(ownerKey, premiumCents, `ticket:${quote.flightKey}`);
  } catch {
    return {
      ok: false,
      status: "NOT_ISSUED",
      refusal: "UNVERIFIED",
      title: "The pot is short.",
      reason: `This ticket is ${premiumCents} cents and the pot has ${pot.balanceCents}.`,
      detail: "The desk grants a demo pot on first check-in. Ask the house to top it up.",
      flightKey: quote.flightKey,
    };
  }

  const policyId = await store.nextPolicyId();
  const cutoffAt = addHours(new Date(quote.flight.scheduledDeparture), -cutoffHours()).toISOString();
  const policy = policyFromQuote(quote, {
    policyId,
    humanKey: session.humanKey,
    now,
    cutoffAt,
  });

  await store.putPolicy(policy);
  await store.putHumanBinding({
    humanKey: session.humanKey,
    flightKey: quote.flightKey,
    policyId: policyId.toString(),
    ticketNumber: policy.ticketNumber,
    boundAt: policy.openedAt,
  });
  await store.lockQuote(quote);

  const write = await writeOpened({
    kind: "PolicyOpened",
    policyId: policyId.toString(),
    flightKeyHash: flightKeyHash(quote.flightKey),
    flightKey: quote.flightKey,
    humanKey: session.humanKey,
    premiumCents: policy.premiumCents,
    payoutCents: policy.payoutCents,
    tauMinutes: policy.tauMinutes,
    scheduledArrival: Math.floor(Date.parse(policy.scheduledArrival) / 1000),
    cutoffAt: Math.floor(Date.parse(policy.cutoffAt) / 1000),
  });

  policy.ledgerTx = write.txHash;
  await store.putPolicy(policy);

  return {
    ok: true,
    policy,
    ticketNumber: policy.ticketNumber,
    potBalanceCents: pot.balanceCents,
  };
}
