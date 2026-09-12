# Late Gate — Parametric Flight-Delay Stubs: Data Landscape, Pricing Model, and Risk Controls

**Company technical paper** · Version 2026-09-12.eng-lock.v1  
**Status:** Internal Eng / Product · Publishable Eng tone  
**Pricing lock:** Takeoff π = **$14**; Arrival π = **$9**; B(30/45/60) = **$100 / $150 / $200** (both products). Fixed premium; scaled payout. τ internal only.

---

## Abstract / Overview

Late Gate offers travelers limited-inventory **parametric stubs** on two outcomes per flight: **Takeoff delay** and **Arrival delay**. The traveler selects a delay-buffer tier; the stub pays a fixed cash amount if observed schedule delay meets or exceeds an internal threshold. The house is the sole counterparty in the MVP.

This paper (1) surveys public and commercial flight-performance data sources; (2) maps gate vs runway delay definitions to Late Gate products; (3) reports empirical US delay rates at 15/30/45/60 minutes from Bureau of Transportation Statistics (BTS) microdata; (4) specifies a pricing model with load λ and house EV; (5) shows that the **locked Eng premiums are underwater at US pool-average probabilities** and therefore must be paired with **selective underwriting**; (6) defines inventory, adverse-selection, correlation, and settlement controls; and (7) notes traveler-safe wording and a future depositor-pool sketch.

**Key empirical result (BTS Reporting Carrier OTP, Jan + Jul 2024, operated non-cancelled non-diverted, n ≈ 1.14M):**

| Product proxy | P(≥30 min) | P(≥45) | P(≥60) |
|---|---|---|---|
| Departure / Takeoff (`DepDelay`) | **18.33%** | **13.61%** | **10.50%** |
| Arrival (`ArrDelay`) | **18.66%** | **13.83%** | **10.69%** |

At locked π and B, expected payout on a **random** US flight exceeds premium (house EV < 0). Positive house EV is restored on a **clean demo / selectively underwritten** book (e.g. \(\hat{p}_{30/45/60} \approx 8\%/5\%/3.5\%\)).

---

## 1. Data landscape

### 1.1 BTS Airline On-Time Performance (primary free US prior)

- **Coverage:** US domestic nonstop flights of reporting carriers (≥0.5% of domestic scheduled passenger revenues).
- **Fields:** Scheduled/actual gate times, `DepDelay` / `ArrDelay`, 15-minute flags, delay-cause minutes, taxi, wheels-off/on, cancellations, diversions, O&D, distance, carrier.
- **Cadence:** Monthly; typically lagged ~1–2 months.
- **Access / license:** Free public download (TranStats prezipped ZIPs). US government statistical data.
- **URLs:**  
  - https://transtats.bts.gov/DatabaseInfo.asp?DB_URL=&QO_VQ=EFD  
  - https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ&QO_fu146_anzr=b0-gvzr  
  - Prezip pattern: `https://transtats.bts.gov/PREZIP/On_Time_Reporting_Carrier_On_Time_Performance_1987_present_YYYY_M.zip`

### 1.2 EUROCONTROL CODA (Europe)

- All-causes delay and punctuality for ECAC IFR traffic; monthly briefs + annual Digest.
- 2024: ~72.4% arrivals within 15 min of STA (≈27.6% >15); avg delay ≈17.5 min/flight.  
  https://www.eurocontrol.int/publication/all-causes-delays-air-transport-europe-annual-2024  
- 2025 review: arrival punctuality 76.1%; departure 70.1%; avg departure delay 14.6 min.  
  https://www.eurocontrol.int/sites/default/files/2026-01/eurocontrol-european-aviation-overview-20260123-2025-review.pdf  
- Monthly band charts publish Del 16–30 / 31–60 / >60 shares (e.g. Sep 2025 >30 min: dep 18.3%, arr 16.5%).  
  https://www.eurocontrol.int/sites/default/files/2025-10/eurocontrol-all-causes-delay-to-air-transport-september-2025.pdf

### 1.3 Cirium Sky API (commercial — settlement candidate)

