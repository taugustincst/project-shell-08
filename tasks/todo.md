# Cartographer's Apprentice — build plan (v1.0 draft)

## Content targets (HANDOFF §1)
- [x] Simplified polygon dataset, ~120 countries/regions (151 authored, stylised, in js/world.js)
- [x] 8 clue generators (coast, language, sun angle, rail gauge, currency, flag glimpsed wrong, driving side, flora/fauna) × 3 tiers, true facts only; flag type labelled eyewitness
- [x] Career mode: 5 ranks
- [x] ~40 authored prestige commissions (40 in js/data.js)
- [x] Endless generated commissions
- [x] Rival mapmakers (3) racing prestige commissions
- [x] Spaced repetition disguised as returning clients
- [x] Expedition route plotting under budget
- [x] Atlas with layered data, entries filled on identification, mistakes teach

## Build spec (§2)
- [x] Vanilla HTML/CSS/JS, no build step
- [x] Map data in-repo with CREDITS file
- [x] Renders from data, no map images
- [x] Save: versioned, sanitized, fail-soft; atlas double-written to a backup key
- [x] window.__cartographer test API
- [x] Portrait, one-handed, large text, colourblind-safe selection (pattern + label)
- [x] Under 4 MB

## Monetization (§3)
- [x] Free: ranks 1–2 and Europe/North America/South America; `full_unlock` $2.99 via Digital Goods API; restore supported

## Verification
- [x] tools/validate.js: every commission resolves to exactly one answer (0 failures)
- [x] Engine unit tests pass
- [x] Headless sim of career economy + spaced repetition
- [x] Playwright smoke test over file:// passes
- [x] CI workflow (tests + validator + sim + smoke)

## Store pack / handoff
- [x] Icons, staged screenshot via test API
- [x] privacy.html, manifest, service worker
- [x] store/listing.md draft (features only, no price wording)
- [x] README, HANDOFF log with FOR TJ items
- [x] Pages workflow (Tj must enable Pages: Settings → Pages → Source: GitHub Actions)

## Review
Built: 151-land stylised dataset (js/world.js), 8 clue generators × 3 tiers with predicate-based matching, commission builder that guarantees a unique answer, atlas renderer from data with clue shading and hatched/labelled selection, career (5 ranks, 8 layers, 8 tools, 40 prestige commissions, 3 rivals), spaced repetition via returning clients, expeditions under budget, free gate (Journeyman / Europe + Americas) with Play Billing `full_unlock` at $2.99, double-written fail-soft save, PWA shell, privacy, store copy.
Verified locally: tests/engine.test.js 13/13; tools/validate.js 3,096 generated + 40 prestige commissions, 0 failures; sim/sim.js (sharp/average/guesser/free/hoarder); tests/smoke.js 18/18 over file://. Size 0.4 MB. Not yet done: Android TWA wrapper, phone playtest, expert review, submission.

## v1.1.0 (2026-11-09): free apprenticeship with one unlock
- [x] Play Billing bridge (`PlayBilling.java`, `js/billing.js`); guild's letter at Journeyman and the More tab card; Restore purchase
- [x] Saves and save codes never carry the unlock; no dev unlock
- [x] Fact fixes: Flora and fauna blurb, Bangladesh gauge, creoles out of language families
- [x] "Which land?" list for taps near small lands; every land pickable by finger
- [x] Message strip moved off the controls
- [x] Smoke test buys, reloads, restores; emulator tap-through in CI; launch on Android 9 and 14; sim covers free and paying players
- [x] Listing, privacy policy, PLAY.md, README updated; 151 lands
- [ ] Full fact pass over all 151 records
- [ ] Merge, upload-key secrets, Console product `full_unlock` at $2.99 (Taylor)
