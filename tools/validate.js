// Fairness validator: every generated commission (each country × tier × several seeds, with every layer owned and with only the free layers)
// and every authored prestige commission must resolve to exactly one country. node tools/validate.js
const E = require('../js/engine.js'); const D = E.D;
let fails = 0, built = 0, fallbacks = 0;
const all = E.TYPES.slice(), free = ['coast', 'lang', 'sun'];
console.log(`resolvable with all layers: ${E.resolvable(all).size}/${E.C.length}; with the free layers only: ${E.resolvable(free).size}/${E.C.length}`);
for (const c of E.C) for (const tier of [1, 2, 3]) for (const types of [all, free]) for (let seed = 1; seed <= 4; seed++) {
  if (!E.resolvable(types).has(c.id)) continue;
  const s = { seed: seed * 7919 + tier }; const com = E.buildCommission(s, c.id, types, tier, {});
  if (!com) { fails++; console.log(`FAIL no unique commission for ${c.n} tier ${tier} with ${types.length} layers`); continue; }
  built++; if (com.fallback) fallbacks++;
  const cands = E.candidates(com.clues);
  if (cands.length !== 1 || cands[0].id !== c.id) { fails++; console.log(`FAIL ${c.n} tier ${tier}: ${cands.map(x => x.n).join(', ')}`); }
  for (const cl of com.clues) if (!E.matches(cl, c)) { fails++; console.log(`FAIL untrue clue for ${c.n}: ${cl.text}`); }
}
for (const p of D.PRESTIGE) {
  const t = E.byId[p.target]; if (!t) { fails++; console.log('FAIL unknown prestige target ' + p.id); continue; }
  for (let seed = 1; seed <= 6; seed++) {
    const s = { seed: seed * 104729 }; const com = E.buildCommission(s, p.target, E.TYPES, 1, {}, p.clues);
    if (!com) { fails++; console.log(`FAIL prestige ${p.id} (${t.n}) builds nothing`); continue; }
    const cands = E.candidates(com.clues);
    if (cands.length !== 1 || cands[0].id !== p.target) { fails++; console.log(`FAIL prestige ${p.id}: ${cands.map(x => x.n).join(', ')}`); }
    if (com.clues.length > p.clues.length + 1) console.log(`note: prestige ${p.id} needed an extra clue (${com.clues.length})`);
  }
}
// every clue type produces a true clue for every country where it applies
for (const c of E.C) for (const t of E.TYPES) for (const tier of [1, 2, 3]) { const cl = E.makeClue({ seed: 5 }, c, t, tier, {}); if (cl && !E.matches(cl, c)) { fails++; console.log(`FAIL ${t} tier ${tier} clue is false for ${c.n}: ${cl.text}`); } }
console.log(`${built} commissions built (${fallbacks} by fallback), ${D.PRESTIGE.length} prestige commissions checked, ${fails} failures`);
process.exit(fails ? 1 : 0);
