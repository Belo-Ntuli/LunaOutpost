import { describe, expect, it } from 'vitest';
import { ROCKET_TRAVEL_DAYS, SHELTER_ENERGY } from '../src/config.js';
import { BUILDINGS } from '../src/data/buildings.js';
import { RESEARCH_PER_DISCOVERY } from '../src/data/discoveries.js';
import { build, checkExpedition, checkRocket, demolish, requestRocket, setShelter, startExpedition } from '../src/game/actions.js';
import { getAdvice } from '../src/game/advisor.js';
import { advanceDay, computeDay, outputMultiplier } from '../src/game/simulation.js';
import { HOME_CELL, generateSectorMap } from '../src/game/sectorMap.js';
import { createNewGame, getColonyShielding, getUnlockCost } from '../src/game/state.js';

const never = () => 0.99; // rng that never triggers random events
const SOUTH_POLE = 1;
const BASALT = 5;

function freeCell(sectorId, state, terrain = null) {
  const used = new Set(state.sectors[sectorId].buildings.map((b) => b.cell));
  return generateSectorMap(sectorId).cells.find((c) => !used.has(c.index) && c.terrain !== 'crater' && (!terrain || c.terrain === terrain)).index;
}

function rich(state) {
  for (const r of Object.keys(state.resources)) state.resources[r] = 1000;
  return state;
}

describe('new game', () => {
  it('only marks real machine pictures in Astro tips', () => {
    const s = createNewGame(BASALT);
    s.day = 20;
    for (const r of Object.keys(s.resources)) s.resources[r] = 1;
    s.flare = { daysLeft: 2, strength: 'strong' };
    const tokens = getAdvice(s, computeDay(s), 99).join(' ').match(/\{\w+\}/g) ?? [];
    expect(tokens.length).toBeGreaterThan(3);
    for (const t of tokens) expect([...Object.keys(BUILDINGS), 'rover']).toContain(t.slice(1, -1));
  });
  it('starts with 7 crew, one habitat in the chosen sector and every other sector locked', () => {
    const s = createNewGame(BASALT);
    expect(s.population).toBe(7);
    expect(s.sectors[BASALT]).toMatchObject({ unlocked: true, buildings: [{ type: 'habitat', cell: HOME_CELL }] });
    expect(Object.entries(s.sectors).filter(([, v]) => v.unlocked).map(([id]) => Number(id))).toEqual([BASALT]);
  });

  it('scales unlock costs up as more sectors are unlocked', () => {
    const s = createNewGame(BASALT);
    const before = getUnlockCost(s, 6).resources.metal;
    s.sectors[7].unlocked = true;
    expect(getUnlockCost(s, 6).resources.metal).toBeGreaterThan(before);
  });
});

