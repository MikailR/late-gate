# Late Gate — Research Notes (Flight Delay Data & Parametric Stub Pricing)

**Date:** 2026-09-12 (America/Toronto)  
**Scope:** Public datasets, empirical delay rates, definitions, competitive parametric products.  
**Pricing lock (Eng):** Takeoff π=$14; Arrival π=$9; B(30/45/60)=$100/$150/$200 for both products. Fixed premium, scaled payout.

---

## 1. Public / commercial datasets

### 1.1 BTS Airline On-Time Performance (primary free US source)
- **What:** Flight-level scheduled vs actual gate departure/arrival for US reporting carriers (≥0.5% domestic scheduled passenger revenue). Includes cancellations, diversions, taxi times, delay causes (carrier/weather/NAS/security/late aircraft), distance, O&D.
- **Coverage:** US domestic nonstop; 1987–present (marketing carrier series from 2018).
- **Cadence:** Monthly releases; typically ~1–2 months lag. TranStats “Latest Available Data” advances monthly.
- **Access:** Free public download (prezipped monthly ZIPs).
- **License:** US Government Works / public domain-style government data (no paywall).
- **URLs:**
  - Database overview: https://transtats.bts.gov/DatabaseInfo.asp?DB_URL=&QO_VQ=EFD
  - Download (Reporting Carrier): https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FGJ&QO_fu146_anzr=b0-gvzr
  - Tables index: https://www.transtats.bts.gov/tables.asp?QO_VQ=EFD&QO_anzr=Nv4yv0r
  - Prezipped example (Jan 2024): https://transtats.bts.gov/PREZIP/On_Time_Reporting_Carrier_On_Time_Performance_1987_present_2024_1.zip
  - On-time % gallery: https://www.bts.gov/browse-statistical-products-and-data/info-gallery/percent-time-flight-departures-and-arrivals
  - Table 1A summary (ops / late %): https://www.bts.gov/sites/bts.dot.gov/files/2025-03/Table%201A%20-%20Reporting%20Operating%20Carrier%20Summary%20of%20Airline%20On-Time%20Performance%20from%201995%20Year-to-date%20December%202024.xlsx *(Akamai often blocks automated fetch; use browser or TranStats prezip)*
- **Local sample used:** `/workspace/late-gate-docs/data/jan2024/` and `jul2024/` (full months).

### 1.2 EUROCONTROL CODA (Europe all-causes delay)
- **What:** Network-level punctuality and all-causes delay (IATA delay codes), departure/arrival bands (e.g. Del 16–30, 31–60, >60), average delay per flight.
- **Coverage:** ECAC IFR flights; partial airline CODA coverage (~57–63% in monthly briefs).
- **Cadence:** Monthly briefs + annual CODA Digest.
- **Access:** Free PDFs.
- **License:** EUROCONTROL public information (White TLP); attribution required; non-commercial copy OK per footer.
- **URLs:**
  - Annual 2024 publication: https://www.eurocontrol.int/publication/all-causes-delays-air-transport-europe-annual-2024
  - Annual PDF: https://www.eurocontrol.int/sites/default/files/2025-07/eurocontrol-coda-digest-annual-report-2024.pdf
  - Sep 2025 monthly: https://www.eurocontrol.int/sites/default/files/2025-10/eurocontrol-all-causes-delay-to-air-transport-september-2025.pdf
  - Dec 2024 monthly: https://www.eurocontrol.int/sites/default/files/2025-01/eurocontrol-all-causes-delay-to-air-transport-december-2024.pdf
  - 2025 review overview: https://www.eurocontrol.int/sites/default/files/2026-01/eurocontrol-european-aviation-overview-20260123-2025-review.pdf

### 1.3 Cirium Sky API
- **What:** Global flight status, schedules, historical status, delay minutes (gate & runway), alerts, delay index.
- **Access:** Commercial API; 14-day trial (capped queries); Pay-as-you-go / Contract. Historical Flight Status = Contract only.
- **Paywall:** Yes. Terms prohibit use for passenger-rights claims actions (e.g. EU261).
- **URL:** https://developer.cirium.com/apis/cirium-sky-api/subscriptions  
  Historical: https://developer.cirium.com/apis/cirium-sky-api/historical-flight-status

