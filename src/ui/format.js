import { RESOURCE_BY_ID } from '../data/resources.js';

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmt(n) {
  return Math.floor(n).toLocaleString();
}

/** Inline cost string, e.g. "🔩 40  🪨 20". */
export function costInline(cost) {
  return Object.entries(cost).map(([r, a]) => `${RESOURCE_BY_ID[r].icon} ${a}`).join('&nbsp;&nbsp;');
}

/** Cost "chips", green if you have enough and red if not. */
export function needChips(cost, resources) {
  return Object.entries(cost)
    .map(([r, a]) => {
      const ok = (resources[r] ?? 0) >= a;
      return `<span class="need ${ok ? '' : 'need--no'}">${ok ? '✅' : '❌'} ${RESOURCE_BY_ID[r].icon} ${a}</span>`;
    })
    .join('');
}

const EXTRA_ICONS = { research: '🔬' };

/** "🫁 +9 💧 -3" style list. */
export function rateIcons(map, sign) {
  return Object.entries(map).map(([r, a]) => `${RESOURCE_BY_ID[r]?.icon ?? EXTRA_ICONS[r] ?? r} ${sign}${Math.round(a * 10) / 10}`).join('  ');
}
