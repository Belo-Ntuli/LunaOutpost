import { getSector } from '../data/sectors.js';
import { STORM_STRENGTH } from './radiation.js';
import {
  countBuildings,
  daysUntilPhaseChange,
  getColonyShielding,
  getHousing,
  isLunarDaylight,
} from './state.js';

/**
 * "Astro" (astronaut helper) tips for young players. Takes the state and a computeDay() report and
 * returns short tips, most urgent first.
 */
export function getAdvice(state, report, limit = 3) {
  const tips = [];
  const add = (priority, text) => tips.push({ priority, text });
  const daysLeft = (r) => (report.deltas[r] < 0 ? state.resources[r] / -report.deltas[r] : Infinity);
  const has = (type) => countBuildings(state, type) > 0;

  if (state.flare) {
    const s = STORM_STRENGTH[state.flare.strength];
    const what = s ? `A ${s.label} solar storm ${s.icons}` : 'A solar storm';
    const extra = state.shelter ? 'The Storm Shelter is ON.' : 'Build Rock Shields, or turn on the 🛡️ Storm Shelter at the top (uses power).';
    add(100, `${what} hits in ${state.flare.daysLeft} day(s)! ${extra}`);
  }
  if (daysLeft('oxygen') < 6) add(90, '🫁 Air is running low! Build an Air Maker 🫧.');
  if (daysLeft('water') < 6) add(85, '💧 Water is running low! Build an Ice Drill 🧊 or a Water Cleaner ♻️.');
  if (daysLeft('food') < 8) add(80, '🥔 Food is running low! Build a Greenhouse 🪴.');
  if (report.powerRatio < 1) add(75, '⚡ Not enough power! Build Solar Panels ☀️ or Nuclear Power ⚛️.');

  const usesNightSolar = Object.entries(state.sectors).some(([id, s]) =>
    !getSector(Number(id)).traits.constantSun && s.buildings.some((b) => b.type === 'solar'));
  if (usesNightSolar && isLunarDaylight(state.day) && daysUntilPhaseChange(state.day) <= 4) {
    add(65, `🌙 Night comes in ${daysUntilPhaseChange(state.day)} day(s)! Solar Panels will stop. Build Batteries 🔋 to save power.`);
  }

  if (state.day < 4) {
    if (!has('electrolysis')) add(60, '👋 Build an Air Maker 🫧 first - your astronauts need air!');
    else if (!has('iceMine')) add(59, '👍 Great! Now build an Ice Drill 🧊 for water.');
    else if (!has('greenhouse')) add(58, '🌱 Now build a Greenhouse for food!');
    else if (!has('solar')) add(57, '☀️ Machines need power. Build Solar Panels!');
  }

  if (state.population >= getHousing(state)) add(40, '🛏️ All beds are full. Build a Moon Home so more astronauts can come.');
  if (!has('pad') && state.day > 10) add(30, '🚀 A Rocket Pad lets you call Earth for supplies and new astronauts!');
  const lowLife = ['oxygen', 'water', 'food'].some((r) => daysLeft(r) < 10);
  const rocketReady = has('pad') && !state.rocket && (state.rocketReadyDay ?? 0) <= state.day;
  if (rocketReady && lowLife) add(70, '📡 Running low? Tap 📡 Call Earth at the top. A rocket takes 3 days to arrive, so call early!');
  if (!has('lab') && state.day > 15) add(15, '🔬 A Science Lab makes discoveries that improve your machines - but it breathes air.');
  if (getColonyShielding(state) < 0.5 && state.day > 8) add(25, '🛡️ Solar storms can hurt astronauts. Build Rock Shields next to your homes.');
  if (state.day > 6) add(10, '🗺️ Hover over a 🔒 place on the Moon to see what you need to explore it.');

  tips.sort((a, b) => b.priority - a.priority);
  return tips.slice(0, limit).map((t) => t.text);
}