### 1.4 OAG Flight Status / Schedules
- **What:** Global near-real-time gate & runway times, delays, cancellations, diversions; schedules; MCT; 20+ year history.
- **Cadence:** Near real-time API/alerts; Snowflake daily.
- **Access:** Commercial (quote-based). Sources: airlines, airports, FAA, ADS-B.
- **URL:** https://www.oag.com/flight-status-data

### 1.5 FAA ASPM / ASQP
- **What:** Airport & carrier performance metrics; gate out/in, wheels off/on, taxi; Core/OEP airports; individual flight downloads (restricted).
- **Access:** Aggregates partly public; preliminary & flight-level require FAA login.
- **URLs:**
  - ASPM overview: https://aspmhelp.faa.gov/index/Aviation_System_Performance_Metrics_(ASPM).html
  - ASQP definitions: https://aspmhelp.faa.gov/index/ASQP__Definitions_of_Variables.html
  - Download manual: https://aspmhelp.faa.gov/index/ASPM_Data_Download_Manual.html

### 1.6 OpenSky Network
- **What:** ADS-B / Mode S state vectors & derived flights — **not** scheduled OTP or CRS delay. Useful for wheels-off/on inference, not BTS-style gate delay vs schedule.
- **Access:** REST API free for non-profit research/education; commercial / operational use requires written license. Trino historical: approved researchers free; commercial = negotiated.
- **URLs:**
  - Terms: https://opensky-network.org/about/terms-of-use
  - FAQ: https://opensky-network.org/about/faq
  - API docs: https://openskynetwork.github.io/opensky-api/index.html
  - Trino: https://openskynetwork.github.io/opensky-api/trino.html

### 1.7 Other
- **DOT Air Travel Consumer Report (ATCR):** Monthly marketing/operating carrier on-time rankings (15-min gate). Example: https://www.transportation.gov/sites/dot.gov/files/2025-03/February%202025%20ATCR.pdf
- **Kaggle mirrors of BTS:** third-party cleaned dumps (e.g. Flight Delay Dataset 2024); prefer official TranStats for production.

---

## 2. Delay definitions → Late Gate products

| Concept | Definition (BTS/ASQP) | Late Gate product |
|---|---|---|
| **Gate departure / Out** | Parking brake release / door close / DGS movement after boarding | **Takeoff delay** proxy (scheduled CRSDep vs actual gate out = `DepDelay`) |
| **Wheels-off** | Runway liftoff | Not primary stub trigger (taxi-out can inflate vs gate) |
| **Gate arrival / In / block-in** | Arrival at destination gate | **Arrival delay** (`ArrDelay` = actual gate in − CRSArr) |
| **Wheels-on** | Touchdown | Not primary (taxi-in gap) |
| **BTS “late”** | ≥15 minutes after scheduled gate time | Industry reporting threshold — **not** Late Gate traveler τ |

**Sources:**  
https://transtats.bts.gov/DatabaseInfo.asp?DB_URL=&QO_VQ=EFD  
https://aspmhelp.faa.gov/index/ASQP__Definitions_of_Variables.html  

**Product mapping recommendation:** Settle Takeoff on **gate-out delay** vs published departure; settle Arrival on **gate-in delay** vs published arrival. Document that “Takeoff delay” in traveler copy means departure lateness from schedule (gate), not wheels-up — τ remains internal.

---

## 3. Industry delay rates

### 3.1 US — BTS published ≥15 min (gate)
From TranStats / Table 1A search excerpts (reporting operating carriers):

| Year | % Late Arrivals (≥15) | % Late Departures (≥15) | Source |
|---|---|---|---|
| 2023 | 20.25% | 20.25% | BTS Table 1A thru Dec 2024 xlsx (search extract) |
| 2024 | 20.48% | 20.36% | same |
| 2025* | ~20.17% delayed arrivals (ops chart) | — | https://www.transtats.bts.gov/homedrillchart.asp |

\*Chart series may mix marketing/operating samples; treat as ≈20% ±1pp for ≥15.

Marketing carrier annual arrivals delayed ≈20.75% (2023), 20.78% (2024), 20.16% (2025):  
https://www.transtats.bts.gov/Marketing_Annual.aspx?URL_SelectMonth=1&URL_SelectYear=2025&URL_Selection=1&URL_Time=1

### 3.2 US — Empirical ≥30/45/60 from BTS flight-level (this study)
**Sample:** All Reporting Carrier OTP flights, Jan 2024 + Jul 2024; operated, non-cancelled, non-diverted; `DepDelay` / `ArrDelay` minutes.

