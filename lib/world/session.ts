import { createHmac, timingSafeEqual } from "node:crypto";
import { worldEnv } from "@/lib/config/env";
import type { Hex } from "@/lib/domain/types";
import type { WorldSessionClaims } from "./types";

const TTL_MS = 5 * 60 * 1000;

function secret(): string {
  return worldEnv().sessionSecret ?? "late-gate-dev-world-session";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** // status: implemented (HMAC). Never put the raw nullifier in a cookie the traveler can read as hex? It is server-issued JSON, not shown in UI. */
export function createWorldSession(input: {
  flightKey: string;
  humanKey: Hex;
  nullifier: string;
  now?: Date;
}): { token: string; expiresAt: string } {
  const issuedAt = (input.now ?? new Date()).getTime();
  const claims: WorldSessionClaims = {
    flightKey: input.flightKey,
    humanKey: input.humanKey,
    nullifier: input.nullifier,
    issuedAt,
    expiresAt: issuedAt + TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  return {
    token: `${payload}.${sign(payload)}`,
    expiresAt: new Date(claims.expiresAt).toISOString(),
  };
}

export function readWorldSession(token: string, now = new Date()): WorldSessionClaims | null {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as WorldSessionClaims;
    if (claims.expiresAt <= now.getTime()) return null;
    return claims;
  } catch {
    return null;
  }
}
