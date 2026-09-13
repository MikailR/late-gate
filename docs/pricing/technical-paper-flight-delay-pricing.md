# Late Gate: Parametric Flight-Delay Stubs

**Company technical paper** · Version `eng-lock.v1` 
**Status:** Internal Eng / Product 
**Pricing lock:** Takeoff π = **$14**; Arrival π = **$9**; B(30/45/60) = **$100 / $150 / $200** (both products). Fixed premium; scaled payout. τ internal only.

---

> **Key takeaways**
> 1. Locked traveler prices are **$14 Takeoff** and **$9 Arrival**, with payouts **$100 / $150 / $200** at internal buffers 30 / 45 / 60.
> 2. US pool-average P(delay ≥ 30) is about **18%** (BTS Reporting Carrier OTP microdata, winter + summer month samples, n ≈ 1.14M). At that rate, locked π loses money.
> 3. Positive house EV requires **selective underwriting**: only list stubs when flight-level p̂ is under product × τ gates (Arrival is stricter).
> 4. Clean demo prior **8% / 5% / 3.5%** restores Takeoff EV ≈ **+$6 to +$7** and Arrival EV ≈ **+$1 to +$2** per stub.
> 5. Scaling factors matter: summer-month sample shows HA ≈ **6.6%** vs AA ≈ **28.9%** p≥30 dep; morning ≈ **7.6%** vs evening ≈ **35.6%**; SEA ≈ **14.5%** vs CLT ≈ **35.9%**.

---

## Contents

