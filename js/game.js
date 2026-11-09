/* Cartographer's Apprentice — UI, save, test API. Numbers live in engine.js. */
(function () {
'use strict';
const E = window.CA, D = E.D, W = E.W;
// The unlock is a Google Play purchase (js/billing.js). Play's answer, cached on the phone, is the only thing
// that opens the whole world: not a save, not a save code, not a URL.
const BILL = window.createBilling({ storageKey: 'cartographer.unlock', productId: 'full_unlock' });
const VERSION = '1.1.0', SAVE_KEY = 'cartographer.v1', ATLAS_KEY = 'cartographer.v1.atlas', BACKUP_KEY = 'cartographer.v1.backup';
const $ = id => document.getElementById(id);
let S = null, profile = null;
const TYPE_NAMES = { coast: 'Coast', lang: 'Sign', sun: 'Sun', gauge: 'Rails', currency: 'Coin', flag: 'Flag', drive: 'Road', wild: 'Wild' };

/* ---------- profile ---------- */
function sanitizeSettings(x) { x = (x && typeof x === 'object') ? x : {}; return { large: x.large === true, contrast: x.contrast === true }; }
function load() {
  let raw = null, atlasBackup = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { try { localStorage.setItem(BACKUP_KEY, localStorage.getItem(SAVE_KEY) || ''); } catch (e2) { } }
  try { atlasBackup = JSON.parse(localStorage.getItem(ATLAS_KEY)); } catch (e) { }
  profile = { settings: sanitizeSettings(raw && raw.settings) };
  S = raw && raw.run ? E.sanitize(raw.run, atlasBackup) : null;
  if (!S) { S = E.newState(); if (atlasBackup) { const r = E.sanitize({ atlas: atlasBackup }, null); if (r) S.atlas = r.atlas; } }
  applyOwned();
}
function applyOwned() { S.unlocked = BILL.state.owned; if (S.unlocked) S.gated = false; else E.checkGate(S); }
function save() { if (!S) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, run: S, settings: profile.settings })); localStorage.setItem(ATLAS_KEY, JSON.stringify(S.atlas)); } catch (e) { } }

/* ---------- helpers ---------- */
let toastTimer = 0; function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function showModal(html) { $('modal-body').innerHTML = html; $('modal').hidden = false; }
function hideModal() { $('modal').hidden = true; }
function fragSvg(c, tier, seedN) { // a piece of the coastline, rotated, no labels
  const pts = E.polygon(c); const n = pts.length; const keep = tier === 1 ? n : tier === 2 ? Math.ceil(n / 2) + 1 : Math.ceil(n / 3) + 1;
  const start = seedN % n; const sel = []; for (let i = 0; i < keep; i++) sel.push(pts[(start + i) % n]);
  const cx = sel.reduce((a, p) => a + p[0], 0) / sel.length, cy = sel.reduce((a, p) => a + p[1], 0) / sel.length;
  const ang = (seedN % 7) * 0.5; const cos = Math.cos(ang), sin = Math.sin(ang);
  const rot = sel.map(p => { const x = p[0] - cx, y = -(p[1] - cy); return [x * cos - y * sin, x * sin + y * cos]; });
  const xs = rot.map(p => p[0]), ys = rot.map(p => p[1]); const minx = Math.min(...xs), miny = Math.min(...ys), w = Math.max(...xs) - minx || 1, h = Math.max(...ys) - miny || 1; const sc = Math.min(56 / w, 40 / h);
  const d = rot.map((p, i) => (i ? 'L' : 'M') + ((p[0] - minx) * sc + 4).toFixed(1) + ' ' + ((p[1] - miny) * sc + 4).toFixed(1)).join(' ') + (tier === 1 ? ' Z' : '');
  return `<svg class="frag" viewBox="0 0 64 48" aria-hidden="true"><path d="${d}" fill="${tier === 1 ? '#e7dcc0' : 'none'}" stroke="#1d1a14" stroke-width="1.2"/></svg>`;
}
function factsHtml(c, full) {
  const L = S.layers, rows = [];
  if (L.coast) rows.push(['Coast', c.sea.length ? c.sea.join(', ') : 'landlocked'], ['Borders', c.nb.length ? c.nb.map(i => E.byId[i].n).join(', ') : 'none (an island)']);
  if (L.lang) rows.push(['Language', c.lang.join(', ')], ['Script', c.scr]);
  if (L.sun) rows.push(['Latitude', `${Math.abs(c.lat)}° ${c.lat >= 0 ? 'N' : 'S'}`]);
  if (L.drive) rows.push(['Traffic', c.d === 'L' ? 'keeps left' : 'keeps right']);
  if (L.gauge) rows.push(['Railway', c.g === undefined ? 'not recorded' : c.g === 0 ? 'none' : `${c.g} mm (${D.GAUGE_CLASS(c.g)})`]);
  if (L.currency) rows.push(['Money', c.cur]);
  if (L.wild) rows.push(['Native', c.wild]);
  if (L.flag) rows.push(['Flag', E.flagText(c.flag)]);
  if (full) rows.unshift(['Capital', c.cap]);
  return `<dl class="facts">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>`;
}

