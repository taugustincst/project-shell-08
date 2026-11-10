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
- **2026-11-03** — **v1.0.0 DRAFT BUILT** on branch `ccr-89815447-wojzds`, merged to `main`. Playable: 151 stylised lands rendered from in-repo data (CREDITS.md), 8 evidence types × 3 tiers generated from true facts only (flag type labelled eyewitness, exactly one detail wrong), a fairness validator (`tools/validate.js`: 3,096 generated + 40 authored prestige commissions, every one resolves to exactly one land, 0 failures), clue shading on the atlas (Coloured inks), confidence wager, expeditions through a true neighbour under budget, career of 5 ranks with 8 reference layers and 8 workshop tools, 40 prestige commissions contested by 3 rivals, spaced repetition as returning clients, Master ending. Free gate at Journeyman / Europe + Americas; `full_unlock` $2.99 via Digital Goods API; atlas double-written to a backup key; `window.__cartographer` test API; PWA + privacy + CI + store copy draft; `tasks/todo.md` and `tasks/lessons.md` per Tj's build guidelines. Verified: engine tests 13/13, validator 0 failures, sim (average player reaches rank 5 in ~190 commissions, free player hits the gate at ~75), smoke test 18/18. Size 0.4 MB of a 4 MB budget.
  - **FOR TJ:** (1) GitHub Pages: if the site is not live after this merge, enable it in Settings → Pages → Source: GitHub Actions (the workflow token cannot create the site). (2) Play Console: app, package name (suggest `com.taugustincst.cartographer`), in-app product `full_unlock` non-consumable at $2.99, upload keystore (Tj only). (3) Web gating: the browser build is gated like Play (`?dev=1` unlocks for tests); decide whether the web build should be fully open. (4) Fact accuracy: the dataset is from general knowledge with uncertain fields omitted; a review pass of `js/world.js` (gauges, wildlife, flags) before submission is recommended.
  - **Next (agent-owned):** Android TWA project from the Ironhold pattern; phone playtest of the atlas tap targets at small sizes; store screenshots 2–4 via the test API; Folder expert review; submission prep.
