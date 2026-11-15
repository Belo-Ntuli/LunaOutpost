// Custom building pictures in one consistent "Moon base" style: silver modules with dark-blue outlines,
// standing on grey Moon ground. Every building in data/buildings.js has an `image` key that points here;
// its emoji `icon` is still used inside plain text (tips, facts).

const O = '#4f5b85'; // outline colour

const DEFS = `<defs>
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#aab6d4"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7a39b"/><stop offset="1" stop-color="#6f6b64"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5aa9ff"/><stop offset="1" stop-color="#1b3f9a"/></linearGradient>
<linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6fbff"/><stop offset="1" stop-color="#7ee8fa"/></linearGradient>
<radialGradient id="w" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#c9f6ff"/><stop offset="1" stop-color="#2a7fd4"/></radialGradient>
</defs>`;

const GROUND = `<ellipse cx="32" cy="54" rx="30" ry="7.5" fill="url(#g)"/>
<ellipse cx="12" cy="56" rx="3.5" ry="1.2" fill="#5d5a54"/><ellipse cx="52" cy="58" rx="2.6" ry=".9" fill="#5d5a54"/>`;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${DEFS}${GROUND}${body}</svg>`;

const PICTURES = {
  // Moon Home: a ribbed inflatable habitat (like a big space tent) with lit windows, an airlock and a flag.
  moonBase: svg(`
<line x1="19" y1="26" x2="19" y2="10" stroke="#c9d3ea" stroke-width="1.8" stroke-linecap="round"/>
<path d="M19 10 H28 L26 13 L28 16 H19 Z" fill="#ff5a5a"/>
<path d="M5 50 V38 Q5 26 17 26 H37 Q46 26 46 37 V50 Z" fill="url(#t)" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M14 27 V50 M23 26 V50 M32 26 V50 M40 27.5 V50" stroke="#8a97bd" stroke-width="1.6"/>
<rect x="16" y="35" width="5" height="5" rx="1.2" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<rect x="25" y="35" width="5" height="5" rx="1.2" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<rect x="34" y="35" width="4.5" height="5" rx="1.2" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<rect x="45" y="38" width="12" height="12" rx="2.5" fill="#c9d3ea" stroke="${O}" stroke-width="2"/>
<circle cx="51" cy="44" r="3" fill="#3a4785" stroke="${O}" stroke-width="1.2"/>`),

  // Solar Panel: a tilted blue panel on a mast, catching the Sun.
  solar: svg(`
<circle cx="52" cy="11" r="6" fill="#ffd23f"/>
<path d="M52 1.5v2.5 M52 18v2.5 M42.5 11h2.5 M59 11h2.5 M45.3 4.3l1.8 1.8 M58.7 4.3l-1.8 1.8" stroke="#ffd23f" stroke-width="2" stroke-linecap="round"/>
<rect x="30.5" y="34" width="3" height="18" fill="#c9d3ea" stroke="${O}" stroke-width="1.2"/>
<polygon points="6,32 46,20 56,32 16,44" fill="url(#b)" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
<path d="M19.3 28 L29.3 40 M32.7 24 L42.7 36 M11 38 L51 26" stroke="#bfe0ff" stroke-width="1.2" opacity=".85"/>`),

  // Battery: a big battery with green charge bars and a lightning bolt.
  battery: svg(`
<rect x="27" y="10" width="10" height="6" rx="1.5" fill="#c9d3ea" stroke="${O}" stroke-width="1.6"/>
<rect x="18" y="15" width="28" height="38" rx="5" fill="url(#t)" stroke="${O}" stroke-width="2.2"/>
<rect x="22" y="20" width="20" height="8" rx="2" fill="#d6dcef"/>
<rect x="22" y="30" width="20" height="8" rx="2" fill="#80ed99"/>
<rect x="22" y="40" width="20" height="9" rx="2" fill="#38b000"/>
<path d="M35 18 L26 33 H32 L28 47 L39 29 H33 Z" fill="#ffd23f" stroke="#c48f00" stroke-width="1.2" stroke-linejoin="round"/>`),

  // Nuclear Power: a reactor drum with a radiation sign and big radiator fins (like NASA's Fission Surface Power design).
  reactor: svg(`
