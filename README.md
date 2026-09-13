# Late Gate

A single-seat parametric flight-delay ticket. Look up a flight, see a price for a fixed payout if that aircraft reaches the gate later than a threshold, pay from a USD travel pot, and either get paid or do not. The house is the only counterparty.

**If they miss the gate, you don’t miss the money.**

Consumer surface is a travel utility — no wallet chrome, no seed phrases. Do not call it insurance, a prediction market, or gambling. The traveler sees zero chains.

Day-1 UI (lookup / quote / refusal / OPEN stub) is still in the tree. **Proto 3 will scrap the visual shell.** Do not restyle it here. This branch adds the rails that rebuild will call: shared domain, store, partner stubs, and a paid-oracle seam.

Partner plan: [`docs/PARTNER_INTEGRATION_PLAN.md`](docs/PARTNER_INTEGRATION_PLAN.md). Prize boxes: [`docs/PRIZE_TRACK_CHECKLIST.md`](docs/PRIZE_TRACK_CHECKLIST.md). **UI ↔ rails contract:** [`docs/INTEGRATION_SEAMS.md`](docs/INTEGRATION_SEAMS.md).

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```
App: [http://127.0.0.1:47210](http://127.0.0.1:47210)

```bash
npm run typecheck
npm test
npm run build
```

No secrets required. Missing partner keys fall back to stubs (402 still returns on the oracle).

## What the UI rebuild should import

```ts
import { quoteFlight, type Quote, type Configure } from "@/lib/domain";
import { lookupSnapshot } from "@/lib/flights/lookup";
import { verifyWorldProof } from "@/lib/world";
import { issueTicket } from "@/lib/issue";
import { getStore } from "@/lib/store";
import { travelerStatus } from "@/lib/domain";
```

HTTP seams (same shapes):

| Call | Who | Result |
|---|---|---|
| `GET /api/quote` | UI | Day-1 quote or **NOT ISSUED** refusal |
| `POST /api/world/verify` | UI | `worldSession` + `humanKey` |
| `POST /api/tickets` | UI | Policy **OPEN**, USD pot debit |
| `GET /api/oracle/snapshot` | agent | **402** then paid snapshot (HBAR) |
| `POST /api/worker/tick` | house | Observe → **PAID** / **EXPIRED** |

Configure in any UI-facing type: `{ product: "takeoff" \| "arrival", minutesLate: 30 \| 45 \| 60 }`. τ is internal.

## Two tills, never mixed

| | Human till | Machine till |
|---|---|---|
| Who | Traveler | Agent script |
| Unit | USD cents in Redis / memory | tinybar (HBAR) via Blocky402 |
| Env | `UPSTASH_REDIS_*`, `DEMO_POT_GRANT_CENTS` | `HOUSE_HEDERA_*`, `BLOCKY402_URL`, `AGENT_HEDERA_*` |
| Route | `POST /api/tickets` | `GET /api/oracle/snapshot` |

## Machine till (x402)

```
curl -i "$BASE/api/oracle/snapshot?flightKey=UA837|2026-09-19|SFO"
# 402 + accepts (HBAR 0.001)

npm run agent:snapshot
# stub-paid 0.001 HBAR · UA837|… · HashScan URL
# defaults to the live clean fixture key (`UA837|<serviceDate>|SFO`)
```

With real Portal accounts, swap the stub header for `@x402/fetch` `wrapFetchWithPayment` (TODO in `lib/x402`). Testnet facilitator: `https://api.testnet.blocky402.com`. Native Hedera, no bridge.

```
unpaid GET ──402──► agent pays dust on Hedera
                         │
                         ▼
                   paid GET 200 { snapshot, snapshotHash, receipt.hederaTxId }
                         │
                         ▼
                   backend enqueues X402Receipt (dual-write to Base later)
```

## Day-1 demo (ETHGlobal Tokyo)

Times are offset from *now*, so HOT / CUTOFF / clean stay true. Home chips still show three fixtures only. The clean hero is United **UA 837 SFO → NRT** (far enough that demo CUTOFF 6h does not fire).

1. **HOT** — `B6 148 · BOS` — estimate already ~95 minutes late → **NOT ISSUED / HOT**
2. **CUTOFF** — `AA 100 · JFK` — inside the 6-hour window (Day-1 was 8h) → **CUTOFF**
3. **Clean** — `UA 837 · SFO` — arrival / 60 is **$9 / $200**, takeoff / 60 is **$14 / $200** → **OPEN** stub

Unknown flight → **NOT_FOUND**. Pool-average `WN 1818 · DAL` is off the chips → **UNDERWRITE_REJECT**. Domestic `UA 472 · EWR` is a second clean fixture (not the home chip).

Pricing lock + gates: [`docs/pricing/README.md`](docs/pricing/README.md).

A fourth fixture `DL2|<today>|ATL` exists for the worker settle path only.

## Layout

```
lib/domain/          quote, refuse, observe, pot, keys, events
lib/store/           Store + memory + Upstash
lib/x402/            machine till (stub if no Hedera keys)
lib/world/           Sandbox IDKit verify + humanKey (orbLegacy default)
lib/ledger/          LateGateLedger dual-write (PARKED — not prize-critical)
lib/usdc/            World Chain Sepolia USDC till (stub or live vault)
lib/oracle/          official snapshot sold via x402
lib/flights/         Day-1 fixtures + lookup
app/api/oracle/      paid snapshot
scripts/agent/       buy-snapshot consumer (PARKED)
scripts/deploy-vault.ts  LateGateVault → World Chain Sepolia
contracts/           LateGateVault.sol (prize) + LateGateLedger.sol (PARKED)
```

## Open blockers

- Production Selfie Check (Beta) is TFH-gated (`developers@toolsforhumanity.com`). Demo ships Sandbox + `orbLegacy` ([`FEEDBACK.md`](FEEDBACK.md)).
- Hedera Portal accounts (house + agent) and testnet HBAR — not the EVM faucet.
- Base Sepolia ETH, `LateGateLedger` deploy, Studio subgraph.
- Upstash Redis for a hosted pot (memory store is fine locally).