- **2026-11-03** — Roster-level handoff for Folder (all eight games, decisions, open items, lessons): https://github.com/taugustincst/taugustincst.github.io/blob/main/ROSTER-HANDOFF.md
- **2026-11-02 — FOR CLAUDE: EVALUATION FIX LIST (Folder's expert review, 2026-11-02). Overall 8/10 — ship after fixes; the clue-truth guarantee held under independent audit (all 151 records spot-checked). Full report filed in this repo at EVALUATION-2026-11-02.md. Work in this priority order and log closures here.**
  - P1-1 FACT PASS on js/world.js + layer copy before submission (you flagged this yourself; the evaluator confirms it is the highest-value remaining work — factual trust is this game's brand): (a) the Flora & Fauna layer's shop blurb claims species "live in one place on earth," but many entries are native, not endemic (GB red deer, KE lion, TH Asian elephant) — the clues are worded safely, the blurb is not; fix the blurb. (b) Bangladesh gauge is listed 1676 while the network is majority metre gauge (1000) in the east — a knowledgeable player can dispute it as THE answer. (c) Tok Pisin is classed Austronesian in the language-family table; it is an English-based creole with Austronesian substrate, so a tier-3 family clue for Papua New Guinea states something shaky.
  - P1-2 BILLING LEFTOVERS: js/billing.js is copied from Keep the Light — global KTL_BILLING and the fallback payment-sheet label literally reads "The rest of the century." One-line class of fix; it would surface in the real Play payment flow.
  - P1-3 DEV UNLOCK MUST NOT SHIP: ?dev=1 grants a free unlock on the web build — strip it from the shipped TWA build (keep for dev). Related: save import accepts a pasted code's meta.unlocked at face value, so a shared save code bypasses the $2.99 purchase — low impact at this price, but record the accept/fix decision here.
  - P2-4 STORE PACK: stage the remaining 3 of 4 planned screenshots; TWA wrapper. Listing says "150 lands" — actual is 151; harmless understatement, fix while you are in the file.
  - P2-5 TAP TARGETS: smallest states (Benelux, Balkans, Baltics, Central America) are blobby hard targets on a phone — run the phone tap-target playtest already on your list and log the result.
  - FOR TJ (as already logged): Play Console items (app creation, package name, full_unlock product) and the post-launch Play Pass application.

- **2026-11-03** — Claude (for Taylor's "package all 8"): Google Play edition added on branch `play/package`: `android/play` (Trusted Web Activity, package `com.taugustincst.cartographer`), build and launch checks (`android.yml`), signed-bundle workflow (`release.yml`), store graphics in `store/`, and `PLAY.md` with the submission steps that need Taylor's accounts. Also fixed: purchases were never acknowledged (Play refunds them after three days), so `js/billing.js` now reports each token to the acknowledgement service with a retry queue; `?dev=1` limited to local copies; billing global renamed to this game's own; privacy page and data safety updated for the purchase report. Folder's evaluation fixes are untouched and still come first.

- **2026-11-03** — Claude (for Taylor: "None of the games should be free"): the game is now a paid download, $2.99 on Play, with no in-app purchases. The free-to-try gate, the `full_unlock` purchase, `js/billing.js` and the `?dev=1` unlock are removed: every save loads fully open, and old saves stopped at the gate carry on. Section 3 (monetization) above is superseded. `android/play` is now a WebView app with the whole game packed inside the APK (WebViewAssetLoader, no internet permission) instead of a Trusted Web Activity, and `tools/launch-test.sh` fails unless the game loads with no script errors. The website becomes a store page (`site/index.html`, built from `store/listing.md`) that links to Play; merging `play/package` takes the free web copy down at once. `PLAY.md` lists the Console steps.

- **2026-11-09** — Claude (for Taylor's decision "Free with paid unlock", applied to every game; this replaces the Nov 3 paid-download setup): v1.1.0 on branch `play/free-unlock-v1.1`. The app is free; Europe and the Americas, up to Journeyman, play free, and one Play purchase, `full_unlock` at $2.99, opens Africa, Asia and Oceania (85 lands), the three upper ranks and the forty prestige commissions. This brings back the earlier free apprenticeship, now sold through Google Play Billing 8 in the app (`android/play/.../PlayBilling.java`, `js/billing.js`) rather than the web Digital Goods API, so nothing has to be acknowledged by a server. The guild's letter at Journeyman and the More tab offer the unlock and Restore purchase. `PLAY.md` has the Console steps, including creating the product. Sim: a free player meets the letter after about 60 to 75 commissions; a paying average player reaches Master around commission 190.
  - Closed from Folder's list: **P1-1** the three named facts: the Flora and fauna blurb now says native, not "lives in one place on earth"; Bangladesh's railway is listed as metre gauge (its majority); Tok Pisin is no longer called Austronesian, and the other creole and pidgin (Haitian Creole, Hiri Motu) left their families for the same reason. The validator still resolves every commission and all forty prestige ones. A full fact pass of all 151 records was not done here. **P1-2** obsolete: the copied billing file is gone, replaced by this game's own. **P1-3** fixed: there is no `?dev=1` unlock, and decided: a save code, or a save itself, never carries the unlock; only Google Play's answer opens the world (tests cover both). **P2-4** the four store screenshots are in place; "150 lands" is now 151; the fourth caption now matches its picture (the expedition). **P2-5** measured at phone size: on the Europe map Luxembourg is 4 px, Malta 1 px, Slovenia 7 px; in Asia Singapore is 0 px. A tap near any small land now opens a short "Which land?" list, and every one of the 151 lands can be picked with a finger (checked by tapping each one in a test).
  - Fixed while playing through by real taps: the message strip sat over the bottom of the screen for 2.6 seconds and covered "This is the place" after a clue tap; it now sits at the top and lets taps through.
  - Checks: engine tests (14), validator, sim with free and paying players, a browser smoke test that buys, reloads, restores and refuses a save code's unlock, and a new emulator tap-through (`tools/tap-through.js`) on Android 14 in CI, plus launch checks on Android 9 and 14.
  - **FOR TAYLOR:** merge the PR; give the repo the AugustInnovations upload key's four `ANDROID_UPLOAD_*` secrets; create the app as free and the `full_unlock` product in Console.
- **2026-11-10** — Claude (for Taylor's "Fix all issues identified across all games", branch `play/fact-pass`, still 1.1.0): full fact pass over all 151 records and the forty prestige letters.
  - Folder's three hard errors fixed: the Netherlands' wild entry is now the black-tailed godwit (tulips were brought in around 1593, not native); Fiji's railway is the 610 mm cane railway (it was "no railway"); Afghanistan's flag is the white flag with the black inscription flown there since 2021.
  - Also wrong and fixed: Bulgaria pays in euro since 1 January 2026; Syria's flag is the green, white and black one with three red stars adopted in 2025; Tunisia's railway is mostly metre gauge; Niger's gauge is no longer stated (track was laid but no service runs, so "no railway" was arguable). Not native where the game said native, so replaced: sunflower (Ukraine, now guelder rose), Damask rose (Bulgaria, now Balkan chamois), apricot (Armenia, now Armenian mouflon), tea (Sri Lanka, now Sri Lankan leopard), cocoa (Ghana, now Diana monkey), date palm (Tunisia, now Barbary deer), dromedary (Mauritania and Somalia, now dorcas gazelle and Speke's gazelle). Arguable and replaced: kouprey (Cambodia, likely extinct, now Irrawaddy dolphin), Siberian tiger (North Korea, likely gone, now northern goshawk), Timor deer (introduced, now saltwater crocodile), and the Zimbabwe bird, a stone carving, now sable antelope.
  - Coasts and borders: Italy touches the Ionian, France the North Sea, Russia the Barents, Azov and Japan seas, Cameroon the Gulf of Guinea; Türkiye and Azerbaijan border each other; Spain borders Morocco and Malaysia Singapore; Mauritania no longer lists Morocco (that border runs through Western Sahara). A clue about an ocean now also fits lands on its arms (Ghana is on the Atlantic, Vietnam on the Pacific, Croatia on the Mediterranean), so no clue can rule out a land a player would rightly count; the expedition's wrong seas skip those too.
  - A bug: the palmchat (the Dominican Republic's bird) was classed as a plant because its name contains "palm"; plant words now match whole words only.
  - Prestige letters: Brazil's no longer says everyone else on the continent speaks Spanish; Ethiopia's script is "of its own", not an alphabet; Morocco's macaques are in the cedar forests, not "on a rock". The Rules of the road blurb says about a third of the world drives the other way, not half.
  - Checks: engine tests 15/15 (new: borders are mutual, plant words, ocean arms), validator 0 failures (3,060 commissions, 170 by fallback; 104 of 151 lands can be singled out on the free layers, was 107), smoke all pass.
  - FOR TAYLOR: the Console steps in `PLAY.md` and a phone playtest are still yours.
