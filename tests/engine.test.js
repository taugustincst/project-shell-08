// Engine unit tests: node tests/engine.test.js
const assert = require('assert'); const E = require('../js/engine.js'); const D = E.D;
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('PASS ' + name); } catch (e) { console.log('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };
t('dataset integrity: unique ids, polygons, neighbours symmetric enough to route', () => {
  const ids = new Set(E.C.map(c => c.id)); assert.strictEqual(ids.size, E.C.length);
  for (const c of E.C) { assert.ok(E.polygon(c).length >= 4, c.id); for (const nb of c.nb) assert.ok(E.byId[nb], c.id + '->' + nb); assert.ok(c.flag && c.flag.c.length, c.id); assert.ok(c.lang.length && c.cur && c.d && c.wild && c.cap, c.id); }
});
t('same seed, same commissions', () => { const a = E.buildCommission({ seed: 9 }, 'FR', E.TYPES, 2, {}), b = E.buildCommission({ seed: 9 }, 'FR', E.TYPES, 2, {}); assert.deepStrictEqual(a, b); });
t('every generated clue is true of its target', () => { for (const c of E.C) for (const ty of E.TYPES) for (const tier of [1, 2, 3]) { const cl = E.makeClue({ seed: 3 }, c, ty, tier, {}); if (cl) assert.ok(E.matches(cl, c), `${c.id} ${ty} ${tier}: ${cl.text}`); } });
t('a flag glimpsed wrong differs from the truth by exactly one detail', () => { for (const c of E.C) { const cl = E.makeClue({ seed: 4 }, c, 'flag', 1, {}); assert.strictEqual(E.flagDiff(cl.k.desc, c.flag), 1, c.id); } });
t('commission resolves uniquely and a wrong answer explains itself', () => {
  const s = E.newState({ seed: 5, unlocked: true }); for (const L of D.LAYERS) s.layers[L.id] = 1;
  const com = E.newCommission(s); assert.ok(com); assert.strictEqual(E.candidates(com.clues).length, 1);
  const wrong = E.C.find(c => c.id !== com.target && c.c === E.byId[com.target].c);
  const r = E.answer(s, wrong.id, false); assert.strictEqual(r.correct, false); assert.ok(r.failed.length >= 1); assert.strictEqual(s.stats.wrong, 1); assert.strictEqual(s.rep, 0);
});
t('a correct answer pays, raises repute, fills the atlas and opens a route within budget', () => {
  const s = E.newState({ seed: 6, unlocked: true }); const com = E.newCommission(s); const r = E.answer(s, com.target, false);
  assert.ok(r.correct && r.pay > 0 && s.rep === 2 && s.atlas[com.target].id);
  const R = com.routeOptions; assert.ok(R && R.opts.some(o => o.ok && o.leagues <= R.budget));
  const good = R.opts.find(o => o.ok); const pr = E.plotRoute(s, good.id); assert.ok(pr.ok && pr.bonus > 0); assert.strictEqual(E.plotRoute(s, good.id), null, 'route plotted once');
});
t('wager doubles pay and triples the loss, only with the licence', () => {
  const s = E.newState({ seed: 7, unlocked: true }); let com = E.newCommission(s); let r = E.answer(s, com.target, true); assert.strictEqual(r.wager, false); E.finishCommission(s);
  s.tools.wager = 1; com = E.newCommission(s); r = E.answer(s, com.target, true); assert.ok(r.wager && r.rep === 3); E.finishCommission(s);
  com = E.newCommission(s); const rep = s.rep; r = E.answer(s, E.C.find(c => c.id !== com.target).id, true); assert.strictEqual(s.rep, Math.max(0, rep - 6));
});
t('spaced repetition: a wrong answer resets the interval, right answers grow it', () => {
  const s = E.newState({ seed: 8, unlocked: true }); const id = 'FR';
  s.commission = Object.assign(E.buildCommission(s, id, E.TYPES, 1, {}), { pay: 10, tier: 1, review: false }); E.answer(s, id, false); const iv1 = s.atlas[id].iv; E.finishCommission(s);
  s.commission = Object.assign(E.buildCommission(s, id, E.TYPES, 1, {}), { pay: 10, tier: 1, review: true }); E.answer(s, id, false); assert.ok(s.atlas[id].iv > iv1); E.finishCommission(s);
  s.commission = Object.assign(E.buildCommission(s, id, E.TYPES, 1, {}), { pay: 10, tier: 1, review: true }); E.answer(s, 'DE', false); assert.strictEqual(s.atlas[id].iv, 1); assert.ok(s.atlas[id].due > s.done);
});
t('free apprenticeship: rank caps at Journeyman and continents stay closed until the unlock', () => {
  const s = E.newState({ seed: 9 }); s.rep = 1000; assert.strictEqual(E.rankOf(s).id, D.FREE_RANK); assert.deepStrictEqual(E.continentsOpen(s), D.FREE_CONTINENTS); assert.strictEqual(E.prestigeAvailable(s).length, 0);
  assert.ok(E.available(s).every(c => D.FREE_CONTINENTS.includes(c.c)));
  s.unlocked = true; assert.strictEqual(E.rankOf(s).id, 5); assert.ok(E.available(s).length > 100); for (const L of D.LAYERS) s.layers[L.id] = 1; assert.ok(E.prestigeAvailable(s).length === D.PRESTIGE.length);
});
t('a save never carries the unlock (Play is the only source), and the gate closes again at Journeyman', () => {
  const s = E.sanitize({ seed: 4, rep: 500, unlocked: true, gated: false }, null); assert.strictEqual(s.unlocked, false); assert.strictEqual(E.rankOf(s).id, D.FREE_RANK);
  E.checkGate(s); assert.strictEqual(s.gated, true);
  const t = E.newState({ seed: 5 }); t.rep = D.RANKS[D.FREE_RANK].rep - 1; E.checkGate(t); assert.strictEqual(t.gated, false);
});
t('targets are only drawn from lands the owned layers can resolve', () => { const s = E.newState({ seed: 10, unlocked: true }); const ok = E.resolvable(E.ownedTypes(s)); for (let i = 0; i < 60; i++) { const com = E.newCommission(s); assert.ok(ok.has(com.target), com.target); E.answer(s, com.target, false); E.finishCommission(s); } });
t('prestige commissions go to the rival on failure and to you on success', () => {
  const s = E.newState({ seed: 11, unlocked: true }); s.rep = 1000; for (const L of D.LAYERS) s.layers[L.id] = 1;
  E.newCommission(s, { prestige: 'p01' }); assert.strictEqual(s.commission.prestige, 'p01'); E.answer(s, 'CN', false); assert.strictEqual(s.prestigeDone.p01, 'vosk'); assert.strictEqual(s.rivals.vosk, 1); E.finishCommission(s);
  E.newCommission(s, { prestige: 'p02' }); E.answer(s, 'EG', false); assert.strictEqual(s.prestigeDone.p02, 'you'); assert.ok(!E.prestigeAvailable(s).some(p => p.id === 'p02'));
});
t('sanitize survives garbage, clamps, and restores the atlas from the backup', () => {
  assert.strictEqual(E.sanitize(null), null); assert.strictEqual(E.sanitize(5), null);
  const s = E.sanitize({ coins: '1e999', rep: -40, done: 'x', layers: { flag: 1, bogus: 1 }, tools: { wager: true }, atlas: { FR: { n: 'q', id: true }, XX: {} }, prestigeDone: { p01: 'vosk', nope: 1 }, rivals: { vosk: 'many' }, history: [{ t: 'FR', a: 'DE' }, { t: 'ZZ' }], lastCountry: 'ZZ', commission: { target: 'FR', tier: 9, pay: -3 } });
  assert.ok(isFinite(s.coins) && s.rep === 0 && s.done === 0); assert.ok(s.layers.flag && !s.layers.bogus && s.tools.wager); assert.ok(s.atlas.FR && s.atlas.FR.n === 0 && !s.atlas.XX); assert.strictEqual(s.prestigeDone.p01, 'vosk'); assert.strictEqual(s.rivals.vosk, 0); assert.strictEqual(s.history.length, 1); assert.strictEqual(s.lastCountry, 'PT');
  assert.ok(s.commission && s.commission.target === 'FR' && s.commission.tier === 3 && s.commission.pay === 1 && E.candidates(s.commission.clues).length === 1);
  const b = E.sanitize({ atlas: {} }, { DE: { n: 2, id: true } }); assert.ok(b.atlas.DE && b.atlas.DE.n === 2);
});
t('fact pass: neighbours are mutual, plant words are whole words, a coast on an arm of a sea counts for the sea', () => {
  for (const c of E.C) for (const n of c.nb) assert.ok(E.byId[n].nb.includes(c.id), c.id + ' lists ' + n + ' but not the other way round');
  assert.ok(!E.PLANT('palmchat') && E.PLANT('date palm') && E.PLANT('guelder rose'));
  const coast = sea => ({ t: 'coast', k: { sea } });
  assert.ok(E.matches(coast('Atlantic Ocean'), E.byId.GH), 'Ghana is on the Atlantic');
  assert.ok(E.matches(coast('Pacific Ocean'), E.byId.VN) && E.matches(coast('Pacific Ocean'), E.byId.TH), 'Vietnam and Thailand reach the Pacific');
  assert.ok(E.matches(coast('Mediterranean Sea'), E.byId.HR) && E.matches(coast('Ionian Sea'), E.byId.IT));
  assert.ok(!E.matches(coast('Atlantic Ocean'), E.byId.IT), 'the Mediterranean is not counted as the Atlantic');
});
t('mastery: all available lands identified at rank 5', () => { const s = E.newState({ seed: 12, unlocked: true }); s.rep = 1000; for (const L of D.LAYERS) s.layers[L.id] = 1; for (const c of E.C) s.atlas[c.id] = { n: 1, w: 0, ease: 2.5, iv: 2, due: 5, id: true }; const com = E.newCommission(s); E.answer(s, com.target, false); assert.ok(s.mastered); });
console.log(process.exitCode ? 'SOME FAILED' : `ALL ${n} PASSED`);
