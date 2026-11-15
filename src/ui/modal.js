const $ = (id) => document.getElementById(id);

let onCloseHandler = null;

/**
 * Shows the shared modal. actions: [{ label, className?, disabled?, onClick? }].
 * Clicking an action closes the modal unless its onClick returns false.
 * `art` is a big emoji picture shown above the title.
 */
export function showModal({ art = '', title, body, actions = [{ label: 'OK' }], onClose }) {
  $('modal-art').innerHTML = art; // trusted, from game code
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = body;
  const box = $('modal-actions');
  box.innerHTML = '';
  for (const action of actions) {
    const btn = document.createElement('button');
    btn.className = `btn btn--big ${action.className ?? ''}`;
    btn.textContent = action.label;
    btn.disabled = !!action.disabled;
    btn.addEventListener('click', () => {
      if (action.onClick?.() === false) return;
      closeModal();
    });
    box.appendChild(btn);
  }
  onCloseHandler = onClose ?? null;
  $('modal').classList.remove('hidden');
  [...box.querySelectorAll('button:not(:disabled)')].at(-1)?.focus();
}

export function closeModal() {
  if ($('modal').classList.contains('hidden')) return;
  $('modal').classList.add('hidden');
  const handler = onCloseHandler;
  onCloseHandler = null;
  handler?.();
}

export function isModalOpen() {
  return !$('modal').classList.contains('hidden');
}

export function toast(text, type = 'info', ms = 6000) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = text;
  const box = $('toasts');
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), ms);
}
