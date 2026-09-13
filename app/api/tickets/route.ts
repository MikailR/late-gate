import { isMinutesLate, isStubProduct } from "@/lib/domain/types";
import { issueTicket } from "@/lib/issue";

export const dynamic = "force-dynamic";

/** // status: implemented against store + stubs. Proto 3 checkout should POST here. */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const row = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const flightKey = typeof row.flightKey === "string" ? row.flightKey : "";
  const worldSession = typeof row.worldSession === "string" ? row.worldSession : "";
  const travelerAddress = typeof row.travelerAddress === "string" ? row.travelerAddress : undefined;
  const usdcTxHash = typeof row.usdcTxHash === "string" ? row.usdcTxHash : undefined;
  const minutesLate = row.minutesLate;
  const product = row.product;

  if (!flightKey || !worldSession) {
    return Response.json(
      { ok: false, status: "NOT_ISSUED", refusal: "UNVERIFIED", reason: "Need flightKey and worldSession." },
      { status: 400 },
    );
  }

  const result = await issueTicket({
    flightKey,
    worldSession,
    travelerAddress: travelerAddress?.startsWith("0x")
      ? (travelerAddress as `0x${string}`)
      : undefined,
    usdcTxHash: usdcTxHash?.startsWith("0x") ? (usdcTxHash as `0x${string}`) : undefined,
    configure:
      isMinutesLate(minutesLate) && isStubProduct(product)
        ? { minutesLate, product }
        : isMinutesLate(minutesLate)
          ? { minutesLate, product: "arrival" }
          : undefined,
  });

  const status = result.ok ? 201 : result.refusal === "DUPLICATE" ? 409 : 409;
  return Response.json(result, { status });
}