describe('daily simulation', () => {
  it('feeds the crew and powers the habitat each day', () => {
    const s = createNewGame(BASALT);
    const start = { ...s.resources };
    advanceDay(s, never);
    expect(s.day).toBe(1);
    expect(s.resources.water).toBe(start.water - 7);
    expect(s.resources.oxygen).toBe(start.oxygen - 7);
    expect(s.resources.energy).toBe(start.energy - BUILDINGS.habitat.energyUse);
  });

  it('turns off solar power during the lunar night outside the poles but not at the pole', () => {
    const equator = rich(createNewGame(BASALT));
    build(equator, BASALT, freeCell(BASALT, equator, 'plain'), 'solar');
    const pole = rich(createNewGame(SOUTH_POLE));
    build(pole, SOUTH_POLE, freeCell(SOUTH_POLE, pole, 'plain'), 'solar');

    equator.day = pole.day = 5; // lunar day
    expect(computeDay(equator).energyProduced).toBeGreaterThan(0);
    equator.day = pole.day = 20; // lunar night
    expect(computeDay(equator).energyProduced).toBe(0);
    expect(computeDay(pole).energyProduced).toBeGreaterThan(0);
  });

  it('keeps life support powered and sheds industry first when power runs short', () => {
    const s = rich(createNewGame(BASALT));
    build(s, BASALT, freeCell(BASALT, s), 'excavator');
    s.resources.energy = 2; // habitat (2, life support) + excavator (2, industry) need 4
    const report = computeDay(s);
    expect(report.powerRatio).toBeCloseTo(0.5);
    expect(report.lifeSupportPower).toBe(1);
    expect(report.industryPower).toBe(0);
    expect(report.deltas.regolith).toBe(0);
  });

  it('reserves water for the crew before converters use it', () => {
    const s = rich(createNewGame(BASALT));
    build(s, BASALT, freeCell(BASALT, s), 'electrolysis');
    s.resources.water = 7; // exactly the crew's daily need
    const report = computeDay(s);
    expect(report.shortages.water).toBe(false);
    expect(report.resources.water).toBe(0);
  });

  it('loses crew when oxygen runs out and ends the game when nobody is left', () => {
    const s = createNewGame(BASALT);
    s.resources.oxygen = 0;
    advanceDay(s, never);
    expect(s.population).toBe(6);
    for (let i = 0; i < 10 && !s.gameOver; i++) advanceDay(s, never);
    expect(s.population).toBe(0);
    expect(s.gameOver).toBe(true);
  });

  it('unlocks a sector when its expedition finishes', () => {
    const s = rich(createNewGame(BASALT));
    expect(startExpedition(s, 6).ok).toBe(true);
    const days = getUnlockCost(s, 6).days;
    for (let i = 0; i < days - 1; i++) advanceDay(s, never);
    expect(s.sectors[6].unlocked).toBe(false);
    advanceDay(s, never);
    expect(s.sectors[6].unlocked).toBe(true);
    expect(s.expeditions).toHaveLength(0);
  });

  it('lands a rocket called from Earth after 3 days, then Earth needs time before the next one', () => {
    const s = rich(createNewGame(BASALT));
    expect(checkRocket(s, 'food').ok).toBe(false); // no Rocket Pad yet
    build(s, BASALT, freeCell(BASALT, s), 'pad');
    const food = s.resources.food;
    expect(requestRocket(s, 'food').ok).toBe(true);
    expect(checkRocket(s, 'water').ok).toBe(false); // one rocket at a time
    for (let i = 0; i < ROCKET_TRAVEL_DAYS; i++) advanceDay(s, never);
    expect(s.rocket).toBeNull();
    expect(s.resources.food).toBeGreaterThan(food); // 50 delivered (minus what the crew ate)
    expect(checkRocket(s, 'food').reason).toMatch(/getting the next rocket ready/);
  });

  it('only lets new astronauts come by rocket when there are free beds', () => {
    const s = rich(createNewGame(BASALT));
    build(s, BASALT, freeCell(BASALT, s), 'pad');
    s.population = 8; // the Moon Home has 8 beds
    expect(checkRocket(s, 'crew').ok).toBe(false);
    s.population = 7;
    expect(requestRocket(s, 'crew').ok).toBe(true);
    for (let i = 0; i < ROCKET_TRAVEL_DAYS; i++) advanceDay(s, never);
    expect(s.population).toBe(8); // 2 sent, only 1 bed free
  });

  it('Storm Shelter costs power every day and makes a storm safer', () => {
    const hit = (shelter) => {
      const s = rich(createNewGame(BASALT));
      s.resources.energy = 100; // below the battery limit, so the shelter's extra use shows
      s.population = 20;
      s.flare = { daysLeft: 1, strength: 'strong' };
      if (shelter) setShelter(s, true);
      const report = computeDay(s);
      advanceDay(s, never);
      return { lost: 20 - s.population, energyUsed: -report.deltas.energy, shelterAfter: s.shelter };
    };
    const without = hit(false);
    const withShelter = hit(true);
    expect(withShelter.energyUsed - without.energyUsed).toBe(SHELTER_ENERGY);
    expect(withShelter.lost).toBeLessThan(without.lost);
    expect(withShelter.shelterAfter).toBe(false); // switches off after the storm
    expect(setShelter(createNewGame(BASALT), true).ok).toBe(false); // only during a storm warning
  });

  it('Science Lab trades air for research, and discoveries boost machines', () => {
    const s = rich(createNewGame(BASALT));
    build(s, BASALT, freeCell(BASALT, s), 'lab');
    const report = computeDay(s);
    expect(report.research).toBe(1);
    expect(report.deltas.oxygen).toBe(-7 - BUILDINGS.lab.consumes.oxygen); // crew breathe 7, lab uses 3
    s.resources.research = RESEARCH_PER_DISCOVERY;
    const entries = advanceDay(s, never);
    expect(s.discoveries).toEqual(['plants']);
    expect(entries.some((e) => e.event === 'discovery:plants')).toBe(true);
    const greenhouse = { cell: 0 };
    expect(outputMultiplier(BASALT, greenhouse, BUILDINGS.greenhouse, 0, s.discoveries)).toBeCloseTo(outputMultiplier(BASALT, greenhouse, BUILDINGS.greenhouse, 0) * 1.25);
  });

  it('protects shielded crew from solar flares', () => {
    const exposed = createNewGame(BASALT);
    exposed.flare = { daysLeft: 1 };
    advanceDay(exposed, never);
    expect(exposed.population).toBeLessThan(7);

    const shielded = rich(createNewGame(BASALT));
    for (let i = 0; i < 4; i++) build(shielded, BASALT, freeCell(BASALT, shielded), 'shield');
    expect(getColonyShielding(shielded)).toBe(1);
    shielded.flare = { daysLeft: 1 };
    advanceDay(shielded, never);
    expect(shielded.population).toBe(7);
  });
});

describe('actions', () => {
  it('rejects building on craters, occupied cells, locked sectors or without resources', () => {
    const s = rich(createNewGame(BASALT));
    const crater = generateSectorMap(BASALT).cells.find((c) => c.terrain === 'crater');
    expect(build(s, BASALT, crater.index, 'solar').ok).toBe(false);
    expect(build(s, BASALT, HOME_CELL, 'solar').ok).toBe(false);
    expect(build(s, 6, 0, 'solar').ok).toBe(false);
    s.resources.metal = 0;
    expect(build(s, BASALT, freeCell(BASALT, s), 'solar').ok).toBe(false);
  });

  it('spends resources when building', () => {
    const s = createNewGame(BASALT);
    const metal = s.resources.metal;
    expect(build(s, BASALT, freeCell(BASALT, s), 'solar').ok).toBe(true);
    expect(s.resources.metal).toBe(metal - BUILDINGS.solar.cost.metal);
  });

  it('will not demolish the only habitat while crew live in it', () => {
    const s = createNewGame(BASALT);
    expect(demolish(s, BASALT, HOME_CELL).ok).toBe(false);
  });

  it('keeps one astronaut home and needs enough free crew to launch an expedition', () => {
    const s = rich(createNewGame(BASALT));
    // 7 crew: send 3 + 3 to two 3-crew sectors, leaving 1 at home; a third expedition can't go.
    expect(startExpedition(s, 8).ok).toBe(true);
    expect(startExpedition(s, 9).ok).toBe(true);
    expect(checkExpedition(s, 6).ok).toBe(false);
    expect(checkExpedition(s, 6).reason).toMatch(/explorers/);
  });
});
