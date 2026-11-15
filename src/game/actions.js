import { ROCKET_CARGOS, ROCKET_TRAVEL_DAYS } from '../config.js';
import { BUILDINGS } from '../data/buildings.js';
import { getSector } from '../data/sectors.js';
import { RESOURCE_BY_ID } from '../data/resources.js';
import { generateSectorMap, TERRAIN } from './sectorMap.js';
import {
  addLog,
  countBuildings,
  getCrewAtBase,
  getHousing,
  getUnlockCost,
  withArticle,
} from './state.js';

// All actions return { ok: boolean, reason?: string } and only mutate state when ok.
// `reason` is shown to young players, so keep it short and friendly.

export function canAfford(state, cost) {
  return Object.entries(cost).every(([r, amount]) => (state.resources[r] ?? 0) >= amount);
}

export function missingResources(state, cost) {
  return Object.entries(cost)
    .filter(([r, amount]) => (state.resources[r] ?? 0) < amount)
    .map(([r, amount]) => `${Math.ceil(amount - state.resources[r])} ${RESOURCE_BY_ID[r].icon} ${RESOURCE_BY_ID[r].name.toLowerCase()}`);
}

function spend(state, cost) {
  for (const [r, amount] of Object.entries(cost)) state.resources[r] -= amount;
}

export function checkBuild(state, sectorId, cellIndex, type) {
  const def = BUILDINGS[type];
  const sector = state.sectors[sectorId];
  if (!def) return { ok: false, reason: 'Unknown building.' };
  if (state.gameOver) return { ok: false, reason: 'The mission is over.' };
  if (!sector?.unlocked) return { ok: false, reason: 'Explore this place first!' };
  const cell = generateSectorMap(sectorId).cells[cellIndex];
  if (!cell) return { ok: false, reason: 'You can\'t build there.' };
  if (!TERRAIN[cell.terrain].buildable) return { ok: false, reason: 'Too steep! Pick another spot.' };
  if (sector.buildings.some((b) => b.cell === cellIndex)) return { ok: false, reason: 'Something is already here.' };
  if (def.maxCount && countBuildings(state, type) >= def.maxCount) return { ok: false, reason: `You can only build ${def.maxCount} ${def.name}.` };
  if (!canAfford(state, def.cost)) return { ok: false, reason: `You need ${missingResources(state, def.cost).join(' and ')} more.` };
  return { ok: true };
}

export function build(state, sectorId, cellIndex, type) {
  const check = checkBuild(state, sectorId, cellIndex, type);
  if (!check.ok) return check;
  const def = BUILDINGS[type];
  spend(state, def.cost);
  state.sectors[sectorId].buildings.push({ type, cell: cellIndex });
  addLog(state, `Built ${withArticle(def.name)} in ${getSector(sectorId).name}.`, 'info');
  return { ok: true };
}

export function demolish(state, sectorId, cellIndex) {
  const sector = state.sectors[sectorId];
  const idx = sector?.buildings.findIndex((b) => b.cell === cellIndex) ?? -1;
  if (idx < 0) return { ok: false, reason: 'Nothing to remove here.' };
  const def = BUILDINGS[sector.buildings[idx].type];
  if (def.housing && getHousing(state) - def.housing < state.population) {
    return { ok: false, reason: 'Your astronauts need these beds! Build another Moon Home first.' };
  }
  sector.buildings.splice(idx, 1);
  for (const [r, amount] of Object.entries(def.cost)) state.resources[r] += Math.floor(amount / 2);
  addLog(state, `Removed ${withArticle(def.name)} and got half the materials back.`, 'info');
  return { ok: true };
}

export function checkExpedition(state, sectorId) {
  const sector = state.sectors[sectorId];
  if (!sector) return { ok: false, reason: 'Unknown place.' };
  if (state.gameOver) return { ok: false, reason: 'The mission is over.' };
  if (sector.unlocked) return { ok: false, reason: 'Already explored.' };
  if (state.expeditions.some((e) => e.sectorId === sectorId)) return { ok: false, reason: 'Explorers are already on the way.' };
  const cost = getUnlockCost(state, sectorId);
  const reasons = [];
  if (!canAfford(state, cost.resources)) reasons.push(`${missingResources(state, cost.resources).join(' and ')} more`);
  // At least one astronaut must stay home to look after the base.
  const free = getCrewAtBase(state) - 1;
  if (free < cost.crew) reasons.push(`${cost.crew} explorers (you can send ${Math.max(0, free)})`);
  if (reasons.length) return { ok: false, reason: `You need ${reasons.join(' and ')}.` };
  return { ok: true };
}

export function startExpedition(state, sectorId) {
  const check = checkExpedition(state, sectorId);
  if (!check.ok) return check;
  const cost = getUnlockCost(state, sectorId);
  spend(state, cost.resources);
  state.expeditions.push({ sectorId, crew: cost.crew, daysLeft: cost.days });
  addLog(state, `🚙 ${cost.crew} explorers drove off to ${getSector(sectorId).name}. Back in ${cost.days} days.`, 'info', 'expedition');
  return { ok: true };
}

/** Can we call Earth for a rocket with this cargo right now? */
export function checkRocket(state, cargoId) {
  const cargo = ROCKET_CARGOS.find((x) => x.id === cargoId);
  if (!cargo) return { ok: false, reason: 'Unknown cargo.' };
  if (state.gameOver) return { ok: false, reason: 'The mission is over.' };
  if (countBuildings(state, 'pad') === 0) return { ok: false, reason: 'Build a Rocket Pad first, so a rocket can land.' };
  if (state.rocket) return { ok: false, reason: `A rocket is already on its way (${state.rocket.daysLeft} days).` };
  const wait = (state.rocketReadyDay ?? 0) - state.day;
  if (wait > 0) return { ok: false, reason: `Earth is getting the next rocket ready. Try again in ${wait} day${wait === 1 ? '' : 's'}.` };
  if (cargo.crew && getHousing(state) - state.population < 1) return { ok: false, reason: 'No free beds for new astronauts. Build a Moon Home first.' };
  return { ok: true };
}

/** Sends the radio call: Earth launches a rocket that lands after ROCKET_TRAVEL_DAYS. */
export function requestRocket(state, cargoId) {
  const check = checkRocket(state, cargoId);
  if (!check.ok) return check;
  const cargo = ROCKET_CARGOS.find((x) => x.id === cargoId);
  state.rocket = { cargo: cargoId, daysLeft: ROCKET_TRAVEL_DAYS };
  addLog(state, `📡 Earth heard your call! A rocket with ${cargo.icon} ${cargo.name.toLowerCase()} lands in ${ROCKET_TRAVEL_DAYS} days.`, 'info', 'call-earth');
  return { ok: true };
}

/** Turns the Storm Shelter on or off. It can only be used while a solar storm is coming. */
export function setShelter(state, on) {
  if (on && !state.flare) return { ok: false, reason: 'The Storm Shelter is only needed when a solar storm is coming.' };
  state.shelter = !!on;
  addLog(state, on ? '🛡️ Storm Shelter ON: everyone is safer, but it uses power every day.' : '🛡️ Storm Shelter OFF.', 'info', on ? 'shelter' : null);
  return { ok: true };
}
