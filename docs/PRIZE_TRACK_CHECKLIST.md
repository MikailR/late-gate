# ETHOnline 2026 — Partner prize checklist (Late Gate)

**Last checked:** 2026-09-07 against live ETHGlobal prize pages  
**Project track:** Start Fresh  
**Product:** single-user parametric flight-delay ticket · house sole counterparty · travel-utility UI (hide rails)

Official pages:
- [Hedera](https://ethglobal.com/events/ethonline2026/prizes/hedera)
- [The Graph](https://ethglobal.com/events/ethonline2026/prizes/the-graph)
- [World](https://ethglobal.com/events/ethonline2026/prizes/world)

---

## Target prizes (only these)

| Sponsor | Track | Why us |
|---|---|---|
| **Hedera** | AI & Agentic Payments | Live x402 machine till + consumer agent paid E2E |
| **The Graph** | Best AI Tooling / AI Use Case (**From Scratch**) | Live Studio subgraph + MCP/SKILL NL over our events |
| **World** | Selfie Check | One-human-per-flight abuse prevention in buy path |

**Do not submit under:** Graph Composable/Standardized (one custom subgraph alone DQ); Hedera Tokenization / Harness / Continuity; World AgentKit Continuity (unless we later extend AgentKit).

---

## Architecture reminder (prize-feasible)

```
Traveler UX (Next.js travel utility)
        │
        ▼
 Late Gate backend
   ├─► Hedera: x402 payments (Blocky402) + optional HCS audit
   └─► Base Sepolia: LateGateLedger.sol events ──► Subgraph Studio (LIVE)
                                                      ├─► ticket UI reads status
                                                      └─► MCP + SKILL.md (agent NL)
 World Selfie Check ──► nullifier / one human per flight (server-side)
```

No bridge. Dual-write. Studio cannot index Hedera.

---

## Hedera — AI & Agentic Payments

**Qualify (must):**
- [ ] Live x402-gated service on Hedera testnet/mainnet via **Blocky402**
- [ ] Consumer platform/agent completes **≥1 real paid request** E2E
- [ ] Public **GitHub** repo + README (setup, architecture, payment flow)
- [ ] Demo video **≤5 min** showing the paid request (HashScan)

**Strong (extra credit, not required):**
- [ ] HCS verifiable payment audit trail
- [ ] Clear pay-per-call / metering story (snapshot dust fee)
- [ ] Recurring/streamed payments only if spare time

**Product mapping:** gate `/api/oracle/snapshot` (+ `/receipt`) behind x402; `scripts/agent/buy-snapshot.ts` (or equiv.) pays once. Traveler ticket UX need not be HBAR.

---

## The Graph — AI From Scratch (not Composable)

**Qualify (must):**
- [ ] `LateGateLedger.sol` on **Base Sepolia**; subgraph deployed to **Subgraph Studio**
- [ ] Consume **live** Studio data (mocked / local-only / static = DQ)
- [ ] App or ticket page **reads live subgraph** (load-bearing)
- [ ] MCP + **SKILL.md** (or equivalent) — NL / meaningful work with data, not raw dump
- [ ] Public repo + demo video **2–4 min**
- [ ] Submit under **AI From Scratch** pool (Start Fresh)

**Strong:**
- [ ] Agent question demo: "what's open on UA472?" → structured answer matching UI stub
- [ ] SKILL.md runnable from Cursor/Claude
- [ ] Pin `startBlock`; handle indexing lag UX ("Filing the receipt…")

**Avoid:** claiming Composable track with a single custom subgraph query.

---

## World — Selfie Check

**Qualify (must):**
- [ ] Selfie Check (or compatible) in a **meaningful** buy/abuse-prevention path
- [ ] Framed as risk / eligibility / fairness / continuity / **abuse prevention**
- [ ] Working app demo
- [ ] **FEEDBACK.md** (docs, Dev Portal, Sandbox states/errors, what was hard)
- [ ] Sandbox testing notes

**Ops:**
- [ ] Email TFH for Selfie feature access (or document `orbLegacy` fallback)

**Copy:** no insurance/gambling language in World-facing UI.

---

## Cross-cutting submission

- [ ] Public GitHub mirror of Origin app (Hedera text says GitHub; Graph says public repo)
- [ ] Showcase / finalist video **2–4 min**, ≥720p (~3:45 spine)
- [ ] Partner cuts: Hedera ≤5; Graph 2–4; World working app + feedback
- [ ] Finalist open-source + description

---

## Honest bar (2026-09-07)

Architecture qualifies. Day-1 is still UI-heavy — Eng must ship the three rails above. Qualification ≠ competitive depth: Graph needs real MCP NL; Hedera needs a real paid HashScan; World needs Selfie in the path + feedback doc.
