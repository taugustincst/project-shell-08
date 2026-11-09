// Headless smoke test of the real page: node tests/smoke.js [url]   (defaults to index.html over file://)
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, arg) => p.evaluate(fn, arg);
// A stand-in for the Play app's billing bridge (android/play/.../PlayBilling.java), as js/billing.js sees it.
const fakePlay = owned => {
  const say = m => setTimeout(() => window.__billingEvent(JSON.stringify(m)), 30);
  window.__buys = 0;
  window.AndroidBilling = {
    // Play remembers a purchase across launches, as the real store does.
    start(id) { const had = owned || localStorage.getItem('fakeplay.bought') === '1'; say({ type: 'ready', product: id }); say({ type: 'price', product: id, price: '$2.99' }); say({ type: 'owned', product: id, owned: had }); },
    buy(id) { window.__buys++; localStorage.setItem('fakeplay.bought', '1'); say({ type: 'purchased', product: id }); },
    restore(id) { say({ type: 'owned', product: id, owned: true }); }
  };
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('a commission is on the desk at the start', (await p.locator('#desk .clue').count()) >= 2);
  check('the three starting layers are owned and Europe and the Americas are open', await T(p, () => { const K = window.__cartographer; return Object.keys(K.state.layers).length === 3 && K.E.continentsOpen(K.state).join() === 'EU,NA,SA' && K.state.unlocked === false; }));
  check('there is no free unlock by URL and no unlock in the test API', await T(p, () => !('unlock' in window.__cartographer) && !('CA_BILLING' in window)));
  // deduce Italy from the atlas with the inks
  await T(p, () => { const K = window.__cartographer; K.layers(); K.state.tools.inks = 1; K.seedCommission('IT', { tier: 1 }); });
  await p.click('[data-clue="0"]'); await p.click('#btn-consult'); await p.waitForSelector('#tab-atlas.active');
  check('tapping a clue shades the lands it allows, including the target', await T(p, () => { const hi = [...document.querySelectorAll('#map path.hi')].map(x => x.dataset.id); return hi.length >= 1 && hi.includes('IT'); }));
  await p.click('#map path[data-id="IT"]'); await p.waitForTimeout(100);
  if (await p.isVisible('[data-pick-land="IT"]')) { await p.click('[data-pick-land="IT"]'); await p.waitForTimeout(100); }
  check('tapping the map selects a land, hatched and labelled', await T(p, () => document.querySelector('#map path.sel').dataset.id === 'IT' && document.getElementById('map-label').textContent === 'Italy'));
  {
    // Luxembourg is a few pixels wide at phone size: a tap on it asks which land was meant
    const sel = await T(p, () => document.querySelector('#map path.sel').dataset.id);
    await p.click('[data-cont="EU"]'); const lu = await T(p, () => { const r = document.querySelector('#map path[data-id="LU"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.click(lu[0], lu[1]); await p.waitForTimeout(100);
    check('a tap on a tiny land opens the Which land? list with it first', await T(p, () => !document.getElementById('modal').hidden && document.querySelector('[data-pick-land]').dataset.pickLand === 'LU'));
    await p.click('[data-pick-land="LU"]'); await p.waitForTimeout(100);
    check('picking from the list selects the land', await T(p, () => document.getElementById('modal').hidden && document.querySelector('#map path.sel').dataset.id === 'LU'));
    await T(p, id => window.__cartographer.select(id), sel);
  }
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
  // the free apprenticeship stops at Journeyman
  await T(p, () => { const K = window.__cartographer; K.setRep(200); K.seedCommission('FR', { tier: 1 }); K.answer('FR', false); });
  await p.click('#btn-ok'); await p.waitForTimeout(100);
  check('repute past Journeyman shows the guild\'s letter, once', await T(p, () => { const K = window.__cartographer; return !document.getElementById('modal').hidden && /Journeyman, and no further/.test(document.getElementById('modal-body').textContent) && K.E.rankOf(K.state).id === 2 && document.getElementById('hdr-rank').textContent === 'Journeyman (free rank)'; }));
  check('outside the Play app the unlock says where to get it and cannot be pressed', await T(p, () => document.getElementById('btn-g-unlock').disabled && /Google Play/.test(document.getElementById('g-note').textContent)));
  await p.click('#btn-g-later'); await p.waitForTimeout(100);
  check('Carry on as Journeyman closes the letter and play goes on', await T(p, () => document.getElementById('modal').hidden && (document.querySelectorAll('#desk .clue').length >= 2 || !!document.querySelector('[data-route], #btn-next'))));
  await p.click('.tab[data-tab="more"]'); check('the More tab shows the whole-world card', await T(p, () => !document.getElementById('unlock-card').hidden && /Africa, Asia and Oceania/.test(document.getElementById('unlock-status').textContent) && document.getElementById('btn-unlock').disabled));
  // a save code never carries the unlock
  await T(p, () => { const K = window.__cartographer; const run = JSON.parse(JSON.stringify(K.state)); run.unlocked = true; run.gated = false; window.__code = btoa(unescape(encodeURIComponent(JSON.stringify({ run, meta: { unlocked: true } })))); window.prompt = () => window.__code; });
  await p.click('#btn-import'); await p.waitForTimeout(100);
  check('a pasted save code loads the career but not the unlock', await T(p, () => { const K = window.__cartographer; return K.state.unlocked === false && K.E.continentsOpen(K.state).length === 3 && K.E.prestigeAvailable(K.state).length === 0; }));
  await p.click('.tab[data-tab="desk"]');
  // the Play app: buy from the guild's letter, then prestige, then a reload
  {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true }); const q = await ctx.newPage(); const qe = []; q.on('pageerror', e => qe.push(e.message)); q.on('dialog', d => d.accept());
    await q.addInitScript(fakePlay, false); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(150);
    await T(q, () => { const K = window.__cartographer; K.setRep(200); K.seedCommission('FR', { tier: 1 }); K.answer('FR', false); });
    await q.click('#btn-ok'); await q.waitForSelector('#btn-g-unlock:not([disabled])');
    check('in the Play app the letter shows Play\'s price on the button', (await q.textContent('#btn-g-unlock')).includes('$2.99'));
    await q.click('#btn-g-unlock'); await q.waitForTimeout(200);
    check('buying opens all six continents and the rank the repute earned', await T(q, () => { const K = window.__cartographer; return window.__buys === 1 && K.state.unlocked && !K.state.gated && K.E.continentsOpen(K.state).length === 6 && K.E.rankOf(K.state).id === 3 && document.getElementById('modal').hidden && document.getElementById('hdr-rank').textContent === 'Draughtsman'; }));
    await T(q, () => { const K = window.__cartographer; K.give(5000); K.state.commission = null; K.setTab('workshop'); });
    await q.click('[data-tool="dossier"]'); await q.waitForTimeout(100);
    check('buying in the workshop spends coins and marks it owned', await T(q, () => window.__cartographer.state.tools.dossier === 1 && document.querySelector('[data-tool="dossier"]').disabled));
    await q.click('[data-prestige]'); await q.waitForSelector('#tab-desk.active');
    check('a prestige commission can be taken from the dossier', await T(q, () => !!window.__cartographer.state.commission.prestige));
    const before = await T(q, () => { const K = window.__cartographer; K.save(); return { done: K.state.done, coins: Math.round(K.state.coins), it: !!K.state.atlas.FR, u: K.state.unlocked, com: K.state.commission.target }; });
    await q.reload(); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(150);
    const after = await T(q, () => { const K = window.__cartographer; return { done: K.state.done, coins: Math.round(K.state.coins), it: !!K.state.atlas.FR, u: K.state.unlocked, com: K.state.commission && K.state.commission.target }; });
    check('the save restores career, atlas, the unlock and the open commission', JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after));
    check('no page errors in the Play app run', qe.length === 0, qe.join(' | '));
    await ctx.close();
  }
  // a reinstall: Play says not owned until Restore asks again
  {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true }); const q = await ctx.newPage(); q.on('dialog', d => d.accept());
    await q.addInitScript(fakePlay, false); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(150);
    await q.click('.tab[data-tab="more"]'); await q.click('#btn-restore'); await q.waitForTimeout(200);
    check('Restore purchase opens the whole world', await T(q, () => window.__cartographer.state.unlocked && document.getElementById('unlock-card').hidden && window.__buys === 0));
    await ctx.close();
  }
  // corrupt saves are fail-soft and the atlas backup survives
  for (const [label, main, atlas] of [['truncated JSON', '{"run":{"coins":"x"', '{"FR":{"n":2,"id":true}}'], ['wrong types', '{"v":1,"run":{"coins":"1e999","atlas":"no","commission":5},"meta":{"unlocked":"yes"}}', null], ['not an object', '42', '{"DE":{"n":1,"id":true}}'], ['a save that claims the unlock', '{"v":1,"run":{"seed":3,"rep":200,"unlocked":true,"gated":false},"meta":{"unlocked":true}}', null]]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message));
    await q.addInitScript(([m, a]) => { try { localStorage.setItem('cartographer.v1', m); if (a) localStorage.setItem('cartographer.v1.atlas', a); } catch (e) { } }, [main, atlas]);
    await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads: ' + label, qerrs.length === 0 && await T(q, a => { const s = window.__cartographer.state; return isFinite(s.coins) && s.unlocked === false && window.__cartographer.E.continentsOpen(s).length === 3 && (!a || Object.keys(s.atlas).length === 1); }, atlas), qerrs.join(' | '));
    await ctx.close();
  }
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
