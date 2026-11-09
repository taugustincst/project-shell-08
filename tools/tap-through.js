'use strict';
// Emulator tap-through: Cartographer's Apprentice driven with real Android
// touch input (adb shell input) on a debug build of the Play edition. Play's
// 3 Nov 2026 review of Bubble Pop's first upload listed "Unresponsive UI
// elements, such as buttons or icons"; this test, built the same way as Bubble
// Pop's, fails unless each control visibly does its job when a finger taps
// it: a commission's clues, the atlas and its continents, a land picked off
// the map (and a tiny one through the "Which land?" list), the answer, the
// expedition, the next client, the tabs and settings, the guild's letter at
// Journeyman with the whole-world unlock (the emulator has no Play Store, so
// it must say so and let the player carry on), Back, and a relaunch that
// keeps the career.
//
// The page's layout and state are read over WebView DevTools (enabled only in
// debuggable builds, see MainActivity), so every tap lands on the element's
// measured centre and every step is checked against the game's own state.
// Taps themselves never go through DevTools: they are real touches.
//
//   node tools/tap-through.js <debug-apk> [package]
// Screenshots and a log go to $TAP_THROUGH_OUT (default tap-through/).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APK = process.argv[2];
const PKG = process.argv[3] || 'com.taugustincst.cartographer';
const OUT = process.env.TAP_THROUGH_OUT || 'tap-through';
const PORT = 9333;
if (!APK) { console.error('usage: node tools/tap-through.js <debug-apk> [package]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = (...a) => execFileSync('adb', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 }).trim();
let shotN = 0;
const shot = name => {
  const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png');
  try { fs.writeFileSync(f, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 })); } catch (e) { /* best effort */ }
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!ok) failures++;
  return ok;
};
const fatal = msg => { console.log('FAIL ' + msg); finish(true); };

// ---------------------------------------------------------------- DevTools
let ws = null, msgId = 0;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('DevTools timeout: ' + method)); } }, 15000);
  });
}
async function js(expression) {
  const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (m.error) throw new Error('DevTools: ' + m.error.message);
  if (m.result.exceptionDetails) {
    const d = m.result.exceptionDetails;
    throw new Error('page: ' + ((d.exception && d.exception.description) || d.text));
  }
  return m.result.result.value;
}
async function connect() {
  for (let i = 0; i < 40; i++) {
    let pid = '';
    try { pid = adb('shell', 'pidof', PKG); } catch (e) { /* not up yet */ }
    if (pid) {
      try {
        adb('forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid.split(/\s+/)[0]}`);
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        const page = list.find(t => t.type === 'page' && /appassets\.androidplatform\.net/.test(t.url));
        if (page) {
          ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
          ws.onmessage = e => {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
            if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
          };
          await send('Runtime.enable');
          if (await js('!!(window.__cartographer)')) return;
          ws.close(); ws = null;
        }
      } catch (e) { /* the page or its DevTools socket is not ready yet */ }
    }
    await sleep(1000);
  }
  fatal('could not reach the game page over WebView DevTools (is this a debug build?)');
}

// ----------------------------------------------------------------- geometry
let dpr = 1, offX = 0, offY = 0, screenW = 0, screenH = 0;
// Measure an element (scrolled into view programmatically if it sits in a
// scrolling panel) and make sure it is the topmost thing at its centre, so a
// tap there reaches it and nothing covers it.
async function measure(sel) {
  return js(`(function(){
    var el=document.querySelector(${JSON.stringify(sel)});
    if(!el) return {missing:true};
    el.scrollIntoView({block:'center',inline:'center'});
    var r=el.getBoundingClientRect();
    var cx=r.left+r.width/2, cy=r.top+r.height/2;
    var top=document.elementFromPoint(cx,cy);
    var visible=r.width>0&&r.height>0&&cx>=0&&cy>=0&&cx<=innerWidth&&cy<=innerHeight;
    return {cx:cx,cy:cy,w:r.width,h:r.height,visible:visible,onTop:!!top&&(top===el||el.contains(top))};
  })()`);
}
const toScreen = (cx, cy) => [Math.round(cx * dpr + offX), Math.round(cy * dpr + offY)];
// Wait for the layout to settle (the soft keyboard opening or closing
// resizes the page), so the tap lands where the element really is.
async function measureSettled(sel) {
  let m = await measure(sel);
  for (let i = 0; i < 12 && !m.missing; i++) {
    await sleep(250);
    const n = await measure(sel);
    if (n.missing || (Math.abs(n.cx - m.cx) < 1 && Math.abs(n.cy - m.cy) < 1)) return n;
    m = n;
  }
  return m;
}
async function tap(sel, label) {
  await sleep(150);
  const m = await measureSettled(sel);
  if (m.missing) return check(`${label}: on screen`, false, `${sel} not in the page`);
  if (!check(`${label}: visible and not covered`, m.visible && m.onTop, JSON.stringify(m))) return false;
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'tap', String(x), String(y));
  return true;
}
async function longPress(sel, ms) {
  const m = await measureSettled(sel);
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'swipe', String(x), String(y), String(x), String(y), String(ms));
}
async function waitFor(expr, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    let v = false;
    try { v = await js(expr); } catch (e) { /* page busy */ }
    if (v) return true;
    if (Date.now() > end) return false;
    await sleep(150);
  }
}
const hidden = id => `document.getElementById(${JSON.stringify(id)}).hidden`;
const shown = id => `!document.getElementById(${JSON.stringify(id)}).hidden`;
function alive() { try { return adb('shell', 'pidof', PKG) !== ''; } catch (e) { return false; } }

