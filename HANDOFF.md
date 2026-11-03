# HANDOFF — project-shell-08 — CARTOGRAPHER'S APPRENTICE

## Status: ASSIGNED 2026-11-02 — build priority #8 in the roster sequence (the cautious pick — judge it on audience, not revenue)

Roster assignment by Folder at Tj's direction, from the 2026-11-02 Google Play niche research. This file is the build brief AND the living handoff. Keep it updated.

## 1. THE GAME — exactly what to make

**Fantasy:** You apprentice to a master mapmaker in a small atlas workshop. Clients arrive with fragments of the world; you turn fragments into certainties, and certainties into a career.

**Why this game (honestly):** 5.2M people installed a bare flags-and-capitals quiz (World Geography Quiz, 4.32 stars) — enormous demand served by uniformly awful, ad-supported quiz skins. Nobody sells this audience a GAME. But the same research says willingness-to-pay in this category is weak: every large competitor is free. This title is therefore an AUDIENCE BUILDER and a Play Pass candidate, sequenced last, with modest revenue expectations by design. Do not let it eat weeks that belong to shells 01–04.

**Core loop:**
1. A client commission arrives with partial evidence — 2 to 4 clues of different types: coastline fragment, language on a sign, sun-angle/shadow, railway gauge, currency glimpsed, flag glimpsed WRONG (one detail off), driving side, endemic animal/plant.
2. You DEDUCE the country/region: interrogate the atlas (your reference map with layered data — coasts, languages, gauges, climate) and commit an answer. Confidence wager: stake reputation on certainty for bonus pay.
3. Correct deductions pay commission and fill the atlas (each place, once identified, gains its full entry). Mistakes cost reputation and teach via the atlas entry — the game corrects you with the real facts.
4. Career layer: commissions grow harder (regions, then cities/rivers), rival mapmakers race you to famous identifications, workshop upgrades buy better reference layers. Spaced repetition disguised as returning clients quietly drills earlier places — the player finishes knowing the map for real.

**Content targets (v1.0):**
- Simplified polygon dataset: ~120 countries/regions, stylised on purpose (the map style is flat vector shapes — embrace it, do not chase geographic precision beyond recognition).
- Clue generators per evidence type (8 types) with 3 difficulty tiers, each generator producing only TRUE clues for its target (plus the designed "glimpsed wrong" type, which is labelled as an eyewitness report, not fact).
- Career mode: 5 ranks, ~40 authored prestige commissions, endless generated commissions.

## 2. BUILD SPEC

- Vanilla HTML5/CSS/JS, no framework, no build step. Static files, GitHub Pages deploy from this repo (pattern: taugustincst/bubblepop, taugustincst/ironhold).
- Fully offline. Zero network calls, zero analytics, zero ads, zero accounts.
- Map data as a compact JSON dataset in-repo, with its source noted in a CREDITS file. Renders from data — no map image assets.
- Saves: localStorage, versioned key, sanitizer on load, fail-soft (Ironhold lesson). Atlas progress is the save's crown jewel — double-write it (backup key) so a corrupt write can never wipe a career.
- Expose a `window.__cartographer` test API (seed commission, set rank/atlas state) for staged screenshots.
- Portrait-first, one-handed, large-text option, colourblind-safe (map regions identified by label/pattern on selection, never colour alone). Under 4 MB including map data.

## 3. MONETIZATION — exact

- Google Play: FREE app. One non-consumable `full_unlock` at **$2.99** opens career mode beyond rank 2, advanced continents/regions, and prestige commissions.
- PAID-UPFRONT IS FORBIDDEN for this title: the category's price expectation is $0 and a paywall at download kills the one thing this game is for (audience volume).
- No ads, no consumables, nothing else sold. Ever.

## 4. HOW IT SUCCEEDS — the launch playbook

- Store copy targets the quiz audience's searches (geography, countries, flags, capitals) while promising the upgrade: "Not a quiz. A deduction game." Short description: features only, NEVER price/promo wording (Play flags it — Ironhold lesson).
- Screenshots: real staged commissions via the test API. Shot 1 = evidence cards beside the atlas with a deduction in progress.
- Declarations: IARC; audience 13-15 / 16-17 / 18+; Data safety = none collected/shared; privacy policy at this repo's Pages site (privacy.html); contact elderon@augustinnovations.io.
- Process: internal draft → declarations → production → Folder expert review → submission only on Tj's explicit approval.
- Apply to Google Play Pass after launch if eligible — this profile (free, quality, no ads) is exactly what Play Pass stocks; per-title payouts are unpublished, so treat it as bonus reach, never as the plan.
- Post-launch: reply to every review for 30 days (roster-wide promise from Ironhold's listing).
- SUCCESS TARGETS (90 days): 30,000 free installs; rating at or above 4.3 stars; unlock conversion at or above 1.5%. Revenue target: deliberately none — installs and rating are this title's job.

## 5. BUILD ORDER (3–4 weeks)

- Week 1: Map dataset + renderer + atlas layers.
- Week 2: Clue generators (all 8 types) + deduction/wager loop.
- Week 3: Career mode, rivals, prestige commissions, atlas entries.
- Week 4: Store pack, expert review, submission prep.

## 6. COORDINATION RULES

- Tj decides scope, names, spending, submissions, and anything irreversible. Everything else, the working agent owns end to end.
- Log entries dated and appended below, newest last. Items needing Tj are marked FOR TJ.
- Verify live state before asserting. No prices on marketing websites. Passwords/signing keys are Tj's alone, secure forms only, Elderon-pattern keystore handling.

## Log

- **2026-10-29** — Shell created (README.md + this HANDOFF.md). Awaiting project assignment from Tj.
- **2026-11-02** — ASSIGNED: Cartographer's Apprentice (roster #8, the cautious pick). Full build brief installed above by Folder. Build priority #8 in the roster sequence.
- **2026-11-02** — GitHub Pages ENABLED (workflow deploy, standard static workflow added at .github/workflows/pages.yml). Site: https://taugustincst.github.io/project-shell-08/ — until the game is built, this serves the repo files (README/HANDOFF); the shipped game + privacy.html deploy from this same root.
