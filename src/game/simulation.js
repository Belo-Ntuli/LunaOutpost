import {
  CREW_NEEDS,
  FLARE_CHANCE_PER_DAY,
  FLARE_EXPOSURE_LOSS,
  FLARE_GRACE_DAYS,
  FLARE_WARNING_DAYS,
  RESOURCE_CAP,
  ROCKET_CARGOS,
  ROCKET_COOLDOWN_DAYS,
  SHELTER_ENERGY,
  SHELTER_SAFETY,
} from '../config.js';
import { DISCOVERIES, DISCOVERY_BOOST, RESEARCH_PER_DISCOVERY, STORM_RESEARCH_FACTOR } from '../data/discoveries.js';
import { MILESTONES } from '../data/milestones.js';
import { getSector } from '../data/sectors.js';
import { RESOURCE_BY_ID, RESOURCE_IDS } from '../data/resources.js';
import { CALM_FLARE_FACTOR, REAL_STORM_MIN_DAY, STORM_STRENGTH, isStormStart, radiationOn, stormCauseOn } from './radiation.js';
import { getCellTerrain } from './sectorMap.js';
import {
  addLog,
  allBuildings,
  countBuildings,
  getColonyShielding,
  getEnergyCap,
  getExpeditionCrew,
  getHousing,
  isLunarDaylight,
  sunlightFactor,
} from './state.js';

// How quickly astronauts are lost when a life-support resource runs out ("rule of threes":
// minutes without air, days without water, weeks without food - compressed for play).
export const SHORTAGE_RULES = {
  oxygen: { grace: 1, interval: 1 },
  water: { grace: 3, interval: 2 },
  food: { grace: 5, interval: 3 },
};

const RECYCLE_LIMIT = 0.6;

