# Late Gate — integration seams (UI ↔ rails)

Contract for the Proto 3 UI rebuild / World Mini App. Types live in [`lib/domain`](../lib/domain). Partner clients are named exports from `lib/usdc`, `lib/world`, `lib/store`, `lib/oracle`. Parked (not prize-critical) stubs remain in `lib/x402` and `lib/ledger`.

**Locked chain:** World Chain. Demo/testnet = **World Chain Sepolia, chain id 4801**. Mainnet (480) addresses are documented only — do not target mainnet.

**Locked prize till:** native **USDC** (6 decimals) on Sepolia. House is still operator; the pot is no longer house-only capital — house **and** users deposit USDC into a shared vault (`lpDeposit` / `lpWithdraw`).

Traveler-facing copy still never says insurance, bet, prediction, or gamble. τ is internal (`tauMinutes` = `configure.minutesLate`). **Do not rebuild the Day-1 traveler UI on this branch.**

Day-1 screens keep importing `@/lib/flights/types` and `@/lib/pricing/quote`. New work should import from `@/lib/domain` and `@/lib/usdc`.

The leftover **memory USD pot** is a labeled **demo fallback**, not the locked prize story. The leftover **Redis / Upstash USD pot** is not prize money — do not mix it with USDC settlement.

---

## Status

| Module | Status | Notes |
|---|---|---|
| `lib/domain` quote / refuse / observe / pot | **implemented** | NOT_FOUND → HOT → CUTOFF → FULL → UNDERWRITE_REJECT → quote. Adds DUPLICATE / UNVERIFIED / EXPOSURE_CAP copy. Configure changes payout, not premium. Memory pot = fallback only. |
| `lib/domain` keys (flightKeyHash, humanKey, snapshotHash) | **implemented** | keccak256 via viem |
| `lib/usdc` chain + amounts | **implemented** | Sepolia 4801, Circle USDC, cents ↔ 6-decimal units |
| `contracts/LateGateVault.sol` | **implemented** | USDC in/out, lgUSDC LP shares, house-only `payout` / `withdraw`, `payPremium` / `collect`, pause + house role |
| `lib/usdc` `payPremium` / `payout` / `lpDeposit` / `lpWithdraw` | **implemented (gated)** | Stub receipts (`implemented: false`) unless `WORLDCHAIN_RPC` + `HOUSE_EVM_PRIVATE_KEY` + `LP_VAULT_ADDRESS` are all set — then live viem sends (`implemented: true` only after a real tx hash) |
| `lib/flights` fixtures + oracle | **implemented** | Demo mode. DL2 settle fixture is not on the home chips. |
| `lib/flights/lookup` live Aviationstack | **TODO** | Needs `AVIATIONSTACK_KEY` |
| `lib/store` memory | **implemented** | Default local store. Pot methods = labeled fallback, not prize path |
| `lib/store` Upstash Redis | **implemented** | Policies / bindings when `UPSTASH_REDIS_REST_*` are set. Redis USD pot is leftover, not prize-critical |
| `GET /api/quote` | **implemented** | Unchanged Day-1 shape + extra quote fields |
| `POST /api/world/verify` | **implemented (Sandbox / stub)** | IDKit-ready server verify + `humanKey`. Live v4 when `app_id` + `rp_id` are set. No live selfie proofs without the TFH flag. |
| `POST /api/tickets` | **implemented** | World session → USDC `payPremium` (live when env is set) → policy. Live pay failure → NOT ISSUED. Memory pot debit is fallback |
| `GET /api/oracle/snapshot` | **PARKED stub** | Still returns **402** then paid receipt. Hedera / Blocky402 is not prize-critical |
| `scripts/agent/buy-snapshot.ts` | **PARKED** | Hedera agent path. Not prize-critical |
| `lib/x402` | **PARKED stub** | Facilitator `/supported` fetch is real; settle is stub. Do not treat as traveler payout |
| `lib/world` | **implemented** | HMAC session + `humanKey`. Default `WORLD_ENV=sandbox`, `WORLD_PRESET=orbLegacy`. `selfieCheckLegacy` needs the TFH flag. |
| `lib/ledger` + `contracts/LateGateLedger.sol` | **PARKED stub** | ABI + in-memory writes. Base / The Graph dual-write is not prize-critical |
| `POST /api/worker/tick` | **implemented** | Observe → PAID / EXPIRED. PAID calls USDC `payout` (live when env is set; stays OPEN on live failure) |
| Subgraph / MCP | **PARKED** | After ledger deploy — not prize-critical |
| HCS audit | **PARKED** | After Hedera topic — not prize-critical |

