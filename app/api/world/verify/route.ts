import { verifyWorldProof } from "@/lib/world";

export const dynamic = "force-dynamic";

/** // status: stub-ok without World app_id. Live v4 verify TODO. */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const row = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const flightKey = typeof row.flightKey === "string" ? row.flightKey : "";
  if (!flightKey) {
    return Response.json(
      { ok: false, refusal: "UNVERIFIED", reason: "flightKey is required." },
      { status: 400 },
    );
  }

  const result = await verifyWorldProof({
    flightKey,
    rpId: typeof row.rp_id === "string" ? row.rp_id : undefined,
    idkitResponse:
      row.idkitResponse && typeof row.idkitResponse === "object"
        ? (row.idkitResponse as Record<string, unknown>)
        : undefined,
    stubNullifier: typeof row.stubNullifier === "string" ? row.stubNullifier : undefined,
  });

  const status = result.ok ? 200 : result.refusal === "DUPLICATE" ? 409 : 401;
  return Response.json(result, { status });
}
