import { signRequest } from "@worldcoin/idkit-core/signing";
import { worldEnv } from "@/lib/config/env";

const RP_CONTEXT_TTL_SECONDS = 300;

export type WorldRpContext = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

export type WorldRpContextSuccess = {
  ok: true;
  rp_context: WorldRpContext;
};

export type WorldRpContextFailure = {
  ok: false;
  refusal: "UNVERIFIED";
  reason: string;
};

export type WorldRpContextResult = WorldRpContextSuccess | WorldRpContextFailure;

/** True only when rails can attempt a real RP signature — never invent one. */
export function isWorldRpSigningConfigured(): boolean {
  const env = worldEnv();
  return Boolean(env.signingKey && env.rpId);
}

/**
 * Sign an IDKit 4.x `rp_context` on the rails.
 * Action is locked to `worldEnv().action` (default `late-gate-ticket`).
 * Never returns `WORLD_RP_SIGNING_KEY`. Missing config refuses honestly — no stub sig.
 * // status: implemented. Gated on WORLD_RP_SIGNING_KEY + rp_id.
 */
export function signWorldRpContext(): WorldRpContextResult {
  const env = worldEnv();
  if (!env.signingKey || !env.rpId) {
    return {
      ok: false,
      refusal: "UNVERIFIED",
      reason: "Rails cannot sign World ID rp_context yet — WORLD_RP_SIGNING_KEY or rp_id is missing.",
    };
  }

  try {
    const { sig, nonce, createdAt, expiresAt } = signRequest({
      signingKeyHex: env.signingKey,
      action: env.action,
      ttl: RP_CONTEXT_TTL_SECONDS,
    });
    return {
      ok: true,
      rp_context: {
        rp_id: env.rpId,
        nonce,
        created_at: createdAt,
        expires_at: expiresAt,
        signature: sig,
      },
    };
  } catch {
    return {
      ok: false,
      refusal: "UNVERIFIED",
      reason: "Rails failed to sign World ID rp_context.",
    };
  }
}
