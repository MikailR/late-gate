import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  USDC_SEPOLIA_ADDRESS,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  assetsForShares,
  isUsdcLiveEnv,
  lpDeposit,
  lpWithdraw,
  payPremium,
  payout,
  sharesForDeposit,
  sharesForWithdraw,
} from "./index";
import { LATE_GATE_VAULT_ABI } from "./vault-abi";
import type { UsdcExecEnv, VaultSender } from "./types";

const TRAVELER = "0x1111111111111111111111111111111111111111" as Address;
const LP = "0x2222222222222222222222222222222222222222" as Address;
const VAULT = "0x3333333333333333333333333333333333333333" as Address;
const LIVE_TX = ("0x" + "ab".repeat(32)) as Hex;

const HOUSE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const HOUSE = privateKeyToAccount(HOUSE_KEY).address;

function liveEnv(overrides: Partial<UsdcExecEnv> = {}): UsdcExecEnv {
  return {
    rpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
    chainId: WORLDCHAIN_SEPOLIA_CHAIN_ID,
    usdcAddress: USDC_SEPOLIA_ADDRESS,
    housePrivateKey: HOUSE_KEY,
    vaultAddress: VAULT,
    explorerUrl: "https://worldchain-sepolia.explorer.alchemy.com",
    ...overrides,
  };
}

function mockSender(house = HOUSE, txHash: Hex = LIVE_TX): VaultSender & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async readHouse() {
      return house;
    },
    async write(call) {
      calls.push(call);
      return txHash;
    },
    async approveUsdc(amount) {
      calls.push({ functionName: "approve", args: [VAULT, amount] });
      return ("0x" + "cd".repeat(32)) as Hex;
    },
  };
}

describe("vault share math", () => {
  it("mints 1:1 on first deposit, then pro-rata; premiums do not mint", () => {
    const first = sharesForDeposit(100_000_000n, 0n, 0n);
    assert.equal(first, 100_000_000n);

    // $9 premium lands without minting — assets 109, shares 100
    const afterPremiumAssets = 109_000_000n;
    const second = sharesForDeposit(100_000_000n, 100_000_000n, afterPremiumAssets);
    assert.equal(second, (100_000_000n * 100_000_000n) / afterPremiumAssets);

    const burned = sharesForWithdraw(50_000_000n, 100_000_000n, afterPremiumAssets);
    assert.equal(burned, (50_000_000n * 100_000_000n) / afterPremiumAssets);
    assert.equal(assetsForShares(100_000_000n, 100_000_000n, afterPremiumAssets), afterPremiumAssets);
  });

  it("rejects insolvent deposits and oversize withdraws", () => {
    assert.throws(() => sharesForDeposit(1_000_000n, 100_000_000n, 0n), /insolvent/);
    assert.throws(() => sharesForWithdraw(1n, 0n, 0n), /empty vault/);
    assert.throws(() => sharesForWithdraw(200n, 100n, 100n), /insufficient assets/);
  });
});

describe("vault ABI the Mini App needs", () => {
  it("exports payPremium, payout, deposit, withdraw and PremiumPaid", () => {
    const names = LATE_GATE_VAULT_ABI.map((item) => ("name" in item ? String(item.name) : item.type));
    for (const name of ["payPremium", "collect", "payout", "deposit", "depositFor", "withdraw", "house"]) {
      assert.ok(names.includes(name), name);
    }
    assert.ok(names.includes("PremiumPaid"));
    assert.ok(names.includes("PayoutSent"));
    assert.ok(names.includes("LpDeposited"));
    assert.ok(names.includes("LpWithdrawn"));
  });
});

