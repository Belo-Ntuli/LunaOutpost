import { BEST_KEY, SAVE_KEY, SAVE_VERSION } from '../config.js';

// localStorage persistence. `storage` is injectable for tests.

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function saveGame(state, storage = defaultStorage()) {
  if (!storage || !state) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    if (state.day > loadBestDays(storage)) storage.setItem(BEST_KEY, String(state.day));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(storage = defaultStorage()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (state?.version !== SAVE_VERSION || typeof state.day !== 'number' || !state.sectors) return null;
    return state;
  } catch {
    return null;
  }
}

export function clearSave(storage = defaultStorage()) {
  storage?.removeItem(SAVE_KEY);
}

export function loadBestDays(storage = defaultStorage()) {
  const n = Number(storage?.getItem(BEST_KEY));
  return Number.isFinite(n) ? n : 0;
}
