import { RESOURCES } from '../data/resources.js';
import { BUILDINGS } from '../data/buildings.js';
import { MILESTONES, countUnlocked } from '../data/milestones.js';
import { DISCOVERIES, RESEARCH_PER_DISCOVERY } from '../data/discoveries.js';
import { RADIO_DELAY_SECONDS, ROCKET_TRAVEL_DAYS, SHELTER_ENERGY, SHELTER_SAFETY } from '../config.js';
import { getAdvice } from '../game/advisor.js';
import { radiationOn } from '../game/radiation.js';
import {
  daysUntilPhaseChange,
  getColonyShielding,
  getExpeditionCrew,
  getHousing,
  isLunarDaylight,
} from '../game/state.js';
import { esc, fmt } from './format.js';
import { iconHtml, pictureHtml } from './icons.js';

const $ = (id) => document.getElementById(id);

// Life resources show "days left"; a full bar means 20+ days of supply.
const FULL_DAYS = 20;
const MATERIAL_FULL = 400;

function resourceView(state, report, r) {
  const value = state.resources[r.id];
  const delta = report.deltas[r.id];
  const daysLeft = delta < 0 ? value / -delta : Infinity;
  let fill;
  if (r.id === 'energy') fill = value / report.energyCap;
  else if (r.life) fill = delta < 0 ? daysLeft / FULL_DAYS : value / Math.max(1, state.population * FULL_DAYS);
  else fill = value / MATERIAL_FULL;

  let note;
  let noteClass = '';
  const rate = Math.round(Math.abs(delta) * 10) / 10;
  if (delta < 0 && r.life) {
    const d = Math.floor(daysLeft);
    note = d <= 0 ? 'Empty!' : `⏳ ${d} day${d === 1 ? '' : 's'}`;
    noteClass = 'down';
  } else if (delta < 0) {
    note = `▼ ${rate} a day`;
    noteClass = 'down';
  } else if (delta > 0) {
    note = `▲ ${rate} a day`;
    noteClass = 'up';
  } else {
    note = r.hint;
  }
  const low = (r.life || r.id === 'energy') && delta < 0 && daysLeft < 5;
  const status = !delta ? '' : note === 'Empty!' ? 'Right now: it is EMPTY!' : `Right now: ${note}${delta < 0 && r.life ? ' left' : ''}.`;
  return `<div class="res ${low ? 'res--low' : ''}" style="--c:${r.color}" ${tipAttrs(`${r.icon} ${r.name} - ${r.hint}`, `${r.tip} ${status}`)}>
    <span class="res__icon">${r.icon}</span>
    <div class="res__body">
      <div class="res__top"><span>${esc(r.name)}</span><span>${fmt(value)}</span></div>
      <div class="res__bar"><i style="width:${Math.round(Math.max(0, Math.min(1, fill)) * 100)}%"></i></div>
      <div class="res__note ${noteClass}">${note}</div>
    </div>
  </div>`;
}

/** Hover-card data read by ui/hudTips.js (replaces the browser's plain `title` tooltips). */
function tipAttrs(title, text) {
  return `data-tip-title="${esc(title)}" data-tip="${esc(text)}"`;
}

const RADIATION_LABEL = { calm: 'Calm 🟢', normal: 'Normal 🟡', storm: 'Storm! 🔴' };

/** Today's real Moon radiation (NASA RadLab / CRaTER), if the game has radiation data. */
function radiationPill(state) {
  const rad = radiationOn(state.radiation, state.day);
  if (!rad) return '';
  const how = state.radiation.source === 'live' ? 'downloaded live from NASA RadLab' : 'built-in copy of NASA RadLab data';
  let text = `A real measurement from the past, replayed: on ${rad.date}, NASA's CRaTER instrument near the Moon measured ${rad.dose} microgray per hour (${how}).`;
  if (state.flare?.flare) text += ` The storm on its way was caused by a real ${state.flare.flare} solar flare (NASA DONKI).`;
  text += ' When it says Storm, build Rock Shields 🛡️. More: ☰ menu → 📡 NASA data.';
  return `<div class="pill ${rad.level === 'storm' ? 'pill--bad' : ''}" ${tipAttrs('📡 Space radiation today', text)}>📡 ${RADIATION_LABEL[rad.level]}</div>`;
}

