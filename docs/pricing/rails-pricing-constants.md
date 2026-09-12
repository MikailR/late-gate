# LateGate Rails — Pricing Constants (`lib/pricing`)

**Version:** 2026-09-12.eng-lock.v1  
**Machine-readable twin:** [`rails-pricing-constants.json`](./rails-pricing-constants.json)

τ (threshold minutes) is **INTERNAL only** — never render τ in traveler UI. Use soft labels (Short / Medium / Long buffer).

---

## 1. Products & locked premiums

| Product code | Traveler name | Settlement metric | BTS proxy | Premium π |
|---|---|---|---|---|
| `TAKEOFF` | Takeoff delay | Gate-out − scheduled dep | `DepDelay` | **$14.00** (1400¢) |
| `ARRIVAL` | Arrival delay | Gate-in − scheduled arr | `ArrDelay` | **$9.00** (900¢) |

House is sole counterparty (no user LP) in MVP.

---

## 2. Thresholds & payouts (both products)

| Internal τ (min) | UI label (suggested) | Payout B |
|---|---|---|
| 30 | Short buffer | **$100** |
| 45 | Medium buffer | **$150** |
| 60 | Long buffer | **$200** |

**Rule:** Traveler picks **one** τ per stub. Premium is **fixed** by product; payout **scales** with τ. Pays `B` if `delay_minutes >= τ`, else `0` (not cumulative ladders).

---

## 3. Load / house edge

| Constant | Value | Notes |
|---|---|---|
| `target_lambda` | **1.45** | Target π / E[payout] on the **underwritten** book |
| `min_lambda_underwriting` | 1.25 | Soft floor before HOT/reject |
| `adverse_selection_buffer` | 0.20 | Included in target vs pure fair odds |

Formula: \(\pi = \lambda \cdot \hat{p}(\mathrm{delay}\ge\tau)\cdot B(\tau)\).  
**Important:** Locked π ≠ λ·E[payout] at US **pool-average** \(\hat{p}\). Enforce λ via **underwriting gates** on flight-level \(\hat{p}\).

---

## 4. Underwriting max \(\hat{p}\) gates

Refuse / don’t list when flight-level \(\hat{p}\) exceeds cap for selected product × τ.

### At target λ = 1.45

| Product | τ | B | p_max (λ=1.45) | Break-even p (λ=1) |
|---|---|---|---|---|
| TAKEOFF | 30 | $100 | **9.66%** | 14.00% |
| TAKEOFF | 45 | $150 | **6.44%** | 9.33% |
| TAKEOFF | 60 | $200 | **4.83%** | 7.00% |
| ARRIVAL | 30 | $100 | **6.21%** | 9.00% |
| ARRIVAL | 45 | $150 | **4.14%** | 6.00% |
| ARRIVAL | 60 | $200 | **3.10%** | 4.50% |

### Clean demo prior (recommended for FOMO demo flight)

| τ | \(\hat{p}\) | Takeoff EV (π=$14) | Arrival EV (π=$9) |
|---|---|---|---|
| 30 | 8.0% | +$6.00 (λ=1.75) | +$1.00 (λ=1.12) |
| 45 | 5.0% | +$6.50 (λ=1.87) | +$1.50 (λ=1.20) |
| 60 | 3.5% | +$7.00 (λ=2.00) | +$2.00 (λ=1.29) |

### Pool-average prior (BTS Jan+Jul 2024) — **do not sell blindly**

| Product | p≥30 | p≥45 | p≥60 | House EV @ locked π |
|---|---|---|---|---|
| TAKEOFF | 18.33% | 13.61% | 10.50% | **−$4.33 / −$6.41 / −$7.00** |
| ARRIVAL | 18.66% | 13.83% | 10.69% | **−$9.66 / −$11.75 / −$12.38** |

---

## 5. Inventory caps

| Constant | Default | Demo | Min | Max |
|---|---|---|---|---|
| Stubs per flight × product | **10** | **5** | 3 | 20 |
| Max payout exposure / flight×product | **$2,000** | $1,000 | — | inventory × $200 |

FOMO: limited stubs per flight/product.

---

## 6. Portfolio exposure limits

| Limit | USD |
|---|---|
| Max net payout exposure / airport-day | 25,000 |
| Max net payout exposure / airline-day | 40,000 |
| Max net payout exposure / book-day | 150,000 |
| Correlation cluster cap | 15,000 |
| Weather-watch airport remaining-capacity multiplier | **0.35** |

---

## 7. Refusal codes (operational)

| Code | Meaning | Action |
|---|---|---|
| `HOT` | Risk elevated (delay developing, weather, soft p warn) | Refuse new buys |
| `CUTOFF` | Past purchase deadline | Refuse (default **4h** before STD; demo **6h**) |
| `FULL` | Inventory exhausted | Refuse |
| `DUPLICATE` | User already has open stub on flight×product | Refuse (max 1) |
| `EXPOSURE_CAP` | Portfolio/cluster cap hit | Refuse |
| `UNDERWRITE_REJECT` | \(\hat{p}\) > p_max for product×τ | Don’t list / refuse |
| `CANCELLED` | Flight cancelled | MVP: **refund premium** |
| `DIVERTED` | Diversion | Arrival: pay max B or review |

---

## 8. Settlement observation

| Item | Value |
|---|---|
| Takeoff metric | Gate-out delay vs published STD |
| Arrival metric | Gate-in delay vs published STA |
| Observation buffer | +30 minutes after expected observe time |
| Dispute window | 72 hours |
| MVP sources | Partner flight-status API; BTS lag for backtest |
| Production sources | Cirium / OAG / airline direct (paywalled) |

---

## 9. Traveler-safe wording

**Avoid in UI:** insurance, gamble, bet, odds, policy, claim, “premium”, τ minutes as jargon.  
**Prefer:** stub, payout, delay cushion, locked price, limited stubs.  
Paper may use actuarial language carefully.

---

## 10. Drop-in Ruby sketch

```ruby
# lib/pricing/constants.rb  (illustrative)
module Pricing
  PRODUCTS = {
    TAKEOFF: { premium_cents: 1400, metric: :gate_dep_delay },
    ARRIVAL: { premium_cents:  900, metric: :gate_arr_delay }
  }.freeze
  PAYOUTS_CENTS = { 30 => 10_000, 45 => 15_000, 60 => 20_000 }.freeze
  TARGET_LAMBDA = 1.45
  INVENTORY_DEFAULT = 10
  # p_max from rails-pricing-constants.json underwriting_gates
end
```
