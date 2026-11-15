import { describe, expect, it } from 'vitest';
import { SECTORS } from '../src/data/sectors.js';
import { buildContinents, latLonToVector, sectorAt } from '../src/globe/continents.js';

describe('moon continents', () => {
  it('gives every one of the 15 sectors its own landmass', () => {
    const continents = buildContinents(16);
    expect(continents).toHaveLength(15);
    for (const c of continents) {
      expect(c.triangles).toBeGreaterThan(0);
      expect(c.positions.length).toBe(c.colors.length);
    }
  });

  it('places each sector around its own lat/lon and leaves channels between continents', () => {
    for (const s of SECTORS) expect(sectorAt(latLonToVector(s.lat, s.lon))).toBe(s.id);
    let channels = 0;
    for (let lat = -80; lat <= 80; lat += 4) {
      for (let lon = 0; lon < 360; lon += 4) if (sectorAt(latLonToVector(lat, lon)) === 0) channels++;
    }
    expect(channels).toBeGreaterThan(0);
  });
});
