// Balance harness: a simple scripted "sensible player" plays 200 days from every landing site.
// Usage: npm run balance [-- <seed>]. Run it after changing numbers in config.js or data/*.js.
// Expected: polar sites thrive, equatorial sites survive with fewer crew, Deep Shadowed Crater is hardest.
import { build, checkRocket, requestRocket, setShelter } from '../src/game/actions.js';
import { BUILDINGS } from '../src/data/buildings.js';
import { advanceDay, computeDay } from '../src/game/simulation.js';
import { createNewGame, countBuildings, getHousing, getColonyShielding, isLunarDaylight } from '../src/game/state.js';
import { generateSectorMap } from '../src/game/sectorMap.js';
import { SECTORS, getSector } from '../src/data/sectors.js';
import { createRng } from '../src/game/rng.js';
import { makeRadiation } from '../src/game/radiation.js';
import { RADLAB_SNAPSHOT } from '../src/data/radlabSnapshot.js';
const PREF = { solar: 'peak', iceMine: 'ice', refinery: 'ore', habitat: 'tube' };
function free(s, id, type) {
  const used = new Set(s.sectors[id].buildings.map(b => b.cell));
  const cells = generateSectorMap(id).cells.filter(c => !used.has(c.index) && c.terrain !== 'crater');
  return (cells.find(c => c.terrain === PREF[type]) ?? cells.find(c=>c.terrain==='plain') ?? cells[0])?.index ?? -1;
}
// Uses Call Earth and the Storm Shelter the way a sensible player would.
function radioAndShelter(s) {
  const r = computeDay(s);
  const days = (res) => (r.deltas[res] < 0 ? s.resources[res] / -r.deltas[res] : Infinity);
  const urgent = ['oxygen', 'water', 'food'].sort((a, b) => days(a) - days(b))[0];
  if (urgent !== 'oxygen' && days(urgent) < 12 && checkRocket(s, urgent).ok) requestRocket(s, urgent);
  else if (checkRocket(s, 'crew').ok && getHousing(s) - s.population >= 2) requestRocket(s, 'crew');
  else if (checkRocket(s, 'metal').ok) requestRocket(s, 'metal');
  if (s.flare && !s.shelter && s.flare.daysLeft === 1 && getColonyShielding(s) < 0.75 && s.resources.energy > 40) setShelter(s, true);
}

function bot(s, home) {
  radioAndShelter(s);
  const sec = getSector(home).traits;
  for (let k = 0; k < 4; k++) {
    const r = computeDay(s); const d = r.deltas;
    const n = (t) => countBuildings(s, t);
    const cycle = !sec.constantSun;
    const day = isLunarDaylight(s.day);
    const reactorOut = n('reactor') * 30 * sec.reactor;
    const solarNow = r.energyProduced - reactorOut;
    const netEnergy = (cycle ? (day ? solarNow / 2 : 0) + reactorOut : r.energyProduced) - r.energyDemand;
    const staffed = () => true;
    const opts = [];
    if (sec.sunlight === 0 && n('reactor') === 0) opts.push('reactor');
    if (netEnergy < 2 && (!cycle || day)) opts.push(sec.sunlight === 0 ? 'reactor' : 'solar');
    if (d.oxygen < 1) opts.push('electrolysis');
    if (cycle && s.day < 3 && n('refinery') === 0) opts.push(n('excavator') === 0 ? 'excavator' : 'refinery');
    if (d.water < 1) opts.push(n('recycler') === 0 && n('iceMine') > 0 ? 'recycler' : 'iceMine');
    if (d.food < 1) opts.push('greenhouse');
    if (n('excavator') === 0) opts.push('excavator');
    if (n('refinery') === 0) opts.push('refinery');
    if (cycle && r.energyCap < r.energyDemand * 15) opts.push('battery');
    if (n('pad') === 0) opts.push('pad');
    if (getColonyShielding(s) < 0.75) opts.push('shield');
    if (s.population >= getHousing(s) - 1) opts.push('habitat');
    if (cycle && n('reactor') === 0) opts.push('reactor');
    const want = opts.find(staffed);
    if (!want || !build(s, home, free(s, home, want), want).ok) break;
  }
}
function run(home, seed) {
  const win = RADLAB_SNAPSHOT[seed % RADLAB_SNAPSHOT.length];
  const s = createNewGame(home, { ...makeRadiation({ ...win, source: 'snapshot' }), storms: win.storms }); const rng = createRng(seed);
  while (!s.gameOver && s.day < 200) { bot(s, home); advanceDay(s, rng); }
  const b = {}; for (const x of s.sectors[home].buildings) b[x.type] = (b[x.type]||0)+1;
  console.log(String(home).padStart(2), getSector(home).name.padEnd(28), 'day', s.day, 'pop', s.population, 'lost', s.stats.crewLost, JSON.stringify(b));
}
const seed = Number(process.argv[2] ?? 11);
console.log(`Balance simulation (seed ${seed}) - a scripted player for 200 days per landing site:`);
for (const s of SECTORS) run(s.id, seed);

