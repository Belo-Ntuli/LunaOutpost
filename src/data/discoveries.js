// Science Lab discoveries: each one is a real NASA research finding plus a small bonus for the base.
// Unlocked in this order, one every RESEARCH_PER_DISCOVERY research points.
//
// boost: building id whose output grows by DISCOVERY_BOOST, or 'storm' (storms send fewer astronauts home).

export const RESEARCH_PER_DISCOVERY = 6;
export const DISCOVERY_BOOST = 1.25;
export const STORM_RESEARCH_FACTOR = 0.75;

export const DISCOVERIES = [
  {
    id: 'plants',
    icon: '🌱',
    title: 'Space plants',
    fact: 'Plants on the International Space Station grow toward light. With no "down" in space, light shows them which way to grow.',
    source: 'NASA plant research on the ISS (e.g. the Veggie experiments)',
    boost: 'greenhouse',
    bonus: 'Greenhouses now make 25% more.',
  },
  {
    id: 'ice',
    icon: '🧊',
    title: 'Hidden Moon ice',
    fact: 'NASA missions found water ice inside dark craters at the Moon\'s poles. Some of these craters have not seen sunlight for billions of years.',
    source: 'NASA LCROSS and Lunar Reconnaissance Orbiter',
    boost: 'iceMine',
    bonus: 'Ice Drills now make 25% more.',
  },
  {
    id: 'oxygen',
    icon: '🫧',
    title: 'Making air on another world',
    fact: 'NASA\'s MOXIE experiment on the Perseverance rover made oxygen from the air on Mars. Future bases could make their own air.',
    source: 'NASA Mars 2020 MOXIE experiment',
    boost: 'electrolysis',
    bonus: 'Air Makers now make 25% more.',
  },
  {
    id: 'solar',
    icon: '☀️',
    title: 'Better solar cells',
    fact: 'The best solar cells used in space turn about 30% of sunlight into electricity. Home solar panels on Earth usually turn about 20% into electricity.',
    source: 'NASA spacecraft power research',
    boost: 'solar',
    bonus: 'Solar Panels now make 25% more.',
  },
  {
    id: 'health',
    icon: '🧑‍🚀',
    title: 'Astronaut health',
    fact: 'In NASA\'s Twins Study, Scott Kelly spent almost a year in space while his twin Mark stayed on Earth. Most changes in Scott\'s body went back to normal after he came home.',
    source: 'NASA Twins Study (NASA Human Research Program)',
    boost: 'storm',
    bonus: 'Solar storms now send 25% fewer astronauts home.',
  },
];

export const DISCOVERY_BY_ID = Object.fromEntries(DISCOVERIES.map((d) => [d.id, d]));