/** Science Lab progress toward the next discovery (only once a lab exists). */
function researchPill(state) {
  const hasLab = Object.values(state.sectors).some((s) => s.buildings.some((b) => b.type === 'lab'));
  if (!hasLab) return '';
  const found = (state.discoveries ?? []).length;
  if (found >= DISCOVERIES.length) {
    return `<div class="pill" ${tipAttrs('🔬 Science', 'Your scientists made every discovery! You can remove the Science Lab to save air and power.')}>🔬 ${found}/${DISCOVERIES.length} ✅</div>`;
  }
  const points = Math.floor(state.resources.research ?? 0);
  return `<div class="pill" ${tipAttrs('🔬 Science', `Your Science Lab does experiments. Every ${RESEARCH_PER_DISCOVERY} research points = a real NASA discovery that makes one machine better. Discoveries: ${found} of ${DISCOVERIES.length}.`)}>🔬 ${points}/${RESEARCH_PER_DISCOVERY}</div>`;
}

/** Storm Shelter switch (only during a storm warning) and Call Earth button (only with a Rocket Pad). */
function renderActions(state) {
  const shelter = $('btn-shelter');
  shelter.classList.toggle('hidden', !state.flare);
  shelter.classList.toggle('is-on', !!state.shelter);
  shelter.textContent = state.shelter ? '🛡️ Shelter ON' : '🛡️ Shelter OFF';
  shelter.dataset.tipTitle = '🛡️ Storm Shelter';
  shelter.dataset.tip = `A solar storm is coming! Turn this on to hide everyone in an extra-safe room: +${SHELTER_SAFETY * 100}% safety when the storm hits, but it uses ${SHELTER_ENERGY} ⚡ every day while ON. It turns off after the storm.`;

  const earth = $('btn-earth');
  const hasPad = Object.values(state.sectors).some((s) => s.buildings.some((b) => b.type === 'pad'));
  earth.classList.toggle('hidden', !hasPad);
  const wait = (state.rocketReadyDay ?? 0) - state.day;
  earth.textContent = state.rocket ? `🚀 Landing in ${state.rocket.daysLeft}d` : wait > 0 ? `🌍 Next rocket ${wait}d` : '📡 Call Earth';
  earth.dataset.tipTitle = '📡 Call Earth';
  earth.dataset.tip = `Ask Earth for a rocket with food, water, metal or astronauts. Your radio call takes ${RADIO_DELAY_SECONDS} seconds to reach Earth. The rocket takes ${ROCKET_TRAVEL_DAYS} days to fly here, so call before you run out!`;
}

// Group labels make six resources read as three systems: life support, power and building.
const GROUP_LABELS = `<div class="res-group res-group--life" style="grid-column: 1 / span 3">❤️ Life support</div>
  <div class="res-group res-group--power" style="grid-column: 4">⚡ Power</div>
  <div class="res-group res-group--build" style="grid-column: 5 / span 2">🏗️ Building</div>`;