/* ---------- tabs ---------- */
let tab = 'desk';
function setTab(t) { tab = t; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t)); render(); }

/* ---------- render ---------- */
function render() {
  const r = E.rankOf(S); $('hdr-rank').textContent = r.name + (S.gated ? ' (free rank)' : ''); $('hdr-coins').textContent = Math.round(S.coins); $('hdr-rep').textContent = Math.round(S.rep);
  renderUnlockCard();
  if (tab === 'desk') renderDesk(); if (tab === 'atlas') renderAtlas(); if (tab === 'workshop') renderWorkshop();
}
let activeClues = {}; // clue index -> on (atlas shading)
function renderDesk() {
  const box = $('desk'); let com = S.commission;
  if (!com) { com = E.newCommission(S); activeClues = {}; save(); }
  if (!com) { box.innerHTML = '<div class="card"><p>No client today. Buy another reference layer in the Workshop: the atlas cannot yet tell some lands apart.</p></div>'; return; }
  const prest = com.prestige ? D.PRESTIGE.find(p => p.id === com.prestige) : null, rival = prest ? D.RIVALS.find(x => x.id === prest.rival) : null;
  let h = `<div class="card"><div class="muted small">${com.review ? 'A returning client' : prest ? 'Prestige commission' : 'Commission'} · pays ${com.pay} coins${com.review && !S.tools.globe ? ' (half rate for a repeat)' : ''}${rival ? ' · ' + esc(rival.name) + ' is after this one' : ''}</div><h2>${esc(com.title)}</h2><p class="client">${esc(prest ? prest.client : com.client + ' comes in with evidence.')}</p></div>`;
  h += com.clues.map((cl, i) => `<div class="clue${activeClues[i] ? ' on' : ''}" data-clue="${i}">${cl.t === 'coast' ? fragSvg(E.byId[com.target], cl.tier, Math.abs(S.seed) + i) : `<span class="ct">${TYPE_NAMES[cl.t]}</span>`}<span class="cx">${esc(cl.text)}${cl.eye ? '<br><span class="eye">Eyewitness. One detail is wrong.</span>' : ''}</span></div>`).join('');
  if (!com.answered) {
    h += `<div class="card"><p class="muted small">${S.tools.inks ? 'Tap a clue to shade every land it allows on the atlas.' : 'Consult the atlas, then commit to a place.'}</p><div class="row-btns"><button class="btn primary" id="btn-consult">Consult the atlas</button><button class="btn" id="btn-decline">Decline (−1 repute)</button></div></div>`;
  } else if (com.routeOptions && !com.route) {
    const R = com.routeOptions;
    h += `<div class="card"><h2>Plot the expedition</h2><p class="muted small">${R.kind === 'land' ? `Guides can only be hired through a land that borders ${esc(E.byId[com.target].n)}. Budget: ${R.budget} leagues.` : `${esc(E.byId[com.target].n)} is an island. Approach by the right sea. Budget: ${R.budget} leagues.`}</p><div class="choices">${R.opts.map(o => `<button class="btn choice" data-route="${esc(o.id)}" ${o.leagues > R.budget ? 'disabled' : ''}>${esc(o.name)} · ${o.leagues} leagues${o.leagues > R.budget ? ' (over budget)' : ''}</button>`).join('')}</div></div>`;
  } else {
    h += `<div class="card"><div class="row-btns"><button class="btn primary" id="btn-next">Next client</button></div></div>`;
  }
  box.innerHTML = h;
}
function answerFlow(id) {
  const com = S.commission; if (!com || com.answered) return;
  const c = E.byId[id];
  showModal(`<h2>${esc(c.n)}?</h2>${factsHtml(c, S.atlas[id] && S.atlas[id].id)}${S.tools.wager ? '<label class="row"><input type="checkbox" id="wager"> Stake your reputation (double pay, triple loss)</label>' : ''}<div class="row-btns"><button class="btn primary" id="btn-commit">This is the place</button><button class="btn" id="btn-cancel">Not yet</button></div>`);
  $('btn-cancel').onclick = hideModal;
  $('btn-commit').onclick = () => { const w = $('wager') && $('wager').checked; const res = E.answer(S, id, w); save(); showResult(res); };
}
function showResult(res) {
  const t = res.target; const com = S.commission;
  let h = res.correct ? `<h2 class="ok">${esc(t.n)}. Correct.</h2><p>${res.pay} coins, +${res.rep} repute.${res.wager ? ' The wager pays.' : ''}${com && com.prestige ? ' The prestige commission is yours; the rival workshop goes without.' : ''}</p>`
    : `<h2 class="bad">Not ${esc(res.chosen.n)}.</h2><p>It was ${esc(t.n)}. ${res.rep} repute.${res.wager ? ' The wager is lost.' : ''}${com && com.prestige ? ' ' + esc(D.RIVALS.find(x => x.id === com.rival).name) + ' claims the commission.' : ''}</p><p class="small">What ruled out ${esc(res.chosen.n)}:</p><ul class="small">${res.failed.map(cl => `<li>${esc(cl.text)}</li>`).join('')}</ul>`;
  h += `<h3>${esc(t.n)} · atlas entry</h3>${factsHtml(t, true)}<div class="row-btns"><button class="btn primary" id="btn-ok">${res.correct && com && com.routeOptions ? 'Plot the expedition' : 'Back to the desk'}</button></div>`;
  showModal(h); $('btn-ok').onclick = () => { hideModal(); setTab('desk'); maybeGate(); maybeMastery(); };
}
function renderWorkshop() {
  const r = E.rankOf(S), nx = E.nextRank(S), prog = E.atlasProgress(S);
  let h = `<div class="card"><h2>${esc(r.name)}</h2><p class="muted">${esc(r.blurb)}</p>${nx ? `<div class="small">Repute ${Math.round(S.rep)} / ${nx.rep} toward ${esc(nx.name)}${!S.unlocked && nx.id > D.FREE_RANK ? ' (needs the whole world)' : ''}</div><div class="meter"><i style="width:${Math.min(100, S.rep / nx.rep * 100)}%"></i></div>` : '<div class="small">The highest rank the guild gives.</div>'}<div class="small">Atlas: ${prog.identified} of ${prog.total} lands identified, ${prog.solid} known cold.</div><div class="meter"><i style="width:${prog.identified / prog.total * 100}%"></i></div></div>`;
  h += `<div class="stats">${[['commissions', S.done], ['correct', S.stats.correct], ['wrong', S.stats.wrong], ['expeditions', S.stats.routesRight + '/' + (S.stats.routesRight + S.stats.routesWrong)]].map(p => `<div class="stat"><b>${p[1]}</b><span>${p[0]}</span></div>`).join('')}</div>`;
  h += '<div class="cat">Reference layers</div>' + D.LAYERS.map(L => `<div class="upg${S.layers[L.id] ? ' owned' : ''}"><div class="n">${esc(L.name)}</div><button class="btn" data-layer="${L.id}" ${S.layers[L.id] || S.coins < L.cost ? 'disabled' : ''}>${S.layers[L.id] ? 'owned' : L.cost + ' coins'}</button><div class="d">${esc(L.desc)}</div></div>`).join('');
  h += '<div class="cat">Workshop</div>' + D.UPGRADES.map(U => `<div class="upg${S.tools[U.id] ? ' owned' : ''}"><div class="n">${esc(U.name)}</div><button class="btn" data-tool="${U.id}" ${S.tools[U.id] || S.coins < U.cost ? 'disabled' : ''}>${S.tools[U.id] ? 'owned' : U.cost + ' coins'}</button><div class="d">${esc(U.desc)}</div></div>`).join('');
  const pres = E.prestigeAvailable(S);
  h += `<div class="cat">Prestige commissions</div><div class="card">${S.unlocked ? `<p class="small muted">${pres.length} open at your rank. ${Object.values(S.prestigeDone).filter(v => v === 'you').length} won, ${Object.values(S.prestigeDone).filter(v => v && v !== 'you').length} lost to rivals, of ${D.PRESTIGE.length}.</p>` : '<p class="small muted">Prestige commissions and the rival workshops open with the whole world.</p>'}${S.tools.dossier && pres.length ? `<ul class="small">${pres.slice(0, 6).map(p => `<li>${esc(p.title)} — contested by ${esc(D.RIVALS.find(x => x.id === p.rival).name)} <button class="btn" data-prestige="${p.id}" style="min-height:32px;padding:2px 8px">take it</button></li>`).join('')}</ul>` : ''}<ul class="rivals small">${D.RIVALS.map(rv => `<li><b>${esc(rv.name)}</b> (${rv.style}): ${S.rivals[rv.id]} claimed. ${esc(rv.blurb)}</li>`).join('')}</ul></div>`;
  $('workshop').innerHTML = h;
}

