# Late Gate — integration seams (UI ↔ rails)

Contract for the Proto 3 UI rebuild. Types live in [`lib/domain`](../lib/domain). Partner clients are named exports from `lib/x402`, `lib/world`, `lib/ledger`, `lib/store`, `lib/oracle`.

House is the sole counterparty. Traveler sees zero chains. Never say insurance, bet, prediction, or gamble in traveler-facing copy. τ is internal (`tauMinutes` = `configure.minutesLate`). Human USD pot and HBAR machine till never mix.

Day-1 screens keep importing `@/lib/flights/types` and `@/lib/pricing/quote`. New work should import from `@/lib/domain`.

---

## Status

| Module | Status | Notes |
|---|---|---|
| `lib/domain` quote / refuse / observe / pot | **implemented** | NOT_FOUND → HOT → CUTOFF → FULL → UNDERWRITE_REJECT → quote. Adds DUPLICATE / UNVERIFIED / EXPOSURE_CAP copy. Configure changes payout, not premium. |
| `lib/domain` keys (flightKeyHash, humanKey, snapshotHash) | **implemented** | keccak256 via viem |
| `lib/flights` fixtures + oracle | **implemented** | Demo mode. DL2 settle fixture is not on the home chips. |
| `lib/flights/lookup` live Aviationstack | **TODO** | Needs `AVIATIONSTACK_KEY` |
| `lib/store` memory | **implemented** | Default local store |
| `lib/store` Upstash Redis | **implemented** | Used when `UPSTASH_REDIS_REST_*` are set |
| `GET /api/quote` | **implemented** | Unchanged Day-1 shape + extra quote fields |
| `POST /api/world/verify` | **stub** | Deterministic nullifier without `app_id`. Live v4 verify TODO. |
| `POST /api/tickets` | **implemented** | Store + demo pot + ledger stub |
| `GET /api/oracle/snapshot` | **stub** | Returns **402** then paid receipt. Live Blocky402 `withX402` TODO. |
| `scripts/agent/buy-snapshot.ts` | **implemented** | Stub pay. Real Hedera signer TODO. |
| `lib/x402` | **stub** | Facilitator `/supported` fetch is real; settle is stub |
| `lib/world` | **stub** | HMAC session implemented. Selfie flag gated — `orbLegacy` fallback |
| `lib/ledger` + `contracts/LateGateLedger.sol` | **stub** | ABI + in-memory writes. Live Base tx TODO. |
| `POST /api/worker/tick` | **implemented** | Observe → PAID / EXPIRED against the store |
| Subgraph / MCP | **TODO** | After ledger deploy |
| HCS audit | **TODO** | After Hedera topic |

---

## 1. FlightLookup / FlightSnapshot

**Who:** UI (lookup form) → `lookupSnapshot()` or Day-1 `lookupFlight()`. Worker uses `officialSnapshot(flightKey)`.

**Request:** `FlightLookup { query: FlightQuery, mode: "demo" \| "live" }`

**Response:** `FlightLookupResult` — snapshot + `flightKey` (`UA472|2026-09-12|EWR`) or `NOT_FOUND`.

**Errors:** `NOT_FOUND`. Live mode without `AVIATIONSTACK_KEY` is `NOT_FOUND` with a config reason (not a traveler-facing chain error).

**TODO vs implemented:** demo implemented. live TODO.

---

## 2. StubProduct / Configure / Quote

**Who:** UI configure + `GET /api/quote`. Worker reads `policy.configure`.

```ts
type StubProduct = "takeoff" | "arrival";
type Configure = { product: StubProduct; minutesLate: 30 | 45 | 60 };
```

`minutesLate` is the only UI-facing threshold. Internally `tauMinutes === minutesLate`. Default is arrival / 60 (Day-1).

**Money lock (winning triples):** Product selects a **fixed premium**. `minutesLate` selects payout from one table shared by both products. Do **not** re-derive dollars from `p * B * (1 + λ)` — `historicalDelayProb` and `λ` are display / risk copy only. HOT still compares live delay to the chosen `minutesLate`.

| Product | Premium (fixed) | Payout 30 | Payout 45 | Payout 60 |
|---|---|---|---|---|
| takeoff | **$14** | **$100** | **$150** | **$200** |
| arrival | **$9** | **$100** | **$150** | **$200** |

UA472 Day-1 default (arrival / 60) is **$9 / $200**. Same flight takeoff / 60 is **$14 / $200**. Human till only — do not send premium or payout to the HBAR machine till.

Lookup: `premiumUsdForProduct` / `PREMIUM_USD_BY_PRODUCT` and `payoutUsdForMinutesLate` / `PAYOUT_USD_BY_MINUTES_LATE` from `@/lib/domain`.

**Underwriting (Financial Research, version `2026-09-12.eng-lock.v1`):** constants in [`docs/pricing/rails-pricing-constants.json`](./pricing/rails-pricing-constants.json) and [`docs/pricing/README.md`](./pricing/README.md). `TARGET_LAMBDA = 1.45`. Refuse `UNDERWRITE_REJECT` when flight-level `p_hat` exceeds the listing cap for `(product, minutesLate)`. UA472 uses `clean_demo_prior` per τ (`p30=0.08`, `p45=0.05`, `p60=0.035`) so the FOMO demo still quotes. US pool-average p (~18%/14%/11%) is underwater — fixture `WN1818` refuses. τ stays internal; UI-facing configure is still `minutesLate` 30\|45\|60.

