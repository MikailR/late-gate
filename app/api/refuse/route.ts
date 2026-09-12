import { isRefusalCode } from "@/lib/domain/refusal";
import { flightKeyHash } from "@/lib/domain/keys";
import { writeRefused } from "@/lib/ledger";

type LoggedRefusal = {
  at: string;
  flightKey?: string;
  refusal?: string;
  reason?: string;
  ledgerTx?: string;
};

const refusals: LoggedRefusal[] = [];

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const record: LoggedRefusal = {
    at: new Date().toISOString(),
  };

  if (body && typeof body === "object") {
    const row = body as Record<string, unknown>;
    if (typeof row.flightKey === "string") record.flightKey = row.flightKey;
    if (typeof row.refusal === "string") record.refusal = row.refusal;
    if (typeof row.reason === "string") record.reason = row.reason;
  }

  // Dual-write: same backend files the refusal on Base (stub until RPC/key).
  // Traveler never signs. Fire-and-forget — do not fail the Day-1 log on ledger miss.
  if (record.flightKey && record.refusal && isRefusalCode(record.refusal)) {
    try {
      const write = await writeRefused({
        kind: "PolicyRefused",
        flightKeyHash: flightKeyHash(record.flightKey),
        flightKey: record.flightKey,
        code: record.refusal,
        estDelayMin: 0,
        at: Math.floor(Date.now() / 1000),
      });
      record.ledgerTx = write.txHash;
    } catch {
      // keep the in-memory log even if the stub write throws
    }
  }

  refusals.unshift(record);
  if (refusals.length > 50) refusals.length = 50;

  return Response.json({ ok: true, logged: record, count: refusals.length });
}

export async function GET() {
  return Response.json({ ok: true, refusals });
}