Global status, gate/runway delays, historical status (contract). Trial / PAYG / contract. Terms restrict passenger-rights claim use.  
https://developer.cirium.com/apis/cirium-sky-api/subscriptions

### 1.4 OAG Flight Status (commercial)

Near-real-time gate & runway times, delays, cancellations, diversions; API / alerts / Snowflake. Quote-based.  
https://www.oag.com/flight-status-data

### 1.5 FAA ASPM / ASQP

US airport and carrier metrics; gate out/in, wheels off/on. Aggregates partly public; flight-level often login-gated.  
https://aspmhelp.faa.gov/index/Aviation_System_Performance_Metrics_(ASPM).html  
https://aspmhelp.faa.gov/index/ASQP__Definitions_of_Variables.html

### 1.6 OpenSky Network

ADS-B tracking — **not** CRS schedule delay. Research free under terms; commercial / operational use requires license.  
https://opensky-network.org/about/terms-of-use

### 1.7 Blockers

Cirium/OAG paywalled (needed for live settlement). BTS Excel summary tables often blocked to datacenter IPs (prezip CSVs work). OpenSky unsuitable as sole settlement oracle for schedule delay.

---

## 2. Delay definitions and product mapping

| Industry metric | Definition | Late Gate product |
|---|---|---|
| Gate departure delay | Actual gate-out − scheduled dep (BTS `DepDelay`) | **Takeoff delay** |
| Wheels-off delay | Runway liftoff − schedule (or vs gate-out + taxi) | Not primary trigger |
| Gate arrival delay | Actual gate-in − scheduled arr (BTS `ArrDelay`) | **Arrival delay** |
| Wheels-on / block | Touchdown / in-block variants | Not primary |
| BTS “late flight” | ≥15 minutes gate late | Reporting standard only |

BTS: gate departure is parking-brake release / door close (with specified gate-return rules).  
https://transtats.bts.gov/DatabaseInfo.asp?DB_URL=&QO_VQ=EFD

**Recommendation:** Settle Takeoff on **gate-out vs published STD**; Arrival on **gate-in vs published STA**. Traveler-facing “Takeoff delay” means departure lateness from schedule, not wheels-up. **Never display τ minutes in UI.**

---

## 3. Empirical rates

### 3.1 US ≥15 minutes (published)

BTS Table 1A / TranStats (reporting carriers): late arrivals/departures ≈ **20.3%** (2023), ≈ **20.4–20.5%** (2024). Marketing-carrier arrival delay ≈20.2% (2025 chart series).  
Sources: TranStats home drill / Marketing Annual; Table 1A xlsx on bts.gov (search-indexed extracts).

### 3.2 US ≥30/45/60 — this study (BTS microdata)

**Method:** Download TranStats Reporting Carrier OTP for **2024-01** and **2024-07**; filter `Cancelled=0`, `Diverted=0`; compute share with `DepDelay` / `ArrDelay` ≥ τ.

| Period | Dep ≥30 | Dep ≥45 | Dep ≥60 | Arr ≥30 | Arr ≥45 | Arr ≥60 |
|---|---|---|---|---|---|---|
| Jan 2024 | 15.47% | 11.27% | 8.57% | 15.94% | 11.54% | 8.78% |
| Jul 2024 | 20.77% | 15.61% | 12.15% | 20.99% | 15.80% | 12.32% |
| **Weighted** | **18.33%** | **13.61%** | **10.50%** | **18.66%** | **13.83%** | **10.69%** |

Artifacts: `data/empirical_delay_rates_*.csv`, `figures/empirical_delay_cdf.png`.

**Caveats:** Two months only; summer worse; cancellations/diversions excluded from CDF (need separate rules); not conditioned on purchase timing (adverse selection).

### 3.3 Heterogeneity (Jul 2024 departures, p≥30)

| Split | Low | High |
|---|---|---|
| Airline | HA 6.6% | AA 28.9% |
| Dep time block | 0600–0659 7.6% | 2000–2059 35.6% |
| Origin (top volume) | SEA 14.5% | CLT 35.9% |
| DOW | Thu 17.5% | Fri 25.7% |