export function renderHud(state, report, { paused, speed, progress }) {
  $('hud-resources').innerHTML = GROUP_LABELS + RESOURCES.map((r) => resourceView(state, report, r)).join('');

  const away = getExpeditionCrew(state);
  const beds = getHousing(state);
  const shield = Math.round(getColonyShielding(state) * 100);
  $('hud-crew').innerHTML = `
    <div class="pill" ${tipAttrs('👩‍🚀 Astronauts', `You have ${state.population} astronauts and ${beds} beds. Build a Moon Home for more beds, then a Rocket Pad 🚀 brings new astronauts.`)}>👩‍🚀 ${state.population} <small>/ ${beds} beds</small></div>
    ${away ? `<div class="pill" ${tipAttrs('🧭 Explorers', `${away} astronauts are away exploring. They come back when they arrive.`)}>${pictureHtml('rover', 'ico')} ${away}</div>` : ''}
    <div class="pill ${shield < 50 ? 'pill--bad' : ''}" ${tipAttrs('🛡️ Safety', `Your astronauts are ${shield}% safe from solar storms. Build Rock Shields 🛡️ next to your homes.`)}>🛡️ ${shield}%</div>
    ${radiationPill(state)}
    ${researchPill(state)}`;

  renderActions(state);

  const day = isLunarDaylight(state.day);
  const badge = $('hud-day');
  badge.classList.toggle('night', !day);
  badge.dataset.tipTitle = `📅 Day ${state.day}`;
  badge.dataset.tip = day
    ? 'Daytime: Solar Panels work. A Moon day lasts about 15 Earth days, then night comes!'
    : 'Night: Solar Panels are off. A Moon night lasts about 15 Earth days. Use Batteries 🔋 or Nuclear Power ⚛️.';
  badge.innerHTML = `<b>Day ${state.day}</b><small>${day ? '☀️ Daytime' : '🌙 Night'} · ${daysUntilPhaseChange(state.day)}d to ${day ? 'night' : 'sunrise'}</small>`;
  $('hud-progress-bar').style.width = `${Math.round(progress * 100)}%`;
  $('btn-pause').textContent = paused ? '▶' : '⏸';
  $('btn-pause').dataset.tipTitle = paused ? '▶ Play' : '⏸ Pause';
  $('btn-speed').textContent = `${speed}x`;
}

/** The ultimate mission, always shown: explore all 15 sections of the Moon. */
function bigGoalHtml(state) {
  const goal = MILESTONES.find((m) => m.big);
  const done = countUnlocked(state);
  const won = state.milestones.includes(goal.id);
  return `<li class="goal-big ${won ? 'done' : ''}"><span>${goal.icon}</span><div><small>Big goal</small>${esc(goal.title)}
    <div class="goal-big__bar"><i style="width:${Math.round((done / 15) * 100)}%"></i></div><small>🌕 ${done} / 15 sections${won ? ' - you did it! 🎉' : ''}</small></div></li>`;
}

let lastTip = '';
let lastGoals = '';

/** Astro's tip as HTML: `{buildingId}` / `{rover}` tokens become the same pictures as the build menu. */
function tipHtml(text) {
  return esc(text).replace(/\{(\w+)\}/g, (token, key) =>
    (BUILDINGS[key] ? iconHtml(BUILDINGS[key]) : pictureHtml(key)) || '');
}

export function renderHelper(state, report) {
  const tip = getAdvice(state, report, 1)[0] ?? '🌟 Everything looks great! Try exploring a new place on the Moon {rover}.';
  if (tip !== lastTip) {
    $('astro-text').innerHTML = tipHtml(tip);
    lastTip = tip;
  }

  const done = MILESTONES.filter((m) => state.milestones.includes(m.id)).length;
  const next = MILESTONES.filter((m) => !m.big && !state.milestones.includes(m.id)).slice(0, 3);
  const html = (next.map((m) => `<li><span>${m.image ? pictureHtml(m.image, 'ico') : m.icon}</span>${esc(m.title)}</li>`).join('') ||
    '<li class="done"><span>⭐</span>All small goals done!</li>') + bigGoalHtml(state);
  const key = `${done}|${html}`;
  if (key !== lastGoals) {
    $('goal-count').textContent = `${done}/${MILESTONES.length}`;
    $('goal-list').innerHTML = html;
    lastGoals = key;
  }
}

export function resetPanelCache() {
  lastTip = '';
  lastGoals = '';
}
