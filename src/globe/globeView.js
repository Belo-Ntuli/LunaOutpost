import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SECTORS } from '../data/sectors.js';
import { esc } from '../ui/format.js';
import { pictureHtml } from '../ui/icons.js';
import { buildContinents } from './continents.js';

const HOVER_LIFT = 1.045;
const ORBIT_DISTANCE = 3.4;
const ZOOM_DISTANCE = 1.45;

const LOCKED_TINT = new THREE.Color('#4a4e58');
const OPEN_TINT = new THREE.Color('#ffffff');

/**
 * 3D overview of the Moon. Emits onHover(sectorId|null, pointer) and onClick(sectorId).
 * Call setSectorStatus() whenever game state changes.
 */
export class GlobeView {
  constructor(container, { onHover, onClick, getCursor }) {
    this.container = container;
    this.onHover = onHover;
    this.onClick = onClick;
    // getCursor({ hovered, dragging }) returns a CSS cursor value (see ui/cursors.js).
    this.getCursor = getCursor;
    this.dragging = false;
    this.cursor = '';
    this.hovered = null;
    this.enabled = true;
    this.status = {};
    this.animation = null;
    this.timer = new THREE.Timer();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    this.camera.position.set(0, 0.6, ORBIT_DISTANCE);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 6;
    this.controls.rotateSpeed = 0.6;

    this.scene.add(new THREE.AmbientLight('#8a93a8', 0.9));
    const sun = new THREE.DirectionalLight('#fff6e8', 2.4);
    sun.position.set(-3, 2, 4);
    this.camera.add(sun);

    this.scene.add(createStars());

    const base = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 64),
      new THREE.MeshStandardMaterial({ color: '#23262e', roughness: 1 }),
    );
    this.scene.add(base);

    this.meshes = [];
    this.centers = {};
    for (const c of buildContinents()) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(c.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(c.colors, 3));
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0, emissive: new THREE.Color('#000000'),
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { sectorId: c.sectorId, lift: 1, glow: 0 };
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.centers[c.sectorId] = c.center;
    }

    this.labels = createLabels(container);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerPx = { x: 0, y: 0 };
    this.pointerInside = false;
    this.downAt = null;

    const el = this.renderer.domElement;
    el.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    el.addEventListener('pointerleave', () => { this.pointerInside = false; this.setHovered(null); });
    el.addEventListener('pointerdown', (e) => { this.downAt = { x: e.clientX, y: e.clientY }; this.dragging = false; });
    el.addEventListener('pointerup', (e) => this.handlePointerUp(e));

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.controls.enabled = enabled && !this.animation;
    this.labels.root.style.display = enabled ? '' : 'none';
    if (!enabled) this.setHovered(null);
  }

  /** status: { [sectorId]: 'locked' | 'open' | 'home' | 'expedition' | 'choose' } */
  setSectorStatus(status) {
    this.status = status;
    for (const mesh of this.meshes) {
      const s = status[mesh.userData.sectorId] ?? 'locked';
      mesh.material.color.copy(s === 'locked' || s === 'expedition' ? LOCKED_TINT : OPEN_TINT);
    }
    for (const sector of SECTORS) {
      const label = this.labels.items[sector.id];
      const s = status[sector.id] ?? 'locked';
      label.className = `globe-label globe-label--${s}`;
      if (s === 'expedition') {
        label.innerHTML = `${pictureHtml('rover', 'ico')} ${esc(sector.name)}`;
      } else {
        const icon = { home: '🚩', locked: '🔒', open: '', choose: '' }[s];
        label.textContent = `${icon ? `${icon} ` : ''}${sector.name}`;
      }
    }
  }

  handlePointerMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.pointerPx = { x: e.clientX, y: e.clientY };
    this.pointerInside = true;
    if (this.downAt && !this.dragging && Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 6) {
      this.dragging = true;
      this.updateCursor();
    }
  }

  handlePointerUp(e) {
    const wasDragging = this.dragging;
    this.dragging = false;
    this.updateCursor();
    if (!this.enabled || this.animation || !this.downAt) return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    this.downAt = null;
    if (wasDragging) return;
    if (moved > 6) return; // was a drag-rotate, not a click
    const id = this.pick();
    if (id) this.onClick?.(id);
  }

  pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
    return hit ? hit.object.userData.sectorId : null;
  }

  setHovered(id) {
    if (this.hovered === id) {
      if (id) this.onHover?.(id, this.pointerPx);
      return;
    }
    this.hovered = id;
    this.updateCursor();
    this.onHover?.(id, this.pointerPx);
  }

  /** Re-evaluates the mouse cursor (call when what the hovered place allows may have changed). */
  updateCursor() {
    const next = this.getCursor?.({ hovered: this.hovered, dragging: this.dragging }) ?? (this.hovered ? 'pointer' : 'grab');
    if (next !== this.cursor) {
      this.cursor = next;
      this.renderer.domElement.style.cursor = next;
    }
  }

  /** Smoothly flies the camera to look straight down at a sector, then calls done(). */
  zoomToSector(id, done) {
    this.setHovered(null);
    this.animateCamera(this.centers[id], ZOOM_DISTANCE, 900, done);
  }

  zoomOut(done) {
    const dir = this.camera.position.clone().normalize();
    this.animateCamera(dir, ORBIT_DISTANCE, 700, done);
  }

  focusSector(id) {
    this.animateCamera(this.centers[id], ORBIT_DISTANCE, 900);
  }

  animateCamera(targetDir, targetDistance, duration, done) {
    const fromDir = this.camera.position.clone().normalize();
    const fromDist = this.camera.position.length();
    const rotation = new THREE.Quaternion().setFromUnitVectors(fromDir, targetDir.clone().normalize());
    this.animation = { rotation, fromDir, fromDist, targetDistance, duration, elapsed: 0, done };
    this.controls.enabled = false;
  }

  stepAnimation(dt) {
    const a = this.animation;
    a.elapsed += dt * 1000;
    const t = Math.min(1, a.elapsed / a.duration);
    const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    const q = new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), a.rotation, e);
    const dist = THREE.MathUtils.lerp(a.fromDist, a.targetDistance, e);
    this.camera.position.copy(a.fromDir).applyQuaternion(q).multiplyScalar(dist);
    this.camera.lookAt(0, 0, 0);
    if (t >= 1) {
      this.animation = null;
      this.controls.enabled = this.enabled;
      a.done?.();
    }
  }

  frame(timestamp) {
    this.timer.update(timestamp);
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const time = this.timer.getElapsed();
    if (this.animation) this.stepAnimation(dt);
    else this.controls.update();

    if (this.enabled && !this.animation && this.pointerInside) this.setHovered(this.pick());

    for (const mesh of this.meshes) {
      const id = mesh.userData.sectorId;
      const isHover = id === this.hovered;
      const target = isHover ? HOVER_LIFT : 1;
      mesh.userData.lift += (target - mesh.userData.lift) * Math.min(1, dt * 12);
      mesh.scale.setScalar(mesh.userData.lift);
      const status = this.status[id];
      let glow = isHover ? 0.32 : 0;
      if (status === 'expedition') glow = Math.max(glow, 0.12 + 0.1 * Math.sin(time * 4));
      if (status === 'home') glow = Math.max(glow, 0.08);
      mesh.material.emissive.set(isHover ? '#7fb8ff' : status === 'expedition' ? '#ffc65c' : '#9fc4ff').multiplyScalar(glow);
    }

    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  }

  updateLabels() {
    if (!this.enabled) return;
    const camDir = this.camera.position.clone().normalize();
    const { clientWidth: w, clientHeight: h } = this.container;
    for (const sector of SECTORS) {
      const label = this.labels.items[sector.id];
      const center = this.centers[sector.id];
      const facing = center.dot(camDir);
      if (facing < 0.35) {
        label.style.opacity = '0';
        continue;
      }
      const p = center.clone().multiplyScalar(1.06).project(this.camera);
      label.style.opacity = String(Math.min(1, (facing - 0.35) * 3));
      label.style.transform = `translate(-50%, -50%) translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
    }
  }
}

function createStars() {
  const count = 1800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 20);
    positions.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.08, sizeAttenuation: true }));
}

function createLabels(container) {
  const root = document.createElement('div');
  root.className = 'globe-labels';
  const items = {};
  for (const s of SECTORS) {
    const el = document.createElement('div');
    el.className = 'globe-label';
    root.appendChild(el);
    items[s.id] = el;
  }
  container.appendChild(root);
  return { root, items };
}