Full tables: `data/empirical_delay_splits_jul2024.csv`.

### 3.4 Europe (published aggregates)

EUROCONTROL: >15 min arrivals ~24–28% depending on year; monthly >30 min often mid-teens (e.g. Dec 2024 arr 13.7%; Sep 2025 arr 16.5%). Exact annual EU p≥45/60 not published as a single scalar in materials reviewed — treat as **unknown** pending CODA microdata or Cirium/OAG.

---

## 4. Pricing model

### 4.1 Contract

For product \(k \in \{\mathrm{TAKEOFF},\mathrm{ARRIVAL}\}\) and traveler-selected internal threshold \(\tau \in \{30,45,60\}\):

\[
\text{Payout} = B(\tau)\cdot\mathbf{1}\{D_k \ge \tau\}, \qquad
B(30)=100,\; B(45)=150,\; B(60)=200
\]

Premium \(\pi_k\) is **fixed** per product (not per τ):

\[
\pi_{\mathrm{TAKEOFF}} = 14,\qquad \pi_{\mathrm{ARRIVAL}} = 9
\]

Expected payout: \(E[\mathrm{payout}] = p_k(\tau)\cdot B(\tau)\) where \(p_k(\tau)=P(D_k\ge\tau)\).

### 4.2 Load and house EV

\[
\pi = \lambda \cdot E[\mathrm{payout}] = \lambda \cdot p\cdot B
\qquad\Rightarrow\qquad
\mathrm{EV}_{\mathrm{house}} = \pi - p\cdot B
\]

**Target λ = 1.45** on the underwritten book (includes ~20pp adverse-selection / ops buffer vs pure fair odds λ=1). Traveler “fair odds” relative to estimated \(p\) means transparent load: fair premium would be \(p\cdot B\); traveler pays \(\lambda\cdot p\cdot B\) when π is set by underwriting, or equivalently only flights with \(p \le \pi/(\lambda B)\) are sold at locked π.

### 4.3 Validation of Eng lock vs data

**Pool-average \(p\) (weighted Jan+Jul 2024):**

| Product | τ | \(p\) | \(E[\mathrm{payout}]\) | π | House EV | Implied λ |
|---|---|---|---|---|---|---|
| Takeoff | 30 | 18.33% | $18.33 | $14 | **−$4.33** | 0.76 |
| Takeoff | 45 | 13.61% | $20.41 | $14 | **−$6.41** | 0.69 |
| Takeoff | 60 | 10.50% | $21.00 | $14 | **−$7.00** | 0.67 |
| Arrival | 30 | 18.66% | $18.66 | $9 | **−$9.66** | 0.48 |
| Arrival | 45 | 13.83% | $20.75 | $9 | **−$11.75** | 0.43 |
| Arrival | 60 | 10.69% | $21.38 | $9 | **−$12.38** | 0.42 |

**Decision:** Retain Eng π/B as **locked baseline** for product UX and Rails constants. **Do not** sell at these prices on pool-average risk. Enforce λ via flight-level \(\hat{p}\) gates.

### 4.4 Underwriting gates (p_max)

At λ=1.45: \(p_{\max} = \pi / (\lambda B)\).

| Product | τ | \(p_{\max}\) | Break-even \(p\) (λ=1) |
|---|---|---|---|
| Takeoff | 30 | **9.66%** | 14.00% |
| Takeoff | 45 | **6.44%** | 9.33% |
| Takeoff | 60 | **4.83%** | 7.00% |
| Arrival | 30 | **6.21%** | 9.00% |
| Arrival | 45 | **4.14%** | 6.00% |
| Arrival | 60 | **3.10%** | 4.50% |

### 4.5 Clean demo prior (recommended)

Assume selectively listed flight with \(\hat{p}=\{8\%,5\%,3.5\%\}\) at {30,45,60}:

