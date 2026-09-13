import { officialSnapshot } from "@/lib/oracle";
import { getStore } from "@/lib/store";
import { evaluateSnapshotPayment } from "@/lib/x402";

export const dynamic = "force-dynamic";

/**
 * Machine till: official flight snapshot behind x402.
 * Unpaid → 402 + accepts. Paid (or stub header) → 200 + receipt.
 * Traveler ticket flow never calls this.
 * // status: stub-ok without Blocky402 keys. Live withX402 is TODO.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const flightKey = url.searchParams.get("flightKey")?.trim() ?? "";

  if (!flightKey) {
    return Response.json(
      {
        ok: false,
        error: "MISSING_FLIGHT_KEY",
        detail: "GET /api/oracle/snapshot?flightKey=UA837|2026-09-19|SFO",
      },
      { status: 400 },
    );
  }

  const payment = await evaluateSnapshotPayment(request, flightKey);
  if (!payment.paid) {
    return Response.json(payment.challenge, {
      status: 402,
      headers: {
        "PAYMENT-REQUIRED": "true",
        "Cache-Control": "no-store",
      },
    });
  }

  const official = await officialSnapshot(flightKey);
  if (!official) {
    return Response.json(
      {
        ok: false,
        error: "NOT_FOUND",
        detail: "No snapshot for that flight key. Try a demo fixture.",
      },
      { status: 404 },
    );
  }

  await getStore().enqueueX402Receipt({
    id: payment.receipt.hederaTxId,
    kind: "X402Receipt",
    resource: "snapshot",
    flightKey,
    amountTinybar: payment.receipt.amountTinybar,
    hederaTxId: payment.receipt.hederaTxId,
    payer: payment.receipt.payer,
    at: Math.floor(Date.now() / 1000),
  });

  return Response.json({
    ok: true,
    flightKey: official.flightKey,
    flightKeyHash: official.flightKeyHash,
    snapshot: official.snapshot,
    snapshotHash: official.snapshotHash,
    houseSig: official.houseSig,
    observedAt: official.observedAt,
    receipt: payment.receipt,
  });
}
