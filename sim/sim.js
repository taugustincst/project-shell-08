/* Headless career sim: node sim/sim.js [commissions] [seed]
   Plays scripted apprentices of different accuracy through the career and reports rank timing, economy, the free gate, prestige vs rivals,
   and how the spaced-repetition scheduler covers the atlas. */
const E = require('../js/engine.js'); const D = E.D;
const N = +(process.argv[2] || 600), SEED = +(process.argv[3] || 7);
function play(name, acc, unlocked, buys) {
  const s = E.newState({ seed: SEED, unlocked });
  const rankAt = { 1: 0 }; let gateAt = null, reviews = 0, prestige = 0, wagers = 0;
  for (let i = 0; i < N; i++) {
    const com = E.newCommission(s); if (!com) break;
    if (com.review) reviews++; if (com.prestige) prestige++;
    // the apprentice "knows" the answer with probability acc; a returning client is easier after a correct earlier answer
    const a = s.atlas[com.target]; const p = Math.min(0.98, acc + (a && a.n ? 0.15 : 0) - (com.tier - 1) * 0.08);
    const ok = E.rand(s) < p;
    const wrongPool = E.candidates(com.clues.slice(0, 1)).filter(c => c.id !== com.target);
    const guess = ok ? com.target : (wrongPool.length ? wrongPool[Math.floor(E.rand(s) * wrongPool.length)].id : com.target);
    const wager = !!s.tools.wager && p > 0.85; if (wager) wagers++;
    const r = E.answer(s, guess, wager);
    if (r.correct && com.routeOptions) { const o = com.routeOptions.opts.filter(x => x.leagues <= com.routeOptions.budget); const good = o.find(x => x.ok); E.plotRoute(s, (E.rand(s) < acc && good) ? good.id : o[0].id); }
    E.finishCommission(s);
    if (buys) { for (const L of D.LAYERS) if (!s.layers[L.id] && s.coins >= L.cost + 20) E.buyLayer(s, L.id); for (const U of D.UPGRADES) if (!s.tools[U.id] && s.coins >= U.cost + 30) E.buyTool(s, U.id); }
    const rk = E.rankOf(s).id; if (!rankAt[rk]) rankAt[rk] = i + 1;
    if (s.gated && gateAt === null) gateAt = i + 1;
  }
  const prog = E.atlasProgress(s); const due = E.dueList(s).length;
  const rivalWins = Object.values(s.rivals).reduce((a, b) => a + b, 0), mine = Object.values(s.prestigeDone).filter(v => v === 'you').length;
  return { name, s, rankAt, gateAt, reviews, prestige, wagers, prog, due, rivalWins, mine };
}
const f = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(' ');
for (const [name, acc, unlocked, buys] of [['sharp', 0.9, true, true], ['average', 0.7, true, true], ['guesser', 0.45, true, true], ['free-sharp', 0.9, false, true], ['free-average', 0.7, false, true], ['hoarder', 0.7, true, false]]) {
  const r = play(name, acc, unlocked, buys); const st = r.s.stats;
  console.log(`${name.padEnd(12)} rank=${E.rankOf(r.s).id} rankAt{${f(r.rankAt)}} gateAt=${r.gateAt} rep=${r.s.rep.toFixed(0)} coins=${r.s.coins.toFixed(0)} earned=${st.coinsEarned} layers=${Object.keys(r.s.layers).length}/8 tools=${Object.keys(r.s.tools).length}/8`);
  console.log(`             correct=${st.correct} wrong=${st.wrong} wagers W/L=${st.wagersWon}/${st.wagersLost} routes R/W=${st.routesRight}/${st.routesWrong} reviews=${r.reviews} prestige=${r.prestige}(you ${r.mine}, rivals ${r.rivalWins}) atlas id=${r.prog.identified}/${r.prog.total} solid=${r.prog.solid} due now=${r.due} mastered=${r.s.mastered}`);
}
// spaced-repetition shape: with a sharp player, how many times is each identified country drilled by the end, and how long are the intervals?
const r = play('sr', 0.9, true, true); const ivs = Object.values(r.s.atlas).map(a => a.iv); const ns = Object.values(r.s.atlas).map(a => a.n);
console.log(`SR after ${N}: countries seen=${ns.length} mean drills=${(ns.reduce((a, b) => a + b, 0) / ns.length).toFixed(2)} max=${Math.max(...ns)} mean interval=${(ivs.reduce((a, b) => a + b, 0) / ivs.length).toFixed(1)} max interval=${Math.max(...ivs)}`);
