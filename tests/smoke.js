// Headless smoke test of the real page: node tests/smoke.js [url]   (defaults to index.html over file://)
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, arg) => p.evaluate(fn, arg);
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('a commission is on the desk at the start', (await p.locator('#desk .clue').count()) >= 2);
  check('the three starting layers are owned and every continent is open', await T(p, () => { const K = window.__cartographer; return Object.keys(K.state.layers).length === 3 && K.E.continentsOpen(K.state).length === 6 && K.state.unlocked === true; }));
  check('no purchase card, unlock or restore button exists', await T(p, () => !['unlock-card', 'unlock-status', 'btn-unlock', 'btn-restore', 'btn-g-unlock', 'btn-g-restore'].some(id => document.getElementById(id)) && !('CA_BILLING' in window) && !('unlock' in window.__cartographer) && !('gate' in window.__cartographer) && !/restore purchase|unlock the whole world|google play|free apprenticeship/i.test(document.body.textContent)));
  // deduce Italy from the atlas with the inks
  await T(p, () => { const K = window.__cartographer; K.layers(); K.state.tools.inks = 1; K.seedCommission('IT', { tier: 1 }); });
  await p.click('[data-clue="0"]'); await p.click('#btn-consult'); await p.waitForSelector('#tab-atlas.active');
  check('tapping a clue shades the lands it allows, including the target', await T(p, () => { const hi = [...document.querySelectorAll('#map path.hi')].map(x => x.dataset.id); return hi.length >= 1 && hi.includes('IT'); }));
  await p.click('#map path[data-id="IT"]'); await p.waitForTimeout(100);
  check('tapping the map selects a land, hatched and labelled', await T(p, () => document.querySelector('#map path.sel').dataset.id === 'IT' && document.getElementById('map-label').textContent === 'Italy'));
  await p.click('#btn-answer'); await p.waitForSelector('#btn-commit'); await p.click('#btn-commit'); await p.waitForSelector('#btn-ok');
  check('a correct deduction pays and fills the atlas', await T(p, () => { const K = window.__cartographer; return K.state.stats.correct === 1 && K.state.atlas.IT.id && document.querySelector('#modal-body h2').textContent.includes('Correct'); }));
  await p.click('#btn-ok'); await p.waitForSelector('[data-route]');
  const good = await T(p, () => window.__cartographer.state.commission.routeOptions.opts.find(o => o.ok).id);
  await p.click(`[data-route="${good}"]`); await p.waitForTimeout(100);
  check('plotting the expedition through a neighbour pays a bonus', await T(p, () => window.__cartographer.state.stats.routesRight === 1));
  await p.click('#btn-next'); await p.waitForTimeout(100);
  check('the next client arrives', (await p.locator('#desk .clue').count()) >= 2);
  // a wrong answer explains itself
  await T(p, () => { const K = window.__cartographer; K.seedCommission('ES', { tier: 1 }); K.answer('PT', false); });
  check('a wrong deduction names the real place and the clues that ruled out the choice', await T(p, () => { const h = document.getElementById('modal-body').innerHTML; return h.includes('Spain') && h.includes('ruled out') && document.querySelectorAll('#modal-body li').length >= 1; }));
  await p.click('#btn-ok');
  // no gate: repute past Journeyman makes Draughtsman, with no purchase sheet
  await T(p, () => { const K = window.__cartographer; K.setRep(200); K.seedCommission('FR', { tier: 1 }); K.answer('FR', false); });
  await p.click('#btn-ok'); await p.waitForTimeout(100);
  check('play continues past Journeyman to Draughtsman with every continent open', await T(p, () => { const K = window.__cartographer; return document.getElementById('modal').hidden && K.E.rankOf(K.state).id === 3 && K.E.continentsOpen(K.state).length === 6 && document.getElementById('hdr-rank').textContent === 'Draughtsman'; }));
  await p.click('.tab[data-tab="more"]'); check('the More tab has no purchase card', await T(p, () => !document.getElementById('unlock-card') && !/purchase|unlock/i.test(document.getElementById('tab-more').textContent)));
  // workshop purchase and prestige
  await T(p, () => { const K = window.__cartographer; K.give(5000); K.state.commission = null; K.setTab('workshop'); });
  await p.click('[data-tool="dossier"]'); await p.waitForTimeout(100);
  check('buying in the workshop spends coins and marks it owned', await T(p, () => window.__cartographer.state.tools.dossier === 1 && document.querySelector('[data-tool="dossier"]').disabled));
  await p.click('[data-prestige]'); await p.waitForSelector('#tab-desk.active');
  check('a prestige commission can be taken from the dossier', await T(p, () => !!window.__cartographer.state.commission.prestige));
  // save, reload, continue
  const before = await T(p, () => { const K = window.__cartographer; K.save(); return { done: K.state.done, coins: Math.round(K.state.coins), it: !!K.state.atlas.IT, u: K.state.unlocked, com: K.state.commission.target }; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  const after = await T(p, () => { const K = window.__cartographer; return { done: K.state.done, coins: Math.round(K.state.coins), it: !!K.state.atlas.IT, u: K.state.unlocked, com: K.state.commission && K.state.commission.target }; });
  check('the save restores career, atlas and the open commission', JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after));
  // corrupt saves are fail-soft and the atlas backup survives
  for (const [label, main, atlas] of [['truncated JSON', '{"run":{"coins":"x"', '{"FR":{"n":2,"id":true}}'], ['wrong types', '{"v":1,"run":{"coins":"1e999","atlas":"no","commission":5},"meta":{"unlocked":"yes"}}', null], ['not an object', '42', '{"DE":{"n":1,"id":true}}'], ['an old save stopped at the gate', '{"v":1,"run":{"seed":3,"rep":200,"unlocked":false,"gated":true},"meta":{"unlocked":false}}', null]]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message));
    await q.addInitScript(([m, a]) => { try { localStorage.setItem('cartographer.v1', m); if (a) localStorage.setItem('cartographer.v1.atlas', a); } catch (e) { } }, [main, atlas]);
    await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads: ' + label, qerrs.length === 0 && await T(q, a => { const s = window.__cartographer.state; return isFinite(s.coins) && s.unlocked === true && !s.gated && window.__cartographer.E.continentsOpen(s).length === 6 && document.getElementById('modal').hidden && (!a || Object.keys(s.atlas).length === 1); }, atlas), qerrs.join(' | '));
    await ctx.close();
  }
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