// ------------------------------------------------- native dialogs
// A <select> in the WebView opens Android's own list dialog, and confirm()
// opens an AlertDialog. Neither is in the page, so find their rows on screen
// with uiautomator and tap them like a finger would.
function screenNodes() {
  for (let i = 0; i < 3; i++) {
    try {
      adb('shell', 'uiautomator', 'dump', '/sdcard/tt-ui.xml');
      const xml = adb('exec-out', 'cat', '/sdcard/tt-ui.xml');
      const nodes = [];
      for (const m of xml.matchAll(/<node [^>]*?text="([^"]*)"[^>]*?resource-id="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)) {
        nodes.push({ text: m[1].replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'), id: m[2], x: (+m[3] + +m[5]) >> 1, y: (+m[4] + +m[6]) >> 1 });
      }
      if (nodes.length) return nodes;
    } catch (e) { /* the screen was still changing */ }
  }
  return [];
}
async function tapScreenText(want, label) {
  for (let tries = 0; tries < 4; tries++) {
    await sleep(600);
    const n = screenNodes().find(n => n.text === want);
    if (n) { adb('shell', 'input', 'tap', String(n.x), String(n.y)); return check(`${label}: "${want}" on screen and tapped`, true); }
    // a long list: scroll the dialog up a little and look again
    adb('shell', 'input', 'swipe', String(screenW >> 1), String(Math.round(screenH * 0.7)), String(screenW >> 1), String(Math.round(screenH * 0.4)), '300');
  }
  return check(`${label}: "${want}" on screen and tapped`, false);
}
async function pick(field, value, label) {
  await tap('#p-' + field, label + ' picker');
  const text = await js(`(function(){var s=document.getElementById('p-${field}');for(var i=0;i<s.options.length;i++)if(s.options[i].value===${JSON.stringify(value)})return s.options[i].textContent;return null})()`);
  await tapScreenText(text, label);
  return waitFor(`document.getElementById('p-${field}').value===${JSON.stringify(value)}`, 3000);
}


// A point well inside a land on the map (a land's box centre can fall in a
// neighbour, as Norway's does in Sweden), measured on the page.
async function landPoint(id) {
  return js(`(function(){
    var el=document.querySelector('#map path[data-id="${id}"]'); if(!el) return null;
    var r=el.getBoundingClientRect(), best=null, bd=-1;
    for(var i=1;i<12;i++)for(var j=1;j<12;j++){var x=r.left+r.width*i/12,y=r.top+r.height*j/12;
      if(document.elementFromPoint(x,y)!==el) continue; var d=99;
      for(var a=0;a<12;a++){for(var k=1;k<30;k++){if(document.elementFromPoint(x+Math.cos(a/12*6.283)*k,y+Math.sin(a/12*6.283)*k)!==el){d=Math.min(d,k);break;}}}
      if(d>bd){bd=d;best=[x,y];}}
    return best||[r.left+r.width/2,r.top+r.height/2];
  })()`);
}
async function tapLand(id, label) {
  await sleep(150);
  const pt = await landPoint(id);
  if (!pt) return check(`${label}: on the map`, false);
  const [x, y] = toScreen(pt[0], pt[1]);
  adb('shell', 'input', 'tap', String(x), String(y));
  return true;
}
// Pick a land as a player does: tap it, and if the "Which land?" list opens,
// tap its row.
async function pickLand(id, label) {
  await tapLand(id, label);
  await waitFor(`${shown('modal')}||(document.querySelector('#map path.sel')||{}).dataset`, 2000);
  if (await js(`${shown('modal')}&&!!document.querySelector('[data-pick-land="${id}"]')`)) {
    await tap(`[data-pick-land="${id}"]`, `${label} in the Which land? list`);
  }
  return waitFor(`${hidden('modal')}&&(document.querySelector('#map path.sel')||{dataset:{}}).dataset.id==='${id}'`);
}

