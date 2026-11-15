import { BUILDING_LIST, BUILDINGS } from '../data/buildings.js';
import { canAfford } from '../game/actions.js';
import { generateSectorMap, TERRAIN } from '../game/sectorMap.js';
import { outputMultiplier } from '../game/simulation.js';
import { costInline, esc, needChips, rateIcons } from './format.js';
import { iconHtml } from './icons.js';

const $ = (id) => document.getElementById(id);

// The menu is built once; afterwards only classes change, so buttons are never
// replaced under the cursor while the game clock ticks.
let menuButtons = null;
let menuOnSelect = null;
let menuPlacing = null;

export function renderBuildMenu(state, placingType, onSelect) {
  menuOnSelect = onSelect;
  menuPlacing = placingType;
  if (!menuButtons) {
    const menu = $('build-menu');
    menu.innerHTML = '';
    menuButtons = {};
    for (const def of BUILDING_LIST) {
      const btn = document.createElement('button');
      btn.innerHTML = `<div class="build-item__head"><span class="build-item__icon">${iconHtml(def)}</span><span class="build-item__name">${esc(def.name)}</span></div>
        <div class="build-item__short">${esc(def.short)}</div>
        <div class="build-item__cost">${costInline(def.cost)}</div>`;
      btn.addEventListener('click', () => menuOnSelect(menuPlacing === def.id ? null : def.id));
      menu.appendChild(btn);
      menuButtons[def.id] = btn;
    }
  }
  for (const def of BUILDING_LIST) {
    const affordable = canAfford(state, def.cost);
    menuButtons[def.id].className = `build-item build-item--${def.category} ${placingType === def.id ? 'build-item--active' : ''} ${affordable ? '' : 'build-item--cant'}`;
  }
}

/** Short "what it does" line using icons. */
export function describeBuilding(def) {
  const parts = [];
  if (Object.keys(def.produces).length) parts.push(`Makes ${rateIcons(def.produces, '+')}`);
  if (def.recycles?.water) parts.push(`Saves 💧 +${def.recycles.water}`);
  if (Object.keys(def.consumes).length) parts.push(`Uses ${rateIcons(def.consumes, '-')}`);
  if (def.energyUse) parts.push(`Uses ⚡ -${def.energyUse}`);
  if (def.housing) parts.push(`🛏️ ${def.housing} beds`);
  if (def.energyStorage) parts.push(`🔋 Stores ${def.energyStorage} ⚡`);
  if (def.shielding) parts.push(`🛡️ +${def.shielding * 100}% safe`);
  return parts.join(' · ') + (parts.length ? ' (each day)' : '');
}

let lastCellKey = '';

/** Renders the info box under the build menu. Only touches the DOM when content changes. */
export function renderCellInfo(state, sectorId, cellIndex, placingType, handlers) {
  const { html, action } = cellInfoContent(state, sectorId, cellIndex, placingType);
  const key = JSON.stringify([sectorId, cellIndex, html, !!action]);
  if (key === lastCellKey) return;
  lastCellKey = key;
  const box = $('cell-info');
  box.innerHTML = html;
  if (!html) return;
  const close = document.createElement('button');
  close.className = 'cell-info__close';
  close.title = 'Close';
  close.textContent = '✕';
  close.addEventListener('click', () => handlers.onClose());
  box.appendChild(close);
  if (!action) return;
  const row = document.createElement('div');
  row.className = 'actions';
  const btn = document.createElement('button');
  btn.className = 'btn btn--red';
  btn.textContent = '🗑️ Remove';
  btn.addEventListener('click', () => handlers.onDemolish(cellIndex));
  row.appendChild(btn);
  box.appendChild(row);
}

function cellInfoContent(state, sectorId, cellIndex, placingType) {
  if (placingType && cellIndex === null) {
    const def = BUILDINGS[placingType];
    return {
      html: `<h4>${iconHtml(def)} ${esc(def.name)}</h4><p>${esc(def.short)}</p><p>${describeBuilding(def)}</p>
        <div class="need-list">${needChips(def.cost, state.resources)}</div>`,
      action: false,
    };
  }
  if (cellIndex === null) return { html: '', action: false };
  const terrain = TERRAIN[generateSectorMap(sectorId).cells[cellIndex].terrain];
  const b = state.sectors[sectorId].buildings.find((x) => x.cell === cellIndex);
  if (!b) {
    return { html: `<h4>${terrain.icon} ${esc(terrain.name)}</h4><p>${esc(terrain.description)}</p>`, action: false };
  }
  const def = BUILDINGS[b.type];
  const mult = outputMultiplier(sectorId, b, def, state.day, state.discoveries ?? []);
  let html = `<h4>${iconHtml(def)} ${esc(def.name)}</h4><p>${describeBuilding(def)}</p>`;
  if (Object.keys(def.produces).length) {
    const pct = Math.round(mult * 100);
    html += `<p>${pct === 0 ? '😴 Not working right now (no sunlight).' : `Working at <b>${pct}%</b> here${pct > 100 ? ' 🎉' : ''}.`}</p>`;
  }
  html += `<p class="fact">💡 ${esc(def.fact)}</p>`;
  return { html, action: true };
}
