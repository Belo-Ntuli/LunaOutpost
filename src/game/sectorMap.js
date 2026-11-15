import { getSector } from '../data/sectors.js';
import { createRng, hashString } from './rng.js';

// Each sector's 2D map is a pointy-top hex grid in "odd-r" offset layout.
// Kept small so hexes are big and easy to click for young players.
export const MAP_COLS = 9;
export const MAP_ROWS = 6;
export const HOME_CELL = Math.floor(MAP_ROWS / 2) * MAP_COLS + Math.floor(MAP_COLS / 2);

const SPECIAL_FRACTION = 0.38;

export const TERRAIN = {
  plain: { id: 'plain', name: 'Flat ground', icon: '', buildable: true, color: '#8d8a84', description: 'Good for building anything.' },
  ice: { id: 'ice', name: 'Ice', icon: '🧊', buildable: true, color: '#a8d8f0', description: 'Ice Drills make extra water here!' },
  ore: { id: 'ore', name: 'Metal rocks', icon: '🔩', buildable: true, color: '#b08d6a', description: 'Metal Makers make extra metal here!' },
  peak: { id: 'peak', name: 'Sunny hill', icon: '⛰️', buildable: true, color: '#e0d9b8', description: 'Solar Panels make extra power here!' },
  tube: { id: 'tube', name: 'Lava cave', icon: '🕳️', buildable: true, color: '#5d4e48', description: 'A Moon Home here is safe from radiation!' },
  crater: { id: 'crater', name: 'Crater', icon: '', buildable: false, color: '#4a4a50', description: 'Too steep - you can\'t build here.' },
};

const cache = new Map();

export function generateSectorMap(sectorId) {
  if (cache.has(sectorId)) return cache.get(sectorId);
  const sector = getSector(sectorId);
  const rng = createRng(hashString(`luna-sector-${sectorId}`));
  const weights = Object.entries(sector.terrain).filter(([, w]) => w > 0);
  const total = weights.reduce((sum, [, w]) => sum + w, 0);

  const cells = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const index = row * MAP_COLS + col;
      let terrain = 'plain';
      if (index !== HOME_CELL && total > 0 && rng() < SPECIAL_FRACTION) {
        let pick = rng() * total;
        for (const [type, w] of weights) {
          pick -= w;
          if (pick <= 0) {
            terrain = type;
            break;
          }
        }
      }
      cells.push({ index, col, row, terrain });
    }
  }
  const map = { sectorId, cols: MAP_COLS, rows: MAP_ROWS, cells };
  cache.set(sectorId, map);
  return map;
}

export function getCellTerrain(sectorId, cellIndex) {
  return generateSectorMap(sectorId).cells[cellIndex]?.terrain ?? 'plain';
}
