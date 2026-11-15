import { RADIATION_WINDOWS, radlabUrl } from '../data/radlabWindows.js';
import { RADLAB_SNAPSHOT } from '../data/radlabSnapshot.js';
import { dailyMeans, makeRadiation } from '../game/radiation.js';
import { fetchStormCauses } from './donki.js';

// The RadLab API doesn't send CORS headers, so the browser calls it through the Vite proxy at
// /radlab-api (see vite.config.js). If that fails (offline, static hosting), the bundled snapshot is used.
const PROXY = './radlab-api/';
const TIMEOUT_MS = 10000;

export function pickWindow(random = Math.random) {
  return RADIATION_WINDOWS[Math.floor(random() * RADIATION_WINDOWS.length)];
}

function snapshotWindow(start) {
  return RADLAB_SNAPSHOT.find((x) => x.start === start) ?? RADLAB_SNAPSHOT[0];
}

/** Bundled radiation + DONKI storm causes for a window (works offline). */
export function snapshotRadiation(start) {
  const w = snapshotWindow(start);
  return { ...makeRadiation({ ...w, source: 'snapshot' }), storms: w.storms ?? [], donki: 'snapshot' };
}

async function loadRadlab(window) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(PROXY + radlabUrl(window.start), { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const daily = dailyMeans(await res.json(), window.start);
    if (daily.filter((x) => x !== null).length < daily.length * 0.75) throw new Error('too many missing days');
    return makeRadiation({ ...window, daily, source: 'live' });
  } catch (err) {
    console.info('[RadLab] Using bundled radiation snapshot:', err.message);
    return makeRadiation({ ...snapshotWindow(window.start), source: 'snapshot' });
  }
}

/**
 * Loads a real month of Moon radiation (RadLab) plus what caused each storm (DONKI).
 * Each part falls back to the bundled snapshot on its own, so the game always gets data.
 */
export async function loadRadiation(window = pickWindow()) {
  const radiation = await loadRadlab(window);
  try {
    radiation.storms = await fetchStormCauses(radiation);
    radiation.donki = 'live';
  } catch (err) {
    console.info('[DONKI] Using bundled storm causes:', err.message);
    radiation.storms = snapshotWindow(window.start).storms ?? [];
    radiation.donki = 'snapshot';
  }
  return radiation;
}