---

## 1. FlightLookup / FlightSnapshot

**Who:** UI (lookup form) → `lookupSnapshot()` or Day-1 `lookupFlight()`. Worker uses `officialSnapshot(flightKey)`.

**Request:** `FlightLookup { query: FlightQuery, mode: "demo" \| "live" }`

**Response:** `FlightLookupResult` — snapshot + `flightKey` (`UA837|2026-09-19|SFO`) or `NOT_FOUND`.

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

Premium and payout are **USDC** on World Chain Sepolia (quoted in USD cents, settled as 6-decimal units). Same numbers as before:

| Product | Premium (fixed) | Payout 30 | Payout 45 | Payout 60 |
|---|---|---|---|---|
| takeoff | **$14** | **$100** | **$150** | **$200** |
| arrival | **$9** | **$100** | **$150** | **$200** |

UA837 SFO–NRT default (arrival / 60) is **$9 / $200**. Same flight takeoff / 60 is **$14 / $200**. Send these to `lib/usdc`, not to Hedera and not to the Redis leftover pot.

Lookup: `premiumUsdForProduct` / `PREMIUM_USD_BY_PRODUCT` and `payoutUsdForMinutesLate` / `PAYOUT_USD_BY_MINUTES_LATE` from `@/lib/domain`. Amount helpers: `centsToUsdcUnits` / `usdcUnitsToCents` from `@/lib/usdc` (`$9` = `900` cents = `9_000_000` units).

**Underwriting (Financial Research, version `2026-09-12.eng-lock.v1`):** constants in [`docs/pricing/rails-pricing-constants.json`](./pricing/rails-pricing-constants.json) and [`docs/pricing/README.md`](./pricing/README.md). `TARGET_LAMBDA = 1.45`. Refuse `UNDERWRITE_REJECT` when flight-level `p_hat` exceeds the listing cap for `(product, minutesLate)`. UA837 uses `clean_demo_prior` per τ (`p30=0.08`, `p45=0.05`, `p60=0.035`) so the FOMO demo still quotes. US pool-average p (~18%/14%/11%) is underwater — fixture `WN1818` refuses. Domestic `UA472` is a second clean fixture, not the hero. τ stays internal; UI-facing configure is still `minutesLate` 30\|45\|60.

**CUTOFF:** demo **6h** before STD (Day-1 was 8h). Live default **4h**. **Inventory:** demo **5** stubs (`HOUSE_MAX_OPEN_PER_FLIGHT`); live default **10**. **EXPOSURE_CAP:** refusal type + portfolio constants only — route check is TODO.

**Request:** Day-1 query string plus optional `product`, `minutesLate`. `payout` / `maxPayout` query params are ignored.

**Response:** `Quote` (extends Day-1 `QuoteSuccess` with `product`, `configure`, `premiumCents`, `payoutCents`) or `QuoteRefusal`. `maxPayout` on the quote is the looked-up USD payout, not a second premium input.

**HTTP:** 200 quote / 409 refusal / 400 incomplete.

**Refusal codes:** `HOT` \| `CUTOFF` \| `NOT_FOUND` \| `FULL` \| `DUPLICATE` \| `UNVERIFIED` \| `UNDERWRITE_REJECT` \| `EXPOSURE_CAP`. Traveler stamp is **NOT ISSUED** + code.

**Pick-time UX (no UI work here):** `UNDERWRITE_REJECT` and the other **NOT ISSUED** codes used at flight/product pick (`HOT`, `CUTOFF`, `FULL`, `EXPOSURE_CAP`) should render as a **disabled row with a reason**, not a separate sorry screen. `NOT_FOUND` / `DUPLICATE` / `UNVERIFIED` stay path-level.

**Quote order:** `NOT_FOUND` → `HOT` → `CUTOFF` → `FULL` → `UNDERWRITE_REJECT` → quote.

**TODO:** `FULL` needs subgraph `openCount`. Pass `book` into `quoteFlight` when Studio is live. `EXPOSURE_CAP` needs portfolio totals.

---

## 3. WorldVerify / humanKey

**Who:** Mini App / Proto 3 checkout → Sandbox IDKit → `POST /api/world/verify` → then USDC `payPremium` → `POST /api/tickets`.

One human per flight is the abuse gate. The chain pivot does not move this off the buy path.

**Shippable path (no production Selfie Check flag):**

