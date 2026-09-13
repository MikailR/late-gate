# Late Gate — pricing constants (Eng lock)

Machine-readable lock for `lib/pricing`: [`rails-pricing-constants.json`](./rails-pricing-constants.json) (version `2026-09-12.eng-lock.v1`).

**Do not change the locked dollars.** Product selects premium; `minutesLate` selects payout. Internal τ is the same number as `minutesLate` — never rename it in traveler UI.

| Product | Premium | Payout 30 | Payout 45 | Payout 60 |
|---|---|---|---|---|
| takeoff | **$14** | **$100** | **$150** | **$200** |
| arrival | **$9** | **$100** | **$150** | **$200** |

Underwriting at `TARGET_LAMBDA = 1.45` is a **listing gate**, not a re-price. Quote order: `NOT_FOUND` → `HOT` → `CUTOFF` → `FULL` → `UNDERWRITE_REJECT` → quote. Stamp stays **NOT ISSUED**.

| Gate | Demo | Default (live) |
|---|---|---|
| CUTOFF hours before STD | **6** (Day-1 was 8) | **4** |
| Inventory stubs / flight / product | **5** (`HOUSE_MAX_OPEN_PER_FLIGHT`) | **10** |

UA837 SFO–NRT FOMO demo uses `clean_demo_prior` per τ: `p30=0.08`, `p45=0.05`, `p60=0.035`. Do **not** sell at US pool-average p (~18%/14%/11%) — locked π is underwater there. Domestic `UA472` is a second clean fixture, not the hero.

Portfolio caps live in the JSON (`portfolio_exposure_limits`). Rails expose `EXPOSURE_CAP` copy; the route check is TODO.

UI rebuild contract: [`docs/INTEGRATION_SEAMS.md`](../INTEGRATION_SEAMS.md) §2.
