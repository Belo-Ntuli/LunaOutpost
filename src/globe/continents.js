import * as THREE from 'three';
import { SECTORS } from '../data/sectors.js';
import { fbm } from './noise.js';

// Builds the 15 sector "continents": raised, organically shaped landmasses on an icosphere,
// separated by dark lowland channels. Pure data (no scene) so it can be unit-tested.
//
// Each sector s has a continuous "landness" field:
//   f_s(p) = (distance to nearest *other* sector seed) - (distance to s's seed) - channelWidth(p)
// Land is where f_s > 0. Triangles are clipped along f_s = 0 (marching triangles), which gives
// smooth coastlines instead of stair-stepped triangle edges.

export const GLOBE_DETAIL = 44;
export const LAND_HEIGHT = 0.035;
export const WALL_BOTTOM = 0.97;
const WARP_STRENGTH = 0.3;
const MIN_CHANNEL = 0.05;
const CHANNEL_VARIATION = 0.09;

export function latLonToVector(lat, lon) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
}

const SEEDS = SECTORS.map((s) => ({ id: s.id, size: s.size, dir: latLonToVector(s.lat, s.lon) }));

/** Warped, size-scaled angular distance from a unit direction to every sector seed. */
function sampleField(dir) {
  const k = 2.2;
  const w = new THREE.Vector3(
    dir.x + (fbm(dir.x * k + 11, dir.y * k, dir.z * k) - 0.5) * WARP_STRENGTH * 2,
    dir.y + (fbm(dir.x * k, dir.y * k + 23, dir.z * k) - 0.5) * WARP_STRENGTH * 2,
    dir.z + (fbm(dir.x * k, dir.y * k, dir.z * k + 37) - 0.5) * WARP_STRENGTH * 2,
  ).normalize();
  const dist = SEEDS.map((s) => Math.acos(THREE.MathUtils.clamp(w.dot(s.dir), -1, 1)) / s.size);
  const channel = MIN_CHANNEL + CHANNEL_VARIATION * fbm(dir.x * 3 + 5, dir.y * 3 + 5, dir.z * 3 + 5);
  let best = 0;
  for (let i = 1; i < dist.length; i++) if (dist[i] < dist[best]) best = i;
  return { dist, channel, best };
}

function landness(field, index) {
  let other = Infinity;
  for (let i = 0; i < field.dist.length; i++) if (i !== index && field.dist[i] < other) other = field.dist[i];
  return other - field.dist[index] - field.channel;
}

/** Returns the sector id owning a unit direction, or 0 for the channels between continents. */
export function sectorAt(dir) {
  const field = sampleField(dir);
  return landness(field, field.best) > 0 ? SEEDS[field.best].id : 0;
}

function landRadius(v) {
  return 1 + LAND_HEIGHT + (fbm(v.x * 5 + 3, v.y * 5 + 3, v.z * 5 + 3) - 0.5) * 0.025;
}

function shade(v) {
  return 0.72 + 0.45 * fbm(v.x * 9 + 1, v.y * 9 + 1, v.z * 9 + 1, 3);
}

const keyOf = (v) => `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;

/** Clips a triangle to the region where values > 0. Returns the polygon (0, 3 or 4 points) and its coast edge. */
function clipTriangle(points, values) {
  const poly = [];
  const coast = [];
  for (let i = 0; i < 3; i++) {
    const a = points[i], b = points[(i + 1) % 3];
    const fa = values[i], fb = values[(i + 1) % 3];
    if (fa > 0) poly.push(a);
    if ((fa > 0) !== (fb > 0)) {
      const p = a.clone().lerp(b, fa / (fa - fb)).normalize();
      poly.push(p);
      coast.push(p);
    }
  }
  return { poly, coast };
}

export function buildContinents(detail = GLOBE_DETAIL) {
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const pos = ico.getAttribute('position');
  const fields = new Map();
  const fieldOf = (v) => {
    const key = keyOf(v);
    let f = fields.get(key);
    if (!f) fields.set(key, (f = sampleField(v)));
    return f;
  };

  const out = SECTORS.map(() => ({ positions: [], colors: [], centroid: new THREE.Vector3(), area: 0 }));
  const color = new THREE.Color();
  const bases = SECTORS.map((s) => new THREE.Color(s.color));

  const push = (bucket, p, base, k) => {
    bucket.positions.push(p.x, p.y, p.z);
    color.copy(base).multiplyScalar(k);
    bucket.colors.push(color.r, color.g, color.b);
  };

  for (let t = 0; t < pos.count; t += 3) {
    const tri = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, t + k).normalize());
    const triFields = tri.map(fieldOf);
    const candidates = new Set(triFields.map((f) => f.best));

    for (const s of candidates) {
      const values = triFields.map((f) => landness(f, s));
      if (values.every((v) => v <= 0)) continue;
      const { poly, coast } = clipTriangle(tri, values);
      if (poly.length < 3) continue;
      const bucket = out[s];
      const base = bases[s];
      const top = poly.map((p) => p.clone().multiplyScalar(landRadius(p)));
      for (let i = 1; i < poly.length - 1; i++) {
        for (const j of [0, i, i + 1]) push(bucket, top[j], base, shade(poly[j]));
      }
      const c = poly.reduce((acc, p) => acc.add(p), new THREE.Vector3());
      bucket.centroid.add(c);
      bucket.area += poly.length - 2;

      // Cliff wall along the coastline so continents read as raised landmasses.
      if (coast.length === 2) {
        const [a, b] = coast;
        const aTop = a.clone().multiplyScalar(landRadius(a));
        const bTop = b.clone().multiplyScalar(landRadius(b));
        const aBot = a.clone().multiplyScalar(WALL_BOTTOM);
        const bBot = b.clone().multiplyScalar(WALL_BOTTOM);
        const outward = a.clone().add(b).multiplyScalar(0.5).sub(c.divideScalar(poly.length));
        const normal = new THREE.Vector3().subVectors(bTop, aTop).cross(new THREE.Vector3().subVectors(aBot, aTop));
        const quad = normal.dot(outward) >= 0 ? [aTop, bTop, aBot, bTop, bBot, aBot] : [aTop, aBot, bTop, bTop, aBot, bBot];
        for (const p of quad) push(bucket, p, base, 0.45);
      }
    }
  }
  ico.dispose();

  return SECTORS.map((s, i) => {
    const b = out[i];
    return {
      sectorId: s.id,
      positions: new Float32Array(b.positions),
      colors: new Float32Array(b.colors),
      center: b.area ? b.centroid.normalize() : latLonToVector(s.lat, s.lon),
      triangles: b.area,
    };
  });
}