/* ---------- atlas ---------- */
let cont = 'EU', selected = null, mapBuilt = false;
function buildMap() {
  if (mapBuilt) return; mapBuilt = true; const g = $('map-countries'); let h = '';
  for (const c of E.C) { const d = E.polygon(c).map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + (-p[1])).join(' ') + ' Z'; h += `<path d="${d}" data-id="${c.id}"><title>${esc(c.n)}</title></path>`; }
  g.innerHTML = h + '<text id="map-label" x="0" y="0"></text>';
  $('cont-btns').innerHTML = Object.keys(W.CONTINENTS).map(k => `<button class="btn" data-cont="${k}">${W.CONTINENTS[k]}</button>`).join('') + '<button class="btn" data-cont="WORLD">World</button>';
}
function setCont(k) { cont = k; const b = E.CONT_BOX[k]; $('map').setAttribute('viewBox', `${b[0]} ${-b[3]} ${b[2] - b[0]} ${b[3] - b[1]}`); document.querySelectorAll('[data-cont]').forEach(x => x.classList.toggle('active', x.dataset.cont === k)); }
function renderAtlas() {
  buildMap(); if (!$('map').dataset.init) { $('map').dataset.init = 1; setCont(cont); }
  const open = E.continentsOpen(S); const com = S.commission;
  const on = com && !com.answered ? com.clues.filter((cl, i) => activeClues[i]) : [];
  const allowed = on.length ? new Set(E.candidates(on).map(c => c.id)) : null;
  document.querySelectorAll('#map path').forEach(p => { const id = p.dataset.id, c = E.byId[id]; p.classList.toggle('id', !!(S.atlas[id] && S.atlas[id].id)); p.classList.toggle('dim', !open.includes(c.c)); p.classList.toggle('hi', !!(allowed && allowed.has(id))); p.classList.toggle('sel', selected === id); });
  const lbl = $('map-label'); if (selected) { const b = E.bounds[selected]; lbl.setAttribute('x', (b[0] + b[2]) / 2); lbl.setAttribute('y', -(b[1] + b[3]) / 2); lbl.setAttribute('text-anchor', 'middle'); lbl.textContent = E.byId[selected].n; } else lbl.textContent = '';
  $('atlas-legend').textContent = (allowed ? `${allowed.size} land${allowed.size === 1 ? '' : 's'} fit the shaded clues. ` : '') + 'Hatched = selected. Darker = identified.' + (S.unlocked ? '' : ' Faded = opens with the whole world.');
  $('atlas-search').hidden = !S.tools.index;
  const e = $('atlas-entry');
  if (!selected) e.innerHTML = '<p class="muted">Tap a land on the map to read its entry.</p>';
  else { const c = E.byId[selected]; const a = S.atlas[selected]; e.innerHTML = `<h2>${esc(c.n)}</h2><div class="muted small">${W.CONTINENTS[c.c]}${a && a.id ? ` · identified ${a.n} time${a.n === 1 ? '' : 's'}` : ' · not yet identified'}${!open.includes(c.c) ? ' · not open to you yet' : ''}</div>${factsHtml(c, a && a.id)}${com && !com.answered && open.includes(c.c) ? '<div class="row-btns"><button class="btn primary" id="btn-answer">This is the place</button></div>' : ''}`; const b = $('btn-answer'); if (b) b.onclick = () => answerFlow(selected); }
  const list = $('atlas-list'); const q = $('atlas-search').value.trim().toLowerCase();
  if (S.tools.index && q) { list.hidden = false; list.innerHTML = E.C.filter(c => c.n.toLowerCase().includes(q)).slice(0, 20).map(c => `<li data-pick="${c.id}" class="${S.atlas[c.id] && S.atlas[c.id].id ? 'id' : ''}">${esc(c.n)} <span class="muted small">${W.CONTINENTS[c.c]}</span></li>`).join(''); } else list.hidden = true;
}
// A fingertip covers about 9 mm. On a phone, Luxembourg, Malta, Singapore and the small Balkan and Central
// American lands are a few pixels wide on the map, so a tap near any small land asks which land was meant.
const FINGER = 22, SMALL = 24;
function mapTap(x, y, hitPath) {
  const near = [];
  document.querySelectorAll('#map path').forEach(p => {
    const c = E.byId[p.dataset.id]; if (cont !== 'WORLD' && c.c !== cont) return;
    const r = p.getBoundingClientRect(); if (!r.width && !r.height && !r.left) return;
    const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom), d = Math.hypot(dx, dy);
    if (d <= FINGER) near.push({ id: c.id, d: p === hitPath ? -1 : d, small: Math.min(r.width, r.height) < SMALL });
  });
  const hit = hitPath ? hitPath.dataset.id : null;
  // A tap squarely on a large land only asks when a small land sits right beside the fingertip.
  const hitSmall = hit && near.some(n => n.id === hit && n.small);
  if (hit && !near.some(n => n.small && n.id !== hit && (hitSmall || n.d <= FINGER / 2))) { selectCountry(hit); return; }
  if (!near.length) return;
  if (near.length === 1) { selectCountry(near[0].id); return; }
  near.sort((a, b) => a.d - b.d);
  const pick = near.slice(0, 6);
  showModal(`<h2>Which land?</h2><p class="muted small">Several lands are under your finger.</p><div class="choices">${pick.map(n => `<button class="btn choice" data-pick-land="${n.id}">${esc(E.byId[n.id].n)}</button>`).join('')}</div><div class="row-btns"><button class="btn" id="btn-pick-cancel">None of these</button></div>`);
  $('modal-body').querySelectorAll('[data-pick-land]').forEach(b => { b.onclick = () => { hideModal(); selectCountry(b.dataset.pickLand); }; });
  $('btn-pick-cancel').onclick = hideModal;
}
function selectCountry(id) { selected = id; const c = E.byId[id]; if (cont !== 'WORLD' && c.c !== cont) setCont(c.c); renderAtlas(); }

