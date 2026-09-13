import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  USDC_DECIMALS,
  USDC_SEPOLIA_ADDRESS,
  USDC_UNITS_PER_CENT,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  centsToUsdcUnits,
  dollarsToUsdcUnits,
  formatUsdcUnits,
  lpDeposit,
  lpWithdraw,
  payPremium,
  payout,
  usdcUnitsToCents,
  usdcUnitsToDollars,
} from "./index";

const TRAVELER = "0x1111111111111111111111111111111111111111" as const;
const LP = "0x2222222222222222222222222222222222222222" as const;

describe("USDC amount conversion", () => {
  it("maps locked premiums and payouts to 6-decimal units", () => {
    assert.equal(USDC_DECIMALS, 6);
    assert.equal(WORLDCHAIN_SEPOLIA_CHAIN_ID, 4801);
    assert.equal(USDC_SEPOLIA_ADDRESS, "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88");

    // $9 / $14 premiums, $100 / $150 / $200 payouts
    assert.equal(centsToUsdcUnits(900), 9_000_000n);
    assert.equal(centsToUsdcUnits(1_400), 14_000_000n);
    assert.equal(centsToUsdcUnits(10_000), 100_000_000n);
    assert.equal(centsToUsdcUnits(15_000), 150_000_000n);
    assert.equal(centsToUsdcUnits(20_000), 200_000_000n);

    assert.equal(usdcUnitsToCents(9_000_000n), 900);
    assert.equal(usdcUnitsToCents(14_000_000n), 1_400);
    assert.equal(dollarsToUsdcUnits(9), 9_000_000n);
    assert.equal(usdcUnitsToDollars(200_000_000n), 200);
    assert.equal(centsToUsdcUnits(1), USDC_UNITS_PER_CENT);
    assert.equal(formatUsdcUnits(9_000_000n), "9.000000");
  });

  it("rejects non-integer cents and leftover dust", () => {
    assert.throws(() => centsToUsdcUnits(9.5), /safe integer/);
    assert.throws(() => centsToUsdcUnits(-1), />= 0/);
    assert.throws(() => usdcUnitsToCents(1n), /whole cent/);
    assert.throws(() => usdcUnitsToCents(-10_000n), />= 0/);
  });
});

describe("USDC stub pay / payout shape", () => {
  it("payPremium records a Sepolia USDC stub receipt", async () => {
    const paid = await payPremium({
      from: TRAVELER,
      amountCents: 900,
      flightKey: "UA837|2026-09-19|SFO",
      policyId: "1",
    });

    assert.equal(paid.ok, true);
    if (!paid.ok) return;
    assert.equal(paid.stub, true);
    assert.equal(paid.implemented, false);
    assert.equal(paid.op, "payPremium");
    assert.equal(paid.asset, "USDC");
    assert.equal(paid.decimals, 6);
    assert.equal(paid.chainId, 4801);
    assert.equal(paid.network, "worldchain-sepolia");
    assert.equal(paid.token, USDC_SEPOLIA_ADDRESS);
    assert.equal(paid.from, TRAVELER);
    assert.equal(paid.amountCents, 900);
    assert.equal(paid.amountUnits, "9000000");
    assert.match(paid.txHash, /^0x/);
    assert.match(paid.explorerUrl, /\/tx\/0x/);
    assert.match(paid.todo, /TODO\(usdc\)/);
    assert.equal(paid.flightKey, "UA837|2026-09-19|SFO");
  });

  it("payout records a Sepolia USDC stub credit", async () => {
    const credit = await payout({
      to: TRAVELER,
      amountCents: 20_000,
      policyId: "1",
      ticketNumber: "LG-1",
    });

    assert.equal(credit.ok, true);
    if (!credit.ok) return;
    assert.equal(credit.stub, true);
    assert.equal(credit.implemented, false);
    assert.equal(credit.op, "payout");
    assert.equal(credit.asset, "USDC");
    assert.equal(credit.chainId, 4801);
    assert.equal(credit.to, TRAVELER);
    assert.equal(credit.amountCents, 20_000);
    assert.equal(credit.amountUnits, "200000000");
    assert.equal(credit.ticketNumber, "LG-1");
  });

  it("lpDeposit / lpWithdraw succeed when LP_VAULT_ADDRESS is set", async () => {
    const vault = "0x3333333333333333333333333333333333333333";
    const prev = process.env.LP_VAULT_ADDRESS;
    process.env.LP_VAULT_ADDRESS = vault;
    try {
      const deposit = await lpDeposit({
        from: LP,
        amountCents: 50_000,
        role: "lp",
      });
      assert.equal(deposit.ok, true);
      if (!deposit.ok) return;
      assert.equal(deposit.op, "lpDeposit");
      assert.equal(deposit.to, vault);
      assert.equal(deposit.from, LP);
      assert.equal(deposit.role, "lp");
      assert.equal(deposit.amountUnits, "500000000");

      const withdrawn = await lpWithdraw({
        to: LP,
        amountCents: 10_000,
        role: "lp",
      });
      assert.equal(withdrawn.ok, true);
      if (!withdrawn.ok) return;
      assert.equal(withdrawn.op, "lpWithdraw");
      assert.equal(withdrawn.from, vault);
      assert.equal(withdrawn.to, LP);
    } finally {
      if (prev === undefined) delete process.env.LP_VAULT_ADDRESS;
      else process.env.LP_VAULT_ADDRESS = prev;
    }
  });

  it("refuses a zero payout and a deposit without a vault", async () => {
    const prev = process.env.LP_VAULT_ADDRESS;
    delete process.env.LP_VAULT_ADDRESS;
    try {
      const zero = await payout({
        to: TRAVELER,
        amountCents: 0,
        policyId: "1",
      });
      assert.equal(zero.ok, false);
      if (zero.ok) return;
      assert.equal(zero.error, "INVALID_AMOUNT");

      const deposit = await lpDeposit({
        from: LP,
        amountCents: 50_000,
        role: "lp",
      });
      assert.equal(deposit.ok, false);
      if (deposit.ok) return;
      assert.equal(deposit.error, "MISSING_VAULT");
    } finally {
      if (prev === undefined) delete process.env.LP_VAULT_ADDRESS;
      else process.env.LP_VAULT_ADDRESS = prev;
    }
  });
});