1. Mini App runs **Sandbox IDKit**: `environment: "sandbox"`, preset **`orbLegacy`**, action `late-gate-ticket`.
2. Forward the IDKit result **unchanged** to `POST /api/world/verify` as `idkitResponse`.
3. Server verifies at `https://developer.world.org/api/v4/verify/{rp_id}` when `NEXT_PUBLIC_WORLD_APP_ID` + `NEXT_PUBLIC_WORLD_RP_ID` are set, then issues `humanKey` + a 5-minute HMAC `worldSession`.

**UI copy (when Proto 3 / Mini App exists — not this branch):** say this is **Sandbox**. Say production **Selfie Check (Beta)** is gated by Tools for Humanity (`developers@toolsforhumanity.com`). ETHOnline teams cannot self-enable that flag. Do **not** present a live selfie CTA as working.

**Fallback (local / empty World creds):**

- No `app_id` / `rp_id` → deterministic **stub** nullifier (`stubNullifier` or `stub:{flightKey}`). Response includes `stub: true`.
- Preset stays **`orbLegacy`**. `selfieCheckLegacy` is only valid after TFH enables the app flag — even in Sandbox, live selfie proofs will not work without it.

**Request:** `{ flightKey, idkitResponse?, stubNullifier? }`

**Response:** `{ ok, humanKey, worldSession, expiresAt, stub, preset }` (5-minute HMAC). Raw nullifier never goes to the client as a displayed field.

`humanKey = keccak256(nullifier_be32 ‖ utf8(flightKey))` — one human per flight.

**Errors:** 401 `UNVERIFIED`, 409 `DUPLICATE` (+ `existingPolicyId`).

**Not claimed:** live production Selfie Check proofs. See [`FEEDBACK.md`](../FEEDBACK.md).

---

## 4. USDC till — payPremium (locked prize path)

**Who:** Traveler **Mini App / Proto 3** pays USDC on World Chain Sepolia. Backend records it via `payPremium` inside `issueTicket` (`POST /api/tickets`). House does not pay the traveler's premium.

```
Mini App                    Late Gate                     World Chain Sepolia
   │                            │
   │  GET /api/quote            │
   │───────────────────────────►│
   │  POST /api/world/verify    │
   │───────────────────────────►│
   │  USDC.approve(vault)  OR   │
   │  USDC.transfer(vault)      │─────────────────────────► LP vault
   │  POST /api/tickets         │
   │  { worldSession,           │
   │    travelerAddress,        │
   │    usdcTxHash? }           │
   │───────────────────────────►│  payPremium (live or stub)
```

**Call:** `payPremium({ from, amountCents, flightKey, policyId?, txHash? })` from `@/lib/usdc`.

**HTTP:** Proto 3 should keep posting `POST /api/tickets` after World verify. Body fields: `travelerAddress` (`0x…` Mini App wallet), `usdcTxHash` (if the Mini App already `transfer`ed USDC to the vault).

**Mini App must do one of these on World Chain Sepolia (4801) before / with `POST /api/tickets`:**

1. **Approve + our `payPremium` (preferred when live env is set)**
   - `USDC.approve(LP_VAULT_ADDRESS, premiumUnits)` — token `0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88`, 6 decimals.
   - Arrival $9 → `9000000`. Takeoff $14 → `14000000`.
   - Then `POST /api/tickets` with `travelerAddress`. Backend house signer calls `vault.payPremium(traveler, units)` (`transferFrom`).
2. **Transfer + recorded hash**
   - `USDC.transfer(LP_VAULT_ADDRESS, premiumUnits)` from the traveler wallet.
   - `POST /api/tickets` with `travelerAddress` + `usdcTxHash` (32-byte). Backend records it; no second pull. House may later `collect(from, amount)` to emit `PremiumPaid`.

Do **not** send mainnet (480). House does not pay the traveler's premium.

**Amounts:** quote `premiumCents` → `centsToUsdcUnits`. Arrival $9 = `900` cents = `9000000` units. Takeoff $14 = `1400` / `14000000`.

**Token:** `USDC_ADDRESS` default `0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88` (Circle + World docs, 2026-09-13). **Vault:** `LP_VAULT_ADDRESS` (set after `npm run deploy:vault`). **Signer (house, payouts / vault ops):** `HOUSE_EVM_PRIVATE_KEY`. **RPC:** `WORLDCHAIN_RPC` (must be explicitly set for live sends; the public Alchemy URL is a docs default only). **Faucet:** https://faucet.circle.com