/** Output multiplier from place traits, ground bonus and Science Lab discoveries. */
export function outputMultiplier(sectorId, building, def, day, discoveries = []) {
  let m = 1;
  if (DISCOVERIES.some((d) => d.boost === def.id && discoveries.includes(d.id))) m *= DISCOVERY_BOOST;
  if (def.trait === 'sunlight') m *= sunlightFactor(sectorId, day);
  else if (def.trait) m *= getSector(sectorId).traits[def.trait] ?? 1;
  if (def.bonusTerrain && getCellTerrain(sectorId, building.cell) === def.bonusTerrain) m *= def.terrainBonus;
  return m;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Pure: works out what one day of colony operation does, without mutating state.
 * Used both to advance the game and to show "+x a day" rates in the HUD.
 */
export function computeDay(state) {
  const res = { ...state.resources };
  res.research = res.research ?? 0;
  const energyCap = getEnergyCap(state);
  const pop = state.population;
  const discoveries = state.discoveries ?? [];

  const active = [...allBuildings(state)].map((entry) => ({
    ...entry,
    mult: outputMultiplier(entry.sectorId, entry.building, entry.def, state.day, discoveries),
  }));

  // 1. Power. On a shortfall, life-support buildings are powered first and
  //    everything else gets what is left (automatic load shedding).
  let energyProduced = 0;
  const demand = { life: 0, industry: 0 };
  for (const a of active) {
    energyProduced += (a.def.produces.energy ?? 0) * a.mult;
    demand[a.def.lifeSupport ? 'life' : 'industry'] += a.def.energyUse;
  }
  // The Storm Shelter keeps people alive, so it is powered like life support.
  const shelterOn = !!(state.shelter && state.flare);
  if (shelterOn) demand.life += SHELTER_ENERGY;
  const energyDemand = demand.life + demand.industry;
  const energyAvailable = res.energy + energyProduced;
  const lifeRatio = demand.life > 0 ? Math.min(1, energyAvailable / demand.life) : 1;
  const leftover = energyAvailable - demand.life * lifeRatio;
  const industryRatio = demand.industry > 0 ? Math.min(1, leftover / demand.industry) : 1;
  const powerRatio = energyDemand > 0 ? Math.min(1, energyAvailable / energyDemand) : 1;
  res.energy = Math.min(energyCap, Math.max(0, leftover - demand.industry * industryRatio));

  const efficiency = (a) => {
    if (a.def.energyUse <= 0) return 1;
    return a.def.lifeSupport ? lifeRatio : industryRatio;
  };

  // 2. Extractors and recyclers (no inputs).
  let recyclable = pop * CREW_NEEDS.water * RECYCLE_LIMIT;
  for (const a of active) {
    if (Object.keys(a.def.consumes).length) continue;
    const eff = efficiency(a);
    for (const [r, amount] of Object.entries(a.def.produces)) {
      if (r === 'energy') continue;
      res[r] += amount * a.mult * eff;
    }
    if (a.def.recycles?.water) {
      const recovered = Math.min(a.def.recycles.water * eff, recyclable);
      recyclable -= recovered;
      res.water += recovered;
    }
  }

  // 3. Converters share their inputs, but the crew's own needs are reserved first.
  const converters = active.filter((a) => Object.keys(a.def.consumes).length);
  const inputDemand = {};
  for (const a of converters) {
    for (const [r, amount] of Object.entries(a.def.consumes)) {
      inputDemand[r] = (inputDemand[r] ?? 0) + amount * efficiency(a);
    }
  }
  const inputRatio = {};
  for (const [r, need] of Object.entries(inputDemand)) {
    const reserved = (CREW_NEEDS[r] ?? 0) * pop;
    const available = Math.max(0, res[r] - reserved);
    inputRatio[r] = need > 0 ? Math.min(1, available / need) : 1;
  }
  for (const a of converters) {
    const ratio = efficiency(a) * Math.min(...Object.keys(a.def.consumes).map((r) => inputRatio[r]));
    for (const [r, amount] of Object.entries(a.def.consumes)) res[r] -= amount * ratio;
    for (const [r, amount] of Object.entries(a.def.produces)) res[r] += amount * a.mult * ratio;
  }

  // 4. Crew life support.
  const shortages = {};
  for (const [r, perPerson] of Object.entries(CREW_NEEDS)) {
    const need = perPerson * pop;
    shortages[r] = res[r] < need;
    res[r] = Math.max(0, res[r] - need);
  }

  for (const r of RESOURCE_IDS) {
    if (r !== 'energy') res[r] = Math.min(RESOURCE_CAP, Math.max(0, res[r]));
    res[r] = round2(res[r]);
  }
  res.research = round2(res.research);

  const deltas = {};
  for (const r of RESOURCE_IDS) deltas[r] = round2(res[r] - state.resources[r]);

  return {
    resources: res, deltas, powerRatio, lifeSupportPower: lifeRatio, industryPower: industryRatio,
    energyProduced, energyDemand, energyCap, shortages,
    research: round2(res.research - (state.resources.research ?? 0)),
    shelterPower: shelterOn ? lifeRatio : 0,
  };
}

function loseCrew(state, count, reason) {
  const lost = Math.min(count, state.population);
  if (lost <= 0) return;
  state.population -= lost;
  state.stats.crewLost += lost;
  addLog(state, `Oh no! ${lost} astronaut${lost > 1 ? 's' : ''} had to go home: ${reason}`, 'danger');
  // Expedition teams can't be bigger than the remaining crew.
  while (getExpeditionCrew(state) > state.population && state.expeditions.length) {
    const exp = state.expeditions[state.expeditions.length - 1];
    exp.crew -= 1;
    if (exp.crew <= 0) {
      state.expeditions.pop();
      addLog(state, `The trip to ${getSector(exp.sectorId).name} was cancelled.`, 'danger');
    }
  }
}

/** Advances the game by one day (mutates state). Returns the log entries created this day. */
export function advanceDay(state, rng = Math.random) {
  if (state.gameOver) return [];
  const logStart = state.log.length;
  const wasDaylight = isLunarDaylight(state.day);
  const result = computeDay(state);
  state.resources = result.resources;
  state.day += 1;

  if (wasDaylight !== isLunarDaylight(state.day)) {
    if (isLunarDaylight(state.day)) addLog(state, '☀️ Sunrise! Solar Panels work again.', 'success', 'sunrise');
    else addLog(state, '🌙 Night is here for 15 days. Solar Panels stop (except near the poles).', 'warning', 'night');
  }

  if (result.lifeSupportPower < 1) addLog(state, '⚡ Not enough power! Even air and water machines are slowing down.', 'danger', 'power');
  else if (result.industryPower < 1) addLog(state, '⚡ Low power! Some machines stopped so air and water keep working.', 'warning', 'power');

  for (const [r, rule] of Object.entries(SHORTAGE_RULES)) {
    if (!result.shortages[r]) {
      state.shortageDays[r] = 0;
      continue;
    }
    const days = ++state.shortageDays[r];
    const { icon, name } = RESOURCE_BY_ID[r];
    if (days === 1) addLog(state, `${icon} We ran out of ${name.toLowerCase()}!`, 'danger', `out-${r}`);
    if (days >= rule.grace && (days - rule.grace) % rule.interval === 0) loseCrew(state, 1, `no ${name.toLowerCase()}.`);
  }

  for (const exp of [...state.expeditions]) {
    exp.daysLeft -= 1;
    if (exp.daysLeft <= 0) {
      state.expeditions.splice(state.expeditions.indexOf(exp), 1);
      state.sectors[exp.sectorId].unlocked = true;
      addLog(state, `🚙 The explorers are back! ${getSector(exp.sectorId).name} is open for building.`, 'success', 'explored');
    }
  }

  // A rocket the player called from Earth (Rocket Pad) lands after its trip.
  if (state.rocket) {
    state.rocket.daysLeft -= 1;
    if (state.rocket.daysLeft <= 0) {
      const cargo = ROCKET_CARGOS.find((x) => x.id === state.rocket.cargo);
      state.rocket = null;
      state.rocketReadyDay = state.day + ROCKET_COOLDOWN_DAYS;
      if (cargo?.crew) {
        const arrivals = Math.min(cargo.crew, Math.max(0, getHousing(state) - state.population));
        state.population += arrivals;
        state.stats.crewArrived += arrivals;
        addLog(state, arrivals > 0
          ? `🚀 The rocket landed with ${arrivals} new astronaut${arrivals > 1 ? 's' : ''}!`
          : '🚀 The rocket landed, but there were no free beds, so the astronauts flew home. Build a Moon Home!', 'success', 'rocket');
      } else if (cargo) {
        for (const [res, amount] of Object.entries(cargo.give)) state.resources[res] = Math.min(RESOURCE_CAP, state.resources[res] + amount);
        addLog(state, `🚀 The rocket landed with ${Object.values(cargo.give)[0]} ${cargo.icon} ${cargo.name.toLowerCase()}!`, 'success', 'rocket');
      }
    }
  }

  // Science Lab research becomes discoveries (real NASA findings + a bonus).
  const discoveries = (state.discoveries ??= []);
  let next = DISCOVERIES.find((d) => !discoveries.includes(d.id));
  while (next && (state.resources.research ?? 0) >= RESEARCH_PER_DISCOVERY) {
    state.resources.research -= RESEARCH_PER_DISCOVERY;
    discoveries.push(next.id);
    addLog(state, `🔬 Discovery: ${next.title}! ${next.bonus}`, 'success', `discovery:${next.id}`);
    next = DISCOVERIES.find((d) => !discoveries.includes(d.id));
  }
  if (!next && state.resources.research) state.resources.research = Math.min(state.resources.research, RESEARCH_PER_DISCOVERY);

  // Solar storms, with advance warning. Real NASA radiation data (if loaded) can start a storm,
  // and makes random storms less likely on calm days.
  const realStormStarts = state.day >= REAL_STORM_MIN_DAY && isStormStart(state.radiation, state.day);
  const calm = radiationOn(state.radiation, state.day)?.level === 'calm';
  if (state.flare) {
    state.flare.daysLeft -= 1;
    if (state.flare.daysLeft <= 0) {
      // Safety = Rock Shields / caves / natural shielding, plus the Storm Shelter if it had power.
      const shield = Math.min(1, getColonyShielding(state) + SHELTER_SAFETY * result.shelterPower);
      let loss = STORM_STRENGTH[state.flare.strength]?.loss ?? FLARE_EXPOSURE_LOSS;
      if (discoveries.includes('health')) loss *= STORM_RESEARCH_FACTOR;
      const losses = Math.round(state.population * (1 - shield) * loss);
      state.flare = null;
      state.shelter = false;
      if (losses > 0) loseCrew(state, losses, `space radiation (only ${Math.round(shield * 100)}% safe).`);
      else addLog(state, `☢️ The solar storm hit, but your shields kept everyone safe!`, 'success');
    }
  } else if (realStormStarts) {
    // DONKI tells us which real solar flare caused this storm; its class sets the storm's strength.
    const cause = stormCauseOn(state.radiation, state.day);
    const strength = cause?.strength ?? 'medium';
    const { label, icons } = STORM_STRENGTH[strength];
    state.flare = { daysLeft: FLARE_WARNING_DAYS, real: true, strength, flare: cause?.flare ?? null, date: cause?.date ?? null };
    const why = cause?.flare ? `the Sun made a real ${cause.flare} solar flare` : 'a real solar storm is coming';
    addLog(state, `📡 NASA data: ${why}! A ${label} storm ${icons} arrives in ${FLARE_WARNING_DAYS} days. Build Rock Shields!`, 'warning', 'real-storm');
  } else if (state.day > FLARE_GRACE_DAYS && rng() < FLARE_CHANCE_PER_DAY * (calm ? CALM_FLARE_FACTOR : 1)) {
    state.flare = { daysLeft: FLARE_WARNING_DAYS };
    addLog(state, `☢️ Solar storm coming in ${FLARE_WARNING_DAYS} days! Build Rock Shields to keep astronauts safe.`, 'warning', 'flare');
  }

  state.stats.peakPopulation = Math.max(state.stats.peakPopulation, state.population);

  for (const m of MILESTONES) {
    if (!state.milestones.includes(m.id) && m.test(state)) {
      state.milestones.push(m.id);
      addLog(state, `⭐ Goal complete: ${m.title}!`, 'success', 'goal');
      if (m.id === 'allSectors') state.victory = true;
    }
  }

  if (state.population <= 0) {
    state.gameOver = true;
    addLog(state, `The mission ended on day ${state.day}.`, 'danger');
  }

  return state.log.slice(logStart);
}