/* ---------- the whole world (gate and unlock) ---------- */
let gateShown = false;
const WORLD_PITCH = 'Africa, Asia and Oceania (85 more lands), the ranks of Draughtsman, Surveyor and Master Cartographer, and forty prestige commissions contested by the rival workshops.';
function unlockNote() {
  const b = BILL.state;
  if (b.owned) return 'The whole world is open. Thank you.';
  if (!b.available) return 'Unlocking is done through Google Play, in the app from Google Play.';
  if (b.pending) return 'Your purchase is waiting on Google Play. The world opens when it goes through.';
  if (b.error) return b.error;
  if (b.busy) return 'Asking Google Play…';
  return b.price ? 'One purchase, ' + b.price + '. Nothing else to buy, no ads.' : 'One purchase. Nothing else to buy, no ads.';
}
function unlockButtons(prefix) { const b = BILL.state, off = !b.available || b.busy || b.pending; return `<button class="btn primary" id="${prefix}-unlock" ${off ? 'disabled' : ''}>Unlock the whole world${b.price ? ' · ' + esc(b.price) : ''}</button><button class="btn" id="${prefix}-restore" ${!b.available || b.busy ? 'disabled' : ''}>Restore purchase</button>`; }
function wireUnlock(prefix) { const u = $(prefix + '-unlock'), r = $(prefix + '-restore'); if (u) u.onclick = () => { BILL.buy(); }; if (r) r.onclick = () => { BILL.restore(); }; }
function renderUnlockCard() {
  const c = $('unlock-card'); c.hidden = S.unlocked; if (S.unlocked) return;
  $('unlock-status').textContent = 'The free apprenticeship covers Europe and the Americas up to the rank of Journeyman. One purchase opens ' + WORLD_PITCH;
  $('unlock-note').textContent = unlockNote(); $('unlock-btns').innerHTML = unlockButtons('btn'); wireUnlock('btn');
}
function renderGate() { if ($('modal').hidden || !$('g-note')) return; $('g-note').textContent = unlockNote(); $('g-btns').innerHTML = unlockButtons('btn-g') + '<button class="btn" id="btn-g-later">Carry on as Journeyman</button>'; wireUnlock('btn-g'); $('btn-g-later').onclick = hideModal; }
function maybeGate() { if (!S.gated || S.unlocked || gateShown) return; gateShown = true; showModal(`<div class="muted small">The guild writes</div><h2>Journeyman, and no further</h2><p>You have the repute for Draughtsman. The guild's free apprenticeship stops at Journeyman and at the edge of Europe and the Americas. Clients keep coming, and the atlas keeps filling, at that rank.</p><p class="muted small">The whole world: ${WORLD_PITCH}</p><p class="small" id="g-note" role="status"></p><div class="row-btns" id="g-btns"></div>`); renderGate(); }
function onBilling() {
  const was = S.unlocked; applyOwned();
  if (S.unlocked && !was) { save(); if (!$('modal').hidden && $('g-note')) hideModal(); toast('The whole world is open.'); }
  render(); renderGate();
}

