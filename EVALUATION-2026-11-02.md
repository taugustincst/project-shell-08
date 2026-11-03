# Evaluation — Shell 08: Cartographer's Apprentice
**Repo:** `taugustincst/project-shell-08` (local: `~/workspace/shell-repos/project-shell-08`)
**Brief:** HANDOFF.md §1–§4 (roster #8, the cautious audience-builder; free + $2.99 unlock; paid-upfront FORBIDDEN; judged on installs/rating, not revenue)
**Evaluator:** Folder expert review, 2026-11-02 · Build evaluated: v1.0.0 draft on `main`

## Scores

| Dimension | Score /10 |
|---|---|
| Brief compliance | 9 |
| Gameplay / design | 8 |
| **Factual accuracy** | **8** |
| Content quality | 8 |
| Polish / presentation | 8 |
| UX / accessibility | 8 |
| Technical quality | 9 |
| Store readiness | 6 |
| **Overall** | **8** |

## Test results (all run by the evaluator, verbatim)

- `tests/engine.test.js` — **ALL 13 PASSED** (dataset integrity, seed determinism, clue truth, flag-diff = 1, wager math, spaced-repetition intervals, free-gate behaviour, prestige rival outcomes, sanitize/backup restore, mastery).
- `tools/validate.js` — `resolvable with all layers: 151/151; with the free layers only: 107/151` → **"3096 commissions built (157 by fallback), 40 prestige commissions checked, 0 failures"**. Notes: prestige p02/p07/p12 each needed one auto-added clue beyond their recipe to stay unique — the system handled it correctly.
- `tests/smoke.js` — **ALL PASSED (18/18)** in headless Chromium at 360×640: desk flow, clue shading incl. target, hatched+labelled map selection, correct/wrong answer flows, route bonus, the Journeyman gate modal, billing-absent behaviour, workshop purchase, prestige from dossier, save→reload restore, and three mangled-save cases (truncated JSON, wrong types, non-object) all loading fail-soft with the atlas backup intact. Environment note: a fresh clone has no `node_modules`; the evaluator ran it with `NODE_PATH` pointed at an existing Playwright install (browsers cached on this machine). Zero page/console/network errors observed.
- `sim/sim.js 600` — average player reaches rank 5 (Master) at ~190 commissions, identifies 147/151 lands; a pure guesser stalls at rank 4 with 300 wrong answers (skill matters); free players hit the gate at ~59–75 commissions having identified all 66 free lands. Economy and spaced repetition behave sensibly.

## Content vs brief floors

| Brief floor | Built | Verdict |
|---|---|---|
| ~120 countries/regions polygon dataset | **151 lands** (EU 40, AS 43, AF 38, NA 14, SA 12, OC 4) | Exceeds |
| 8 clue-generator types × 3 tiers | 8 types (coast, lang, sun, gauge, currency, flag, drive, wild) × 3 tiers, plus 8 matching atlas layers | Meets |
| 5 career ranks | 5 (Apprentice → Master Cartographer; rep 0/60/160/320/560) | Meets |
| ~40 authored prestige commissions | **40**, each with client text + clue recipe, contested by 3 named rivals | Meets |
| Endless generated commissions | Yes — builder guarantees a unique answer or refuses the target | Meets |
| Confidence wager | Yes — workshop "Wager licence" (200 coins): double pay / +3 rep on a win, −6 rep on a loss | Meets |
| Atlas fills with real facts; mistakes teach | Atlas entry shows a facts table (capital + full record once identified); wrong answers name which clues ruled the choice out | Meets |
| Rival mapmakers / workshop upgrades | 3 rivals; 8 layers + 8 tools purchasable with coins | Meets |
| Spaced repetition as returning clients | Implemented in the engine (intervals grow/shrink; wrong resets to 1) and unit-tested | Meets |

## Critical check — are generated clues always TRUE?

This is the disqualifying-risk item for a geography game, so it was audited three ways:

1. **By construction:** every generator builds its clue from the target's own record (sea from its coast list, gauge from its `g`, language from its `lang`, etc.). The only intentionally false content is the `flag` type, and every flag clue is prefixed **"Eyewitness report (one detail is wrong):"** — exactly as the brief requires. A unit test proves the described flag differs from the truth by exactly one detail (layout, one colour, or emblem) for all 151 lands.
2. **By the fairness validator:** 3,096 generated commissions + 40 prestige × 6 seeds: every clue true of its target, every commission resolving to exactly one land, 0 failures.
3. **By independent spot-audit of the dataset against real-world knowledge** (the game's own `matches()` can only prove internal consistency, so the evaluator read all 151 records): the dataset is impressively accurate. All the classic traps are right — capitals (Sri Jayawardenepura Kotte, Dodoma, Gitega, Yamoussoukro, Sucre, Naypyidaw, Astana), railway gauges (Ireland 1600, Iberian 1668, Finland 1524 — and the prestige joke "four millimetres wider than Russia's" is literally true — Hejaz 1050, Eritrea 950, Guatemala/Colombia 914), driving side (incl. Guyana, Suriname, Timor-Leste — the ones everyone gets wrong), sun-clue physics (shadow direction formula is correct), and honest omissions where facts are uncertain (Afghanistan/Qatar gauge left blank per the CREDITS policy). Clue texts are carefully hedged where a fact is loose ("a creature native there", "from the carriage window: X"), so sightings are true even when a species isn't endemic.

**Residual factual defects (none disqualifying, all fixable in one pass):**
- The **Flora and fauna layer's shop description** overclaims: "a creature or a tree … that lives in one place on earth." Many entries are native/characteristic, not endemic (GB red deer, LU red deer, KE lion, TH Asian elephant). The clues themselves are worded safely; the layer blurb is not.
- **Bangladesh gauge 1676** — the network is majority metre gauge (1000) in the east with 1676 in the west; a knowledgeable player can dispute "the railway: 1676 mm" as the single answer.
- **Tok Pisin classed as Austronesian** in the language-family table (it's an English-based creole with Austronesian substrate) — a tier-3 family clue for Papua New Guinea can therefore state something shaky.
- Flag colour lists are sometimes partial (e.g. the US entry's colour list is red/white with the blue canton carried in the emblem string — the rendered eyewitness text is actually accurate, but the model is fragile if edited casually).
- The builder's own HANDOFF already flags this: *"a review pass of js/world.js (gauges, wildlife, flags) before submission is recommended."* The evaluator agrees — for a game whose brand is "you will know the map for real," this pass is the highest-value remaining work.

## Monetization audit

- **Free + one non-consumable `full_unlock` ($2.99)** via the Digital Goods API — matches the brief exactly. **No paid-upfront gating anywhere**: the download and the entire free tier (ranks 1–2, Europe + the Americas = 66 lands, unlimited play at Journeyman after the gate, gate modal offers "Carry on as Journeyman") are genuinely free. Paid-upfront is not used. No ads, no consumables, no timers.
- The gate is generous in the way the roster's Melvor lesson demands: hitting it doesn't stop play; it caps rank/continents/prestige.
- Minor leaks/leftovers: (a) `?dev=1` grants a free unlock on the web build — already surfaced to Tj as a FOR-TJ decision in the HANDOFF, but it must not survive into the shipped TWA; (b) save import accepts a pasted code's `meta.unlocked` flag at face value, so a shared save code bypasses the purchase (low impact at $2.99, worth knowing); (c) `js/billing.js` is visibly copied from shell-04 (Keep the Light): the global is `KTL_BILLING` and the fallback payment-sheet label literally reads **"The rest of the century"** — wrong-game text that would appear in the Play payment sheet if item details fail to load. One-line fix, embarrassing if shipped.

## Map rendering judgment

Screenshots were captured from the running game (Europe, World, desk). The stylised polygons are **genuinely recognizable**: Iberia, France, Italy's boot, Scandinavia, and the world view all read instantly; locked continents render faded with a textual legend. Selection is **hatched + labelled** (SVG pattern), identified lands are darker, and the legend explains every state in words — regions are never identified by colour alone, as briefed. Weaknesses: the smallest states (Benelux, Balkans, Baltics, Central America) are blobby and will be hard tap targets on a phone — the builder's own next-step list already includes a phone tap-target playtest; an index-search tool (workshop upgrade) partially mitigates this. A few northern-Europe borders overlap slightly. Overall the "embrace stylisation" instruction was followed well.

## Other brief-compliance checks

- **Save double-write:** `save()` writes both `cartographer.v1` and `cartographer.v1.atlas`; on load, an empty/corrupt atlas is restored from the backup key, and a third key stashes a corrupt main save before reset. Sanitize is exemplary (clamps, whitelists, rebuilds an in-progress commission from its target rather than trusting it). Smoke-tested with three mangled-save shapes — all fail-soft.
- **Offline / no-network / no-analytics:** grep finds no fetch/XHR/beacon/analytics/ad code in game JS. The only URL strings are the Play Billing method identifier and the service worker's same-origin cache handler. Data safety declaration ("no data collected/shared") is truthful.
- **Test API:** `window.__cartographer` present (seedCommission, setRep, gate, unlock, setCont, layers, state…) — the smoke test and this evaluation both drove the game through it.
- **Size:** 0.35 MB total including the 56 KB world dataset — under 10% of the 4 MB budget.
- **Accessibility:** large-text (19px root) and high-contrast settings, aria labels on map/search/modal, one-handed portrait layout, no timers or twitch input.
- **Store pack:** `store/listing.md` is complete and rule-compliant — tagline "Not a quiz. A geography deduction game", short description is features-only with zero price/promo wording, correct declarations (13+ not child-directed, Data safety none, contact elderon@augustinnovations.io, Play Pass application planned). Icons (192/512/maskable) exist. **Gaps:** only 1 of the 4 planned store screenshots has been staged, and there is no Android wrapper/AAB yet (TWA build is the builder's listed next step; Play app, package name, and the `full_unlock` product are FOR-TJ items). The listing says "150 lands" (actual 151 — harmless understatement).

## Top defects (ranked)

1. **Fact-pass residue in the dataset** — the wild-layer endemism overclaim in its shop description, Bangladesh's gauge, Tok Pisin's family. Small, but this game's entire pitch is factual trust; the builder already recommended the pass. Do it before submission.
2. **Copy-pasted billing module** — "The rest of the century" fallback label + `KTL_BILLING` global from Keep the Light. Could surface wrong-game text in the real payment sheet.
3. **Store package incomplete** — no TWA/AAB, 1 of 4 screenshots, Play Console items still FOR TJ. Not submittable today; the remaining path is short and itemised in the HANDOFF.

## Verdict

**Ship after fixes.** The game itself is complete, coherent, and verified end-to-end — the full brief is implemented, the clue-truth guarantee (the one thing that could sink a geography game) holds under independent audit, and the free tier is generous in exactly the way the audience-builder strategy requires. What remains is a one-pass fact polish of `js/world.js`/layer copy, a one-line billing-copy fix, removing the dev-unlock from the shipped build, and the mechanical TWA + store-asset work. None of it touches the design.
