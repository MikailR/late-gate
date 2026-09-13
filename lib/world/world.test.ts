import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import { isWorldConfigured, worldEnv } from "@/lib/config/env";
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
});
