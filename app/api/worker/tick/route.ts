import { workerKey } from "@/lib/config/env";
import { settleOpenPolicies } from "@/lib/settlement";

export const dynamic = "force-dynamic";

/** House worker. Traveler never calls this. `now` is honoured when DEMO_MODE=1. */
export async function POST(request: Request) {
  const expected = workerKey();
  const presented = request.headers.get("x-worker-key");
  if (expected && presented !== expected) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let now = new Date();
  if (process.env.DEMO_MODE === "1") {
    try {
      const body = (await request.json()) as { now?: string };
      if (body.now) now = new Date(body.now);
    } catch {
      now = new Date();
    }
  }

  const result = await settleOpenPolicies(now);
  return Response.json({
    ok: true,
    scanned: result.scanned,
    settled: result.settled.map((policy) => ({
      policyId: policy.policyId.toString(),
      ticketNumber: policy.ticketNumber,
      status: policy.status,
      outcome: policy.outcome,
    })),
    skipped: result.skipped,
  });
}
