// Real Moon radiation from NASA's RadLab API (CRaTER instrument on the Lunar Reconnaissance Orbiter).
// Pure helpers only: no fetch, no DOM. See src/api/radlab.js for the network part.

export const RADLAB_INSTRUMENT = 'CRaTER-D1D2';
export const RADIATION_WINDOW_DAYS = 30;

// A day counts as a "storm" when its dose is this many times the window's typical (median) dose,
// and as "calm" when it is below CALM_RATIO of it.
export const STORM_RATIO = 2;
export const CALM_RATIO = 0.9;
// Random solar storms are this much less likely on calm days.
export const CALM_FLARE_FACTOR = 0.5;
// Game day on which the first real solar storm starts, and the earliest day a real storm can start.
export const FIRST_STORM_DAY = 12;
export const REAL_STORM_MIN_DAY = 5;

/** Converts a RadLab JSON response ({ columns, data }) into daily mean dose rates (μGy/hour). */
export function dailyMeans(response, startDate, days = RADIATION_WINDOW_DAYS) {
  const tCol = response.columns.indexOf('timestamp');
  const dCol = response.columns.indexOf('absorbed_dose_rate');
  if (tCol < 0 || dCol < 0) throw new Error('RadLab response is missing timestamp or absorbed_dose_rate');
  const sums = new Map();
  for (const row of response.data) {
    const value = Number(row[dCol]);
    if (!Number.isFinite(value) || value <= 0) continue;
    const day = String(row[tCol]).slice(0, 10);
    const s = sums.get(day) ?? { total: 0, n: 0 };
    s.total += value;
    s.n += 1;
    sums.set(day, s);
  }
  const out = [];
  for (let i = 0; i < days; i++) {
    const s = sums.get(addDays(startDate, i));
    out.push(s ? Math.round((s.total / s.n) * 100) / 100 : null);
  }
  return out;
}

export function addDays(isoDate, n) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function median(values) {
  const v = values.filter((x) => x !== null).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : 0;
}

/** Builds the radiation record stored in the game state. Missing days are filled with the median. */
export function makeRadiation({ start, label = '', daily, source }) {
  const typical = median(daily);
  const radiation = {
    source, // 'live' (fetched from RadLab) or 'snapshot' (bundled copy)
    start,
    label,
    typical,
    daily: daily.map((x) => (x === null ? typical : x)),
    offset: 0,
  };
  // Shift the window so its first real storm begins on FIRST_STORM_DAY, giving kids time to build shields.
  const n = radiation.daily.length;
  const onset = radiation.daily.findIndex((_, i) => levelAt(radiation, i) === 'storm' && levelAt(radiation, i - 1) !== 'storm');
  if (onset >= 0) radiation.offset = (((onset - FIRST_STORM_DAY) % n) + n) % n;
  return radiation;
}

function levelAt(radiation, index) {
  const n = radiation.daily.length;
  const dose = radiation.daily[((index % n) + n) % n];
  const ratio = radiation.typical > 0 ? dose / radiation.typical : 1;
  return ratio >= STORM_RATIO ? 'storm' : ratio < CALM_RATIO ? 'calm' : 'normal';
}

/** Real radiation for a game day: { dose, level: 'calm' | 'normal' | 'storm', date }. */
export function radiationOn(radiation, day) {
  if (!radiation?.daily?.length) return null;
  const i = (day + radiation.offset) % radiation.daily.length;
  return { dose: radiation.daily[i], level: levelAt(radiation, i), date: addDays(radiation.start, i) };
}

/** True on the first day of a real storm (the day before was not a storm day). */
export function isStormStart(radiation, day) {
  if (!radiation?.daily?.length) return false;
  const i = day + radiation.offset;
  return levelAt(radiation, i) === 'storm' && levelAt(radiation, i - 1) !== 'storm';
}

// ---------------------------------------------------------------- DONKI (what caused each storm)
//
// NASA's DONKI space-weather database (https://ccmc.gsfc.nasa.gov/tools/DONKI/) records solar flares (FLR)
// and solar energetic particle events (SEP). For each storm onset in the radiation data we look up the
// SEP event on that day and the flare linked to it. The flare's class sets how strong the game storm is.

// Share of *unprotected* astronauts sent home when a storm of this strength hits.
export const STORM_STRENGTH = {
  strong: { label: 'strong', icons: '☢️☢️☢️', loss: 0.3 },
  medium: { label: 'medium', icons: '☢️☢️', loss: 0.2 },
  small: { label: 'small', icons: '☢️', loss: 0.1 },
};

/** Flare class letter → storm strength (X is 10× M, which is 10× C). */
export function strengthFromFlare(classType) {
  const letter = String(classType ?? '').charAt(0).toUpperCase();
  return letter === 'X' ? 'strong' : letter === 'M' ? 'medium' : 'small';
}

const flareRank = (c) => ({ X: 3, M: 2, C: 1 }[String(c).charAt(0)] ?? 0) * 100 + (parseFloat(String(c).slice(1)) || 0);

/** Window-day indexes where a real storm begins. */
export function stormOnsets(radiation) {
  return radiation.daily.map((_, i) => i).filter((i) => levelAt(radiation, i) === 'storm' && levelAt(radiation, i - 1) !== 'storm');
}

/**
 * Matches each storm onset with DONKI events. `flares` / `seps` are DONKI FLR / SEP JSON arrays.
 * Returns [{ index, date, flare, flareTime, sepTime, strength }] (flare is null when none was found).
 */
export function stormCauses(radiation, flares, seps) {
  const flareById = new Map(flares.map((f) => [f.flrID, f]));
  return stormOnsets(radiation).map((index) => {
    const date = addDays(radiation.start, index);
    const from = addDays(date, -1);
    const sep = seps.find((s) => s.eventTime.slice(0, 10) >= from && s.eventTime.slice(0, 10) <= date);
    // Prefer the flare DONKI linked to the particle event; otherwise the biggest flare in the 2 days before.
    let flare = (sep?.linkedEvents ?? []).map((e) => flareById.get(e.activityID)).find(Boolean);
    if (!flare) {
      const near = flares.filter((f) => f.peakTime?.slice(0, 10) >= addDays(date, -2) && f.peakTime.slice(0, 10) <= date);
      flare = near.sort((a, b) => flareRank(b.classType) - flareRank(a.classType))[0];
    }
    return {
      index,
      date,
      flare: flare?.classType ?? null,
      flareTime: flare?.peakTime ?? null,
      sepTime: sep?.eventTime ?? null,
      strength: flare ? strengthFromFlare(flare.classType) : 'small',
    };
  });
}

/** The DONKI cause for a storm starting on this game day, if known. */
export function stormCauseOn(radiation, day) {
  if (!radiation?.storms?.length) return null;
  const i = (day + radiation.offset) % radiation.daily.length;
  return radiation.storms.find((s) => s.index === i) ?? null;
}
