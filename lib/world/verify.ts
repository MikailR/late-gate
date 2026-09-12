import { createHash } from "node:crypto";
import { isWorldConfigured, worldEnv } from "@/lib/config/env";
import { humanKeyFromNullifier } from "@/lib/domain/keys";
import { REFUSAL_COPY } from "@/lib/domain/refusal";
import { parseFlightKey } from "@/lib/flights/flight-key";
import { getStore } from "@/lib/store";
import { createWorldSession } from "./session";
import type { WorldVerifyRequest, WorldVerifyResult } from "./types";

export { isWorldConfigured };

function stubNullifier(flightKey: string, raw?: string): bigint {
  const seed = raw?.trim() || `stub:${flightKey}`;
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 16);
  return BigInt(`0x${hex}`);
}

function unverified(flightKey: string, detail?: string): WorldVerifyResult {
  const copy = REFUSAL_COPY.UNVERIFIED;
  return {
    ok: false,
    refusal: "UNVERIFIED",
    title: copy.title,
    reason: copy.reason,
    detail: detail ?? copy.detail,
    flightKey,
  };
}

/**
 * Server-side Selfie / World ID verify, then one-human-per-flight.
 * Live: POST idkitResponse to developer.world.org/api/v4/verify/{rp_id}.
 * Stub: deterministic nullifier from stubNullifier or "stub:{flightKey}".
 * Fallback preset is orbLegacy until TFH enables Selfie Check — see FEEDBACK.md.
 * // status: stub implemented; live v4 verify TODO until app_id / rp_id land
 */
export async function verifyWorldProof(input: WorldVerifyRequest): Promise<WorldVerifyResult> {
  const flightKey = input.flightKey.trim();
  if (!parseFlightKey(flightKey)) {
    return unverified(flightKey, "Need a flight key like UA472|2026-09-12|EWR.");
  }

  const env = worldEnv();
  let nullifier: bigint;
  let stub = !isWorldConfigured();

  if (isWorldConfigured() && input.idkitResponse) {
    const live = await verifyLive(env.rpId ?? "", input.idkitResponse, flightKey);
    if (!live.ok) return live;
    nullifier = live.nullifier;
    stub = false;
  } else if (isWorldConfigured() && !input.idkitResponse && !input.stubNullifier) {
    return unverified(flightKey, "Send the IDKit payload. The desk cannot confirm you from an empty proof.");
  } else {
    nullifier = stubNullifier(flightKey, input.stubNullifier);
  }

  const humanKey = humanKeyFromNullifier(nullifier, flightKey);
  const existing = await getStore().getHumanBinding(humanKey);
  if (existing) {
    const copy = REFUSAL_COPY.DUPLICATE;
    return {
      ok: false,
      refusal: "DUPLICATE",
      title: copy.title,
      reason: `This flight already has a stub in your name. You already hold ${existing.ticketNumber}.`,
      detail: copy.detail,
      flightKey,
      existingPolicyId: existing.policyId,
    };
  }

  const session = createWorldSession({
    flightKey,
    humanKey,
    nullifier: nullifier.toString(),
  });

  return {
    ok: true,
    flightKey,
    humanKey,
    worldSession: session.token,
    expiresAt: session.expiresAt,
    stub,
    preset: env.preset,
  };
}

/** // status: TODO — confirm signal_hash helper against @worldcoin/idkit-core once the app_id is live. */
async function verifyLive(
  rpId: string,
  idkitResponse: Record<string, unknown>,
  flightKey: string,
): Promise<{ ok: true; nullifier: bigint } | WorldVerifyResult> {
  try {
    const response = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(idkitResponse),
    });
    const body = (await response.json()) as {
      success?: boolean;
      action?: string;
      nullifier?: string;
      nullifier_hash?: string;
      signal_hash?: string;
      error?: string;
    };
    if (!response.ok || body.success === false) {
      return unverified(flightKey, body.error ?? "World could not confirm the proof.");
    }
    const env = worldEnv();
    if (body.action && body.action !== env.action) {
      return unverified(flightKey, "Proof action did not match late-gate-ticket.");
    }
    const raw = body.nullifier ?? body.nullifier_hash;
    if (!raw) return unverified(flightKey, "Verify response had no nullifier.");
    return { ok: true, nullifier: BigInt(raw) };
  } catch {
    return unverified(flightKey, "Could not reach World verify. Try again.");
  }
}
