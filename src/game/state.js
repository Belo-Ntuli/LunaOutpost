import {
  BASE_ENERGY_CAP,
  LUNAR_CYCLE_DAYS,
  LUNAR_DAYLIGHT_DAYS,
  SAVE_VERSION,
  STARTING_POPULATION,
  STARTING_RESOURCES,
  UNLOCK_COST_GROWTH,
} from '../config.js';
import { BUILDINGS } from '../data/buildings.js';
import { SECTORS, getSector } from '../data/sectors.js';
import { HOME_CELL, getCellTerrain } from './sectorMap.js';

/** `radiation` (optional) is real Moon radiation data from game/radiation.js `makeRadiation`. */
export function createNewGame(homeSectorId, radiation = null) {
  if (!getSector(homeSectorId)) throw new Error(`Unknown sector ${homeSectorId}`);
  const sectors = {};
  for (const s of SECTORS) {
    sectors[s.id] = { unlocked: s.id === homeSectorId, buildings: [] };
  }
  sectors[homeSectorId].buildings.push({ type: 'habitat', cell: HOME_CELL });

  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    day: 0,
    homeSectorId,
    population: STARTING_POPULATION,
    resources: { ...STARTING_RESOURCES },
    sectors,
    expeditions: [],
    flare: null,
    radiation,
    // Rocket called from Earth: null or { cargo, daysLeft }. Earth can send the next one from rocketReadyDay.
    rocket: null,
    rocketReadyDay: 0,
    // Storm Shelter switched on (only works during a storm warning).
    shelter: false,
    // Science Lab discoveries (ids from data/discoveries.js).
    discoveries: [],
    shortageDays: { water: 0, food: 0, oxygen: 0 },
    milestones: [],
    // Ids of "Did you know?" cards the player has already seen.
    learned: [],
    log: [{ day: 0, type: 'info', text: `Touchdown! ${STARTING_POPULATION} astronauts landed in ${getSector(homeSectorId).name}.` }],
    stats: { peakPopulation: STARTING_POPULATION, crewLost: 0, crewArrived: 0 },
    gameOver: false,
    victory: false,
  };
}

export function* allBuildings(state) {
  for (const [sectorId, sector] of Object.entries(state.sectors)) {
    for (const b of sector.buildings) yield { sectorId: Number(sectorId), building: b, def: BUILDINGS[b.type] };
  }
}

export function countUnlocked(state) {
  return Object.values(state.sectors).filter((s) => s.unlocked).length;
}

export function countBuildings(state, type) {
  let n = 0;
  for (const { building } of allBuildings(state)) if (building.type === type) n++;
  return n;
}

// Lunar day/night for non-polar sectors. Day 0 starts at local sunrise.
export function isLunarDaylight(day) {
  return day % LUNAR_CYCLE_DAYS < LUNAR_DAYLIGHT_DAYS;
}

export function daysUntilPhaseChange(day) {
  const t = day % LUNAR_CYCLE_DAYS;
  return t < LUNAR_DAYLIGHT_DAYS ? LUNAR_DAYLIGHT_DAYS - t : LUNAR_CYCLE_DAYS - t;
}

export function sunlightFactor(sectorId, day) {
  const { traits } = getSector(sectorId);
  if (traits.constantSun) return traits.sunlight;
  return isLunarDaylight(day) ? traits.sunlight : 0;
}

export function getHousing(state) {
  let beds = 0;
  for (const { def } of allBuildings(state)) beds += def.housing ?? 0;
  return beds;
}

export function getEnergyCap(state) {
  let cap = BASE_ENERGY_CAP;
  for (const { def } of allBuildings(state)) cap += def.energyStorage ?? 0;
  return cap;
}

export function getExpeditionCrew(state) {
  return state.expeditions.reduce((sum, e) => sum + e.crew, 0);
}

/** Astronauts at the base (not away exploring). */
export function getCrewAtBase(state) {
  return Math.max(0, state.population - getExpeditionCrew(state));
}

export function getSectorShielding(state, sectorId) {
  let shield = getSector(sectorId).traits.shielding;
  for (const b of state.sectors[sectorId].buildings) shield += BUILDINGS[b.type].shielding ?? 0;
  return Math.min(1, shield);
}

// Bed-weighted radiation protection across the colony (0..1).
// A Moon Home built in a lava cave is fully protected.
export function getColonyShielding(state) {
  let beds = 0;
  let protectedBeds = 0;
  for (const [id, sector] of Object.entries(state.sectors)) {
    const sectorShield = getSectorShielding(state, Number(id));
    for (const b of sector.buildings) {
      const housing = BUILDINGS[b.type].housing ?? 0;
      if (!housing) continue;
      beds += housing;
      const inCave = getCellTerrain(Number(id), b.cell) === 'tube';
      protectedBeds += housing * (inCave ? 1 : sectorShield);
    }
  }
  return beds === 0 ? 0 : protectedBeds / beds;
}

export function getUnlockCost(state, sectorId) {
  const { unlock } = getSector(sectorId);
  const scale = 1 + UNLOCK_COST_GROWTH * Math.max(0, countUnlocked(state) - 1);
  return {
    resources: {
      metal: Math.round(unlock.metal * scale),
      regolith: Math.round(unlock.regolith * scale),
      energy: Math.round(unlock.energy * scale),
    },
    crew: unlock.crew,
    days: unlock.days,
  };
}

/** `event` optionally tags an entry (e.g. 'night', 'flare') so the UI can show a learning card. */
export function addLog(state, text, type = 'info', event = null) {
  state.log.push(event ? { day: state.day, type, text, event } : { day: state.day, type, text });
  if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
}

export function withArticle(name) {
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
}
