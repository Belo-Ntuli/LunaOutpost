// Global tuning constants. Change balance here rather than inside game logic.

export const SAVE_KEY = 'lunaOutpost.save.v2';
export const BEST_KEY = 'lunaOutpost.bestDays.v1';
export const SAVE_VERSION = 2;

// Real seconds per in-game (Earth) day at 1x speed. Slow enough for young players to read and plan.
export const SECONDS_PER_DAY = 8;
export const SPEEDS = [1, 2, 4];

// A full lunar day/night cycle is ~29.5 Earth days: ~15 days of light, ~15 of darkness.
export const LUNAR_CYCLE_DAYS = 30;
export const LUNAR_DAYLIGHT_DAYS = 15;

export const STARTING_POPULATION = 7;
// Kept tight on purpose: about 11 days of air, water and food, and metal for only the first few machines.
export const STARTING_RESOURCES = {
  water: 80,
  food: 80,
  energy: 100,
  oxygen: 80,
  metal: 300,
  regolith: 120,
};

// Daily consumption per crew member.
export const CREW_NEEDS = { water: 1, food: 1, oxygen: 1 };

export const RESOURCE_CAP = 1500;
export const BASE_ENERGY_CAP = 150;

// Unlock costs grow with each sector already unlocked.
export const UNLOCK_COST_GROWTH = 0.35;

// Calling Earth for a supply rocket (needs a Rocket Pad).
// A radio message takes about 1.3 seconds to travel between the Moon and Earth (speed of light).
export const RADIO_DELAY_SECONDS = 1.3;
// Like the Apollo missions, a rocket takes about 3 days to fly from Earth to the Moon.
export const ROCKET_TRAVEL_DAYS = 3;
// Days Earth needs to get the next rocket ready after one lands.
export const ROCKET_COOLDOWN_DAYS = 10;
export const ROCKET_CARGOS = [
  { id: 'food', icon: '🥔', name: 'Food', give: { food: 50 } },
  { id: 'water', icon: '💧', name: 'Water', give: { water: 50 } },
  { id: 'metal', icon: '🔩', name: 'Metal', give: { metal: 60 } },
  { id: 'crew', icon: '👩‍🚀', name: '2 new astronauts', crew: 2 },
];

// Storm Shelter: during a storm warning, astronauts can hide in an extra-safe room.
// Running it uses power every day, and it adds this much safety when the storm hits.
export const SHELTER_ENERGY = 15;
export const SHELTER_SAFETY = 0.5;

// Solar particle events (with advance warning so players can react).
export const FLARE_CHANCE_PER_DAY = 0.02;
export const FLARE_WARNING_DAYS = 3;
export const FLARE_GRACE_DAYS = 15;
export const FLARE_EXPOSURE_LOSS = 0.3;
