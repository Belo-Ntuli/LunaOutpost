import { addDays } from '../game/radiation.js';
import { esc } from './format.js';

// "📡 NASA data" screen: attributes every real dataset the game uses, and says honestly whether the
// numbers were downloaded live just now or come from the built-in copy of the same NASA data.

const niceDate = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const LIVE = '🟢 Downloaded live from NASA for your game';
const BUILT_IN = '📦 Built-in copy of real NASA data (NASA could not be reached)';

/** One-line summary of this week's real space weather, or null while unknown. */
export function realSunLine(recent) {
  if (!recent) return null;
  const big = recent.biggest ? `, biggest ${recent.biggest.classType}` : '';
  return `☀️ The real Sun this week: ${recent.flareCount} solar flare${recent.flareCount === 1 ? '' : 's'}${big} (NASA DONKI, live)`;
}

/**
 * HTML for the NASA data screen. `state` may be null (title screen). `recent` is the live DONKI
 * summary, `null` if it failed, or `undefined` while still loading.
 */
export function nasaDataHtml(state, recent) {
  const rad = state?.radiation;
  const mission = rad
    ? `<p><b>Your mission replays a real month:</b> ${esc(rad.label || 'a real month')} (from ${niceDate(rad.start)} to ${niceDate(addDays(rad.start, rad.daily.length - 1))}).</p>`
    : '<p>Every new game replays a real month from 2012–2017 that had a real solar storm.</p>';
  const radSource = rad ? `<p class="source">${rad.source === 'live' ? LIVE : BUILT_IN}</p>` : '';
  let donkiSource = '';
  if (rad && !rad.donki) donkiSource = '<p class="source">ℹ️ This saved game started before flare data was added. Start a new game to use it.</p>';
  else if (rad) donkiSource = `<p class="source">${rad.donki === 'live' ? LIVE : BUILT_IN}</p>`;
  const storms = (rad?.storms ?? []).filter((s) => s.flare).map((s) => `${s.flare} flare on ${niceDate(s.flareTime ?? s.date)}`);
  const stormLine = storms.length ? `<p>Real flares in your month: <b>${esc(storms.join(', '))}</b>.</p>` : '';
  let sun;
  if (recent === undefined) sun = '<p>☀️ Asking NASA about the real Sun this week…</p>';
  else if (recent === null) sun = '<p>☀️ Could not reach NASA to check the real Sun this week.</p>';
  else {
    sun = `<p>${esc(realSunLine(recent))}.</p><p>${recent.sepCount > 0
      ? `⚠️ There ${recent.sepCount === 1 ? 'was a real particle storm' : `were ${recent.sepCount} real particle storms`} this week. Real Moon bases would be checking their shields!`
      : 'No particle storms this week - a calm week for astronauts.'}</p>`;
  }
  return `<div class="nasa-data">
    <div class="nasa-card">
      <h3>🛰️ Moon radiation - NASA RadLab</h3>
      <p>Measured by <b>CRaTER</b>, an instrument on NASA's <b>Lunar Reconnaissance Orbiter</b>, a spacecraft circling the Moon.</p>
      ${mission}${radSource}
      <p class="what">In the game: decides calm 🟢, normal 🟡 and storm 🔴 days (the 📡 sign).</p>
    </div>
    <div class="nasa-card">
      <h3>☀️ Solar flares - NASA DONKI</h3>
      <p>NASA's space-weather database. It records every big solar flare and particle storm.</p>
      ${stormLine}${donkiSource}
      <p class="what">In the game: names the real flare behind each storm. X flares make strong storms, M flares medium ones.</p>
    </div>
    <div class="nasa-card nasa-card--now">
      <h3>📡 Right now</h3>
      ${sun}
    </div>
    <p class="credits">Sources: NASA Open Science Data Repository RadLab (visualization.osdr.nasa.gov/radlab) · NASA CCMC DONKI (ccmc.gsfc.nasa.gov/tools/DONKI)</p>
  </div>`;
}