**ABI / events** (export `LATE_GATE_VAULT_ABI` from `@/lib/usdc`):

| Surface | Name | Who |
|---|---|---|
| write | `payPremium(from, amount)` | house relayer after traveler `approve` |
| write | `collect(from, amount)` | house — recorded deposit, no pull |
| write | `payout(to, amount)` | house only |
| write | `deposit(assets)` / `depositFor(from, assets)` | LP or house (needs USDC allowance) |
| write | `withdraw(to, assets)` | house only — burns `to`'s lgUSDC shares |
| write | `setPaused(bool)` / `transferHouse(next)` | house only |
| event | `PremiumPaid(from, amount, pulled)` | premium |
| event | `PayoutSent(to, amount)` | settlement |
| event | `LpDeposited(from, assets, shares)` / `LpWithdrawn(to, assets, shares)` | pot |

**Response:** `{ ok, stub, implemented, op: "payPremium", asset: "USDC", chainId: 4801, token, from, to, amountCents, amountUnits, txHash, explorerUrl, todo }`. `implemented: true` only after a real 32-byte hash (live send or recorded Mini App transfer). Stub path stays `stub: true`, `implemented: false`.

**TODO vs implemented:** vault + live viem path **implemented**. Live send still needs Mikail's RPC + funded house key + deployed `LP_VAULT_ADDRESS`.

---

## 5. TicketIssue / Policy

**Who:** UI / Mini App → `POST /api/tickets` (`issueTicket` in `lib/issue.ts`).

**Request:** `{ flightKey, worldSession, minutesLate?, product?, travelerAddress?, usdcTxHash? }`

**Response:** 201 `{ policy, ticketNumber, potBalanceCents, potSource: "memory-fallback", usdc }` or 409 `NOT ISSUED` + refusal.

**Prize money:** USDC `payPremium` (stub if env missing; live `transferFrom` / recorded hash when configured). Live pay failure refuses the ticket (`UNVERIFIED` / "The premium did not clear."). Settlement later is USDC `payout`.

**Fallback pot:** USD cents in the **memory** store only (`getFallbackPotStore`). Demo grant `$50` (`DEMO_POT_GRANT_CENTS=5000`) on first issue. Labeled `potSource: "memory-fallback"`. **Not Redis. Not HBAR. Not the locked story.**

**Policy statuses:** OPEN → (worker) PAID \| EXPIRED. VOID is on-chain only. Traveler `TicketStatus` adds NOT ISSUED. Policy may carry `travelerAddress` + `usdcTx`.

**PARKED:** live `openPolicy` on Base once `LEDGER_ADDRESS` exists — not prize-critical.

---

## 6. Settlement observe → PAID | EXPIRED (USDC payout)

**Who:** worker (`POST /api/worker/tick` + later `scripts/worker.ts`). Not the traveler.

**Rule:** after `scheduledArrival + 15m`, `officialSnapshot` → `observedDelay ≥ minutesLate` → **PAID** else **EXPIRED**.

**PAID:** `payout({ to: travelerAddress, amountCents, policyId, ticketNumber })` — house calls `vault.payout` when live env is set. Stub OK if env is missing. Live failure leaves the policy **OPEN** for retry (no memory-pot credit).

**Payout table (USDC):** 30 → $100 (`100000000` units) · 45 → $150 · 60 → $200.

**Fallback:** memory pot credit, reason `settle-fallback:…`. Do not credit leftover Redis USD as prize money.

**PARKED:** HCS ref string on `PolicySettled`; subgraph read for the ticket page.

---

## 7. LP vault — lpDeposit / lpWithdraw

**Who:** house operator + LPs (users). Not the traveler ticket UI.

House remains operator. Capital is a shared USDC pot: house deposits and users deposit.

| Call | Who | What |
|---|---|---|
| `lpDeposit({ from, amountCents, role: "house" \| "lp", txHash? })` | House wallet or LP wallet | USDC into `LP_VAULT_ADDRESS` (approve + `deposit` / `depositFor`, or recorded `txHash`) |
| `lpWithdraw({ to, amountCents, role: "house" \| "lp" })` | House operator only | `vault.withdraw` — live path checks the signer equals `vault.house()` |

**Implemented:** `LateGateVault` + stub receipts when env is missing + `MISSING_VAULT` when `LP_VAULT_ADDRESS` is empty (will not invent a vault). Live withdraw returns `NOT_HOUSE` if the key is not the on-chain house.

**Deploy (not a CI step — no key):**