<path d="M5 21 L22 28 V45 L5 38 Z" fill="#d6dcef" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M59 21 L42 28 V45 L59 38 Z" fill="#d6dcef" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M10 23 V40 M14 24.7 V41.7 M18 26.3 V43.3 M54 23 V40 M50 24.7 V41.7 M46 26.3 V43.3" stroke="#8a97bd" stroke-width="1.3"/>
<rect x="22" y="22" width="20" height="30" fill="url(#t)" stroke="${O}" stroke-width="2"/>
<ellipse cx="32" cy="22" rx="10" ry="3.5" fill="#eef2fb" stroke="${O}" stroke-width="2"/>
<circle cx="32" cy="37" r="7" fill="#ffd23f" stroke="#c48f00" stroke-width="1"/>
<path d="M31.1 35.44 L29 31.8 A6 6 0 0 1 35 31.8 L32.9 35.44 A1.8 1.8 0 0 0 31.1 35.44 Z
M33.8 37 L38 37 A6 6 0 0 1 35 42.2 L32.9 38.56 A1.8 1.8 0 0 0 33.8 37 Z
M31.1 38.56 L29 42.2 A6 6 0 0 1 26 37 L30.2 37 A1.8 1.8 0 0 0 31.1 38.56 Z" fill="#1d2350"/>
<circle cx="32" cy="37" r="1.1" fill="#1d2350"/>`),

  // Ice Drill: a drilling tower with a spinning drill bit, next to blocks of ice.
  iceMine: svg(`
