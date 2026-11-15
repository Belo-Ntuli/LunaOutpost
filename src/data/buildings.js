// Building catalogue. All rates are per in-game day.
//
// cost          - resources spent to build
// energyUse     - energy used per day
// produces      - resources made per day (before sector/terrain bonuses)
// consumes      - resources used up per day (inputs)
// housing       - beds for astronauts
// energyStorage - extra battery space
// shielding     - radiation protection added to its sector (0..1, stacks, max 1)
// recycles      - water recovered from the crew's used water
// trait         - sector trait that boosts its output (see data/sectors.js)
// bonusTerrain/terrainBonus - hex terrain that boosts output and by how much
// lifeSupport   - gets power first when power runs short
// maxCount      - colony-wide limit
// category      - colour group in the build menu: life | power | build | safety
// image         - picture key in ui/icons.js, shown on the map, build cards and cursor (emoji `icon` is for text)
// short         - one-line description for kids
// fact          - "Did you know?" fact shown the first time it is built

export const BUILDINGS = {
  habitat: {
    id: 'habitat', name: 'Moon Home', icon: '⛺', image: 'moonBase', category: 'life',
    cost: { metal: 80, regolith: 40 },
    energyUse: 2, produces: {}, consumes: {},
    housing: 8, lifeSupport: true,
    short: 'Beds for 8 astronauts.',
    fact: 'Moon homes keep the air in and keep astronauts warm. Nights on the Moon get as cold as -170 °C!',
  },
  solar: {
    id: 'solar', name: 'Solar Panel', icon: '☀️', image: 'solar', category: 'power',
    cost: { metal: 35 },
    energyUse: 0, produces: { energy: 10 }, consumes: {},
    trait: 'sunlight', bonusTerrain: 'peak', terrainBonus: 1.25,
    short: 'Makes power from sunlight. Stops at night!',
    fact: 'A night on the Moon lasts about 2 weeks. Solar panels make no power in the dark.',
  },
  battery: {
    id: 'battery', name: 'Battery', icon: '🔋', image: 'battery', category: 'power',
    cost: { metal: 40, regolith: 10 },
    energyUse: 0, produces: {}, consumes: {},
    energyStorage: 200,
    short: 'Saves extra power for the night.',
    fact: 'Batteries store energy from sunny days so machines keep running when it gets dark.',
  },
  reactor: {
    id: 'reactor', name: 'Nuclear Power', icon: '⚛️', image: 'reactor', category: 'power',
    cost: { metal: 140, regolith: 20 },
    energyUse: 0, produces: { energy: 30 }, consumes: {},
    trait: 'reactor',
    short: 'Lots of power, day AND night.',
    fact: 'NASA is designing small nuclear power plants for the Moon. They work even in the dark.',
  },
  iceMine: {
    id: 'iceMine', name: 'Ice Drill', icon: '🧊', image: 'iceMine', category: 'life',
    cost: { metal: 40 },
    energyUse: 4, produces: { water: 8 }, consumes: {},
    trait: 'ice', bonusTerrain: 'ice', terrainBonus: 1.5, lifeSupport: true,
    short: 'Digs up ice and melts it into water.',
    fact: 'There is frozen water hiding in dark craters near the Moon\'s poles!',
  },
  electrolysis: {
    id: 'electrolysis', name: 'Air Maker', icon: '🫧', image: 'airMaker', category: 'life',
    cost: { metal: 45 },
    energyUse: 6, produces: { oxygen: 9 }, consumes: { water: 3 },
    lifeSupport: true,
    short: 'Splits water to make air to breathe.',
    fact: 'Water is made of hydrogen and oxygen. Electricity can split it apart to make air!',
  },
  greenhouse: {
    id: 'greenhouse', name: 'Greenhouse', icon: '🪴', image: 'greenhouse', category: 'life',
    cost: { metal: 40, regolith: 20 },
    energyUse: 5, produces: { food: 9, oxygen: 2 }, consumes: { water: 2 },
    lifeSupport: true,
    short: 'Grows food. Plants make some air too!',
    fact: 'Astronauts have grown lettuce, peppers and even flowers on the space station.',
  },
  recycler: {
    id: 'recycler', name: 'Water Cleaner', icon: '♻️', image: 'recycler', category: 'life',
    cost: { metal: 50, regolith: 10 },
    energyUse: 3, produces: {}, consumes: {},
    recycles: { water: 6 }, lifeSupport: true,
    short: 'Cleans used water so it can be used again.',
    fact: 'On the space station, astronauts recycle almost all of their water - even sweat!',
  },
  excavator: {
    id: 'excavator', name: 'Moon Digger', icon: '⛏️', image: 'digger', category: 'build',
    cost: { metal: 25 },
    energyUse: 2, produces: { regolith: 9 }, consumes: {},
    trait: 'regolith',
    short: 'Digs up Moon dirt (regolith).',
    fact: 'Moon dirt is called regolith. It is sharp and sticky, like tiny bits of broken glass.',
  },
  refinery: {
    id: 'refinery', name: 'Metal Maker', icon: '⚙️', image: 'metalMaker', category: 'build',
    cost: { metal: 30, regolith: 50 },
    energyUse: 8, produces: { metal: 6, oxygen: 1 }, consumes: { regolith: 6 },
    trait: 'metal', bonusTerrain: 'ore', terrainBonus: 1.5,
    short: 'Turns Moon dirt into metal.',
    fact: 'Moon rocks are almost half oxygen! Melting them gives us metal AND air.',
  },
  shield: {
    id: 'shield', name: 'Rock Shield', icon: '🛡️', image: 'shield', category: 'safety',
    cost: { regolith: 70 },
    energyUse: 0, produces: {}, consumes: {},
    shielding: 0.25,
    short: 'Moon dirt piles that block space radiation.',
    fact: 'The Moon has no thick air to block harmful sun rays. A thick layer of dirt keeps astronauts safe.',
  },
  lab: {
    id: 'lab', name: 'Science Lab', icon: '🔬', image: 'lab', category: 'science',
    cost: { metal: 60, regolith: 30 },
    energyUse: 5, produces: { research: 1 }, consumes: { oxygen: 3 },
    short: 'Makes discoveries. Uses air and power.',
    fact: 'Astronauts on the International Space Station run hundreds of science experiments every year. Science needs air and power too!',
  },
  pad: {
    id: 'pad', name: 'Rocket Pad', icon: '🚀', image: 'rocketPad', category: 'safety',
    cost: { metal: 80, regolith: 120 },
    energyUse: 1, produces: {}, consumes: {},
    maxCount: 1,
    short: 'Lets you call Earth for a rocket with supplies or astronauts.',
    fact: 'Rockets blast dust everywhere when they land. A flat, hard pad keeps the base clean.',
  },
};

export const BUILDING_LIST = Object.values(BUILDINGS);

export function getBuilding(id) {
  return BUILDINGS[id];
}
