# World ID / Selfie Check — feedback (draft)

Late Gate uses World as an eligibility / abuse-prevention gate: **one ticket per human per flight**. That is `nullifier × flightKey`, verified server-side. The traveler never sees a chain. Copy is "confirm it's you at the gate" — not insurance, not a bet.

## Current state (12 Sep 2026)

- Rails: `lib/world` + `POST /api/world/verify`.
- Preset: **`orbLegacy`** until Tools for Humanity enables Selfie Check (Beta) on our `app_id`.
- Live `POST https://developer.world.org/api/v4/verify/{rp_id}` is wired but unused until `NEXT_PUBLIC_WORLD_APP_ID` / `WORLD_RP_ID` exist.
- Without those env vars the route accepts a stub nullifier so the ticket issue path can be tested.

## Access gate (blocker)

Selfie Check is flagged behind an email to `developers@toolsforhumanity.com`. Sandbox tester installs are separately gated (TestFlight / Play). We have not received either grant as of this draft. That is the main friction.

## What we will fill in once a phone is on Sandbox

1. Docs: presets vs legacy, `environment: sandbox` vs `staging`, where `rp_id` vs `app_id` are used, v4 verify passthrough.
2. Developer Portal: finding World ID 4.0, the Sandbox page, and whether the Selfie flag status is visible.
3. Sandbox app: Hot / Cold / Semi-cold on the devices we have, invite codes, error bodies.
4. Wishlist: a documented way to test one-action-per-human uniqueness without a production orb.

Until the flag lands we will keep `WORLD_PRESET=orbLegacy` and say so in the prize write-up (the track text allows a Selfie Check-compatible World ID credential flow).