| Product | τ | \(E[\mathrm{payout}]\) | House EV | λ |
|---|---|---|---|---|
| Takeoff | 30 | $8.00 | **+$6.00** | 1.75 |
| Takeoff | 45 | $7.50 | **+$6.50** | 1.87 |
| Takeoff | 60 | $7.00 | **+$7.00** | 2.00 |
| Arrival | 30 | $8.00 | **+$1.00** | 1.12 |
| Arrival | 45 | $7.50 | **+$1.50** | 1.20 |
| Arrival | 60 | $7.00 | **+$2.00** | 1.29 |

Arrival at $9 is tight (λ≈1.1–1.3 on this prior). Prefer morning / historically clean flights for Arrival inventory.

### 4.6 Alternatives if Eng reopens pricing (not locked)

For **unselective** US pool book at λ=1.45 and current B: π ≈ **$27–$31** both products. Or keep π and reduce B to ~$30–$55 (poor UX). **Recommendation:** keep locked π/B + selection for demo; revisit risk-based π later.

---

## 5. Risk controls

### 5.1 Inventory caps (FOMO)

- Default **10** stubs per flight per product (demo **5**; max 20).
- Max payout exposure ≈ inventory × $200 (default **$2,000** / flight×product).

### 5.2 Adverse selection — operational codes

| Code | Rule |
|---|---|
| **HOT** | Freeze new sales if delay already developing, weather watch, or soft \(\hat{p}\) warn |
| **CUTOFF** | No sales inside **4h** of STD (demo **6h**) |
| **FULL** | Inventory exhausted |
| **DUPLICATE** | Max **1** open stub per user per flight×product |
| **UNDERWRITE_REJECT** | \(\hat{p} > p_{\max}\) for product×τ |
| **EXPOSURE_CAP** | Portfolio / cluster limit hit |
| **CANCELLED** | MVP: refund premium |
| **DIVERTED** | Arrival: pay max B or review |

### 5.3 Correlation / weather / portfolio

- Caps: airport-day $25k; airline-day $40k; book-day $150k; cluster $15k (max simultaneous payout exposure).
- Weather-watch airports: remaining capacity × **0.35**.
- Prefer diversifying away from single-hub evening banks.

### 5.4 Why controls matter for EV

Purchase timing correlates with information about delay. CUTOFF + HOT shrink adverse selection so realized \(p\) on sold stubs approaches (or stays under) underwriting \(\hat{p}\). Without them, locked π is insufficient even on “clean” scheduled flights.

---

## 6. Settlement

1. **Oracle:** Production — Cirium or OAG (or airline direct). MVP — partner status API; BTS for offline backtest only (lag).
2. **Metric:** Takeoff = gate-out delay; Arrival = gate-in delay vs published times at purchase lock.
3. **Observe:** After actual event or scheduled time + τ + **30 min** buffer.
4. **Auto-pay** if high-confidence source and \(D\ge\tau\); else hold.
5. **Dispute window:** 72 hours.
6. **Cancelled:** refund π (MVP). **Diverted:** Arrival special case.

---

## 7. Sensitivity

### 7.1 House EV vs \(p\) at locked π

See `figures/house_ev_sensitivity.png`. Zero-crossing at break-even \(p=\pi/B\). Pool \(p_{30}\) (≈18–19%) lies deep in the loss region for both products.

### 7.2 Inventory × λ

| Inventory | Takeoff premium income | Max exposure (τ=60) | Arrival premium income |
|---|---|---|---|
| 5 | $70 | $1,000 | $45 |
| 10 | $140 | $2,000 | $90 |
| 20 | $280 | $4,000 | $180 |

House EV scales with \(\sum_i (\pi - p_i B_i)\) over sold stubs — negative if \(p_i\) uncontrolled.

### 7.3 Traveler fair-odds comparison (clean demo prior)

For Takeoff τ=30: fair premium ≈ $8.00; traveler pays $14 → load 1.75 (pays $6 above actuarial fair for that prior). For Arrival τ=30: fair ≈ $8.00; pays $9 → load 1.12 (thin). Communicate value as **certainty of payout rules + limited inventory**, not “cheap odds.”

---

## 8. Future depositor pool (optional)

