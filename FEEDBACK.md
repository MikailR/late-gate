# World ID / Selfie Check — feedback (ETHOnline 2026)

Late Gate uses World as an eligibility / abuse-prevention gate: **one ticket per human per flight**. That is `nullifier × flightKey`, verified server-side. Traveler copy is "confirm it's you at the gate" — not insurance, not a bet. The traveler never sees a chain.

This write-up is honest about what we shipped and what World still gates. We do **not** claim live production Selfie Check proofs.

## What we implemented

- **IDKit-ready server verify** in `lib/world` + `POST /api/world/verify`.
- When `NEXT_PUBLIC_WORLD_APP_ID` and `NEXT_PUBLIC_WORLD_RP_ID` are set, the route forwards the IDKit payload **as-is** to `POST https://developer.world.org/api/v4/verify/{rp_id}` and binds `action` to `late-gate-ticket`.
- **One-human-per-flight** `humanKey = keccak256(nullifier_be32 ‖ utf8(flightKey))`. Raw nullifier stays on the server. A 5-minute HMAC `worldSession` is what checkout presents to `POST /api/tickets`.
- Without those env vars the route accepts a **deterministic stub nullifier** so the ticket-issue path can be tested. That stub is labeled (`stub: true`). It is not a World proof.

## Demo path we can actually ship

| Knob | Value | Why |
|---|---|---|
| `WORLD_ENV` | `sandbox` | IDKit environment World documents for integration testing. Sandbox proofs are non-production. |
| `WORLD_PRESET` | `orbLegacy` | Orb / World ID 3.0. Works without the Selfie Check feature flag. |
| `WORLD_ACTION` | `late-gate-ticket` | Uniqueness action for the buy path. |

Mini App / Proto 3 should call **Sandbox IDKit** (`environment: sandbox`, preset `orbLegacy`) and `POST` the result to `/api/world/verify`. UI copy should say Sandbox vs the gated production Selfie Check flag — see [`docs/INTEGRATION_SEAMS.md`](docs/INTEGRATION_SEAMS.md).

## Production Selfie Check — blocked on World

Selfie Check (Beta) is **access-gated**. World docs and Discord say to email `developers@toolsforhumanity.com` so Tools for Humanity can enable the feature flag on the app. **ETHOnline teams cannot self-enable it.** A valid `app_id` / action does not imply Selfie Check access.

Until TFH flips that flag:

- We keep `WORLD_PRESET=orbLegacy`.
- We do **not** set `selfieCheckLegacy` and pretend live selfie proofs work.
- `selfieCheckLegacy` is the documented Selfie Check preset (World ID 3.0 today; World ID 4.0 support is not yet available). It can be requested for Sandbox **after** the flag is on. It is not the default.

Sandbox tester installs are a **separate** gate (Developer Portal → World ID Sandbox → TestFlight / private Play track). That is install access, not the Selfie Check flag. Both are required before anyone can run a real selfie journey.

## Docs / Developer Portal / Sandbox (what was hard)

1. **Docs** — Presets vs legacy are clear (`orbLegacy` vs `selfieCheckLegacy`). Environment is `sandbox` vs `staging` (simulator only). Verify is always `POST https://developer.world.org/api/v4/verify/{rp_id}`; World says forward the IDKit JSON unchanged. `rp_id` (`rp_…`) is preferred; `app_id` (`app_…`) is still accepted. The gap: Selfie Check is documented as Beta **and** email-gated, with no self-serve toggle for hackathon apps.
2. **Developer Portal** — Finding World ID 4.0, the Sandbox page, and `rp_id` / `app_id` is fine. The Selfie Check flag status is **not** something we can flip. We have not received a grant as of 13 Sep 2026.
3. **Sandbox app** — Install is gated (iOS TestFlight enrollment + Android private Play). We have not completed Hot / Cold / Semi-cold selfie journeys on a phone because the app flag is off. World’s own Sandbox selfie guide says the feature must be enabled before those journeys work.
4. **Wishlist** — A documented, self-serve way to test one-action-per-human uniqueness (and Selfie Check) on Sandbox without waiting on a production flag email.

## Prize framing

The track asks for Selfie Check **or a compatible** World ID credential flow in a meaningful abuse-prevention path, plus this feedback doc. We implemented the compatible server path (IDKit verify + `humanKey`) and default the demo to **Sandbox + `orbLegacy`**. Production Selfie Check stays first-class in the architecture and stays **off** until World enables the flag. That is the blocker, not missing rails on our side.
