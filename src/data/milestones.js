// Mission goals ("stars"). `test` receives the game state and returns true once achieved.
// The `big` goal is the ultimate mission: it is always shown at the bottom of the Goals card.
export const MILESTONES = [
  { id: 'week', icon: '📅', title: 'Survive 7 days', test: (s) => s.day >= 7 },
  { id: 'lunarCycle', icon: '🌙', title: 'Survive a whole Moon night (30 days)', test: (s) => s.day >= 30 },
  { id: 'sectors3', icon: '🧭', image: 'rover', title: 'Explore 3 more sections', test: (s) => countExplored(s) >= 3 },
  { id: 'reactor', icon: '⚛️', title: 'Build Nuclear Power', test: (s) => hasBuilding(s, 'reactor') },
  { id: 'pad', icon: '🚀', title: 'Build a Rocket Pad', test: (s) => hasBuilding(s, 'pad') },
  { id: 'crew12', icon: '👩‍🚀', title: 'Have 12 astronauts', test: (s) => s.population >= 12 },
  { id: 'hundred', icon: '💯', title: 'Survive 100 days', test: (s) => s.day >= 100 },
  { id: 'sectors8', icon: '🗺️', title: 'Explore 8 more sections', test: (s) => countExplored(s) >= 8 },
  { id: 'crew25', icon: '🏙️', title: 'Have 25 astronauts', test: (s) => s.population >= 25 },
  { id: 'allSectors', icon: '🏆', big: true, title: 'Explore the WHOLE Moon!', test: (s) => countUnlocked(s) >= 15 },
];

export function countUnlocked(state) {
  return Object.values(state.sectors).filter((s) => s.unlocked).length;
}

/** Sections explored on top of the home base. */
function countExplored(state) {
  return countUnlocked(state) - 1;
}

function hasBuilding(state, type) {
  return Object.values(state.sectors).some((s) => s.buildings.some((b) => b.type === type));
}