// -------------------------------------------------------------------- run
let finished = false;
function finish(stop) {
  if (finished) return; finished = true;
  try { fs.writeFileSync(path.join(OUT, 'logcat.txt'), adb('logcat', '-d')); } catch (e) { /* best effort */ }
  if (stop) failures = failures || 1;
  console.log(failures ? `tap-through: ${failures} FAILED` : 'tap-through: every screen and control responded');
  try { if (ws) ws.close(); } catch (e) { /* closing */ }
  process.exit(failures ? 1 : 0);
}
const K = 'window.__cartographer';
const tabOpen = t => `document.getElementById('tab-${t}').classList.contains('active')`;

// One commission by taps: consult, find the land, answer, plot the road.
async function playCommission(label) {
  const t = await js(`(function(){var c=${K}.state.commission;var l=${K}.E.byId[c.target];return {id:l.id,c:l.c,n:l.n}})()`);
  await tap('#btn-consult', `${label}: Consult the atlas`);
  check(`${label}: the atlas opens`, await waitFor(tabOpen('atlas')));
  await tap(`[data-cont="${t.c}"]`, `${label}: ${t.c} on the atlas`);
  check(`${label}: the map shows ${t.c}`, await waitFor(`document.querySelector('[data-cont="${t.c}"]').classList.contains('active')`));
  check(`${label}: ${t.n} can be picked off the map`, await pickLand(t.id, `${label}: ${t.n}`));
  await tap('#btn-answer', `${label}: This is the place`);
  check(`${label}: the answer sheet opens`, await waitFor(`${shown('modal')}&&!!document.getElementById('btn-commit')`));
  await tap('#btn-commit', `${label}: commit`);
  check(`${label}: the deduction is right and paid`, await waitFor(`!!document.getElementById('btn-ok')&&/Correct/.test(document.getElementById('modal-body').textContent)`));
  await tap('#btn-ok', `${label}: Plot the expedition`);
  check(`${label}: the expedition choices show`, await waitFor(`${hidden('modal')}&&!!document.querySelector('[data-route]')`));
  const before = await js(`${K}.state.stats.routesRight`);
  const good = await js(`${K}.state.commission.routeOptions.opts.find(function(o){return o.ok}).id`);
  await tap(`[data-route="${good}"]`, `${label}: a road through a neighbour`);
  check(`${label}: the good road pays`, await waitFor(`${K}.state.stats.routesRight===${before + 1}`));
  await tap('#btn-next', `${label}: Next client`);
  check(`${label}: the next client arrives`, await waitFor(`document.querySelectorAll('#desk .clue').length>=2&&!!document.getElementById('btn-consult')`));
}

