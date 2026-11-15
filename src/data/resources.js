// Display order matters: life support first, then power, then building materials.
// `hint` is a short kid-friendly explanation shown under the name; `tip` appears in the hover card.
export const RESOURCES = [
  { id: 'oxygen', name: 'Oxygen', hint: 'Air to breathe', icon: '🫁', color: '#7ee8fa', life: true, tip: "Every astronaut breathes 1 each day. Make more with an Air Maker 🫧 or a Greenhouse 🪴." },
  { id: 'water', name: 'Water', hint: 'To drink', icon: '💧', color: '#4cc9f0', life: true, tip: "Every astronaut drinks 1 each day. Get more with an Ice Drill 🧊 or a Water Cleaner ♻️." },
  { id: 'food', name: 'Food', hint: 'To eat', icon: '🥔', color: '#80ed99', life: true, tip: "Every astronaut eats 1 each day. Grow more in a Greenhouse 🪴." },
  { id: 'energy', name: 'Energy', hint: 'Power for machines', icon: '⚡', color: '#ffd23f', tip: "Machines need power. Make it with Solar Panels ☀️ or Nuclear Power ⚛️. Batteries 🔋 store more." },
  { id: 'metal', name: 'Metal', hint: 'For building', icon: '🔩', color: '#c0c9d6', tip: "Used to build machines. Make more with a Metal Maker ⚙️." },
  { id: 'regolith', name: 'Regolith', hint: 'Moon dirt', icon: '🪨', color: '#d4a373', tip: "Moon dirt for building and Rock Shields 🛡️. Dig more with a Moon Digger ⛏️." },
];

export const RESOURCE_IDS = RESOURCES.map((r) => r.id);

export const RESOURCE_BY_ID = Object.fromEntries(RESOURCES.map((r) => [r.id, r]));
