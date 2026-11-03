# Cartographer's Apprentice

**Adult geography as a deduction game, not a quiz.** Clients bring partial evidence: a coastline fragment, the language on a sign, a sun angle, a railway gauge, a coin, a flag glimpsed wrong. You take it to the atlas, find the one land it all fits, plot the expedition, and fill your atlas. You finish the career actually knowing the map of the world.

A paid download on Google Play: the whole world is in the app, with no in-app purchases. No ads, no consumables, fully offline.

Status: **v1.0.0 draft built 2026-11-03**, not yet submitted. Brief and living log in [HANDOFF.md](HANDOFF.md); build plan in [tasks/todo.md](tasks/todo.md). Repo rename at ship time (Tj's call).

Owner: Tj (Taylor Augustin) / AugustInnovations LLC.

## The game
- **151 lands**, hand-authored stylised polygons rendered from data (no map images), with coasts, borders, languages, scripts, latitude, driving side, railway gauge, currency, native wildlife and flag.
- **8 kinds of evidence × 3 tiers**, each generated only from true facts about the target; the "flag glimpsed wrong" type is labelled an eyewitness report and differs from the truth by exactly one detail. Every commission's clues intersect over the whole world to exactly one land (`tools/validate.js` proves it for every land, tier and layer set, and for all 40 prestige commissions).
- **Deduction, not recall**: tap a clue (with the Coloured inks tool) to shade every land it allows on the atlas; the intersection is the answer. A wrong answer shows the real entry and which clues excluded your choice.
- **Confidence wager** (with the licence): double pay when right, triple the repute loss when wrong.
- **Expeditions**: after each identification, reach the land through a true neighbour (or the right sea for islands) within a league budget.
- **Career**: five ranks, 8 reference layers and 8 workshop tools to buy, 40 authored prestige commissions contested by three rival workshops, endless generated commissions, and a Master ending when every open land is identified.
- **Spaced repetition** disguised as returning clients: intervals grow with correct answers and reset on mistakes.

## Code (no build step, no runtime dependencies)
| File | What |
| --- | --- |
| `js/world.js` | The dataset: 151 lands with polygons and facts. See `CREDITS.md`. |
| `js/data.js` | Language families, currency families, ranks, layers, tools, rivals, 40 prestige commissions. |
| `js/engine.js` | Pure engine: clue predicates and generators, commission builder, career, spaced repetition, routes, save sanitizer. Runs in Node and the browser. |
| `js/game.js` | UI, atlas renderer (SVG from data), save (double-written atlas), test API `window.__cartographer`. |
| `tools/validate.js` | Fairness validator (every clue set resolves to exactly one answer). |
| `sim/sim.js` | Headless career and spaced-repetition sim across player accuracies. |
| `tests/engine.test.js`, `tests/smoke.js` | Unit tests; Playwright smoke test over `file://`. |

```bash
node tests/engine.test.js && node tools/validate.js && node sim/sim.js 600 7
npm install && node tests/smoke.js
```

Saves: `cartographer.v1` (career) and `cartographer.v1.atlas` (atlas backup, restored if the main save is lost).

## Publishing
A paid app on Google Play with the whole game packed inside it (`android/play`, see `PLAY.md`). Pages deploys only the store page from `main` (`site/index.html`, the privacy policy `privacy.html` and the store graphics), not the playable game. Store copy: `store/listing.md`.