| Period | Product | n | p≥15 | p≥30 | p≥45 | p≥60 | p≥90 | p≥120 |
|---|---|---|---|---|---|---|---|---|
| 2024-01 | dep | 547k sched | 23.09% | 15.47% | 11.27% | 8.57% | — | — |
| 2024-01 | arr | ″ | 24.06% | 15.94% | 11.54% | 8.78% | — | — |
| 2024-07 | dep | 635k | 29.44% | 20.77% | 15.61% | 12.15% | — | — |
| 2024-07 | arr | ″ | 29.62% | 20.99% | 15.80% | 12.32% | — | — |
| **Weighted combo** | **dep** | **1.14M** | **26.51%** | **18.33%** | **13.61%** | **10.50%** | **6.73%** | **4.53%** |
| **Weighted combo** | **arr** | **1.14M** | **27.06%** | **18.66%** | **13.83%** | **10.69%** | **6.84%** | **4.61%** |

Files: `data/empirical_delay_rates_jan_jul_2024.csv`, `data/empirical_delay_rates_combined.csv`.

**Caveats:** Two months ≠ full year; summer (Jul) materially worse; excludes cancelled/diverted from delay CDF (they need separate product rules). Not route-conditioned.

### 3.3 US — published splits (this study, Jul 2024 dep p≥30)
- **Airline:** HA 6.6% → AA 28.9% (wide). File: `empirical_delay_splits_jul2024.csv`.
- **Day of week:** Thu ~17.5%; Fri ~25.7%.
- **Time of day:** 0600–0659 ~7.6%; 2000–2059 ~35.6%.
- **Origin (top-15 volume):** SEA ~14.5%; CLT ~35.9%.
- **Distance:** mild U-shape; mid-haul slightly worse than short/ultra-long in this month.

### 3.4 Europe — EUROCONTROL
- **2024 annual:** 72.4% arrivals within 15 min of STA → **~27.6%** arrival delay >15; avg delay ~17.5 min/flight.  
  https://www.eurocontrol.int/publication/all-causes-delays-air-transport-europe-annual-2024
- **2025 network review:** arrival punctuality 76.1% (≤15 late); departure punctuality 70.1%; avg departure all-causes delay 14.6 min (−16% vs 2024).  
  https://www.eurocontrol.int/sites/default/files/2026-01/eurocontrol-european-aviation-overview-20260123-2025-review.pdf
- **Sep 2025 monthly (bands):** flights delayed **>30 min**: dep 18.3%, arr 16.5%; bands include Del 31–60 and Del >60 (see PDF charts).  
  https://www.eurocontrol.int/sites/default/files/2025-10/eurocontrol-all-causes-delay-to-air-transport-september-2025.pdf
- **Dec 2024:** >30 min dep 14.7%, arr 13.7%.  
  https://www.eurocontrol.int/sites/default/files/2025-01/eurocontrol-all-causes-delay-to-air-transport-december-2024.pdf

Annual EU exact p≥45 / p≥60: **not extracted as a single published number** in materials fetched; use monthly band charts or CODA raw for pricing.

### 3.5 Academic delay CCDF
Wang et al. (arXiv:1701.05556) / Sci Rep follow-on: US departure delay CCDFs fit shifted power-law or exponentially truncated SPL (airline-specific). Useful for tail shape, not 2024 rates.  
https://ar5iv.labs.arxiv.org/html/1701.05556  
https://doi.org/10.1038/s41598-020-62871-6

---

## 4. Parametric / delay products (high-level comparison)

| Product | Trigger (public) | Benefit | Pricing public? | Notes |
|---|---|---|---|---|
| AXA + HK Express U-First parametric | ≥90 min delay; buy ≥48h prior | Lounge pass or HKD80 cash (HK origin) | Bundled in U-First; not standalone stub | https://www.axapartners.com/en/page/axa-hk-express-flight-delay-parametric-protection |
| Blink Parametric Flight Disruption | Configurable delay | Lounge / hotel / cash | B2B white-label | https://blinkparametric.com/blink-parametric-platform/blink-flight-disruption/ |
| Cover Genius Delay Valet | Partner-configured thresholds | Cash / lounge / credits; near-instant | Embedded B2B; not published retail π/B | https://covergenius.com/solutions/delay-valet/ |
| Hopper Disruption Guarantee | Configurable `min_minutes_delay` | Rebook any airline or refund (assistance, not classic parametric cash) | Dynamic via DG API | https://www.oag.com/hopper-case-study ; OpenAPI refs on apis.io |

