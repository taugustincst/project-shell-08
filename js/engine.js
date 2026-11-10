/* Cartographer's Apprentice — engine. Pure functions over a state object; no DOM. Runs in Node (validator, sim, tests) and the browser. */
(function (root) {
'use strict';
const W = (typeof CA_WORLD !== 'undefined') ? CA_WORLD : require('./world.js');
const D = (typeof CA_DATA !== 'undefined') ? CA_DATA : require('./data.js');
const C = W.COUNTRIES, byId = {}; C.forEach(c => { byId[c.id] = c; });
const SEA_PARENT = D.SEA_PARENT || {};
const seaWithParents = list => { const out = new Set(); for (let x of list) while (x && !out.has(x)) { out.add(x); x = SEA_PARENT[x]; } return out; };
C.forEach(c => { c.nb = c.nb.filter(n => byId[n]); c.landlocked = c.sea.length === 0; c.waters = seaWithParents(c.sea); });
const PLANT = s => D.PLANT_WORDS.some(w => new RegExp('(^|[^a-z])' + w + '($|[^a-z])').test(s.toLowerCase())); // whole words: a palmchat is a bird
const famOf = {}; for (const f in D.LANG_FAMILY) for (const l of D.LANG_FAMILY[f]) famOf[l] = f;
const curFamily = cur => { const l = cur.toLowerCase(); for (const f of D.CUR_FAMILIES) if (l.includes(f)) return f; return null; };
const TYPES = ['coast', 'lang', 'sun', 'gauge', 'currency', 'flag', 'drive', 'wild'];
const DECL = { 'June solstice': 23.4, 'December solstice': -23.4, 'the equinox': 0 };

/* ---------- RNG ---------- */
function rand(s) { s.seed = (s.seed + 0x6D2B79F5) | 0; let t = s.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
function shuffle(s, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- clue predicates ---------- */
function flagDiff(a, b) { // a: {l,c,e} description; b: country flag. Counts how many details differ.
  let d = 0;
  if (a.l !== undefined && a.l !== b.l) d++;
  if (a.e !== undefined && (a.e || '') !== (b.e || '')) d++;
  if (a.c) {
    const x = a.c, y = b.c;
    if (x.length !== y.length) d += 1 + Math.abs(x.length - y.length);
    else { let pos = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) pos++; const same = x.slice().sort().join() === y.slice().sort().join(); d += same ? (pos ? 1 : 0) : pos; }
  }
  return d;
}
function matches(clue, c) {
  const k = clue.k;
  switch (clue.t) {
    case 'coast': return k.sea ? c.waters.has(k.sea) : (c.landlocked && (!k.nb || c.nb.includes(k.nb)));
    case 'lang': return k.lang ? c.lang.includes(k.lang) : k.scr ? c.scr === k.scr : c.lang.some(l => famOf[l] === k.fam);
    case 'sun': return Math.abs(c.lat - k.lat) <= k.tol;
    case 'gauge': return c.g !== undefined && (k.g !== undefined ? c.g === k.g : D.GAUGE_CLASS(c.g) === k.cls);
    case 'currency': return k.cur ? c.cur === k.cur : k.fam ? curFamily(c.cur) === k.fam : c.cur[0].toLowerCase() === k.first;
    case 'flag': return k.colours ? k.colours.filter(x => c.flag.c.includes(x)).length >= 2 : flagDiff(k.desc, c.flag) <= 1;
    case 'drive': return c.d === k.d;
    case 'wild': return k.wild ? c.wild === k.wild : k.first ? c.wild[0].toLowerCase() === k.first : PLANT(c.wild) === k.plant;
  }
  return false;
}
function candidates(clues) { return C.filter(c => clues.every(cl => matches(cl, c))); }

/* ---------- clue generators (only true facts about the target; the flag type is a labelled eyewitness report) ---------- */
const COLOURS = ['red', 'white', 'blue', 'green', 'yellow', 'black', 'orange', 'light blue', 'maroon', 'saffron', 'crimson'];
const GEN = {
  coast(s, c, tier) {
    if (c.landlocked) { const nb = tier === 3 || !c.nb.length ? null : pick(s, c.nb); return { k: { landlocked: true, nb }, text: nb ? `No coast anywhere. The client crossed in by road from ${byId[nb].n}.` : 'The client never saw the sea. "Not a coast in the whole country," they say.', frag: tier }; }
    const sea = pick(s, c.sea);
    return { k: { sea }, text: tier === 1 ? `A fragment of coastline on the ${sea}, traced from a chart.` : tier === 2 ? `A torn chart: part of a coast on the ${sea}.` : `A scrap of chart. The client thinks the water was the ${sea}.`, frag: tier };
  },
  lang(s, c, tier) {
    if (tier === 1) { const lang = pick(s, c.lang); return { k: { lang }, text: `A sign copied down in ${lang}.` }; }
    if (tier === 2) return { k: { scr: c.scr }, text: `A sign the client could not read, in ${c.scr === 'Latin' ? 'ordinary Latin letters' : c.scr + ' script'}.` };
    const fams = c.lang.map(l => famOf[l]).filter(Boolean); if (!fams.length) return GEN.lang(s, c, 2);
    const fam = pick(s, fams); return { k: { fam }, text: `Overheard: a ${fam} language, the client is fairly sure.` };
  },
  sun(s, c, tier, tools) {
    const date = pick(s, Object.keys(DECL)), decl = DECL[date];
    const elev = 90 - Math.abs(c.lat - decl); if (elev <= 2) return GEN.sun(s, c, tier, tools); // polar night: no shadow to read
    const shadow = Math.tan((90 - elev) * Math.PI / 180);
    const dir = c.lat > decl ? 'north' : c.lat < decl ? 'south' : 'straight down';
    let tol = [0, 4, 7, 11][tier]; if (tools && tools.sextant) tol = Math.max(2, tol / 2);
    const r = tier === 1 ? shadow.toFixed(2) : tier === 2 ? (Math.round(shadow * 4) / 4).toFixed(2) : (Math.round(shadow * 2) / 2).toFixed(1);
    return { k: { lat: c.lat, tol }, text: `Noon on ${date}: a pole one yard tall cast a shadow ${r} yards long, pointing ${dir}.`, sun: { date, shadow, dir } };
  },
  gauge(s, c, tier) {
    if (c.g === undefined) return null;
    if (tier === 1) return { k: { g: c.g }, text: c.g === 0 ? 'The client looked for a railway and found none: there is not a single line in the country.' : `The client measured the railway: ${c.g} mm between the rails.` };
    const cls = D.GAUGE_CLASS(c.g);
    return { k: { cls }, text: cls === 'no railways' ? 'No railway anywhere, the client says.' : tier === 2 ? `The railway was ${cls}, by the client\'s pace.` : `The sleepers looked ${cls === 'standard gauge' ? 'ordinary' : cls === 'broad gauge' ? 'wider than at home' : 'narrower than at home'}, as railways go.` };
  },
  currency(s, c, tier) {
    if (tier === 1) return { k: { cur: c.cur }, text: `The client paid in ${c.cur}.` };
    const fam = curFamily(c.cur);
    if (tier === 2 && fam) return { k: { fam }, text: `The coins were some kind of ${fam}.` };
    return { k: { first: c.cur[0].toLowerCase() }, text: `The client half-heard the name of the money. It began with "${c.cur[0].toUpperCase()}".` };
  },
  flag(s, c, tier) {
    const f = c.flag;
    if (tier === 3) { // three colours named, one of them wrong
      if (f.c.length < 2) return GEN.flag(s, c, 2);
      const two = shuffle(s, f.c.filter((x, i, a) => a.indexOf(x) === i)).slice(0, 2); if (two.length < 2) return GEN.flag(s, c, 2);
      const wrong = pick(s, COLOURS.filter(x => !f.c.includes(x)));
      const named = shuffle(s, two.concat([wrong]));
      return { k: { colours: named }, text: `Eyewitness report (one detail is wrong): the flag had ${named.join(', ')} on it.`, eye: true };
    }
    const desc = { c: f.c.slice() }; if (tier === 1) { desc.l = f.l; desc.e = f.e || ''; }
    const edits = ['colour']; if (tier === 1) { edits.push('layout'); if (f.e) edits.push('emblem'); }
    const edit = pick(s, edits);
    if (edit === 'colour') { const i = Math.floor(rand(s) * desc.c.length); desc.c[i] = pick(s, COLOURS.filter(x => x !== desc.c[i])); }
    else if (edit === 'layout') desc.l = pick(s, ['h', 'v', 'x', 'f', 'd', 'q'].filter(x => x !== f.l));
    else desc.e = pick(s, ['a single star', 'a crescent', 'a sun', 'a coat of arms', 'an eagle', 'a cross', 'a tree'].filter(x => x !== f.e));
    return { k: { desc }, text: 'Eyewitness report (one detail is wrong): ' + flagText(desc), eye: true };
  },
  drive(s, c, tier) { return { k: { d: c.d }, text: tier === 1 ? `Carts and carriages kept to the ${c.d === 'L' ? 'left' : 'right'}.` : tier === 2 ? `The client was nearly run down stepping off a kerb: traffic came from the ${c.d === 'L' ? 'right, because it keeps left' : 'left, because it keeps right'}.` : `"They drive on the ${c.d === 'L' ? 'wrong' : 'proper'} side," says the client, who is from a right-hand country.` }; },
  wild(s, c, tier) {
    if (tier === 1) return { k: { wild: c.wild }, text: `From the carriage window: ${c.wild}.` };
    if (tier === 2) return { k: { first: c.wild[0].toLowerCase() }, text: `A ${PLANT(c.wild) ? 'plant' : 'creature'} native there, whose name begins with "${c.wild[0].toUpperCase()}".` };
    return { k: { plant: PLANT(c.wild) }, text: PLANT(c.wild) ? 'The client pressed a leaf from a plant that grows there and nowhere the client has been.' : 'The client sketched an animal they had never seen at home.' };
  }
};
const LAYOUTS = { h: 'horizontal bands', v: 'vertical bands', x: 'a cross', f: 'a plain field', d: 'a diagonal division', q: 'quarters' };
function flagText(d) { let t = ''; if (d.l) t += LAYOUTS[d.l] + ' of '; t += d.c.join(', '); if (d.e) t += ', with ' + d.e; return t + '.'; }
function makeClue(s, c, type, tier, tools) { const g = GEN[type](s, c, tier, tools); if (!g) return null; g.t = type; g.tier = tier; return g; }

/* A commission: a target and 2–5 clues of distinct types whose intersection over the whole world is exactly the target. */
function buildCommission(s, targetId, types, tier, tools, recipe) {
  const c = byId[targetId];
  for (let attempt = 0; attempt < 40; attempt++) {
    let clues = [];
    if (recipe) { for (const [t, tr] of recipe) { const cl = makeClue(s, c, t, tr, tools); if (cl) clues.push(cl); } }
    else {
      const order = shuffle(s, types.filter(t => t === 'coast' || t === 'lang' || t === 'sun' || t === 'drive' || t === 'currency' || t === 'wild' || t === 'flag' || t === 'gauge'));
      const n = 2 + Math.floor(rand(s) * 2);
      for (const t of order) { if (clues.length >= n) break; const cl = makeClue(s, c, t, tier, tools); if (cl) clues.push(cl); }
    }
    let cands = candidates(clues);
    const unused = shuffle(s, types.filter(t => !clues.some(cl => cl.t === t)));
    while (cands.length > 1 && unused.length && clues.length < 5) { const cl = makeClue(s, c, unused.shift(), Math.max(1, tier - (attempt > 20 ? 1 : 0)), tools); if (!cl) continue; clues.push(cl); cands = candidates(clues); }
    if (cands.length === 1 && cands[0].id === targetId && clues.length >= 2) return { target: targetId, clues };
  }
  // last resort: every owned layer at tier 1, generated with the same fixed seed the resolvability check uses
  const clues = types.map(t => makeClue({ seed: 1 }, c, t, 1, {})).filter(Boolean);
  const cands = candidates(clues);
  return cands.length === 1 ? { target: targetId, clues, fallback: true } : null;
}
/* Countries that the owned layers can single out at all (tier-1 facts of every owned type). */
const resolvableCache = {};
function resolvable(types) {
  const key = types.slice().sort().join(',');
  if (!resolvableCache[key]) resolvableCache[key] = new Set(C.filter(c => { const clues = types.map(t => makeClue({ seed: 1 }, c, t, 1, {})).filter(Boolean); return clues.length >= 2 && candidates(clues).length === 1; }).map(c => c.id));
  return resolvableCache[key];
}

/* ---------- state ---------- */
function newState(opts) {
  opts = opts || {};
  const s = { v: 1, seed: (opts.seed | 0) || ((Date.now() ^ (Math.random() * 1e9)) | 0), coins: 30, rep: 0, done: 0, layers: { coast: 1, lang: 1, sun: 1 }, tools: {}, atlas: {}, prestigeDone: {}, rivals: { vosk: 0, pell: 0, ortel: 0 }, unlocked: !!opts.unlocked, gated: false, commission: null, history: [], stats: { correct: 0, wrong: 0, wagersWon: 0, wagersLost: 0, routesRight: 0, routesWrong: 0, coinsEarned: 0, refused: 0 }, lastCountry: 'PT', mastered: false, flags: {} };
  return s;
}
function rankOf(s) { let r = D.RANKS[0]; for (const k of D.RANKS) if (s.rep >= k.rep) r = k; if (!s.unlocked && r.id > D.FREE_RANK) r = D.RANKS[D.FREE_RANK - 1]; return r; }
function nextRank(s) { const r = rankOf(s); return D.RANKS[r.id] || null; }
function continentsOpen(s) { return s.unlocked ? Object.keys(W.CONTINENTS) : D.FREE_CONTINENTS.slice(); }
function available(s) { const open = continentsOpen(s); const ok = resolvable(ownedTypes(s)); return C.filter(c => open.includes(c.c) && ok.has(c.id)); }
function ownedTypes(s) { return TYPES.filter(t => s.layers[t]); }
function tierFor(s, c) { const r = rankOf(s).id; const a = s.atlas[c.id]; const seen = a ? a.n : 0; let t = r <= 1 ? 1 : r <= 3 ? 2 : 3; if (seen >= 3) t = Math.min(3, t + 1); if (seen === 0 && r >= 2) t = Math.max(1, t - 1); return t; }

/* Spaced repetition: each identified country has an interval (in commissions) and a due index; wrong answers reset it. */
function dueList(s) { return available(s).filter(c => s.atlas[c.id] && s.atlas[c.id].due <= s.done); }
function chooseTarget(s) {
  const due = dueList(s); const avail = available(s); const unseen = avail.filter(c => !s.atlas[c.id]);
  const reviewShare = unseen.length === 0 ? 1 : rankOf(s).id >= 5 ? 0.3 : due.length > 30 ? 0.6 : 0.45;
  if (due.length && rand(s) < reviewShare) return { c: pick(s, due), review: true };
  if (unseen.length) { const nearby = unseen.filter(c => c.c === byId[s.lastCountry].c); return { c: pick(s, nearby.length && rand(s) < 0.6 ? nearby : unseen), review: false }; }
  if (due.length) return { c: pick(s, due), review: true };
  const weakest = avail.slice().sort((a, b) => (s.atlas[a.id].due) - (s.atlas[b.id].due))[0];
  return { c: weakest, review: true };
}
function prestigeAvailable(s) { const r = rankOf(s).id; return s.unlocked ? D.PRESTIGE.filter(p => !s.prestigeDone[p.id] && p.rank <= r && p.clues.every(([t]) => s.layers[t])) : []; }
function newCommission(s, opts) {
  opts = opts || {};
  if (s.commission) return s.commission;
  let com;
  const pres = prestigeAvailable(s);
  if (opts.prestige || (pres.length && rand(s) < 0.2)) {
    const p = opts.prestige ? pres.find(x => x.id === opts.prestige) : pick(s, pres);
    if (p) {
      const built = buildCommission(s, p.target, ownedTypes(s), 1, s.tools, p.clues);
      if (built) com = Object.assign(built, { prestige: p.id, title: p.title, client: p.client, rival: p.rival, review: false, tier: 1, pay: 40 + 15 * p.rank });
    }
  }
  if (!com) {
    const pickd = chooseTarget(s); const tier = tierFor(s, pickd.c);
    const built = buildCommission(s, pickd.c.id, ownedTypes(s), tier, s.tools);
    if (!built) return null;
    com = Object.assign(built, { tier, review: pickd.review, client: pick(s, D.CLIENTS), title: pickd.review ? 'A returning client' : 'A new commission', pay: [0, 6, 10, 15][tier] + 2 * rankOf(s).id });
  }
  com.wager = false; com.answered = null; com.route = null; com.routeOptions = null;
  s.commission = com; return com;
}

/* The answer. Returns a result the UI reads back to the player, including which clues excluded a wrong choice. */
function answer(s, countryId, wager) {
  const com = s.commission; if (!com || com.answered) return null;
  const c = byId[countryId]; if (!c) return null;
  const target = byId[com.target], correct = countryId === com.target;
  wager = !!wager && !!s.tools.wager; com.wager = wager; com.answered = countryId;
  let pay = com.pay * (com.review && !s.tools.globe ? 0.5 : 1) * (s.tools.apprentice ? 1.15 : 1) * (com.prestige && s.tools.press ? 1.5 : 1);
  let rep;
  if (correct) { if (wager) { pay *= 2; rep = 3; s.stats.wagersWon++; } else rep = 2; s.stats.correct++; if (com.prestige) { rep += 6; s.prestigeDone[com.prestige] = 'you'; } }
  else { pay = 0; rep = wager ? -6 : -2; if (wager) s.stats.wagersLost++; s.stats.wrong++; if (com.prestige) { s.prestigeDone[com.prestige] = com.rival; s.rivals[com.rival]++; } }
  pay = Math.round(pay); s.coins += pay; s.stats.coinsEarned += pay; s.rep = Math.max(0, s.rep + rep);
  // spaced repetition record
  const a = s.atlas[com.target] || (s.atlas[com.target] = { n: 0, w: 0, ease: 2.5, iv: 1, due: 0, id: false });
  if (correct) { a.n++; a.id = true; a.iv = Math.max(1, Math.round(a.n === 1 ? 2 : a.iv * a.ease)); a.ease = Math.min(3.2, a.ease + 0.1); }
  else { a.w++; a.iv = 1; a.ease = Math.max(1.3, a.ease - 0.3); }
  a.due = s.done + 1 + a.iv;
  s.done++; s.lastCountry = correct ? com.target : s.lastCountry;
  const failed = correct ? [] : com.clues.filter(cl => !matches(cl, c));
  const res = { correct, pay, rep, target, chosen: c, failed, wager };
  s.history.push({ t: com.target, a: countryId, ok: correct, p: com.prestige || null }); if (s.history.length > 200) s.history.shift();
  if (correct) com.routeOptions = routeOptions(s, target);
  checkGate(s); checkMastery(s);
  return res;
}
function refuse(s) { const com = s.commission; if (!com || com.answered) return false; s.stats.refused++; s.commission = null; return true; }
function finishCommission(s) { if (s.commission && (s.commission.answered)) s.commission = null; }

/* The expedition: reach the identified land through one of its neighbours (or, for an island, by the right sea), within budget. */
const toRad = x => x * Math.PI / 180;
function dist(a, b) { const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon); const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.asin(Math.sqrt(h)); }
function routeOptions(s, target) {
  const from = byId[s.lastCountry] || byId.PT;
  if (target.nb.length) {
    const good = shuffle(s, target.nb).slice(0, 2).map(id => byId[id]);
    const decoys = shuffle(s, C.filter(c => c.c === target.c && c.id !== target.id && !target.nb.includes(c.id))).slice(0, 4 - good.length);
    const opts = shuffle(s, good.concat(decoys)).map(o => ({ id: o.id, name: o.n, leagues: Math.round((dist(from, o) + dist(o, target)) / 100), ok: target.nb.includes(o.id) }));
    const budget = Math.max.apply(null, opts.filter(o => o.ok).map(o => o.leagues)) + 2;
    return { kind: 'land', opts, budget };
  }
  const allSeas = Array.from(new Set(C.flatMap(c => c.sea)));
  const good = shuffle(s, target.sea).slice(0, 1); const decoys = shuffle(s, allSeas.filter(x => !target.waters.has(x))).slice(0, 3);
  return { kind: 'sea', opts: shuffle(s, good.concat(decoys)).map(x => ({ id: x, name: x, leagues: Math.round(dist(from, target) / 100) + (target.waters.has(x) ? 0 : 3), ok: target.waters.has(x) })), budget: Math.round(dist(from, target) / 100) + 2 };
}
function plotRoute(s, optionId) {
  const com = s.commission; if (!com || !com.routeOptions || com.route) return null;
  const o = com.routeOptions.opts.find(x => x.id === optionId); if (!o || o.leagues > com.routeOptions.budget) return null;
  com.route = o.id; let bonus = 0;
  if (o.ok) { bonus = Math.max(2, Math.round(com.pay * 0.5)); s.coins += bonus; s.stats.coinsEarned += bonus; s.stats.routesRight++; s.rep += 1; }
  else { s.stats.routesWrong++; s.rep = Math.max(0, s.rep - 1); }
  return { ok: o.ok, bonus, option: o };
}

/* ---------- workshop ---------- */
function buyLayer(s, id) { const L = D.LAYERS.find(l => l.id === id); if (!L || s.layers[id] || s.coins < L.cost) return false; s.coins -= L.cost; s.layers[id] = 1; return true; }
function buyTool(s, id) { const U = D.UPGRADES.find(u => u.id === id); if (!U || s.tools[id] || s.coins < U.cost) return false; s.coins -= U.cost; s.tools[id] = 1; return true; }
function checkGate(s) { if (!s.unlocked && s.rep >= D.RANKS[D.FREE_RANK].rep) s.gated = true; }
function checkMastery(s) { if (s.mastered) return; if (rankOf(s).id === 5 && available(s).every(c => s.atlas[c.id] && s.atlas[c.id].id)) { s.mastered = true; s.flags.masteredAt = s.done; } }
function atlasProgress(s) { const avail = available(s); const idd = avail.filter(c => s.atlas[c.id] && s.atlas[c.id].id).length; const solid = avail.filter(c => s.atlas[c.id] && s.atlas[c.id].n >= 3 && s.atlas[c.id].w <= s.atlas[c.id].n).length; return { total: avail.length, identified: idd, solid }; }

/* ---------- save hygiene ---------- */
const num = (v, def, lo, hi) => { v = +v; if (!isFinite(v)) v = def; if (lo !== undefined && v < lo) v = lo; if (hi !== undefined && v > hi) v = hi; return v; };
function sanitizeAtlas(raw) { const out = {}; if (!raw || typeof raw !== 'object') return out; for (const id in raw) { if (!byId[id]) continue; const a = raw[id]; if (!a || typeof a !== 'object') continue; out[id] = { n: Math.round(num(a.n, 0, 0, 1e6)), w: Math.round(num(a.w, 0, 0, 1e6)), ease: num(a.ease, 2.5, 1.3, 3.2), iv: Math.round(num(a.iv, 1, 1, 1e5)), due: Math.round(num(a.due, 0, 0, 1e9)), id: a.id === true }; } return out; }
function sanitize(raw, atlasBackup) {
  if (!raw || typeof raw !== 'object') return null;
  const s = newState({ seed: raw.seed }); // the unlock is Play's to say (js/billing.js), never a save's
  s.coins = num(raw.coins, 0, 0, 1e9); s.rep = num(raw.rep, 0, 0, 1e7); s.done = Math.round(num(raw.done, 0, 0, 1e9));
  if (raw.layers && typeof raw.layers === 'object') for (const k in raw.layers) if (D.LAYERS.find(l => l.id === k) && raw.layers[k]) s.layers[k] = 1;
  if (raw.tools && typeof raw.tools === 'object') for (const k in raw.tools) if (D.UPGRADES.find(u => u.id === k) && raw.tools[k]) s.tools[k] = 1;
  s.atlas = sanitizeAtlas(raw.atlas);
  if (!Object.keys(s.atlas).length && atlasBackup) s.atlas = sanitizeAtlas(atlasBackup);
  if (raw.prestigeDone && typeof raw.prestigeDone === 'object') for (const k in raw.prestigeDone) if (D.PRESTIGE.find(p => p.id === k)) s.prestigeDone[k] = String(raw.prestigeDone[k]).slice(0, 10);
  if (raw.rivals && typeof raw.rivals === 'object') for (const k in s.rivals) s.rivals[k] = Math.round(num(raw.rivals[k], 0, 0, 1e4));
  if (raw.stats && typeof raw.stats === 'object') for (const k in s.stats) s.stats[k] = Math.round(num(raw.stats[k], 0, 0, 1e9));
  s.lastCountry = byId[raw.lastCountry] ? raw.lastCountry : 'PT'; s.mastered = raw.mastered === true; s.gated = raw.gated === true && !s.unlocked;
  if (Array.isArray(raw.history)) s.history = raw.history.filter(h => h && byId[h.t] && byId[h.a]).slice(-200).map(h => ({ t: h.t, a: h.a, ok: h.ok === true, p: typeof h.p === 'string' ? h.p : null }));
  // an in-progress commission is rebuilt from its target rather than trusted
  if (raw.commission && typeof raw.commission === 'object' && byId[raw.commission.target] && !raw.commission.answered) {
    const r = raw.commission; const p = typeof r.prestige === 'string' && D.PRESTIGE.find(x => x.id === r.prestige && x.target === r.target);
    const built = buildCommission(s, r.target, ownedTypes(s), Math.round(num(r.tier, 1, 1, 3)), s.tools, p ? p.clues : null);
    if (built) s.commission = Object.assign(built, { prestige: p ? p.id : undefined, title: p ? p.title : (typeof r.title === 'string' ? r.title.slice(0, 60) : 'A new commission'), client: p ? p.client : (typeof r.client === 'string' ? r.client.slice(0, 200) : D.CLIENTS[0]), rival: p ? p.rival : undefined, review: r.review === true, tier: Math.round(num(r.tier, 1, 1, 3)), pay: Math.round(num(r.pay, 8, 1, 1000)), wager: false, answered: null, route: null, routeOptions: null });
  }
  return s;
}

/* ---------- geometry for the renderer ---------- */
function polygon(c) { return c.p.trim().split(/\s+/).map(t => t.split(',').map(Number)); }
const bounds = {}; C.forEach(c => { const pts = polygon(c); bounds[c.id] = [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))]; });
const CONT_BOX = { EU: [-25, 34, 45, 71], AS: [25, -11, 150, 56], AF: [-20, -36, 55, 38], NA: [-130, 5, -50, 72], SA: [-85, -57, -32, 14], OC: [110, -48, 182, 0], WORLD: [-170, -58, 180, 80] };

const ENGINE = { W, D, C, byId, TYPES, resolvable, famOf, curFamily, PLANT, flagDiff, flagText, matches, candidates, makeClue, buildCommission, newState, rankOf, nextRank, continentsOpen, available, ownedTypes, tierFor, dueList, chooseTarget, prestigeAvailable, newCommission, answer, refuse, finishCommission, routeOptions, plotRoute, buyLayer, buyTool, atlasProgress, sanitize, polygon, bounds, CONT_BOX, rand, dist, checkGate };
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE; else root.CA = ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
