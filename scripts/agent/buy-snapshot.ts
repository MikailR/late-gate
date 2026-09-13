/**
 * Consumer agent for the Hedera machine till.
 * 1) GET snapshot without pay → expect 402
 * 2) GET again with stub (or later real) payment → print body + HashScan URL
 *
 * Live Blocky402: set AGENT_HEDERA_* and swap the stub header for wrapFetchWithPayment.
 */
import { getFixtureByKind } from "../../lib/flights/fixtures";
import { STUB_PAYMENT_HEADER } from "../../lib/x402/types";

const base = (process.env.BASE_URL ?? "http://127.0.0.1:47210").replace(/\/$/, "");
const flightKey =
  process.argv[2] ?? process.env.FLIGHT_KEY ?? getFixtureByKind("clean").flightKey;
const url = `${base}/api/oracle/snapshot?flightKey=${encodeURIComponent(flightKey)}`;

async function main() {
  const unpaid = await fetch(url, { cache: "no-store" });
  const unpaidBody = await unpaid.json();
  console.log(`unpaid ${unpaid.status} ${url}`);
  console.log(JSON.stringify(unpaidBody, null, 2));

  if (unpaid.status !== 402) {
    console.error("expected 402 on the unpaid request (machine till is unprotected if this is 200)");
    process.exitCode = 1;
    return;
  }

  const paid = await fetch(url, {
    cache: "no-store",
    headers: { [STUB_PAYMENT_HEADER]: "1" },
  });
  const body = (await paid.json()) as {
    ok?: boolean;
    flightKey?: string;
    snapshot?: { estimatedDelayMinutes?: number };
    receipt?: { amountTinybar?: string; hederaTxId?: string; hashscanUrl?: string; stub?: boolean };
  };

  console.log(`\npaid ${paid.status}`);
  console.log(JSON.stringify(body, null, 2));

  const receipt = body.receipt;
  if (paid.status !== 200 || !receipt) {
    console.error("expected 200 + receipt after stub pay");
    process.exitCode = 1;
    return;
  }

  const hbar = Number(receipt.amountTinybar ?? 0) / 100_000_000;
  console.log(
    `\n${receipt.stub ? "stub-paid" : "paid"} ${hbar} HBAR · ${body.flightKey} · est +${body.snapshot?.estimatedDelayMinutes ?? "?"} min · tx ${receipt.hederaTxId}`,
  );
  console.log(receipt.hashscanUrl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