**CUTOFF:** demo **6h** before STD (Day-1 was 8h). Live default **4h**. **Inventory:** demo **5** stubs (`HOUSE_MAX_OPEN_PER_FLIGHT`); live default **10**. **EXPOSURE_CAP:** refusal type + portfolio constants only — route check is TODO.

**Request:** Day-1 query string plus optional `product`, `minutesLate`. `payout` / `maxPayout` query params are ignored.

**Response:** `Quote` (extends Day-1 `QuoteSuccess` with `product`, `configure`, `premiumCents`, `payoutCents`) or `QuoteRefusal`. `maxPayout` on the quote is the looked-up USD payout, not a second premium input.

**HTTP:** 200 quote / 409 refusal / 400 incomplete.

**Refusal codes:** `HOT` \| `CUTOFF` \| `NOT_FOUND` \| `FULL` \| `DUPLICATE` \| `UNVERIFIED` \| `UNDERWRITE_REJECT` \| `EXPOSURE_CAP`. Traveler stamp is **NOT ISSUED** + code.

**Quote order:** `NOT_FOUND` → `HOT` → `CUTOFF` → `FULL` → `UNDERWRITE_REJECT` → quote.

**TODO:** `FULL` needs subgraph `openCount`. Pass `book` into `quoteFlight` when Studio is live. `EXPOSURE_CAP` needs portfolio totals.

---

## 3. WorldVerify / humanKey

**Who:** UI checkout → `POST /api/world/verify` → then `POST /api/tickets`.

**Request:** `{ flightKey, idkitResponse?, stubNullifier? }`

**Response:** `{ ok, humanKey, worldSession, expiresAt }` (5-minute HMAC). Raw nullifier never goes to the client as a displayed field.

`humanKey = keccak256(nullifier_be32 ‖ utf8(flightKey))` — one human per flight.

**Errors:** 401 `UNVERIFIED`, 409 `DUPLICATE` (+ `existingPolicyId`).

**TODO:** TFH Selfie Check flag + Sandbox testers. Until then preset is `orbLegacy`. See [`FEEDBACK.md`](../FEEDBACK.md).

---

## 4. TicketIssue / Policy / Pot

**Who:** UI → `POST /api/tickets` (`issueTicket` in `lib/issue.ts`).

**Request:** `{ flightKey, worldSession, minutesLate?, product? }`

**Response:** 201 `{ policy, ticketNumber, potBalanceCents }` or 409 `NOT ISSUED` + refusal.

**Pot:** USD cents in `lib/store`. Demo grant `$50` (`DEMO_POT_GRANT_CENTS=5000`) on first issue. **Not HBAR.**

**Policy statuses:** OPEN → (worker) PAID \| EXPIRED. VOID is on-chain only. Traveler `TicketStatus` adds NOT ISSUED.

**TODO:** live `openPolicy` on Base once `LEDGER_ADDRESS` exists.

---

## 5. Settlement observe → PAID | EXPIRED

**Who:** worker (`POST /api/worker/tick` + later `scripts/worker.ts`). Not the traveler.

**Rule:** after `scheduledArrival + 15m`, `officialSnapshot` → `observedDelay ≥ minutesLate` → **PAID** (credit USD pot) else **EXPIRED**.

**TODO:** HCS ref string on `PolicySettled`; subgraph read for the ticket page.

---

## 6. x402 oracle snapshot + receipt

**Who:** machine agent (`npm run agent:snapshot`). Not the traveler.

**Request:** `GET /api/oracle/snapshot?flightKey=`

**Unpaid:** **402** `{ x402Version, accepts[], stub }` — HBAR tinybar, asset `0.0.0`, network `hedera:testnet`.

**Paid:** 200 `{ snapshot, snapshotHash, houseSig, observedAt, receipt }` where `receipt` has `amountTinybar`, `hederaTxId`, `hashscanUrl`.

Stub pay header: `X-Late-Gate-Stub-Pay: 1`.

**TODO:** `@x402/next` `withX402` + real agent signer when Hedera Portal accounts exist.

---

## 7. Ledger dual-write (Base Sepolia)

**Who:** backend only (`lib/ledger`). Same process writes USD ticket events to Base and enqueues x402 receipts (Hedera tx id as a string). Traveler never signs.

**Events:** `PolicyRefused`, `PolicyOpened`, `ObservationPosted`, `PolicySettled`, `X402Receipt`.

**TODO:** deploy `contracts/LateGateLedger.sol`, set `LEDGER_ADDRESS`, viem wallet + nonce queue, Studio subgraph.

---

## What the UI rebuild should import

```ts
import { quoteFlight, refuseDuplicate, type Quote, type Configure } from "@/lib/domain";
import { lookupSnapshot } from "@/lib/flights/lookup";
import { verifyWorldProof } from "@/lib/world";
import { issueTicket } from "@/lib/issue";
import { getStore } from "@/lib/store";
import { travelerStatus } from "@/lib/domain";
```

Or call the HTTP seams: `GET /api/quote`, `POST /api/world/verify`, `POST /api/tickets`. Do not send the traveler to Hedera or Base.

---

## Open blockers

1. **TFH email** — Selfie Check (Beta) + Sandbox tester access. Fallback: `orbLegacy`.
2. **Hedera Portal** ×2 (house + agent). Not the EVM faucet (hollow accounts).
3. **Blocky402** — no API key on testnet; still need Portal accounts for a HashScan-visible receipt.
4. **Base Sepolia ETH** + Studio deploy key for `LateGateLedger`.
5. **Upstash Redis** — memory store works locally; Vercel needs REST URL + token.
6. **Aviationstack** — live mode off until a key exists.