<rect x="5" y="42" width="11" height="10" rx="2" fill="#a8e6ff" stroke="#2a7fd4" stroke-width="1.5"/>
<rect x="7" y="44" width="4" height="2" rx="1" fill="#fff" opacity=".85"/>
<rect x="14" y="47" width="7" height="6" rx="1.5" fill="#a8e6ff" stroke="#2a7fd4" stroke-width="1.3"/>
<rect x="47" y="44" width="11" height="9" rx="2" fill="#a8e6ff" stroke="#2a7fd4" stroke-width="1.5"/>
<rect x="49" y="46" width="4" height="2" rx="1" fill="#fff" opacity=".85"/>
<path d="M20 50 L32 9 L44 50" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M20 50 L32 9 L44 50" fill="none" stroke="#c9d3ea" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M24.6 34.5 H39.4 M28.2 22 H35.8" stroke="#c9d3ea" stroke-width="2.4"/>
<rect x="27" y="24" width="10" height="9" rx="2" fill="#ff9f43" stroke="${O}" stroke-width="1.6"/>
<path d="M30 33 H34 V49 L32 55 L30 49 Z" fill="#8a97bd" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M30 37 L34 39 M30 41 L34 43 M30 45 L34 47" stroke="${O}" stroke-width="1"/>`),

  // Air Maker: an oxygen tank (O2) fed with water, with air bubbles coming out.
  airMaker: svg(`
<circle cx="24" cy="10" r="3" fill="none" stroke="#7ee8fa" stroke-width="1.8"/>
<circle cx="32.5" cy="6" r="4" fill="none" stroke="#7ee8fa" stroke-width="1.8"/>
<circle cx="41" cy="11" r="2.4" fill="none" stroke="#7ee8fa" stroke-width="1.8"/>
<path d="M11 44 H18" stroke="#8a97bd" stroke-width="2.4"/>
<path d="M9 35 Q14 42 9 46 Q4 42 9 35 Z" fill="#4cc9f0" stroke="#1f7ab8" stroke-width="1.2"/>
<rect x="16" y="48" width="32" height="5" rx="2" fill="#6c7799"/>
<rect x="18" y="16" width="28" height="35" rx="14" fill="url(#c)" stroke="${O}" stroke-width="2.2"/>
<rect x="22" y="22" width="4" height="20" rx="2" fill="#fff" opacity=".65"/>
<text x="33" y="39" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="14" text-anchor="middle" fill="#1d4e89">O<tspan font-size="9" dy="3">2</tspan></text>`),

  // Greenhouse: a glass dome with green plants growing inside.
  greenhouse: svg(`
<rect x="6" y="48" width="52" height="5" rx="2" fill="#6c7799"/>
<path d="M20 48 V36 M32 48 V29 M44 48 V38" stroke="#2d8a2d" stroke-width="1.8"/>
<ellipse cx="16.5" cy="38" rx="4.5" ry="2.2" transform="rotate(-30 16.5 38)" fill="#38b000"/>
<ellipse cx="23.5" cy="35" rx="4.5" ry="2.2" transform="rotate(30 23.5 35)" fill="#80ed99"/>
<ellipse cx="28" cy="33" rx="5" ry="2.4" transform="rotate(-30 28 33)" fill="#80ed99"/>
<ellipse cx="36" cy="30" rx="5" ry="2.4" transform="rotate(30 36 30)" fill="#38b000"/>
<ellipse cx="28.5" cy="41" rx="4.5" ry="2.2" transform="rotate(-25 28.5 41)" fill="#38b000"/>
<ellipse cx="35.5" cy="42" rx="4.5" ry="2.2" transform="rotate(25 35.5 42)" fill="#80ed99"/>
<ellipse cx="41" cy="40" rx="4.2" ry="2.1" transform="rotate(-30 41 40)" fill="#80ed99"/>
<ellipse cx="47.5" cy="38" rx="4.2" ry="2.1" transform="rotate(30 47.5 38)" fill="#38b000"/>
<path d="M7 48 A25 25 0 0 1 57 48 Z" fill="#bdf3ff" fill-opacity=".3" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M12 37 Q32 30 52 37 M18 28.5 Q32 24 46 28.5" fill="none" stroke="#e6f0ff" stroke-width="1.4" opacity=".8"/>
<path d="M14 42 Q16 31 25 26" fill="none" stroke="#fff" stroke-width="2" opacity=".75" stroke-linecap="round"/>`),

  // Water Cleaner: a water tank with a big drop and two green recycling arrows.
  recycler: svg(`
<rect x="16" y="20" width="32" height="32" fill="url(#t)" stroke="${O}" stroke-width="2"/>
<ellipse cx="32" cy="20" rx="16" ry="4" fill="#eef2fb" stroke="${O}" stroke-width="2"/>
<path d="M32 26 C36 32 40 36 40 41 A8 8 0 0 1 24 41 C24 36 28 32 32 26 Z" fill="#4cc9f0" stroke="#1f7ab8" stroke-width="1.4"/>
<path d="M28 40 Q28 36 30.5 33.5" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8" stroke-linecap="round"/>
<path d="M9 30 Q10 13 25 9" fill="none" stroke="#38b000" stroke-width="3" stroke-linecap="round"/>
<polygon points="23,4.5 30,9 23,13.5" fill="#38b000"/>
<path d="M39 8 Q53 11 55 26" fill="none" stroke="#38b000" stroke-width="3" stroke-linecap="round"/>
<polygon points="50.5,24 55,31 59.5,24" fill="#38b000"/>`),

  // Moon Digger: a six-wheel rover with a digging arm and a scoop full of Moon dirt.
  digger: svg(`
<path d="M26 34 L15 22 L8 31" fill="none" stroke="${O}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M26 34 L15 22 L8 31" fill="none" stroke="#c9d3ea" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 30 L14 30 L12 39 L5 39 Z" fill="#8a97bd" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M4 30 Q8.5 24 13 30 Z" fill="#a39d94" stroke="#6f6b64" stroke-width="1"/>
<line x1="50" y1="22" x2="50" y2="15" stroke="#c9d3ea" stroke-width="1.6"/>
<rect x="39" y="22" width="13" height="9" rx="2" fill="#c9f6ff" stroke="${O}" stroke-width="1.8"/>
<rect x="23" y="30" width="32" height="13" rx="3" fill="#ffc914" stroke="${O}" stroke-width="2"/>
<path d="M27 36 H51" stroke="#c48f00" stroke-width="1.4"/>
<circle cx="29" cy="47" r="4.6" fill="#3a4785" stroke="${O}" stroke-width="1.5"/><circle cx="29" cy="47" r="1.6" fill="#c9d3ea"/>
<circle cx="39" cy="47" r="4.6" fill="#3a4785" stroke="${O}" stroke-width="1.5"/><circle cx="39" cy="47" r="1.6" fill="#c9d3ea"/>
<circle cx="49" cy="47" r="4.6" fill="#3a4785" stroke="${O}" stroke-width="1.5"/><circle cx="49" cy="47" r="1.6" fill="#c9d3ea"/>`),

  // Metal Maker: a furnace with a glowing window and a hot vent, next to shiny metal bars.
  metalMaker: svg(`
<rect x="31" y="12" width="7" height="14" fill="#c9d3ea" stroke="${O}" stroke-width="1.6"/>
<ellipse cx="34.5" cy="11" rx="4.5" ry="2" fill="#ff9f43"/>
<path d="M32 7 Q34.5 3 37 7" fill="none" stroke="#ffd23f" stroke-width="1.6" stroke-linecap="round"/>
<rect x="7" y="24" width="35" height="28" rx="3" fill="url(#t)" stroke="${O}" stroke-width="2"/>
<rect x="13" y="31" width="15" height="11" rx="2" fill="#ff7b29" stroke="${O}" stroke-width="1.6"/>
<rect x="15.5" y="33.5" width="10" height="6" rx="1.5" fill="#ffd23f"/>
<path d="M32 33 H38 M32 38 H38 M32 43 H38" stroke="#8a97bd" stroke-width="1.6"/>
<path d="M42 53 L45 46 H57 L60 53 Z" fill="#e3e8f5" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M45.5 46 L48 40 H54.5 L57 46 Z" fill="#c9d3ea" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`),

  // Rock Shield: a thick wall of Moon-dirt bags with a shield sign on top.
  shield: svg(`
<g fill="#b9a58f" stroke="#6b5a47" stroke-width="1.6">
<rect x="5" y="43" width="14" height="10" rx="5"/><rect x="19" y="43" width="14" height="10" rx="5"/>
<rect x="33" y="43" width="14" height="10" rx="5"/><rect x="47" y="43" width="13" height="10" rx="5"/>
<rect x="12" y="34" width="14" height="10" rx="5"/><rect x="26" y="34" width="14" height="10" rx="5"/>
<rect x="40" y="34" width="14" height="10" rx="5"/>
<rect x="19" y="25" width="14" height="10" rx="5"/><rect x="33" y="25" width="14" height="10" rx="5"/>
</g>
<path d="M32 4 L43 8.5 V17 Q43 25 32 29 Q21 25 21 17 V8.5 Z" fill="#9b5de5" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
<path d="M32 9 V24 M26 15 H38" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>`),

  // Science Lab: a lab module with one big window, a science flask and a radio dish.
  lab: svg(`
<line x1="41" y1="28" x2="41" y2="19" stroke="#c9d3ea" stroke-width="2"/>
<path d="M31 13 Q39 27 53 18 Z" fill="#d6dcef" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
<line x1="42" y1="18" x2="46" y2="12" stroke="${O}" stroke-width="1.4"/>
<rect x="5" y="28" width="43" height="24" rx="11" fill="url(#t)" stroke="${O}" stroke-width="2.2"/>
<circle cx="17" cy="40" r="6" fill="url(#w)" stroke="${O}" stroke-width="1.6"/>
<path d="M32.5 31.5 H39.5 M34.5 31.5 V37.5 L30 46.5 Q29.5 48.8 31.8 48.8 H40.2 Q42.5 48.8 42 46.5 L37.5 37.5 V31.5" fill="#ffffff" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M31.4 43.5 H40.6 L42 46.5 Q42.5 48.8 40.2 48.8 H31.8 Q29.5 48.8 30 46.5 Z" fill="#80ed99"/>
<circle cx="35" cy="46" r="1" fill="#fff"/><circle cx="37.5" cy="44.8" r=".8" fill="#fff"/>`),

  // Rocket Pad: a landing pad with a rocket standing on it.
  rocketPad: svg(`
<ellipse cx="32" cy="50" rx="25" ry="6.5" fill="#8a97bd" stroke="${O}" stroke-width="2"/>
<ellipse cx="32" cy="50" rx="17" ry="4" fill="none" stroke="#ffd23f" stroke-width="1.8" stroke-dasharray="4 3"/>
<path d="M28.5 42 Q32 50 35.5 42 Z" fill="#ff9f43"/>
<path d="M24 31 L16.5 44 H24 Z" fill="#ff5a5a" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M40 31 L47.5 44 H40 Z" fill="#ff5a5a" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M32 5 Q40 13 40 28 V43 H24 V28 Q24 13 32 5 Z" fill="url(#t)" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
<path d="M32 5 Q36.6 9.5 38.4 15 H25.6 Q27.4 9.5 32 5 Z" fill="#ff5a5a" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
<circle cx="32" cy="25" r="3.8" fill="url(#w)" stroke="${O}" stroke-width="1.4"/>
<path d="M24 36 H40" stroke="#8a97bd" stroke-width="1.4"/>`),

  // Explorer rover (not a building): an Apollo-style Moon buggy with an astronaut driver,
  // an umbrella radio dish, a gold-foil box and big wire-mesh wheels.
  rover: svg(`
<line x1="50" y1="31" x2="50" y2="15" stroke="#c9d3ea" stroke-width="1.8"/>
<path d="M41 11 Q50 22 59 11 Z" fill="#d6dcef" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M45.5 11.5 L50 16 L54.5 11.5" fill="none" stroke="#8a97bd" stroke-width="1"/>
<rect x="18" y="20.5" width="5" height="11" rx="1.5" fill="#c9d3ea" stroke="${O}" stroke-width="1.4"/>
<rect x="22" y="20" width="10" height="12" rx="3.5" fill="#ffffff" stroke="${O}" stroke-width="1.8"/>
<path d="M30 25 L38 28.5" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
<path d="M30 25 L38 28.5" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
<rect x="38" y="26" width="2.6" height="6" rx="1" fill="#8a97bd" stroke="${O}" stroke-width="1"/>
<circle cx="27" cy="14" r="6" fill="#ffffff" stroke="${O}" stroke-width="1.8"/>
<path d="M28.5 9.6 Q33.6 11 33 15.5 Q32.2 19.4 28.5 18.6 Z" fill="#ffc914" stroke="#c48f00" stroke-width="1"/>
<rect x="7" y="26.5" width="9" height="6" rx="1" fill="#8a97bd" stroke="${O}" stroke-width="1.4"/>
<rect x="42" y="26.5" width="12" height="6" rx="1" fill="#ffd23f" stroke="#c48f00" stroke-width="1.2"/>
<path d="M6 32 H58 L56 37 H8 Z" fill="url(#t)" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
<path d="M5.8 41 A10 10 0 0 1 24.2 41 M39.8 41 A10 10 0 0 1 58.2 41" fill="none" stroke="#5aa9ff" stroke-width="3" stroke-linecap="round"/>
<g stroke="${O}" stroke-width="1.8"><circle cx="15" cy="45" r="7.5" fill="#3a4785"/><circle cx="49" cy="45" r="7.5" fill="#3a4785"/></g>
<g fill="none" stroke="#8a97bd" stroke-width="1.2" stroke-dasharray="1.6 1.4"><circle cx="15" cy="45" r="5"/><circle cx="49" cy="45" r="5"/></g>
<g fill="#c9d3ea"><circle cx="15" cy="45" r="2"/><circle cx="49" cy="45" r="2"/></g>`),
};

export const BUILDING_IMAGES = Object.fromEntries(
  Object.entries(PICTURES).map(([key, markup]) => [key, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`]),
);

const loaded = {};

/** Preloaded <img> for a picture key (null if unknown). */
export function pictureImage(key) {
  if (!BUILDING_IMAGES[key]) return null;
  if (!loaded[key]) {
    const img = new Image();
    img.src = BUILDING_IMAGES[key];
    loaded[key] = img;
  }
  return loaded[key];
}

/** Preloaded <img> for a building's picture (null if it has none). */
export function buildingImage(def) {
  return def?.image ? pictureImage(def.image) : null;
}

/** HTML <img> for a picture key, e.g. pictureHtml('rover'). */
export function pictureHtml(key, className = 'ico') {
  return BUILDING_IMAGES[key] ? `<img class="${className}" src="${BUILDING_IMAGES[key]}" alt="">` : '';
}

/** HTML for a building's icon: its picture, or its emoji if it has none. */
export function iconHtml(def, className = 'ico') {
  return pictureHtml(def.image, className) || def.icon;
}

// Start loading pictures right away so the map and cursor can use them immediately.
export function preloadBuildingImages(defs) {
  for (const def of defs) buildingImage(def);
  pictureImage('rover');
}