MVP: house sole counterparty. Future: depositors post capital; after traveler payouts and ops, residual edge \((\lambda-1)\cdot E[\mathrm{payout}]\) can be shared, e.g. 40% house ops / 50% depositor yield / 10% reserve. Depositors **inherit house edge only after** underwriting and reserves — they do not remove the need for \(p_{\max}\) gates. No user LP in current product.

---

## 9. Traveler-safe wording notes

| Avoid (UI) | Prefer |
|---|---|
| insurance, policy, claim, premium | stub, locked price, payout |
| gamble, bet, odds | delay cushion, buffer tier |
| show “30/45/60 minutes” as τ | Short / Medium / Long buffer |
| house edge, λ, \(\hat{p}\) | Limited stubs on this flight |

Paper/actuarial language is fine internally and in this document; traveler surfaces should stay assistance/ancillary-protection tone (consistent with Hopper-style “disruption assistance” framing in market), without claiming regulated insurance unless licensed.

---

## 10. References

1. BTS Airline On-Time Performance Database — https://transtats.bts.gov/DatabaseInfo.asp?DB_URL=&QO_VQ=EFD  
2. BTS Download (Reporting Carrier) — https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ&QO_fu146_anzr=b0-gvzr  
3. BTS TranStats annual charts — https://www.transtats.bts.gov/homedrillchart.asp  
4. BTS Marketing Carrier Annual — https://www.transtats.bts.gov/Marketing_Annual.aspx  
5. BTS on-time gallery — https://www.bts.gov/browse-statistical-products-and-data/info-gallery/percent-time-flight-departures-and-arrivals  
6. EUROCONTROL CODA Digest 2024 — https://www.eurocontrol.int/publication/all-causes-delays-air-transport-europe-annual-2024  
7. EUROCONTROL Sep 2025 delay brief PDF — https://www.eurocontrol.int/sites/default/files/2025-10/eurocontrol-all-causes-delay-to-air-transport-september-2025.pdf  
8. EUROCONTROL 2025 review PDF — https://www.eurocontrol.int/sites/default/files/2026-01/eurocontrol-european-aviation-overview-20260123-2025-review.pdf  
9. FAA ASQP definitions — https://aspmhelp.faa.gov/index/ASQP__Definitions_of_Variables.html  
10. FAA ASPM overview — https://aspmhelp.faa.gov/index/Aviation_System_Performance_Metrics_(ASPM).html  
11. Cirium Sky subscriptions — https://developer.cirium.com/apis/cirium-sky-api/subscriptions  
12. OAG Flight Status — https://www.oag.com/flight-status-data  
13. OpenSky terms — https://opensky-network.org/about/terms-of-use  
14. Wang et al. delay CCDF (arXiv) — https://ar5iv.labs.arxiv.org/html/1701.05556  
15. AXA HK Express parametric — https://www.axapartners.com/en/page/axa-hk-express-flight-delay-parametric-protection  
16. Cover Genius Delay Valet — https://covergenius.com/solutions/delay-valet/  
17. Blink Flight Disruption — https://blinkparametric.com/blink-parametric-platform/blink-flight-disruption/  
18. Hopper / OAG case study — https://www.oag.com/hopper-case-study  
19. Late Gate empirical outputs — `/workspace/late-gate-docs/data/`, `/workspace/late-gate-docs/figures/`

---

## Appendix A — Rails constants

See `rails-pricing-constants.md` and `rails-pricing-constants.json` for drop-in thresholds, premiums, payouts, inventory, λ, refusal codes, and exposure limits.

## Appendix B — Assumptions (labeled)

- **A1:** Settlement equals BTS-style gate delay (assumption until Cirium/OAG wired).  
- **A2:** Sold-stub \(p\) equals historical flight-level \(\hat{p}\) if CUTOFF/HOT enforced (optimistic without live telemetry).  
- **A3:** Single-tier payout (not stacked 30+45+60).  
- **A4:** Cancellations refund π (not a delay win).  
- **A5:** Clean demo prior 8/5/3.5% is a **scenario**, not a national statistic.  
- **A6:** Full-year 2024/2025 microdata not fully ingested — expand before production rate cards.
