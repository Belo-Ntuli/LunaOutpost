// "Did you know?" learning cards. Shown once per game (tracked in state.learned).
// Building facts come from data/buildings.js; these cover events and the intro.

export const INTRO_CARDS = [
  { art: '🌕', title: 'Welcome to the Moon!', text: 'You are the boss of 7 astronauts. Your job: keep them safe and build a Moon town!' },
  { art: '🫁💧🥔', title: 'Astronauts need 3 things', text: 'Every day they need AIR, WATER and FOOD. Watch the bars at the top - keep them full!' },
  { art: '🏗️', title: 'Let\'s build!', text: 'This is your base! Pick a machine on the right, then click a hexagon to build it. Press ▶ to start time. Press ⬅ Back to Moon to see the whole Moon.' },
];

export const EVENT_CARDS = {
  night: { art: '🌙', title: 'Moon night!', text: 'A night on the Moon lasts about 15 Earth days! Solar Panels stop working. Batteries and Nuclear Power keep the lights on.' },
  flare: { art: '☢️', title: 'Solar storm!', text: 'The Sun sometimes blasts out dangerous radiation. Earth\'s air protects us, but the Moon has none. Build Rock Shields, or turn on the 🛡️ Storm Shelter at the top (it uses power).' },
  expedition: { art: '🚙', title: 'Explorers on the way!', text: 'Real astronauts used a Moon buggy called the Lunar Rover to explore further from their lander.' },
  explored: { art: '🗺️', title: 'New place unlocked!', text: 'Every place on the Moon is different. Some have ice, some have metal, some get more sun. Use them all!' },
  rocket: { art: '🚀', title: 'Rocket delivery!', text: 'The Apollo astronauts took about 3 days to fly from Earth to the Moon. That is why you must call Earth BEFORE you run out!' },
  'call-earth': { art: '📡🌍', title: 'Talking to Earth', text: 'Radio messages travel at the speed of light. From the Moon they reach Earth in about 1.3 seconds. From Mars they can take up to 22 minutes! Mars astronauts must solve most problems on their own.' },
  shelter: { art: '🛡️', title: 'Storm Shelter', text: 'NASA\'s Orion spacecraft has a storm plan: astronauts build a shelter out of supply bags and hide inside until the storm passes. Here, keeping the shelter running uses power.' },
  power: { art: '⚡', title: 'Power matters!', text: 'When there isn\'t enough power, your base turns off the less important machines first, so air and water keep working.' },
  'out-oxygen': { art: '🫁', title: 'No air!', text: 'People can only last a few minutes without air. Air is the most important thing to keep full!' },
  'out-water': { art: '💧', title: 'No water!', text: 'People can only last a few days without water. Ice Drills and Water Cleaners help.' },
  'out-food': { art: '🥔', title: 'No food!', text: 'People can last a few weeks without food, but they get very weak. Greenhouses grow food.' },
  radlab: { art: '📡', title: 'Real NASA data!', text: 'The space radiation in this game is REAL. Your mission replays a real month from the past, measured by CRaTER on NASA\'s Lunar Reconnaissance Orbiter - a spacecraft flying around the Moon. Watch the 📡 sign at the top! To see all the NASA data, open ☰ → 📡 NASA data.' },
  'real-storm': { art: '☀️📡', title: 'A real solar storm!', text: 'NASA scientists watch the Sun every day and record every big solar flare in a database called DONKI. Flares are graded C, M and X - each letter is 10 times stronger than the one before! This storm really happened. Rock Shields keep your astronauts safe.' },
};