/* ---------- mastery ---------- */
let masteryShown = false;
function maybeMastery() { if (S.mastered && !masteryShown) { masteryShown = true; showModal(`<h2>Master Cartographer</h2><p>Every land in the atlas identified, in your hand, from evidence. The master hands you the keys and goes back to the garden. Clients will keep coming; returning ones will keep testing you; the rivals will keep losing. You know the map of the world now. That was the point.</p><div class="row-btns"><button class="btn primary" id="btn-m-ok">Back to the desk</button></div>`); $('btn-m-ok').onclick = hideModal; } }

/* ---------- wiring ---------- */
function applySettings() { document.documentElement.classList.toggle('large', profile.settings.large); document.documentElement.classList.toggle('contrast', profile.settings.contrast); $('opt-large').checked = profile.settings.large; $('opt-contrast').checked = profile.settings.contrast; }
function init() {
  load(); applySettings(); $('about-version').textContent = VERSION;
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('desk').addEventListener('click', e => {
    const cl = e.target.closest('[data-clue]'); if (cl) { if (!S.tools.inks) { toast('Coloured inks (Workshop) shade the atlas by clue.'); return; } activeClues[cl.dataset.clue] = !activeClues[cl.dataset.clue]; renderDesk(); return; }
    if (e.target.id === 'btn-consult') { setTab('atlas'); return; }
    if (e.target.id === 'btn-decline') { S.rep = Math.max(0, S.rep - 1); E.refuse(S); activeClues = {}; save(); renderDesk(); return; }
    if (e.target.id === 'btn-next') { E.finishCommission(S); activeClues = {}; selected = null; save(); renderDesk(); return; }
    const rt = e.target.closest('[data-route]'); if (rt) { const r = E.plotRoute(S, rt.dataset.route); if (!r) return; save(); toast(r.ok ? `A good road. +${r.bonus} coins, +1 repute.` : `${r.option.name} does not border it. The guides turn back. −1 repute.`); renderDesk(); }
  });
  $('workshop').addEventListener('click', e => { const l = e.target.closest('[data-layer]'); if (l && E.buyLayer(S, l.dataset.layer)) { save(); render(); toast('Layer added to the atlas.'); } const t = e.target.closest('[data-tool]'); if (t && E.buyTool(S, t.dataset.tool)) { save(); render(); toast('Bought.'); } const p = e.target.closest('[data-prestige]'); if (p && !S.commission) { E.newCommission(S, { prestige: p.dataset.prestige }); save(); setTab('desk'); } else if (p) toast('Finish the commission on your desk first.'); });
  $('map').addEventListener('click', e => mapTap(e.clientX, e.clientY, e.target.closest('path')));
  $('cont-btns').addEventListener('click', e => { const b = e.target.closest('[data-cont]'); if (b) { setCont(b.dataset.cont); renderAtlas(); } });
  $('atlas-search').addEventListener('input', renderAtlas); $('atlas-list').addEventListener('click', e => { const li = e.target.closest('[data-pick]'); if (li) { $('atlas-search').value = ''; selectCountry(li.dataset.pick); } });
  for (const k of ['large', 'contrast']) $('opt-' + k).addEventListener('change', e => { profile.settings[k] = e.target.checked; applySettings(); save(); });
  $('btn-export').addEventListener('click', async () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify({ run: S })))); try { await navigator.clipboard.writeText(code); toast('Save code copied.'); } catch (e) { prompt('Your save code:', code); } });
  // A save code carries the career and the atlas. It never carries the unlock: that stays with the Google account.
  $('btn-import').addEventListener('click', () => { const code = prompt('Paste a save code:'); if (!code) return; try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); const run = E.sanitize(o.run, null); if (!run) throw 0; S = run; applyOwned(); gateShown = false; save(); render(); toast('Save loaded.'); } catch (e) { toast('That code could not be read.'); } });
  $('btn-reset').addEventListener('click', () => { if (!confirm('Start a new apprenticeship? The career and atlas start again from nothing. A purchase stays.')) return; S = E.newState(); applyOwned(); gateShown = masteryShown = false; selected = null; activeClues = {}; save(); setTab('desk'); });
  window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  BILL.onChange(onBilling); BILL.start();
  $('app').hidden = false; render(); maybeGate();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
}
window.__cartographer = {
  get state() { return S; }, E, D, VERSION, billing: BILL,
  seedCommission(target, opts) { S.commission = null; const p = opts && opts.prestige; if (p) E.newCommission(S, { prestige: p }); else { const tier = (opts && opts.tier) || 1; const built = E.buildCommission(S, target, E.ownedTypes(S), tier, S.tools); if (built) S.commission = Object.assign(built, { tier, review: false, client: D.CLIENTS[0], title: 'A new commission', pay: 10, wager: false, answered: null, route: null, routeOptions: null }); } activeClues = {}; setTab('desk'); return S.commission; },
  setRank(n) { S.rep = D.RANKS[Math.max(0, Math.min(4, n - 1))].rep; E.checkGate(S); render(); }, setRep(r) { S.rep = r; render(); },
  identify(ids) { for (const id of ids) S.atlas[id] = { n: 3, w: 0, ease: 2.5, iv: 8, due: S.done + 8, id: true }; render(); },
  give(coins) { S.coins += coins; render(); }, layers(all) { for (const L of D.LAYERS) S.layers[L.id] = 1; render(); },
  answer(id, w) { const r = E.answer(S, id, w); save(); showResult(r); return r; },
  select: selectCountry, setCont, save, reset() { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(ATLAS_KEY); location.reload(); }, render, setTab
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