```bash
WORLDCHAIN_RPC=... HOUSE_EVM_PRIVATE_KEY=... npm run deploy:vault
# prints: LP_VAULT_ADDRESS=0x…
```

No traveler Mini App screen for this on this branch.

---

## 8. x402 oracle snapshot + receipt — PARKED

**Who:** machine agent (`npm run agent:snapshot`). Not the traveler. **Not prize-critical.**

**Request:** `GET /api/oracle/snapshot?flightKey=`

**Unpaid:** **402** `{ x402Version, accepts[], stub }` — HBAR tinybar, asset `0.0.0`, network `hedera:testnet`.

**Paid:** 200 `{ snapshot, snapshotHash, houseSig, observedAt, receipt }` where `receipt` has `amountTinybar`, `hederaTxId`, `hashscanUrl`.

Stub pay header: `X-Late-Gate-Stub-Pay: 1`.

**TODO (parked):** `@x402/next` `withX402` + real agent signer when Hedera Portal accounts exist.

---

## 9. Ledger dual-write (Base Sepolia) — PARKED

**Who:** backend only (`lib/ledger`). Same process still enqueues ticket events. Traveler never signs. **Not prize-critical.** The Graph / subgraph path is parked with this.

**Events:** `PolicyRefused`, `PolicyOpened`, `ObservationPosted`, `PolicySettled`, `X402Receipt`.

**TODO (parked):** deploy `contracts/LateGateLedger.sol`, set `LEDGER_ADDRESS`, viem wallet + nonce queue, Studio subgraph.

`HOUSE_EVM_PRIVATE_KEY` is **reused** as the World Chain house signer for USDC payouts / vault ops.

---

## What Proto 3 / Mini App should call

```ts
import { quoteFlight, type Quote, type Configure } from "@/lib/domain";
import { lookupSnapshot } from "@/lib/flights/lookup";
import { verifyWorldProof } from "@/lib/world";
import { issueTicket } from "@/lib/issue";
import {
  payPremium,
  centsToUsdcUnits,
  LATE_GATE_VAULT_ABI,
  USDC_SEPOLIA_ADDRESS,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
} from "@/lib/usdc";
import { travelerStatus } from "@/lib/domain";
```

Or the HTTP seams (no Day-1 traveler UI rebuild):

| Call | Who | Result |
|---|---|---|
| `GET /api/quote` | Mini App | Day-1 quote or **NOT ISSUED** refusal |
| `POST /api/world/verify` | Mini App (after Sandbox IDKit) | `worldSession` + `humanKey` (`orbLegacy` / stub). Not live Selfie Check. |
| `USDC.approve(vault, units)` or `USDC.transfer(vault, units)` | Mini App | Premium allowance or recorded deposit on **4801** |
| `POST /api/tickets` | Mini App | Policy **OPEN** + USDC receipt. Body: `flightKey`, `worldSession`, `travelerAddress`, optional `usdcTxHash` |
| `POST /api/worker/tick` | house | Observe → **PAID** / **EXPIRED** + USDC `payout` |
| `lpDeposit` / `lpWithdraw` | house + LPs | Shared USDC vault. Not a traveler screen |

Do not send the traveler to Hedera or Base. Do not treat Redis `potBalanceCents` as the prize balance — it is `potSource: "memory-fallback"`.

---

## Open blockers

1. **Mikail — World Chain Sepolia RPC** (`WORLDCHAIN_RPC`). Public docs URL: `https://worldchain-sepolia.g.alchemy.com/public`. Must be set (not just the code default) to unlock live sends.
2. **Mikail — Circle faucet USDC** on World Chain Sepolia for the house signer + a traveler demo wallet. https://faucet.circle.com
3. **Mikail — house signer** (`HOUSE_EVM_PRIVATE_KEY`) funded with Sepolia ETH (gas) + faucet USDC.
4. **`LP_VAULT_ADDRESS`** — run `npm run deploy:vault` with (1)+(3), then paste the printed address. Until all three exist, receipts stay stub (`implemented: false`).
5. **TFH email** — production Selfie Check (Beta) flag (`developers@toolsforhumanity.com`). ETHOnline cannot self-enable it. Shipped default: Sandbox + `orbLegacy` / stub. Sandbox tester installs are a separate gate.
6. **Aviationstack** — live mode off until a key exists.
7. **PARKED (do not delete):** Hedera Portal ×2, Blocky402 (`lib/x402`), Base Sepolia ledger (`lib/ledger`, `contracts/LateGateLedger.sol`) + Studio subgraph.
