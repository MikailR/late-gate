# World ID / Selfie Check — feedback (ETHOnline 2026)

Late Gate uses World as an eligibility / abuse-prevention gate: **one ticket per human per flight**. That is `nullifier × flightKey`, verified server-side. Traveler copy is "confirm it's you at the gate" — not insurance, not a bet. The traveler never sees a chain.

This write-up is honest about what we shipped and what World still gates. We do **not** claim completed Sandbox phone journeys or live production Selfie Check proofs.

## What we implemented

- **IDKit-ready server verify** in `lib/world` + `POST /api/world/verify`.
- **`POST /api/world/rp-context`** (PR #8, `f10543f`) signs IDKit 4.x `rp_context` with server-only `WORLD_RP_SIGNING_KEY`. The Mini App never holds the key.
- When `NEXT_PUBLIC_WORLD_APP_ID` and `NEXT_PUBLIC_WORLD_RP_ID` are set, verify forwards the IDKit payload **as-is** to `POST https://developer.world.org/api/v4/verify/{rp_id}` and binds `action` to `late-gate-ticket`.
- **One-human-per-flight** `humanKey = keccak256(nullifier_be32 ‖ utf8(flightKey))`. Raw nullifier stays on the server. A 5-minute HMAC `worldSession` is what checkout presents to `POST /api/tickets`.
- **No fake verified-without-proof.** Configured World + an empty verify body is `UNVERIFIED`. The stub path is labeled `stub: true` and requires `{ flightKey, stubNullifier }`. It is not a World proof.

## Demo path we can actually ship

| Knob | Value | Why |
|---|---|---|
| `WORLD_ENV` | `sandbox` | Our rails flag. Sandbox-access docs say IDKit `environment: sandbox` so the handoff opens World ID (Sandbox). Sandbox proofs are non-production. |
| `WORLD_PRESET` | `orbLegacy` | Orb / World ID 3.0. Works without the Selfie Check feature flag. |
| `WORLD_ACTION` | `late-gate-ticket` | Uniqueness action for the buy path. |

When a Sandbox tester is on the phone, Mini App / Proto 3 should call **`POST /api/world/rp-context`**, then Sandbox IDKit (`environment: sandbox`, preset `orbLegacy`), then `POST /api/world/verify` with `{ flightKey, idkitResponse }`. UI copy should say Sandbox vs the gated production Selfie Check flag — see [`docs/INTEGRATION_SEAMS.md`](docs/INTEGRATION_SEAMS.md).

**As of 2026-09-13 we have not completed that phone journey.** See the Sandbox install blocker below.

## Sandbox install — blocked on TestFlight (as of 2026-09-13)

This is **install access**, not the Selfie Check flag.

- The public TestFlight group at https://testflight.apple.com/join/VZEurhHe is **not accepting new testers**. World docs do not list a newer public link.
- Official path now: Developer Portal → World ID Sandbox → iOS tab → submit Apple Account email → wait for a TestFlight invite. ETHOnline prize form: https://forms.gle/mqbaiwMvX5MzmKdY8. Rejected or revoked access: `sandbox.access@toolsforhumanity.org`.
- Mikail created a new Sandbox-enabled Developer Portal account, submitted enrolment, and is waiting on the invite. For the ETHOnline deadline we assume that email will not arrive in time.

**Deadline circumvention (product lock — not a live Sandbox proof):** Mini App shell via production World App + the first portal Mini App IDs. The product name is Late Gate. The verify demo uses honest `orbLegacy` / stub. Rails stay Sandbox-configured (`WORLD_ENV=sandbox`) so if the invite lands, `POST /api/world/rp-context` + `POST /api/world/verify { flightKey, idkitResponse }` still work. We do **not** treat this circumvention as a completed Sandbox phone proof.

## Production Selfie Check — blocked on World

Selfie Check (Beta) is **access-gated**. World docs and Discord say to email `developers@toolsforhumanity.com` so Tools for Humanity can enable the feature flag on the app. **ETHOnline teams cannot self-enable it.** A valid `app_id` / action does not imply Selfie Check access.

Until TFH flips that flag:

- We keep `WORLD_PRESET=orbLegacy`.
- We do **not** set `selfieCheckLegacy` and pretend live selfie proofs work.
- `selfieCheckLegacy` is the documented Selfie Check preset (World ID 3.0 today; World ID 4.0 support is not yet available). It can be requested for Sandbox **after** the flag is on. It is not the default.

Sandbox tester installs and the production Selfie Check flag are **two separate gates**. Getting onto TestFlight does not enable Selfie Check. Getting the Selfie Check flag does not install the Sandbox app. Both would be required before anyone can run a real selfie journey.

## Docs / Developer Portal / Sandbox (what was hard)

1. **Docs** — Presets vs legacy are clear (`orbLegacy` vs `selfieCheckLegacy`). Environment is `sandbox` vs `staging` (simulator only). Verify is always `POST https://developer.world.org/api/v4/verify/{rp_id}`; World says forward the IDKit JSON unchanged. `rp_id` (`rp_…`) is preferred; `app_id` (`app_…`) is still accepted. The gap: Selfie Check is documented as Beta **and** email-gated, with no self-serve toggle for hackathon apps. Sandbox install is a second email wait (portal iOS tab) after the public TestFlight group filled up.
2. **Developer Portal** — Finding World ID 4.0, the Sandbox page, and `rp_id` / `app_id` is fine. The Selfie Check flag status is **not** something we can flip. We have not received a grant as of 13 Sep 2026.
3. **Sandbox app** — The public TestFlight group is full. The remaining path is portal email enrolment, which has not arrived as of 13 Sep 2026. We have not completed a Sandbox World ID (or Hot / Cold / Semi-cold selfie) journey on a phone. World's own Sandbox selfie guide still says the Selfie Check feature must be enabled before those selfie journeys work — that is a separate blocker from the TestFlight wait.
4. **Wishlist** — A public TestFlight / Play track that stays open for hackathon testers, plus a documented, self-serve way to test one-action-per-human uniqueness (and Selfie Check) on Sandbox without waiting on email gates.

## Prize framing

The track asks for Selfie Check **or a compatible** World ID credential flow in a meaningful abuse-prevention path, plus this feedback doc. We implemented the compatible server path (`rp-context` signing + IDKit verify + `humanKey`) and default the demo to **Sandbox + `orbLegacy`**, with an honest labeled stub when there is no proof.

Two World-side blockers remain, and they are not the same thing:

1. **Sandbox install** — public TestFlight full; portal invite pending; deadline circumvention is labeled stub / `orbLegacy`, not a live Sandbox proof.
2. **Production Selfie Check flag** — still email-gated at `developers@toolsforhumanity.com`.

Those are the blockers, not missing rails on our side.
