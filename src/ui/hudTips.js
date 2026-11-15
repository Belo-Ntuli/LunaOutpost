// Hover cards for the top bar. They use the same card style as the Moon hover card, but appear
// neatly *below* the top bar (centred under the item) after a short delay, so they never cover
// the bar itself and don't pop up while the mouse is just passing by.
// Any element with data-tip-title / data-tip inside #hud gets a card.

const SHOW_DELAY_MS = 350;

export function initHudTips(hud, tip) {
  let target = null;
  let timer = null;

  const hide = () => {
    clearTimeout(timer);
    target = null;
    tip.classList.add('hidden');
  };

  const show = () => {
    if (!target?.isConnected) return hide();
    const title = target.dataset.tipTitle ?? '';
    const text = target.dataset.tip ?? '';
    tip.innerHTML = '';
    if (title) tip.appendChild(Object.assign(document.createElement('h4'), { textContent: title }));
    if (text) tip.appendChild(Object.assign(document.createElement('p'), { textContent: text }));
    tip.classList.remove('hidden');
    const r = target.getBoundingClientRect();
    const barBottom = hud.getBoundingClientRect().bottom;
    const x = Math.min(Math.max(10, r.left + r.width / 2 - tip.offsetWidth / 2), window.innerWidth - tip.offsetWidth - 10);
    tip.style.left = `${x}px`;
    tip.style.top = `${barBottom + 10}px`;
    tip.style.setProperty('--arrow-x', `${r.left + r.width / 2 - x}px`);
  };

  hud.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-tip-title], [data-tip]');
    if (!el || !hud.contains(el)) return hide();
    if (el === target) return;
    const wasOpen = !tip.classList.contains('hidden');
    target = el;
    clearTimeout(timer);
    // Moving between items while a card is open switches instantly.
    if (wasOpen) show();
    else timer = setTimeout(show, SHOW_DELAY_MS);
  });
  hud.addEventListener('pointerleave', hide);
  hud.addEventListener('pointerdown', hide);
  window.addEventListener('keydown', hide);
}
