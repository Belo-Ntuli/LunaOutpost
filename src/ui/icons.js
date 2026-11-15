// Custom building pictures that emoji can't show well (e.g. a Moon base tent instead of an Earth house).
// A building with `image: '<key>'` in data/buildings.js uses the picture here; others use their emoji.

// Moon base camp: a ribbed inflatable habitat (like a big space tent) with lit windows, an airlock and a flag.
const MOON_BASE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#aab6d4"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7a39b"/><stop offset="1" stop-color="#6f6b64"/></linearGradient>
</defs>
<ellipse cx="32" cy="53" rx="31" ry="8" fill="url(#g)"/>
<ellipse cx="12" cy="55" rx="4" ry="1.4" fill="#5d5a54"/>
<ellipse cx="52" cy="57" rx="3" ry="1" fill="#5d5a54"/>
<line x1="19" y1="26" x2="19" y2="10" stroke="#c9d3ea" stroke-width="1.8" stroke-linecap="round"/>
<path d="M19 10 H28 L26 13 L28 16 H19 Z" fill="#ff5a5a"/>
<path d="M5 50 V38 Q5 26 17 26 H37 Q46 26 46 37 V50 Z" fill="url(#t)" stroke="#4f5b85" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M14 27 V50 M23 26 V50 M32 26 V50 M40 27.5 V50" stroke="#8a97bd" stroke-width="1.6"/>
<rect x="16" y="35" width="5" height="5" rx="1.2" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<rect x="25" y="35" width="5" height="5" rx="1.2" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<rect x="34" y="35" width="4.5" height="5" rx="1.2" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<rect x="45" y="38" width="12" height="12" rx="2.5" fill="#c9d3ea" stroke="#4f5b85" stroke-width="2"/>
<circle cx="51" cy="44" r="3" fill="#3a4785" stroke="#4f5b85" stroke-width="1.2"/>
</svg>`;

export const BUILDING_IMAGES = {
  moonBase: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(MOON_BASE_SVG)}`,
};

const loaded = {};

/** Preloaded <img> for a building with a custom picture (null for emoji buildings). */
export function buildingImage(def) {
  if (!def?.image || !BUILDING_IMAGES[def.image]) return null;
  if (!loaded[def.image]) {
    const img = new Image();
    img.src = BUILDING_IMAGES[def.image];
    loaded[def.image] = img;
  }
  return loaded[def.image];
}

/** HTML for a building's icon: its custom picture, or its emoji. */
export function iconHtml(def, className = 'ico') {
  return def.image && BUILDING_IMAGES[def.image] ? `<img class="${className}" src="${BUILDING_IMAGES[def.image]}" alt="">` : def.icon;
}

// Start loading pictures right away so the map and cursor can use them immediately.
export function preloadBuildingImages(defs) {
  for (const def of defs) buildingImage(def);
}
