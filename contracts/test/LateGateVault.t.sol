// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LateGateVault} from "../LateGateVault.sol";
import {MockUSDC} from "./MockUSDC.sol";

/// @dev Actor so tests can pull/deposit from a second address without forge-std prank.
contract VaultActor {
    function approve(MockUSDC token, address spender, uint256 amount) external {
        token.approve(spender, amount);
    }

    function deposit(LateGateVault vault, uint256 assets) external {
        vault.deposit(assets);
    }

    function payPremium(LateGateVault vault, uint256 amount) external {
        vault.payPremium(address(this), amount);
    }

    function tryPayout(LateGateVault vault, address to, uint256 amount) external {
        vault.payout(to, amount);
    }

    function tryWithdraw(LateGateVault vault, address to, uint256 amount) external {
        vault.withdraw(to, amount);
    }
}

/// @notice Forge harness (no forge-std). `forge test` runs every `test*` function.
contract LateGateVaultTest {
    MockUSDC internal usdc;
    LateGateVault internal vault;
    VaultActor internal traveler;
    VaultActor internal lp;
    VaultActor internal stranger;

    uint256 internal constant TAKEOFF_PREMIUM = 14_000_000; // $14
    uint256 internal constant ARRIVAL_PREMIUM = 9_000_000; // $9
    uint256 internal constant PAYOUT_B = 200_000_000; // $200

    function setUp() public {
        usdc = new MockUSDC();
        vault = new LateGateVault(address(usdc), address(this));
        traveler = new VaultActor();
        lp = new VaultActor();
        stranger = new VaultActor();

        usdc.mint(address(this), 1_000_000_000);
        usdc.mint(address(traveler), 50_000_000);
        usdc.mint(address(lp), 500_000_000);
        usdc.approve(address(vault), type(uint256).max);
        traveler.approve(usdc, address(vault), type(uint256).max);
        lp.approve(usdc, address(vault), type(uint256).max);
    }

    function testConstructorPinsUsdcAndHouse() public view {
        require(vault.usdc() == address(usdc), "usdc");
        require(vault.house() == address(this), "house");
        require(vault.decimals() == 6, "decimals");
        require(vault.paused() == false, "paused");
    }

    function testHouseAndLpDepositMintProRataShares() public {
        vault.deposit(100_000_000); // house $100
        require(vault.balanceOf(address(this)) == 100_000_000, "house shares");
        require(vault.totalAssets() == 100_000_000, "assets");

        lp.deposit(vault, 50_000_000); // LP $50
        require(vault.balanceOf(address(lp)) == 50_000_000, "lp shares");
        require(vault.totalSupply() == 150_000_000, "supply");
        require(vault.totalAssets() == 150_000_000, "assets after lp");
    }

    function testPayPremiumPullsUsdcWithoutMintingShares() public {
        vault.deposit(100_000_000);
        uint256 supplyBefore = vault.totalSupply();
        traveler.payPremium(vault, ARRIVAL_PREMIUM);
        require(vault.totalAssets() == 100_000_000 + ARRIVAL_PREMIUM, "premium in");
        require(vault.totalSupply() == supplyBefore, "no shares for traveler");
        require(vault.balanceOf(address(traveler)) == 0, "traveler not lp");
        require(usdc.balanceOf(address(traveler)) == 50_000_000 - ARRIVAL_PREMIUM, "traveler paid");
    }

    function testCollectRecordsWithoutPull() public {
        uint256 before = usdc.balanceOf(address(traveler));
        vault.collect(address(traveler), TAKEOFF_PREMIUM);
        require(usdc.balanceOf(address(traveler)) == before, "no pull");
        require(vault.totalSupply() == 0, "no shares");
    }

    function testPayoutIsHouseOnlyAndDoesNotBurnShares() public {
        vault.deposit(PAYOUT_B);
        traveler.payPremium(vault, ARRIVAL_PREMIUM);
        uint256 supply = vault.totalSupply();
        vault.payout(address(traveler), PAYOUT_B);
        require(vault.totalSupply() == supply, "shares stay");
        require(usdc.balanceOf(address(traveler)) == 50_000_000 - ARRIVAL_PREMIUM + PAYOUT_B, "paid");
    }

    function testStrangerPayoutReverts() public {
        vault.deposit(PAYOUT_B);
        bool reverted = false;
        try stranger.tryPayout(vault, address(traveler), PAYOUT_B) {
            reverted = false;
        } catch {
            reverted = true;
        }
        require(reverted, "stranger payout");
    }

    function testWithdrawIsHouseGatedAndBurnsShares() public {
        lp.deposit(vault, 80_000_000);
        uint256 lpUsdcBefore = usdc.balanceOf(address(lp));
        vault.withdraw(address(lp), 20_000_000);
        require(vault.balanceOf(address(lp)) == 60_000_000, "burned");
        require(usdc.balanceOf(address(lp)) == lpUsdcBefore + 20_000_000, "usdc out");
        require(vault.totalAssets() == 60_000_000, "assets left");
    }

    function testStrangerWithdrawReverts() public {
        lp.deposit(vault, 80_000_000);
        bool reverted = false;
        try stranger.tryWithdraw(vault, address(lp), 1_000_000) {
            reverted = false;
        } catch {
            reverted = true;
        }
        require(reverted, "stranger withdraw");
    }

    function testPauseBlocksPremiumAndPayout() public {
        vault.deposit(PAYOUT_B);
        vault.setPaused(true);
        bool premiumReverted = false;
        try traveler.payPremium(vault, ARRIVAL_PREMIUM) {
            premiumReverted = false;
        } catch {
            premiumReverted = true;
        }
        require(premiumReverted, "paused premium");

        bool payoutReverted = false;
        try vault.payout(address(traveler), 1_000_000) {
            payoutReverted = false;
        } catch {
            payoutReverted = true;
        }
        require(payoutReverted, "paused payout");

        vault.setPaused(false);
        traveler.payPremium(vault, TAKEOFF_PREMIUM);
        require(vault.totalAssets() == PAYOUT_B + TAKEOFF_PREMIUM, "unpaused");
    }

    function testDepositRevertsWhenInsolvent() public {
        vault.deposit(PAYOUT_B);
        vault.payout(address(traveler), PAYOUT_B);
        require(vault.totalAssets() == 0, "drained");
        require(vault.totalSupply() == PAYOUT_B, "shares remain");
        bool reverted = false;
        try vault.deposit(1_000_000) {
            reverted = false;
        } catch {
            reverted = true;
        }
        require(reverted, "insolvent deposit");
    }

    function testLockedPricingUnits() public pure {
        require(TAKEOFF_PREMIUM == 14 * 1_000_000, "takeoff $14");
        require(ARRIVAL_PREMIUM == 9 * 1_000_000, "arrival $9");
        require(PAYOUT_B == 200 * 1_000_000, "B $200");
    }
}
