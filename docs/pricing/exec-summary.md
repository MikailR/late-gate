# Late Gate — Exec Summary (Mikail)

**Date:** 12 Sep 2026 (ET)  
**Ask:** Data-backed parametric stub pricing for Takeoff & Arrival delay products.

---

## Locked Eng baseline (demo / Rails)

| | Takeoff delay | Arrival delay |
|---|---|---|
| **Premium π** | **$14** | **$9** |
| **Payouts B** | **$100 / $150 / $200** at internal 30 / 45 / 60 min | same |
| Structure | Fixed premium; traveler picks one buffer tier; payout scales | same |
| Inventory | Limited stubs / flight / product (default 10; demo 5) | |
| Counterparty | House only (no user LP yet) | |

τ stays **internal** — UI never shows “30/45/60 minutes” as underwriting jargon.

---

## What the data says

From **BTS** flight-level On-Time Performance (Reporting Carrier), **Jan + Jul 2024** (~1.14M operated flights):

| | p(delay ≥ 30) | ≥ 45 | ≥ 60 |
|---|---|---|---|
| **Departure (Takeoff proxy)** | **18.3%** | **13.6%** | **10.5%** |
| **Arrival** | **18.7%** | **13.8%** | **10.7%** |

US industry ≥15 min late remains ~**20–21%** (BTS 2023–2025). Europe is similar or worse on >15 (EUROCONTROL 2024 arrival punctuality ~72% → ~28% >15).

Delays concentrate by **airline, airport, time-of-day, day-of-week** (e.g. Jul 2024 morning dep p≥30 ~8%; evening ~35%; HA ~7% vs AA ~29%).

---

## Critical pricing finding

**At pool-average probabilities, Eng’s locked π/B loses money** (house EV deeply negative; implied λ ≈ 0.4–0.8).

| Product | Example τ=30 | E[payout] at pool p | π | House EV |
|---|---|---|---|---|
| Takeoff | 18.3% × $100 | $18.33 | $14 | **−$4.33** |
| Arrival | 18.7% × $100 | $18.66 | $9 | **−$9.66** |

**We keep Eng numbers as the locked baseline** for UI/demo/Rails constants, and make the book work via **selective underwriting**:

- Only list stubs when flight-level \(\hat{p}\) is below gates (Arrival is stricter than Takeoff).
- Target load **λ ≈ 1.45** on the *underwritten* book.
- Clean demo prior \(\hat{p}\) ≈ **8% / 5% / 3.5%** → Takeoff EV ≈ **+$6 to +$7**; Arrival EV ≈ **+$1 to +$2** per stub.

If Eng later reopens prices for a *random-flight* book, fair π at λ=1.45 & current B is roughly **$27–$31** per product — or cut B sharply. Prefer **selection + locked π** for the demo.

---

## Top 5 risk controls

1. **UNDERWRITE_REJECT / p_max gates** — don’t sell high-\(\hat{p}\) flights.  
2. **CUTOFF** — stop sales before STD (4–6h).  
3. **HOT** — freeze sales when delay/weather develops.  
4. **Inventory + portfolio caps** — FOMO stubs; airport/airline/day exposure limits; weather multiplier 0.35.  
5. **DUPLICATE** — one stub / user / flight / product.

---

## Settlement (MVP)

- **Takeoff** = gate-out vs schedule; **Arrival** = gate-in vs schedule (matches BTS `DepDelay` / `ArrDelay`).  
- Observe with buffer; 72h dispute window.  
- Live settlement needs **Cirium/OAG** (paywalled); BTS is free but lagged (great for priors/backtest).

---

## Traveler copy

Avoid “insurance / gambling / odds.” Prefer stub, payout, delay cushion, limited inventory. Paper may use actuarial language; UI must not.

---

## Deliverables

| File | Path |
|---|---|
| Technical paper | `/workspace/late-gate-docs/technical-paper-flight-delay-pricing.md` |
| Research notes | `/workspace/late-gate-docs/research-notes.md` |
| Rails tables | `/workspace/late-gate-docs/rails-pricing-constants.md` |
| Rails JSON | `/workspace/late-gate-docs/rails-pricing-constants.json` |
| Data & figures | `/workspace/late-gate-docs/data/`, `figures/` |

**Bottom line:** Ship Eng’s **$14 / $9** and **$100/$150/$200**, but **only on clean flights**. That is how house EV stays > 0 without abandoning the locked traveler-facing numbers.
