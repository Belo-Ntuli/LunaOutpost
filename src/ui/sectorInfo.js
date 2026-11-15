import { getSector } from '../data/sectors.js';
import { checkExpedition } from '../game/actions.js';
import { getCrewAtBase, getUnlockCost } from '../game/state.js';
import { esc, needChips } from './format.js';

const starCount = (v) => (v <= 0 ? 0 : v < 0.8 ? 1 : v < 1.3 ? 2 : 3);
const stars = (v) => {
  const n = starCount(v);
  return n === 0 ? '—' : `${'★'.repeat(n)}<span class="star-off">${'★'.repeat(3 - n)}</span>`;
};

/** Star ratings for a sector's resources, e.g. ☀️ Sun ★★★ (no night!). */
export function sectorStars(sectorId) {
  const t = getSector(sectorId).traits;
  const sun = t.sunlight === 0 ? '— always dark!' : `${stars(t.sunlight)}${t.constantSun ? ' <small>no night!</small>' : ''}`;
  const rows = [
    ['☀️ Sun', sun],
    ['🧊 Ice', stars(t.ice)],
    ['🔩 Metal', stars(t.metal)],
    ['🪨 Dirt', stars(t.regolith)],
  ];
  if (t.shielding > 0) rows.push(['🛡️ Safe', stars(t.shielding * 4)]);
  return `<div class="stars">${rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>`;
}

/** What you need to explore a locked sector, as green/red chips. */
export function expeditionNeeds(state, sectorId) {
  const cost = getUnlockCost(state, sectorId);
  const free = Math.max(0, getCrewAtBase(state) - 1);
  const crewOk = free >= cost.crew;
  return `<div class="need-list">${needChips(cost.resources, state.resources)}
    <span class="need ${crewOk ? '' : 'need--no'}">${crewOk ? '✅' : '❌'} 👩‍🚀 ${cost.crew}</span>
    <span class="need">⏱️ ${cost.days} days</span></div>`;
}

/** HTML for the globe hover card. mode: 'choose' while picking a landing site. */
export function sectorTooltip(state, sectorId, mode) {
  const s = getSector(sectorId);
  let status;
  if (mode === 'choose') {
    status = '<div class="status status--go">👆 Click to land here!</div>';
  } else {
    const sec = state.sectors[sectorId];
    const exp = state.expeditions.find((e) => e.sectorId === sectorId);
    if (sec.unlocked) {
      status = `<div class="status status--go">${sectorId === state.homeSectorId ? '🚩 Your home base!' : '✅ Explored!'} Click to build</div>`;
    } else if (exp) {
      status = `<div class="status status--wait">🚙 Explorers arrive in ${exp.daysLeft} day${exp.daysLeft === 1 ? '' : 's'}</div>`;
    } else {
      const ok = checkExpedition(state, sectorId).ok;
      status = `<div class="status ${ok ? 'status--go' : 'status--wait'}">🔒 To explore you need:${expeditionNeeds(state, sectorId)}
        <div style="margin-top:8px">${ok ? '👆 Click to send explorers!' : '⏳ Keep building to get more!'}</div></div>`;
    }
  }
  return `<h4>${esc(s.name)}</h4>
    <div>${esc(s.summary)}</div>
    ${sectorStars(sectorId)}
    <p class="fact">💡 ${esc(s.science)}</p>
    ${status}`;
}
