import type { Hex, HumanKey } from "@/lib/domain/types";

export type WorldVerifyRequest = {
  flightKey: string;
  rpId?: string;
  /** IDKit v4 payload. Passed through to developer.world.org when configured. */
  idkitResponse?: Record<string, unknown>;
  /** Local / demo only. Ignored when World app_id is configured unless WORLD_ALLOW_STUB=1. */
  stubNullifier?: string;
};

export type WorldVerifySuccess = {
  ok: true;
  flightKey: string;
  humanKey: HumanKey;
  worldSession: string;
  expiresAt: string;
  stub: boolean;
  preset: "orbLegacy" | "selfieCheckLegacy";
};

export type WorldVerifyFailure = {
  ok: false;
  refusal: "UNVERIFIED" | "DUPLICATE";
  title: string;
  reason: string;
  detail: string;
  flightKey: string;
  existingPolicyId?: string;
};

export type WorldVerifyResult = WorldVerifySuccess | WorldVerifyFailure;

export type WorldSessionClaims = {
  flightKey: string;
  humanKey: Hex;
  nullifier: string;
  issuedAt: number;
  expiresAt: number;
};
