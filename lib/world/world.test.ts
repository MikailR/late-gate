import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import { generatePrivateKey } from "viem/accounts";
import { GET, POST } from "@/app/api/world/rp-context/route";
import { isWorldConfigured, worldEnv } from "@/lib/config/env";
import { signWorldRpContext } from "./rp-context";
import { verifyWorldProof } from "./verify";

const WORLD_KEYS = [
  "NEXT_PUBLIC_WORLD_APP_ID",
  "WORLD_APP_ID",
  "NEXT_PUBLIC_WORLD_RP_ID",
  "WORLD_RP_ID",
  "WORLD_ACTION",
  "WORLD_ENV",
  "WORLD_PRESET",
  "WORLD_SESSION_SECRET",
  "WORLD_RP_SIGNING_KEY",
] as const;

const original: Record<string, string | undefined> = {};
for (const key of WORLD_KEYS) {
  original[key] = process.env[key];
}

function clearWorldEnv(): void {
  for (const key of WORLD_KEYS) delete process.env[key];
}

describe("World shippable defaults", () => {
  beforeEach(clearWorldEnv);
  after(() => {
    for (const key of WORLD_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("defaults to sandbox + orbLegacy + late-gate-ticket", () => {
    const env = worldEnv();
    assert.equal(env.environment, "sandbox");
    assert.equal(env.preset, "orbLegacy");
    assert.equal(env.action, "late-gate-ticket");
    assert.equal(isWorldConfigured(), false);
  });

  it("does not treat selfieCheckLegacy as configured without TFH creds", () => {
    process.env.WORLD_PRESET = "selfieCheckLegacy";
    const env = worldEnv();
    assert.equal(env.preset, "selfieCheckLegacy");
    assert.equal(isWorldConfigured(), false);
  });

  it("issues a stub humanKey session when World app_id is unset", async () => {
    const result = await verifyWorldProof({
      flightKey: "UA837|2026-09-19|SFO",
      stubNullifier: "demo-human-a",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.stub, true);
    assert.equal(result.preset, "orbLegacy");
    assert.match(result.humanKey, /^0x[0-9a-f]{64}$/);
    assert.ok(result.worldSession.includes("."));
  });

  it("refuses an empty IDKit payload once World is configured — no fake selfie", async () => {
    process.env.NEXT_PUBLIC_WORLD_APP_ID = "app_test";
    process.env.NEXT_PUBLIC_WORLD_RP_ID = "rp_test";
    const result = await verifyWorldProof({
      flightKey: "UA837|2026-09-19|SFO",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.refusal, "UNVERIFIED");
  });

  it("refuses rp_context without WORLD_RP_SIGNING_KEY — no forged signature", async () => {
    process.env.NEXT_PUBLIC_WORLD_RP_ID = "rp_test_fake";
    const helper = signWorldRpContext();
    assert.equal(helper.ok, false);
    if (helper.ok) return;
    assert.equal(helper.refusal, "UNVERIFIED");
    assert.ok(!("rp_context" in helper));

    const res = await POST();
    assert.equal(res.status, 503);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.refusal, "UNVERIFIED");
    assert.equal(body.rp_context, undefined);
    assert.ok(typeof body.reason === "string" && body.reason.length > 0);
  });

  it("refuses rp_context without rp_id even when a signing key is set", async () => {
    process.env.WORLD_RP_SIGNING_KEY = generatePrivateKey();
    const helper = signWorldRpContext();
    assert.equal(helper.ok, false);
    if (helper.ok) return;
    assert.equal(helper.refusal, "UNVERIFIED");
    assert.ok(!("rp_context" in helper));

    const res = await GET();
    assert.equal(res.status, 503);
  });

  it("returns 500 UNVERIFIED when signRequest throws — still no stub signature", async () => {
    process.env.WORLD_RP_SIGNING_KEY = "not-a-secp256k1-key";
    process.env.NEXT_PUBLIC_WORLD_RP_ID = "rp_test_fake";
    const helper = signWorldRpContext();
    assert.equal(helper.ok, false);
    if (helper.ok) return;
    assert.equal(helper.refusal, "UNVERIFIED");
    assert.ok(!("rp_context" in helper));

    const res = await POST();
    assert.equal(res.status, 500);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.refusal, "UNVERIFIED");
    assert.equal(body.rp_context, undefined);
  });

  it("signs rp_context with a generated test key and never returns the key", async () => {
    const testKey = generatePrivateKey();
    process.env.WORLD_RP_SIGNING_KEY = testKey;
    process.env.NEXT_PUBLIC_WORLD_RP_ID = "rp_test_fake";

    const helper = signWorldRpContext();
    assert.equal(helper.ok, true);
    if (!helper.ok) return;
    assert.equal(helper.rp_context.rp_id, "rp_test_fake");
    assert.match(helper.rp_context.nonce, /^0x[0-9a-fA-F]+$/);
    assert.match(helper.rp_context.signature, /^0x[0-9a-fA-F]+$/);
    assert.equal(typeof helper.rp_context.created_at, "number");
    assert.equal(typeof helper.rp_context.expires_at, "number");
    assert.equal(helper.rp_context.expires_at - helper.rp_context.created_at, 300);
    assert.ok(!JSON.stringify(helper).includes(testKey.slice(2)));

    const res = await POST();
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      rp_context: {
        rp_id: string;
        nonce: string;
        created_at: number;
        expires_at: number;
        signature: string;
      };
    };
    assert.equal(body.ok, true);
    assert.equal(body.rp_context.rp_id, "rp_test_fake");
    assert.match(body.rp_context.nonce, /^0x[0-9a-fA-F]+$/);
    assert.match(body.rp_context.signature, /^0x[0-9a-fA-F]+$/);
    assert.equal(typeof body.rp_context.created_at, "number");
    assert.equal(typeof body.rp_context.expires_at, "number");
    const dumped = JSON.stringify(body);
    assert.ok(!dumped.includes(testKey));
    assert.ok(!dumped.includes(testKey.slice(2)));
  });
});
