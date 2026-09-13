import { isWorldRpSigningConfigured, signWorldRpContext } from "@/lib/world";

export const dynamic = "force-dynamic";

/**
 * IDKit 4.x rp_context for the Mini App.
 * Server-only WORLD_RP_SIGNING_KEY — never returned. Action locked to late-gate-ticket.
 * POST is primary; GET aliases the same handler. No body is read (ignore client action).
 */
function handleRpContext(): Response {
  try {
    const result = signWorldRpContext();
    if (result.ok) {
      return Response.json(result, { status: 200 });
    }
    const status = isWorldRpSigningConfigured() ? 500 : 503;
    return Response.json(result, { status });
  } catch {
    return Response.json(
      {
        ok: false,
        refusal: "UNVERIFIED",
        reason: "Rails failed to sign World ID rp_context.",
      },
      { status: 500 },
    );
  }
}

export async function POST(): Promise<Response> {
  return handleRpContext();
}

export async function GET(): Promise<Response> {
  return handleRpContext();
}