describe("live vs stub till routing", () => {
  it("keeps stub receipts when live env is missing", async () => {
    assert.equal(isUsdcLiveEnv({}), false);
    const paid = await payPremium({
      from: TRAVELER,
      amountCents: 900,
      flightKey: "UA837|2026-09-19|SFO",
    });
    assert.equal(paid.ok, true);
    if (!paid.ok) return;
    assert.equal(paid.stub, true);
    assert.equal(paid.implemented, false);
    assert.equal(paid.amountUnits, "9000000");
    assert.match(paid.todo, /TODO\(usdc\)/);
  });

  it("sets implemented:true only after a real live tx hash", async () => {
    const sender = mockSender();
    const paid = await payPremium(
      {
        from: TRAVELER,
        amountCents: 1_400,
        flightKey: "UA837|2026-09-19|SFO",
      },
      { live: true, env: liveEnv(), sender },
    );
    assert.equal(paid.ok, true);
    if (!paid.ok) return;
    assert.equal(paid.stub, false);
    assert.equal(paid.implemented, true);
    assert.equal(paid.txHash, LIVE_TX);
    assert.equal(paid.todo, "");
    assert.equal(paid.to, VAULT);
    assert.equal(paid.amountUnits, "14000000");
    assert.deepEqual(sender.calls[0], { functionName: "payPremium", args: [TRAVELER, 14_000_000n] });
  });

  it("records a Mini App transfer hash without a second pull", async () => {
    const sender = mockSender();
    const paid = await payPremium(
      {
        from: TRAVELER,
        amountCents: 900,
        flightKey: "UA837|2026-09-19|SFO",
        txHash: LIVE_TX,
      },
      { live: true, env: liveEnv(), sender },
    );
    assert.equal(paid.ok, true);
    if (!paid.ok) return;
    assert.equal(paid.implemented, true);
    assert.equal(paid.txHash, LIVE_TX);
    assert.equal(sender.calls.length, 0);
  });

  it("live payout writes vault.payout and refuses the stub traveler", async () => {
    const sender = mockSender();
    const credit = await payout(
      { to: TRAVELER, amountCents: 20_000, policyId: "1", ticketNumber: "LG-1" },
      { live: true, env: liveEnv(), sender },
    );
    assert.equal(credit.ok, true);
    if (!credit.ok) return;
    assert.equal(credit.implemented, true);
    assert.equal(credit.from, VAULT);
    assert.deepEqual(sender.calls[0], { functionName: "payout", args: [TRAVELER, 200_000_000n] });

    const dead = await payout(
      { to: "0x000000000000000000000000000000000000dEaD", amountCents: 20_000, policyId: "1" },
      { live: true, env: liveEnv(), sender },
    );
    assert.equal(dead.ok, false);
    if (dead.ok) return;
    assert.equal(dead.error, "INVALID_ADDRESS");
  });

  it("house lpDeposit approves then deposit(); LP uses depositFor", async () => {
    const houseSender = mockSender();
    const houseIn = await lpDeposit(
      { from: HOUSE, amountCents: 50_000, role: "house" },
      { live: true, env: liveEnv(), sender: houseSender },
    );
    assert.equal(houseIn.ok, true);
    if (!houseIn.ok) return;
    assert.equal(houseIn.implemented, true);
    assert.equal((houseSender.calls[0] as { functionName: string }).functionName, "approve");
    assert.deepEqual(houseSender.calls[1], { functionName: "deposit", args: [500_000_000n] });

    const lpSender = mockSender();
    const lpIn = await lpDeposit(
      { from: LP, amountCents: 10_000, role: "lp" },
      { live: true, env: liveEnv(), sender: lpSender },
    );
    assert.equal(lpIn.ok, true);
    if (!lpIn.ok) return;
    assert.deepEqual(lpSender.calls[0], { functionName: "depositFor", args: [LP, 100_000_000n] });
  });

  it("lpWithdraw checks the house signer before sending", async () => {
    const okSender = mockSender(HOUSE);
    const withdrawn = await lpWithdraw(
      { to: LP, amountCents: 10_000, role: "lp" },
      { live: true, env: liveEnv(), sender: okSender },
    );
    assert.equal(withdrawn.ok, true);
    if (!withdrawn.ok) return;
    assert.equal(withdrawn.implemented, true);
    assert.deepEqual(okSender.calls[0], { functionName: "withdraw", args: [LP, 100_000_000n] });

    const other = privateKeyToAccount(generatePrivateKey()).address;
    const bad = await lpWithdraw(
      { to: LP, amountCents: 10_000, role: "lp" },
      { live: true, env: liveEnv(), sender: mockSender(other) },
    );
    assert.equal(bad.ok, false);
    if (bad.ok) return;
    assert.equal(bad.error, "NOT_HOUSE");
    assert.equal(bad.implemented, false);
    assert.equal(bad.stub, false);
  });

  it("live env helper requires WORLDCHAIN_RPC + house key + vault", () => {
    assert.equal(isUsdcLiveEnv({}), false);
    assert.equal(isUsdcLiveEnv({ rpcUrl: "https://example.invalid", housePrivateKey: HOUSE_KEY }), false);
    assert.equal(
      isUsdcLiveEnv({
        rpcUrl: "https://example.invalid",
        housePrivateKey: HOUSE_KEY,
        vaultAddress: VAULT,
      }),
      true,
    );
  });
});
