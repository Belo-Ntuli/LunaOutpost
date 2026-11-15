import { describe, expect, it } from 'vitest';
import { BEST_KEY, SAVE_KEY } from '../src/config.js';
import { createNewGame } from '../src/game/state.js';
import { loadBestDays, loadGame, saveGame } from '../src/game/storage.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

describe('localStorage persistence', () => {
  it('round-trips a saved game and records the best survival day', () => {
    const storage = memoryStorage();
    const state = createNewGame(3);
    state.day = 42;
    expect(saveGame(state, storage)).toBe(true);
    expect(loadGame(storage)).toMatchObject({ day: 42, homeSectorId: 3, population: 7 });
    expect(loadBestDays(storage)).toBe(42);
  });

  it('ignores corrupt or incompatible saves', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{not json');
    expect(loadGame(storage)).toBeNull();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 999, day: 1, sectors: {} }));
    expect(loadGame(storage)).toBeNull();
  });

  it('does not lower the best record', () => {
    const storage = memoryStorage();
    storage.setItem(BEST_KEY, '100');
    saveGame({ ...createNewGame(1), day: 5 }, storage);
    expect(loadBestDays(storage)).toBe(100);
  });
});