1. [At a glance](#1-at-a-glance)
2. [Locked product parameters](#2-locked-product-parameters)
3. [Industry baseline rates](#3-industry-baseline-rates)
4. [Scaling factors](#4-scaling-factors)
5. [Mathematical model and decisions](#5-mathematical-model-and-decisions)
6. [House EV under pool vs clean prior](#6-house-ev-under-pool-vs-clean-prior)
7. [Underwriting gates and risk controls](#7-underwriting-gates-and-risk-controls)
8. [Settlement definitions](#8-settlement-definitions)
9. [Data sources](#9-data-sources)
10. [Sensitivity and assumptions](#10-sensitivity-and-assumptions)
11. [References](#11-references)

---

## 1. At a glance

Late Gate sells limited-inventory **parametric stubs** on two outcomes per flight: **Takeoff delay** and **Arrival delay**. The traveler picks one delay-buffer tier. The stub pays a fixed cash amount if observed schedule delay meets or exceeds an internal threshold. The house is the sole counterparty in the MVP.

### Variables (front-loaded)

| Symbol | Meaning | Locked / default |
|---|---|---|
| π | Premium paid by traveler | Takeoff **$14**; Arrival **$9** |
| B(τ) | Payout if delay ≥ τ | **$100 / $150 / $200** at τ = 30 / 45 / 60 |
| τ | Internal threshold (minutes) | Never shown in traveler UI |
| p or p̂ | P(D ≥ τ), true or estimated | Flight-level underwriting input |
| λ | Load = π / E[payout] | Target **1.45** on underwritten book |
| EV_house | π − p · B | Must be > 0 on sold stubs |

### Decisions that make the model work

| Decision | Why |
|---|---|
| Fixed π, scaled B | Simple UX; traveler picks Short / Medium / Long buffer |
| Selective underwriting | Locked π is underwater at pool-average p (~18% at ≥30) |
| Target λ = 1.45 | Includes ~20pp adverse-selection / ops buffer vs fair odds |
| CUTOFF + HOT | Shrink purchase-timing adverse selection |
| Inventory caps | FOMO UX and bounded payout exposure |
| Gate-out / gate-in settlement | Matches BTS `DepDelay` / `ArrDelay` priors |

### Empirical snapshot

**BTS Reporting Carrier OTP**, winter month + summer month samples, operated non-cancelled non-diverted, **n ≈ 1.14M**:

| Product proxy | P(≥30) | P(≥45) | P(≥60) |
|---|---|---|---|
| Departure / Takeoff (`DepDelay`) | **18.33%** | **13.61%** | **10.50%** |
| Arrival (`ArrDelay`) | **18.66%** | **13.83%** | **10.69%** |

At locked π and B, expected payout on a **random** US flight exceeds premium (house EV < 0). Positive house EV is restored on a **clean demo / selectively underwritten** book (p̂₃₀/₄₅/₆₀ ≈ 8% / 5% / 3.5%).

---

## 2. Locked product parameters

> **Variables callout** 
> Premium is fixed per product. Payout scales with the traveler-selected buffer. Threshold minutes stay internal.

| Product code | Traveler name | Settlement metric | BTS proxy | Premium π |
|---|---|---|---|---|
| `TAKEOFF` | Takeoff delay | Gate-out − scheduled dep | `DepDelay` | **$14.00** |
| `ARRIVAL` | Arrival delay | Gate-in − scheduled arr | `ArrDelay` | **$9.00** |

| Internal τ (min) | UI label | Payout B |
|---|---|---|
| 30 | Short buffer | **$100** |
| 45 | Medium buffer | **$150** |
| 60 | Long buffer | **$200** |

**Contract rule:** Traveler selects **one** τ per stub. Pays B if observed delay_minutes ≥ τ, else 0 (single-tier, not cumulative).

| Inventory | Default | Demo | Min | Max |
|---|---|---|---|---|
| Stubs per flight × product | **10** | **5** | 3 | 20 |
| Max payout exposure / flight×product | **$2,000** | $1,000 | n/a | inventory × $200 |

House is sole counterparty (no user LP) in MVP. Machine-readable twin: [`rails-pricing-constants.json`](./rails-pricing-constants.json).

---

## 3. Industry baseline rates

### 3.1 US ≥15 minutes (published)

BTS reporting-carrier late arrivals/departures remain about **20-21%** at the ≥15 minute gate standard across recent annual summaries. Marketing-carrier arrival delay is in the same band. Treat ≈20% ±1pp as the industry ≥15 backdrop. Exact ≥30/45/60 come from microdata below (section 3.2), not from the ≥15 reporting standard.

### 3.2 US ≥30 / 45 / 60 (this study)

**Method:** TranStats Reporting Carrier OTP for one winter month and one summer month; filter `Cancelled=0`, `Diverted=0`; share with `DepDelay` / `ArrDelay` ≥ τ.

| Sample | Dep ≥30 | Dep ≥45 | Dep ≥60 | Arr ≥30 | Arr ≥45 | Arr ≥60 |
|---|---|---|---|---|---|---|
| Winter month | 15.47% | 11.27% | 8.57% | 15.94% | 11.54% | 8.78% |
| Summer month | 20.77% | 15.61% | 12.15% | 20.99% | 15.80% | 12.32% |
| **Weighted** | **18.33%** | **13.61%** | **10.50%** | **18.66%** | **13.83%** | **10.69%** |

Artifacts: `data/empirical_delay_rates_*.csv`, `figures/empirical_delay_cdf.png`.

**Caveats:** Two months only; summer worse; cancellations/diversions excluded from the delay CDF (need separate rules); not conditioned on purchase timing (adverse selection).

### 3.3 Europe (published aggregates)

EUROCONTROL all-causes: arrivals within 15 min of STA around low-to-mid 70s% in recent annual digests (so >15 around mid-to-high 20s%). Monthly briefs publish delay bands (16-30 / 31-60 / >60). Example monthly shares delayed >30 min often sit in the mid-teens. Exact annual EU p≥45 / p≥60 as a single scalar was not extracted from materials reviewed. Treat as **unknown** pending CODA microdata or Cirium/OAG.

---

## 4. Scaling factors

Heterogeneity dominates pool averages. Summer-month departure sample (p≥30) illustrates why selection works.

> **Scaling callout (summer month, dep p≥30)** 
> Airline HA **6.6%** vs AA **28.9%**. Time block 0600-0659 **7.6%** vs 2000-2059 **35.6%**. Origin SEA **14.5%** vs CLT **35.9%**. DOW Thu **17.5%** vs Fri **25.7%**.

| Split | Low example | High example |
|---|---|---|
| Airline | HA 6.6% | AA 28.9% |
| Dep time block | 0600-0659 7.6% | 2000-2059 35.6% |
| Origin (top volume) | SEA 14.5% | CLT 35.9% |
| Day of week | Thu 17.5% | Fri 25.7% |

Full tables: `data/empirical_delay_splits_jul2024.csv` (filename retains sample label; treat as summer-month split file).

**Product implication:** Prefer morning banks, historically clean carriers/origins, and off-peak DOW for Arrival inventory (Arrival p_max gates are tighter than Takeoff). Origin airport is a practical **gate / airport proxy** for local congestion risk until gate-level telemetry is wired.

---

## 5. Mathematical model and decisions

### 5.1 Contract

For product k ∈ {TAKEOFF, ARRIVAL} and traveler-selected internal threshold τ ∈ {30, 45, 60}:

```
Payout = B(τ) · 1{D_k ≥ τ}
B(30)=100, B(45)=150, B(60)=200
```

Premium π_k is **fixed** per product (not per τ):

```
π_TAKEOFF = 14
π_ARRIVAL = 9
```

Expected payout: E[payout] = p_k(τ) · B(τ) where p_k(τ) = P(D_k ≥ τ).

### 5.2 Load and house EV

```
π = λ · E[payout] = λ · p · B
EV_house = π − p · B
```

**Target λ = 1.45** on the underwritten book (includes ~20pp adverse-selection / ops buffer vs pure fair odds λ=1).

Equivalently, at locked π only sell when:

```
p ≤ p_max = π / (λ · B)
```

### 5.3 Why selective underwriting

Locked π and B are product/UX locks. They are **not** equal to λ · E[payout] at US pool-average p. At pool rates, implied λ is about **0.4-0.8** (house EV deeply negative). The noteworthy mathematical decision:

> **Keep locked π/B for traveler UX. Enforce λ via flight-level p̂ gates (UNDERWRITE_REJECT).** 
> Do not sell random-pool flights at these prices.

### 5.4 Underwriting gates (p_max at λ=1.45)

| Product | τ | p_max (λ=1.45) | Break-even p (λ=1) |
|---|---|---|---|
| Takeoff | 30 | **9.66%** | 14.00% |
| Takeoff | 45 | **6.44%** | 9.33% |
| Takeoff | 60 | **4.83%** | 7.00% |
| Arrival | 30 | **6.21%** | 9.00% |
| Arrival | 45 | **4.14%** | 6.00% |
| Arrival | 60 | **3.10%** | 4.50% |

### 5.5 Delay definitions → products

| Industry metric | Definition | Late Gate product |
|---|---|---|
| Gate departure delay | Actual gate-out − scheduled dep | **Takeoff delay** |
| Wheels-off delay | Runway liftoff − schedule | Not primary trigger |
| Gate arrival delay | Actual gate-in − scheduled arr | **Arrival delay** |
| BTS "late flight" | ≥15 minutes gate late | Reporting standard only |

**Recommendation:** Settle Takeoff on **gate-out vs published STD**; Arrival on **gate-in vs published STA**. Traveler-facing "Takeoff delay" means departure lateness from schedule, not wheels-up. **Never display τ minutes in UI.**

### 5.6 Alternatives if Eng reopens pricing (not locked)

For an **unselective** US pool book at λ=1.45 and current B: π ≈ **$27-$31** both products. Or keep π and reduce B to about **$30-$55** (poor UX). **Recommendation:** keep locked π/B + selection for demo; revisit risk-based π later.

---

## 6. House EV under pool vs clean prior

### 6.1 Pool-average book (underwater)

Weighted winter + summer microdata:

| Product | τ | p | E[payout] | π | House EV | Implied λ |
|---|---|---|---|---|---|---|
| Takeoff | 30 | 18.33% | $18.33 | $14 | **−$4.33** | 0.76 |
| Takeoff | 45 | 13.61% | $20.41 | $14 | **−$6.41** | 0.69 |
| Takeoff | 60 | 10.50% | $21.00 | $14 | **−$7.00** | 0.67 |
| Arrival | 30 | 18.66% | $18.66 | $9 | **−$9.66** | 0.48 |
| Arrival | 45 | 13.83% | $20.75 | $9 | **−$11.75** | 0.43 |
| Arrival | 60 | 10.69% | $21.38 | $9 | **−$12.38** | 0.42 |

### 6.2 Clean demo prior (recommended)

Assume selectively listed flight with p̂ = {8%, 5%, 3.5%} at {30, 45, 60}:

| Product | τ | E[payout] | House EV | λ |
|---|---|---|---|---|
| Takeoff | 30 | $8.00 | **+$6.00** | 1.75 |
| Takeoff | 45 | $7.50 | **+$6.50** | 1.87 |
| Takeoff | 60 | $7.00 | **+$7.00** | 2.00 |
| Arrival | 30 | $8.00 | **+$1.00** | 1.12 |
| Arrival | 45 | $7.50 | **+$1.50** | 1.20 |
| Arrival | 60 | $7.00 | **+$2.00** | 1.29 |

Arrival at $9 is tight (λ ≈ 1.1-1.3 on this prior). Prefer morning / historically clean flights for Arrival inventory.

### 6.3 Scenario ladder (research)

| Scenario | p̂30/45/60 | Takeoff EV @τ30 | Arrival EV @τ30 |
|---|---|---|---|
| ultra_clean | 5 / 3 / 2% | +$9.00 | +$4.00 |
| clean_demo | 8 / 5 / 3.5% | +$6.00 | +$1.00 |
| HA-like (summer dep) | 6.6 / 3.6 / 2.4% | +$7.40 | +$2.40 |
| AS-like | 13.3 / 7.9 / 5.2% | +$0.70 | **−$4.30** |
| pool_avg | ~18.5 / 13.7 / 10.6% | loss | loss |

See `data/pricing_selective_scenarios.csv` and `figures/house_ev_sensitivity.png`.

---

## 7. Underwriting gates and risk controls

> **Risk callout** 
> Without CUTOFF, HOT, and p_max gates, locked π is insufficient even on "clean" scheduled flights because purchase timing correlates with delay information.

### 7.1 Refusal codes

| Code | Rule |
|---|---|
| **HOT** | Freeze new sales if delay already developing, weather watch, or soft p̂ warn |
| **CUTOFF** | No sales inside **4h** of STD (demo **6h**) |
| **FULL** | Inventory exhausted |
| **DUPLICATE** | Max **1** open stub per user per flight×product |
| **UNDERWRITE_REJECT** | p̂ > p_max for product×τ |
| **EXPOSURE_CAP** | Portfolio / cluster limit hit |
| **CANCELLED** | MVP: refund premium |
| **DIVERTED** | Arrival: pay max B or review |

### 7.2 Portfolio / weather caps

| Limit | USD |
|---|---|
| Max net payout exposure / airport-day | 25,000 |
| Max net payout exposure / airline-day | 40,000 |
| Max net payout exposure / book-day | 150,000 |
| Correlation cluster cap | 15,000 |
| Weather-watch airport remaining-capacity multiplier | **0.35** |

Prefer diversifying away from single-hub evening banks.

### 7.3 Traveler-safe wording

| Avoid (UI) | Prefer |
|---|---|
| insurance, policy, claim, premium | stub, locked price, payout |
| gamble, bet, odds | delay cushion, buffer tier |
| show "30/45/60 minutes" as τ | Short / Medium / Long buffer |
| house edge, λ, p̂ | Limited stubs on this flight |

Paper/actuarial language is fine internally. Traveler surfaces should stay assistance/ancillary-protection tone, without claiming regulated insurance unless licensed.

### 7.4 Future depositor pool (optional)

MVP: house sole counterparty. Future sketch: depositors post capital; after traveler payouts and ops, residual edge (λ−1)·E[payout] can be shared (example split 40% house ops / 50% depositor yield / 10% reserve). Depositors inherit house edge only after underwriting and reserves. They do not remove the need for p_max gates. No user LP in current product.

---

## 8. Settlement definitions

1. **Oracle:** Production: Cirium or OAG (or airline direct). MVP: partner status API; BTS for offline backtest only (lag).
2. **Metric:** Takeoff = gate-out delay; Arrival = gate-in delay vs published times at purchase lock.
3. **Observe:** After actual event or scheduled time + τ + **30 min** buffer.
4. **Auto-pay** if high-confidence source and D ≥ τ; else hold.
5. **Dispute window:** 72 hours.
6. **Cancelled:** refund π (MVP). **Diverted:** Arrival special case.

---

## 9. Data sources

Primary free US prior: BTS Airline On-Time Performance (Reporting Carrier). Europe: EUROCONTROL CODA digests and monthly briefs. Commercial settlement candidates: Cirium Sky API, OAG Flight Status. US airport/carrier metrics: FAA ASPM / ASQP. ADS-B tracking (OpenSky) is **not** CRS schedule delay.

Labeled links live in [References](#11-references). Local study artifacts: `data/`, `figures/`.

**Blockers:** Cirium/OAG paywalled (needed for live settlement). BTS Excel summary tables often blocked to datacenter IPs (prezip CSVs work). OpenSky unsuitable as sole settlement oracle for schedule delay. Full-year microdata not fully ingested here (two-month sample).

---

## 10. Sensitivity and assumptions

### 10.1 House EV vs p at locked π

See `figures/house_ev_sensitivity.png`. Zero-crossing at break-even p = π/B. Pool p₃₀ (≈18-19%) lies deep in the loss region for both products.

### 10.2 Inventory × premium income

| Inventory | Takeoff premium income | Max exposure (τ=60) | Arrival premium income |
|---|---|---|---|
| 5 | $70 | $1,000 | $45 |
| 10 | $140 | $2,000 | $90 |
| 20 | $280 | $4,000 | $180 |

House EV scales with Σᵢ (π − pᵢ Bᵢ) over sold stubs. Negative if pᵢ uncontrolled.

### 10.3 Traveler fair-odds comparison (clean demo prior)

For Takeoff τ=30: fair premium ≈ $8.00; traveler pays $14 → load 1.75. For Arrival τ=30: fair ≈ $8.00; pays $9 → load 1.12 (thin). Communicate value as **certainty of payout rules + limited inventory**, not "cheap odds."

### 10.4 Assumptions (labeled)

- **A1:** Settlement equals BTS-style gate delay (assumption until Cirium/OAG wired).
- **A2:** Sold-stub p equals historical flight-level p̂ if CUTOFF/HOT enforced (optimistic without live telemetry).
- **A3:** Single-tier payout (not stacked 30+45+60).
- **A4:** Cancellations refund π (not a delay win).
- **A5:** Clean demo prior 8/5/3.5% is a **scenario**, not a national statistic.
- **A6:** Full-year microdata not fully ingested. Expand before production rate cards.

### 10.5 Rails constants

See [`rails-pricing-constants.md`](./rails-pricing-constants.md) and [`rails-pricing-constants.json`](./rails-pricing-constants.json) for drop-in thresholds, premiums, payouts, inventory, λ, refusal codes, and exposure limits.

---

## 11. References

1. [BTS Airline On-Time Performance Database](https://transtats.bts.gov/DatabaseInfo.asp?DB_URL=&QO_VQ=EFD)
2. [BTS Download (Reporting Carrier)](https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ&QO_fu146_anzr=b0-gvzr)
3. [BTS TranStats annual charts](https://www.transtats.bts.gov/homedrillchart.asp)
4. [BTS Marketing Carrier Annual](https://www.transtats.bts.gov/Marketing_Annual.aspx)
5. [BTS on-time gallery](https://www.bts.gov/browse-statistical-products-and-data/info-gallery/percent-time-flight-departures-and-arrivals)
6. [EUROCONTROL CODA Digest (annual all-causes delays)](https://www.eurocontrol.int/publication/all-causes-delays-air-transport-europe-annual-2024)
7. [EUROCONTROL monthly delay brief (example PDF)](https://www.eurocontrol.int/sites/default/files/2025-10/eurocontrol-all-causes-delay-to-air-transport-september-2025.pdf)
8. [EUROCONTROL network overview review PDF](https://www.eurocontrol.int/sites/default/files/2026-01/eurocontrol-european-aviation-overview-20260123-2025-review.pdf)
9. [FAA ASQP definitions](https://aspmhelp.faa.gov/index/ASQP__Definitions_of_Variables.html)
10. [FAA ASPM overview](https://aspmhelp.faa.gov/index/Aviation_System_Performance_Metrics_(ASPM).html)
11. [Cirium Sky subscriptions](https://developer.cirium.com/apis/cirium-sky-api/subscriptions)
12. [OAG Flight Status](https://www.oag.com/flight-status-data)
13. [OpenSky terms of use](https://opensky-network.org/about/terms-of-use)
14. [Wang et al. delay CCDF (arXiv HTML)](https://ar5iv.labs.arxiv.org/html/1701.05556)
15. [AXA HK Express parametric protection](https://www.axapartners.com/en/page/axa-hk-express-flight-delay-parametric-protection)
16. [Cover Genius Delay Valet](https://covergenius.com/solutions/delay-valet/)
17. [Blink Flight Disruption](https://blinkparametric.com/blink-parametric-platform/blink-flight-disruption/)
18. [Hopper / OAG case study](https://www.oag.com/hopper-case-study)
19. Late Gate empirical outputs: local `data/` and `figures/` under this docs pack
