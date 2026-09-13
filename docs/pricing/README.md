# Late Gate: Pricing research pack

Internal Eng / Rails docs for parametric Takeoff and Arrival delay stubs.

| Doc | Purpose |
|---|---|
| [technical-paper-flight-delay-pricing.md](./technical-paper-flight-delay-pricing.md) | Full technical paper (source) |
| [exec-summary.md](./exec-summary.md) | Short summary |
| [pricing-paper.html](./pricing-paper.html) | **Primary: print/academic Times/letter HTML** |
| [pricing-paper.pdf](./pricing-paper.pdf) | PDF of the primary academic layout |
| [pricing-paper-gitbook.html](./pricing-paper-gitbook.html) | Optional GitBook-style alternate (sidebar TOC) |
| [rails-pricing-constants.md](./rails-pricing-constants.md) | Human tables for `lib/pricing` |
| [rails-pricing-constants.json](./rails-pricing-constants.json) | Machine-readable constants |
| [research-notes.md](./research-notes.md) | Dataset survey + citations |
| [data/](./data/) | BTS-derived empirical rate CSVs |

**Layout lock:** Primary view is print/academic (Times/letter). Do not replace primary with website or sticky-sidebar chrome. GitBook HTML is optional only.

**Pricing lock (Eng):** Takeoff π=$14, Arrival π=$9, B(30/45/60)=$100/$150/$200. τ internal only. Selective underwriting required for house EV > 0.

Version: `eng-lock.v1`
