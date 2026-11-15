// The 15 lunar sectors. lat/lon (degrees) place each sector's centre on the globe.
// `size` > 1 grows a sector's share of hex tiles (used to keep polar caps playable).
//
// traits:
//   sunlight     - solar panel multiplier while the sun is up (0 = permanent shadow)
//   constantSun  - true near the poles: no 15-day lunar night (sun skims the horizon)
//   ice          - water-ice extraction multiplier
//   regolith     - regolith excavation multiplier
//   metal        - metal refining multiplier
//   shielding    - natural radiation protection (0..1) from terrain (lava tubes, massifs)
//   reactor      - fission reactor output multiplier
// terrain: relative weights for special hex cells in the 2D sector map.
// unlock: expedition cost (before scaling by number of sectors already unlocked).
// summary/science: short, kid-friendly description and "Did you know?" fact.
// summary/science: short, kid-friendly description and "Did you know?" fact.

export const SECTORS = [
  {
    id: 1,
    name: 'South Pole',
    lat: -90, lon: 0, size: 1.35,
    color: '#9fb4c7',
    summary: "Sunny hilltops next to icy craters.",
    science: "NASA's Artemis astronauts plan to land near the Moon's South Pole!",
    traits: { sunlight: 0.9, constantSun: true, ice: 1.6, regolith: 1.0, metal: 0.8, shielding: 0, reactor: 1 },
    terrain: { ice: 4, ore: 1, peak: 4, tube: 0, crater: 3 },
    unlock: { metal: 90, regolith: 60, energy: 30, crew: 3, days: 4 },
  },
  {
    id: 2,
    name: 'Southern Polar Field',
    lat: -48, lon: 20, size: 1.2,
    color: '#a9b8c2',
    summary: "Bumpy plains near the south pole, with long shadows.",
    science: "Some craters here are so cold that water stays frozen forever.",
    traits: { sunlight: 0.75, constantSun: true, ice: 1.2, regolith: 1.1, metal: 0.9, shielding: 0, reactor: 1 },
    terrain: { ice: 3, ore: 2, peak: 2, tube: 0, crater: 3 },
    unlock: { metal: 70, regolith: 50, energy: 25, crew: 2, days: 3 },
  },
  {
    id: 3,
    name: 'North Pole',
    lat: 90, lon: 0, size: 1.35,
    color: '#b7c3cf',
    summary: "The top of the Moon, with sunny crater edges.",
    science: "Peary Crater's edge gets sunshine almost all year long.",
    traits: { sunlight: 0.85, constantSun: true, ice: 1.3, regolith: 1.0, metal: 0.8, shielding: 0, reactor: 1 },
    terrain: { ice: 3, ore: 1, peak: 4, tube: 0, crater: 3 },
    unlock: { metal: 90, regolith: 60, energy: 30, crew: 3, days: 4 },
  },
  {
    id: 4,
    name: 'Northern Ice Fields',
    lat: 48, lon: 80, size: 1.2,
    color: '#c4d4e0',
    summary: "Frosty craters full of hidden ice.",
    science: "Space probes found ice in Moon craters that never see the Sun.",
    traits: { sunlight: 0.6, constantSun: true, ice: 1.8, regolith: 1.0, metal: 0.8, shielding: 0, reactor: 1 },
    terrain: { ice: 6, ore: 1, peak: 1, tube: 0, crater: 3 },
    unlock: { metal: 80, regolith: 50, energy: 30, crew: 2, days: 4 },
  },
  {
    id: 5,
    name: 'Basalt Plains',
    lat: 8, lon: 0, size: 1,
    color: '#7d7f86',
    summary: "Flat, dark plains made from old lava.",
    science: "The dark patches you can see on the Moon are giant plains of cooled lava!",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.5, regolith: 1.3, metal: 1.4, shielding: 0, reactor: 1 },
    terrain: { ice: 0, ore: 4, peak: 1, tube: 1, crater: 2 },
    unlock: { metal: 60, regolith: 40, energy: 20, crew: 2, days: 3 },
  },
  {
    id: 6,
    name: 'Wrinkle Ridges',
    lat: -12, lon: 51, size: 1,
    color: '#86878d',
    summary: "Long bumpy ridges, like wrinkles on the Moon.",
    science: "These wrinkles formed when hot lava cooled down and shrank.",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.5, regolith: 1.0, metal: 1.2, shielding: 0.1, reactor: 1 },
    terrain: { ice: 0, ore: 3, peak: 2, tube: 1, crater: 2 },
    unlock: { metal: 60, regolith: 40, energy: 20, crew: 2, days: 3 },
  },
  {
    id: 7,
    name: 'Volcanic Domes',
    lat: 12, lon: 103, size: 1,
    color: '#8e8478',
    summary: "Gentle old volcanoes covered in tiny glass beads.",
    science: "Long ago, the Moon had volcanoes that sprayed lava like fountains!",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.7, regolith: 1.1, metal: 1.5, shielding: 0, reactor: 1 },
    terrain: { ice: 1, ore: 4, peak: 2, tube: 1, crater: 1 },
    unlock: { metal: 70, regolith: 50, energy: 25, crew: 2, days: 3 },
  },
  {
    id: 8,
    name: 'Sinuous Rilles',
    lat: -10, lon: 154, size: 1,
    color: '#7b7a73',
    summary: "Snaking valleys with hidden lava caves.",
    science: "Lava caves could be safe homes that protect astronauts from space radiation.",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.55, regolith: 1.0, metal: 1.1, shielding: 0.45, reactor: 1 },
    terrain: { ice: 0, ore: 2, peak: 1, tube: 5, crater: 2 },
    unlock: { metal: 80, regolith: 50, energy: 30, crew: 3, days: 4 },
  },
  {
    id: 9,
    name: 'Procellarum Terrane',
    lat: 10, lon: 206, size: 1,
    color: '#8a7f7a',
    summary: "The \"Ocean of Storms\" - full of rare metals.",
    science: "It is called an ocean, but there is no water - only old lava!",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.5, regolith: 1.0, metal: 1.6, shielding: 0, reactor: 1.3 },
    terrain: { ice: 0, ore: 5, peak: 1, tube: 1, crater: 2 },
    unlock: { metal: 100, regolith: 60, energy: 35, crew: 3, days: 5 },
  },
  {
    id: 10,
    name: 'Northern Poles',
    lat: 52, lon: 200, size: 1.2,
    color: '#b0bccb',
    summary: "Far-side hills in the north with long sunny days.",
    science: "Near the poles the Sun stays low, so tall hills can stay sunny for weeks.",
    traits: { sunlight: 0.7, constantSun: true, ice: 1.4, regolith: 1.0, metal: 0.9, shielding: 0, reactor: 1 },
    terrain: { ice: 4, ore: 1, peak: 3, tube: 0, crater: 3 },
    unlock: { metal: 80, regolith: 50, energy: 30, crew: 2, days: 4 },
  },
  {
    id: 11,
    name: 'Lunar Highlands',
    lat: -12, lon: 257, size: 1,
    color: '#c9c6bd',
    summary: "Bright, ancient mountains covered in craters.",
    science: "The bright parts of the Moon are its oldest rocks - over 4 billion years old!",
    traits: { sunlight: 1.05, constantSun: false, ice: 0.5, regolith: 1.2, metal: 1.3, shielding: 0, reactor: 1 },
    terrain: { ice: 0, ore: 3, peak: 3, tube: 0, crater: 4 },
    unlock: { metal: 70, regolith: 50, energy: 25, crew: 2, days: 3 },
  },
  {
    id: 12,
    name: 'Basin Blankets',
    lat: 45, lon: 320, size: 1.2,
    color: '#a39d94',
    summary: "Loose dirt thrown out by huge space-rock crashes.",
    science: "When giant space rocks hit the Moon, they threw dirt hundreds of kilometres!",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.55, regolith: 1.7, metal: 1.0, shielding: 0, reactor: 1 },
    terrain: { ice: 0, ore: 2, peak: 1, tube: 0, crater: 2 },
    unlock: { metal: 60, regolith: 30, energy: 20, crew: 2, days: 3 },
  },
  {
    id: 13,
    name: 'Impact Basin',
    lat: -45, lon: 260, size: 1.2,
    color: '#6f7078',
    summary: "A giant crater made by a huge space rock.",
    science: "The biggest crater on the Moon is about 2,500 km wide!",
    traits: { sunlight: 1.0, constantSun: false, ice: 0.7, regolith: 1.2, metal: 1.4, shielding: 0, reactor: 1 },
    terrain: { ice: 1, ore: 4, peak: 1, tube: 0, crater: 4 },
    unlock: { metal: 90, regolith: 60, energy: 30, crew: 3, days: 4 },
  },
  {
    id: 14,
    name: 'Massif Concentric Mountains',
    lat: 10, lon: 309, size: 1,
    color: '#a5a29b',
    summary: "Rings of tall mountains around giant craters.",
    science: "Tall mountains catch extra sunlight, and their rock walls block radiation.",
    traits: { sunlight: 1.15, constantSun: false, ice: 0.5, regolith: 1.0, metal: 1.2, shielding: 0.2, reactor: 1 },
    terrain: { ice: 0, ore: 2, peak: 5, tube: 1, crater: 2 },
    unlock: { metal: 90, regolith: 60, energy: 30, crew: 3, days: 4 },
  },
  {
    id: 15,
    name: 'Deep Shadowed Crater',
    lat: -55, lon: 140, size: 1.2,
    color: '#4c5566',
    summary: "A crater so deep the Sun never shines inside.",
    science: "It can be -240 °C here - one of the coldest places in the solar system!",
    traits: { sunlight: 0, constantSun: true, ice: 3.0, regolith: 1.0, metal: 0.7, shielding: 0.1, reactor: 1 },
    terrain: { ice: 8, ore: 1, peak: 0, tube: 0, crater: 3 },
    unlock: { metal: 120, regolith: 80, energy: 50, crew: 4, days: 6 },
  },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

export function getSector(id) {
  return SECTOR_BY_ID[id];
}
