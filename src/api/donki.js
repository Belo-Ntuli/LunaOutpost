import { RADIATION_WINDOW_DAYS, addDays, stormCauses } from '../game/radiation.js';

// NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) from the
// Community Coordinated Modeling Center. API docs: https://ccmc.gsfc.nasa.gov/DONKI/api/
// DONKI sends `Access-Control-Allow-Origin: *`, so the browser can call it directly (no proxy).
export const DONKI_BASE = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/';
const TIMEOUT_MS = 10000;

/** URL for DONKI events of `type` ('FLR' flares, 'SEP' solar energetic particles) around a radiation window. */
export function donkiUrl(type, start) {
  // Start 3 days early so flares just before the window are included (max 60 days per request).
  return `${DONKI_BASE}${type}?startDate=${addDays(start, -3)}&endDate=${addDays(start, RADIATION_WINDOW_DAYS)}`;
}

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Downloads flares and particle events from DONKI and matches them to the storms in `radiation`. */
export async function fetchStormCauses(radiation) {
  const [flares, seps] = await Promise.all([getJson(donkiUrl('FLR', radiation.start)), getJson(donkiUrl('SEP', radiation.start))]);
  return stormCauses(radiation, flares ?? [], seps ?? []);
}

const flareRank = (c) => ({ X: 3, M: 2, C: 1 }[String(c).charAt(0)] ?? 0) * 100 + (parseFloat(String(c).slice(1)) || 0);

/**
 * Today's real space weather: DONKI flares and particle events from the last `days` days (live only).
 * Returns { from, to, flareCount, biggest: { classType, peakTime } | null, sepCount }.
 */
export async function fetchRecentSpaceWeather(days = 7, now = new Date()) {
  const to = now.toISOString().slice(0, 10);
  const from = addDays(to, -days);
  const [flares, seps] = await Promise.all([
    getJson(`${DONKI_BASE}FLR?startDate=${from}&endDate=${to}`),
    getJson(`${DONKI_BASE}SEP?startDate=${from}&endDate=${to}`),
  ]);
  const list = flares ?? [];
  const biggest = [...list].sort((a, b) => flareRank(b.classType) - flareRank(a.classType))[0] ?? null;
  return {
    from,
    to,
    flareCount: list.length,
    biggest: biggest && { classType: biggest.classType, peakTime: biggest.peakTime },
    sepCount: (seps ?? []).length,
  };
}