(async () => {
  adb('wait-for-device');
  adb('install', '-r', APK);
  try { adb('shell', 'pm', 'clear', PKG); } catch (e) { /* fresh install */ }
  adb('logcat', '-c');
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  [screenW, screenH] = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/).slice(1).map(Number);
  dpr = await js('devicePixelRatio');
  await sleep(1500);
  shot('desk');

  // 1. The desk. Calibrate on the title (no handler).
  check('a commission is on the desk', await waitFor(`document.querySelectorAll('#desk .clue').length>=2`));
  await js(`window.__tt=[];addEventListener('pointerdown',function(e){__tt.push([e.clientX,e.clientY])},true);1`);
  {
    const m = await measure('header.top h1');
    const sx = Math.round(m.cx * dpr), sy = Math.round(m.cy * dpr);
    adb('shell', 'input', 'tap', String(sx), String(sy));
    if (!(await waitFor('__tt.length>0'))) fatal('a tap on the screen never reached the page (touch input is not getting through)');
    const [px, py] = await js('__tt[__tt.length-1]');
    offX = sx - px * dpr; offY = sy - py * dpr;
    console.log(`geometry: screen ${screenW}x${screenH}, devicePixelRatio ${dpr}, page offset ${offX.toFixed(1)},${offY.toFixed(1)}`);
    check('touch reaches the page where it was aimed', Math.abs(offX) < screenW && Math.abs(offY) < screenH);
  }
  await tap('#desk [data-clue="0"]', 'A clue without the coloured inks');
  check('a clue says what shading needs', await waitFor(`${shown('toast')}&&/Coloured inks/.test(document.getElementById('toast').textContent)`));

  // 2. Two commissions by hand: the one on the desk, then a tiny land.
  await playCommission('First commission');
  shot('expedition');
  await js(`${K}.seedCommission('LU',{tier:1});1`);
  await playCommission('Luxembourg');
  shot('after-luxembourg');

  // 3. The tabs and a setting.
  for (const t of ['atlas', 'workshop', 'more', 'desk']) {
    await tap(`.tab[data-tab="${t}"]`, `${t} tab`);
    check(`the ${t} tab opens`, await waitFor(tabOpen(t)));
  }
  await tap('.tab[data-tab="more"]', 'more tab');
  await tap('#opt-large', 'Large text');
  check('Large text turns on', await waitFor(`document.documentElement.classList.contains('large')`));
  await tap('#opt-large', 'Large text again');
  check('Large text turns off', await waitFor(`!document.documentElement.classList.contains('large')`));
  check('the More tab offers the whole world', await waitFor(shown('unlock-card')));
  check('the app has the Play billing bridge', await js('!!window.AndroidBilling'));

  // 4. The guild's letter at Journeyman. No Play Store here, so the letter
  // must say so and let the player carry on.
  await tap('.tab[data-tab="desk"]', 'desk tab');
  await js(`(function(){var k=${K};k.setRep(200);k.seedCommission('FR',{tier:1});k.answer('DE',false)})();1`);
  await tap('#btn-ok', 'Back to the desk after a wrong answer');
  check('the guild\'s letter shows at Journeyman', await waitFor(`${shown('modal')}&&!!document.getElementById('btn-g-later')`));
  check('without a Play Store the letter says so', await waitFor(`/Google Play/.test(document.getElementById('g-note').textContent)`, 8000), await js(`document.getElementById('g-note').textContent`));
  shot('letter');
  if (await js(`!document.getElementById('btn-g-unlock').disabled`)) {
    await tap('#btn-g-unlock', 'Unlock the whole world');
    check('the unlock button answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
    check('nothing unlocked without Play', await js(`!${K}.state.unlocked`));
  }
  if (await js(`!!document.getElementById('btn-g-restore')&&!document.getElementById('btn-g-restore').disabled`)) {
    await tap('#btn-g-restore', 'Restore purchase');
    check('Restore answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  await tap('#btn-g-later', 'Carry on as Journeyman');
  check('Carry on closes the letter at Journeyman', await waitFor(`${hidden('modal')}&&/free rank/.test(document.getElementById('hdr-rank').textContent)`));

  // 5. Back leaves without a crash, and the career is still there on relaunch.
  const kept = await js(`(function(){var s=${K}.state;${K}.save();return {done:s.done,correct:s.stats.correct,lu:!!(s.atlas.LU&&s.atlas.LU.id)}})()`);
  adb('shell', 'input', 'keyevent', '4');
  await sleep(1500);
  const log1 = adb('logcat', '-d');
  check('Back leaves without a crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log1));
  try { ws.close(); } catch (e) { /* reconnecting */ } ws = null;
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  await sleep(1000);
  check('the career and atlas are kept on relaunch', await waitFor(`(function(){var s=${K}.state;return s.done===${kept.done}&&s.stats.correct===${kept.correct}&&!!(s.atlas.LU&&s.atlas.LU.id)===${kept.lu}&&s.gated&&!s.unlocked})()`));
  shot('relaunch');

  const log = adb('logcat', '-d');
  check('no crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log));
  check(`no "app not responding"`, !log.includes(`ANR in ${PKG}`));
  check('no errors in the page', pageErrors.length === 0, pageErrors.join(' | '));
  check('the app is still running', alive());
  finish(false);
})().catch(e => { console.log('FAIL tap-through stopped: ' + (e && e.stack || e)); finish(true); });
