# Late Gate: Pricing research pack

Internal Eng / Rails docs for parametric Takeoff and Arrival delay stubs.

| Doc | Purpose |
|---|---|
| [technical-paper-flight-delay-pricing.md](./technical-paper-flight-delay-pricing.md) | Full technical paper (source) |
| [exec-summary.md](./exec-summary.md) | Front-matter style summary |
| [pricing-paper.html](./pricing-paper.html) | GitBook-like academic HTML |
| [pricing-paper-academic.html](./pricing-paper-academic.html) | Same HTML (alias) |
| [pricing-paper.pdf](./pricing-paper.pdf) | PDF of the academic layout |
| [md_to_paper.py](./md_to_paper.py) | Markdown to HTML renderer |
| [rails-pricing-constants.md](./rails-pricing-constants.md) | Human tables for `lib/pricing` |
| [rails-pricing-constants.json](./rails-pricing-constants.json) | Machine-readable constants |
| [research-notes.md](./research-notes.md) | Dataset landscape and method notes |
| [data/](./data/) | Empirical CSVs and validation tables |
| [figures/](./figures/) | Delay CDF and house EV charts |

**Pricing lock (`eng-lock.v1`):** Takeoff π=$14; Arrival π=$9; B=$100/$150/$200. Selective underwriting required (pool-average p≥30 ≈ 18%).

Prefer the academic HTML/PDF for review. Regenerate with `python3 md_to_paper.py` then Chrome headless print-to-pdf.