**Takeaway:** Retail parametric cash stubs with transparent fixed π and tiered B are rare in public materials; most are bundled, B2B-configured, or assistance/rebooking. Late Gate’s transparent stub + inventory FOMO is differentiated. Exact competitor π rarely published — do not invent.

---

## 5. Pricing validation vs Eng lock

**Locked:** Takeoff π=$14; Arrival π=$9; B={100,150,200} at τ={30,45,60}.

### 5.1 Pool-average book (Jan+Jul 2024 weighted) — **underwater**
| Product | τ | p | E[payout]=p·B | π | House EV | Implied λ |
|---|---|---|---|---|---|---|
| Takeoff | 30 | 18.33% | $18.33 | $14 | **−$4.33** | 0.76 |
| Takeoff | 45 | 13.61% | $20.41 | $14 | **−$6.41** | 0.69 |
| Takeoff | 60 | 10.50% | $21.00 | $14 | **−$7.00** | 0.67 |
| Arrival | 30 | 18.66% | $18.66 | $9 | **−$9.66** | 0.48 |
| Arrival | 45 | 13.83% | $20.75 | $9 | **−$11.75** | 0.43 |
| Arrival | 60 | 10.69% | $21.38 | $9 | **−$12.38** | 0.42 |

**Conclusion:** Eng numbers are **not** fair for a random US flight. House EV > 0 requires **selective underwriting** (only list stubs when flight-level ˆp is below gates) and/or future risk-based π.

### 5.2 Break-even / λ=1.45 max p (underwriting gates)
| Product | τ | B | p break-even (λ=1) | p_max @ λ=1.45 |
|---|---|---|---|---|
| Takeoff | 30 | 100 | 14.00% | **9.66%** |
| Takeoff | 45 | 150 | 9.33% | **6.44%** |
| Takeoff | 60 | 200 | 7.00% | **4.83%** |
| Arrival | 30 | 100 | 9.00% | **6.21%** |
| Arrival | 45 | 150 | 6.00% | **4.14%** |
| Arrival | 60 | 200 | 4.50% | **3.10%** |

### 5.3 Clean demo / selective scenarios (EV > 0)
| Scenario | ˆp30/45/60 | Takeoff EV @τ30 | Arrival EV @τ30 |
|---|---|---|---|
| ultra_clean | 5/3/2% | +$9.00 (λ=2.80) | +$4.00 (λ=1.80) |
| clean_demo (recommended demo prior) | 8/5/3.5% | +$6.00 (λ=1.75) | +$1.00 (λ=1.12) |
| HA-like Jul dep | 6.6/3.6/2.4% | +$7.40 | +$2.40 |
| AS-like | 13.3/7.9/5.2% | +$0.70 | **−$4.30** |
| pool_avg | ~18.5/13.7/10.6% | loss | loss |

**Demo recommendation:** Keep Eng π/B locked for UI/demo; only enable inventory on flights with historical ˆp under Arrival gates (stricter). Prefer morning departures, better airlines/airports (e.g. HA/AS/SEA-like), off-peak DOW.

### 5.4 Alternative π/B if Eng later reopens pricing (not locked)
To hit λ≈1.45 on **pool** p without selection: Takeoff π≈$27–$31; Arrival π≈$27–$31 (same B). Or keep π and cut B to ≈$30–$55 (ugly traveler numbers). **Prefer selection + Eng lock** for demo.

---

## 6. Blockers
1. **Cirium / OAG:** paywalled; no public π tables; needed for live settlement & global coverage.
2. **BTS.xlsx summary tables:** Akamai often 403 to datacenter IPs; prezipped CSVs work.
3. **OpenSky:** no CRS schedule delay; commercial license required for product use.
4. **EU annual p≥45/60:** not a single published scalar in fetched PDFs — use monthly bands or airline feeds.
5. **Full-year 2024/2025 BTS:** only Jan+Jul downloaded here; expand for production priors.

---

## 7. File index
- `data/On_Time_2024_1.zip`, `On_Time_2024_7.zip`
- `data/jan2024/`, `data/jul2024/` CSVs
- `data/empirical_delay_rates_*.csv`
- `data/empirical_delay_splits_jul2024.csv`
- `data/pricing_validation_eng_baseline.csv`
- `data/pricing_selective_scenarios.csv`
- `figures/empirical_delay_cdf.png`
- `figures/house_ev_sensitivity.png`
