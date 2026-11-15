import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles.css';
import { RADIO_DELAY_SECONDS, ROCKET_CARGOS, ROCKET_COOLDOWN_DAYS, ROCKET_TRAVEL_DAYS, SECONDS_PER_DAY, SPEEDS, STARTING_POPULATION } from './config.js';
import { DISCOVERY_BY_ID } from './data/discoveries.js';
import { BUILDINGS } from './data/buildings.js';
import { EVENT_CARDS, INTRO_CARDS } from './data/learn.js';
import { SECTORS, getSector } from './data/sectors.js';
import { build, checkBuild, checkExpedition, checkRocket, demolish, requestRocket, setShelter, startExpedition } from './game/actions.js';
import { advanceDay, computeDay } from './game/simulation.js';
import { createNewGame, getSectorShielding, sunlightFactor, withArticle } from './game/state.js';
import { loadRadiation, pickWindow, snapshotRadiation } from './api/radlab.js';
import { fetchRecentSpaceWeather } from './api/donki.js';
import { nasaDataHtml, realSunLine } from './ui/nasaData.js';
import { clearSave, loadBestDays, loadGame, saveGame } from './game/storage.js';
import { generateSectorMap, TERRAIN } from './game/sectorMap.js';
import { GlobeView } from './globe/globeView.js';
import { SectorView } from './sector/sectorView.js';
import { esc } from './ui/format.js';
import { renderHelper, renderHud, resetPanelCache } from './ui/hud.js';
import { closeModal, isModalOpen, showModal, toast } from './ui/modal.js';
import { initHudTips } from './ui/hudTips.js';
import { CURSORS, emojiCursor, imageCursor, installCursorVariables } from './ui/cursors.js';
import { buildingImage, iconHtml, pictureHtml, preloadBuildingImages } from './ui/icons.js';
import { renderBuildMenu, renderCellInfo } from './ui/sectorPanel.js';
import { expeditionNeeds, sectorStars, sectorTooltip } from './ui/sectorInfo.js';

const $ = (id) => document.getElementById(id);

const app = {
  state: null,
  mode: 'title', // title | spawn | globe | sector | transition
  paused: true,
  speed: SPEEDS[0],
  dayTimer: 0,
  sectorId: null,
  placingType: null,
  selectedCell: null,
  report: null,
  learnQueue: [],
};

let globe;
let sectorView;

function init() {
  installCursorVariables();
  preloadBuildingImages(Object.values(BUILDINGS));
  for (const el of document.querySelectorAll('[data-picture]')) el.innerHTML = pictureHtml(el.dataset.picture, 'ico') || el.innerHTML;
  globe = new GlobeView($('globe'), { onHover: handleGlobeHover, onClick: handleGlobeClick, getCursor: globeCursor });
  sectorView = new SectorView($('sector-canvas'), {
    getView: () => ({
      state: app.state,
      sectorId: app.sectorId,
      selectedCell: app.selectedCell,
      placingType: app.placingType,
      canPlace: (cell) => checkBuild(app.state, app.sectorId, cell, app.placingType).ok,
    }),
    onCellClick: handleCellClick,
    onCellHover: updateSectorHint,
  });

  // Keep the layout below the (wrapping) top bar.
  new ResizeObserver(() => {
    const h = $('hud').classList.contains('hidden') ? 0 : $('hud').offsetHeight;
    document.documentElement.style.setProperty('--top', `${h}px`);
    sectorView.running && sectorView.resize();
  }).observe($('hud'));

  app.state = loadGame();
  bindControls();
  initHudTips($('hud'), $('hud-tip'));
  // Live "real Sun this week" from NASA DONKI (shown on the title screen and the NASA data screen).
  fetchRecentSpaceWeather()
    .then((r) => { recentWeather = r; })
    .catch(() => { recentWeather = null; })
    .finally(() => { $('real-sun').textContent = realSunLine(recentWeather) ?? ''; });
  setMode('title');
  $('loading').classList.add('hidden');

  let last = performance.now();
  const loop = (now) => {
    tick(Math.min(0.25, (now - last) / 1000));
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- game clock

const inPlay = () => app.mode === 'globe' || app.mode === 'sector';

function clockRunning() {
  return app.state && !app.state.gameOver && !app.paused && !isModalOpen() && inPlay();
}

function tick(dt) {
  if (app.learnQueue.length && inPlay() && !isModalOpen()) showLearnCard(app.learnQueue.shift());
  if (!clockRunning()) return;
  app.dayTimer += dt * app.speed;
  while (app.dayTimer >= SECONDS_PER_DAY) {
    app.dayTimer -= SECONDS_PER_DAY;
    onDayAdvanced(advanceDay(app.state));
    if (!clockRunning()) break;
  }
  $('hud-progress-bar').style.width = `${Math.round((app.dayTimer / SECONDS_PER_DAY) * 100)}%`;
}

function onDayAdvanced(entries) {
  entries.filter((e) => e.type !== 'info').slice(-2).forEach((e) => toast(e.text, e.type));
  for (const e of entries) {
    if (EVENT_CARDS[e.event]) queueLearn(e.event, EVENT_CARDS[e.event]);
    const discovery = e.event?.startsWith('discovery:') && DISCOVERY_BY_ID[e.event.slice('discovery:'.length)];
    if (discovery) {
      queueLearn(`disc:${discovery.id}`, {
        art: `${discovery.icon}🔬`,
        title: `Discovery: ${discovery.title}!`,
        text: `${discovery.fact} ⭐ Bonus: ${discovery.bonus} (Real NASA research: ${discovery.source}.)`,
      });
    }
  }
  saveGame(app.state);
  refresh();
  if (app.state.gameOver) showGameOver();
  else if (app.state.victory && !app.state.victoryShown) showVictory();
}

function setPaused(paused) {
  app.paused = paused;
  if (paused && app.state) saveGame(app.state);
  refresh();
}

// ---------------------------------------------------------------- learning cards

/** Queues a "Did you know?" card once per game. */
function queueLearn(id, card) {
  if (!app.state || app.state.learned.includes(id)) return;
  app.state.learned.push(id);
  app.learnQueue.push(card);
  saveGame(app.state);
}

function showLearnCard(card) {
  showModal({
    art: card.image ? pictureHtml(card.image, 'ico ico--art') : card.art,
    title: card.title,
    body: `${card.tag === false ? '' : '<span class="learn-tag">💡 Did you know?</span>'}<p>${esc(card.text)}</p>`,
    actions: [{ label: card.button ?? 'Got it! 👍', className: 'btn--green' }],
  });
}

// ---------------------------------------------------------------- modes

function setMode(mode) {
  app.mode = mode;
  document.body.dataset.mode = mode;
  const inGame = mode === 'globe' || mode === 'sector' || mode === 'transition';
  $('title-screen').classList.toggle('hidden', mode !== 'title');
  $('spawn-banner').classList.toggle('hidden', mode !== 'spawn');
  $('hud').classList.toggle('hidden', !inGame);
  $('goals').classList.toggle('hidden', mode !== 'globe');
  $('astro').classList.toggle('hidden', !inPlay());
  $('sector-screen').classList.toggle('hidden', mode !== 'sector');
  globe.setEnabled(mode === 'globe' || mode === 'spawn');
  globe.controls.autoRotate = mode === 'title';
  globe.controls.autoRotateSpeed = 0.6;
  hideTooltip();

  if (mode === 'title') {
    $('btn-continue').classList.toggle('hidden', !app.state || app.state.gameOver);
    const best = loadBestDays();
    $('best-days').textContent = best ? `🏆 Your record: ${best} days` : '';
  }
  if (mode === 'sector') sectorView.start();
  else sectorView.stop();
  refresh();
}

function refresh() {
  if (!globe) return;
  if (app.mode === 'spawn' || app.mode === 'title' || !app.state) {
    globe.setSectorStatus(Object.fromEntries(SECTORS.map((s) => [s.id, app.mode === 'spawn' ? 'choose' : 'open'])));
    $('pause-badge').classList.add('hidden');
    return;
  }
  const { state } = app;
  app.report = computeDay(state);
  renderHud(state, app.report, { paused: app.paused, speed: app.speed, progress: app.dayTimer / SECONDS_PER_DAY });
  renderHelper(state, app.report);
  $('pause-badge').classList.toggle('hidden', !app.paused || state.gameOver || !inPlay());
  document.body.dataset.paused = String(app.paused && !state.gameOver);
  globe.setSectorStatus(Object.fromEntries(SECTORS.map((s) => {
    const sec = state.sectors[s.id];
    if (s.id === state.homeSectorId) return [s.id, 'home'];
    if (sec.unlocked) return [s.id, 'open'];
    if (state.expeditions.some((e) => e.sectorId === s.id)) return [s.id, 'expedition'];
    return [s.id, 'locked'];
  })));
  if (globe.hovered) handleGlobeHover(globe.hovered, lastPointer);
  globe.updateCursor();
  if (app.mode === 'sector') refreshSectorScreen();
}

// ---------------------------------------------------------------- globe

let lastPointer = { x: 0, y: 0 };

function handleGlobeHover(id, pointer) {
  if (pointer) lastPointer = pointer;
  if (!id || (app.mode !== 'globe' && app.mode !== 'spawn') || isModalOpen()) return hideTooltip();
  const tip = $('tooltip');
  tip.innerHTML = sectorTooltip(app.state, id, app.mode === 'spawn' ? 'choose' : 'play');
  tip.classList.remove('hidden');
  const { innerWidth: w, innerHeight: h } = window;
  const x = Math.min(lastPointer.x + 22, w - tip.offsetWidth - 10);
  const y = Math.min(lastPointer.y + 22, h - tip.offsetHeight - 10);
  tip.style.left = `${Math.max(10, x)}px`;
  tip.style.top = `${Math.max(10, y)}px`;
}

function hideTooltip() {
  $('tooltip').classList.add('hidden');
}

function handleGlobeClick(id) {
  const sector = getSector(id);
  if (app.mode === 'spawn') {
    hideTooltip();
    showModal({
      art: '🚀',
      title: `Land in ${sector.name}?`,
      body: `<p>${esc(sector.summary)}</p>${sectorStars(id)}<p>Your ${STARTING_POPULATION} astronauts will get a Moon Home (a base tent to live in) here.</p>`,
      actions: [
        { label: '↩ Pick another' },
        { label: '🚀 Land here!', className: 'btn--green', onClick: () => startNewGame(id) },
      ],
    });
    return;
  }
  if (app.mode !== 'globe') return;
  const { state } = app;
  if (state.sectors[id].unlocked) return enterSector(id);
  const exp = state.expeditions.find((e) => e.sectorId === id);
  if (exp) return toast(`🧭 The explorers reach ${sector.name} in ${exp.daysLeft} day(s).`);
  showExpeditionModal(id);
}

function showExpeditionModal(id) {
  const sector = getSector(id);
  const check = checkExpedition(app.state, id);
  hideTooltip();
  showModal({
    art: pictureHtml('rover', 'ico ico--art'),
    title: `Explore ${sector.name}?`,
    body: `<p>${esc(sector.summary)}</p>${sectorStars(id)}<p>To send explorers you need:</p>${expeditionNeeds(app.state, id)}
      ${check.ok ? '' : `<p style="color:var(--red)">${esc(check.reason)}</p>`}`,
    actions: [
      { label: 'Not now' },
      {
        label: '🧭 Send explorers!',
        className: 'btn--green',
        disabled: !check.ok,
        onClick: () => {
          const res = startExpedition(app.state, id);
          if (res.ok) queueLearn('expedition', EVENT_CARDS.expedition);
          else toast(res.reason, 'warning');
          saveGame(app.state);
          refresh();
        },
      },
    ],
  });
}

function startNewGame(sectorId) {
  clearSave();
  // Real NASA radiation data: use the live RadLab download if it finished, otherwise the bundled copy.
  const radiation = prefetchedRadiation ?? snapshotRadiation(pickWindow().start);
  prefetchedRadiation = null;
  app.state = createNewGame(sectorId, radiation);
  app.dayTimer = 0;
  app.paused = true;
  app.learnQueue = [];
  resetPanelCache();
  INTRO_CARDS.forEach((card, i) => queueLearn(`intro-${i}`, {
    ...card, tag: false, button: i === INTRO_CARDS.length - 1 ? "Let's go! 🚀" : 'Next ➜',
  }));
  queueLearn('radlab', EVENT_CARDS.radlab);
  saveGame(app.state);
  // Fly straight down into the new base so kids can start building right away.
  enterSector(sectorId);
}

// ---------------------------------------------------------------- sector (2D)

function enterSector(id) {
  app.sectorId = id;
  app.placingType = null;
  app.selectedCell = null;
  setMode('transition');
  globe.zoomToSector(id, () => setMode('sector'));
}

function exitSector() {
  app.placingType = null;
  app.selectedCell = null;
  setMode('transition');
  $('sector-screen').classList.add('hidden');
  globe.zoomOut(() => setMode('globe'));
}

function refreshSectorScreen() {
  const { state, sectorId } = app;
  const sector = getSector(sectorId);
  const sun = sunlightFactor(sectorId, state.day);
  $('sector-title').textContent = `${sectorId === state.homeSectorId ? '🚩 ' : ''}${sector.name}`;
  const light = $('sector-light');
  light.classList.toggle('night', sun === 0);
  light.textContent = sector.traits.sunlight === 0
    ? '🌑 Always dark - no solar power'
    : sun > 0 ? '☀️ Sunny' : '🌙 Night - solar panels off';
  light.title = `Rock Shield safety here: ${Math.round(getSectorShielding(state, sectorId) * 100)}%`;
  renderBuildMenu(state, app.placingType, selectBuildType);
  renderCellInfo(state, sectorId, app.selectedCell, app.placingType, { onDemolish: handleDemolish, onClose: () => selectBuildType(null) });
  updateSectorHint(sectorView.hoverCell);
}

function selectBuildType(type) {
  app.placingType = type;
  app.selectedCell = null;
  refreshSectorScreen();
}

function handleCellClick(cell) {
  const { state, sectorId } = app;
  if (app.placingType) {
    const type = app.placingType;
    const res = build(state, sectorId, cell, type);
    if (!res.ok) {
      toast(res.reason, 'warning');
    } else {
      const def = BUILDINGS[type];
      queueLearn(`b:${type}`, { art: iconHtml(def, 'ico ico--art'), title: `You built ${withArticle(def.name)}!`, text: def.fact });
      saveGame(state);
    }
    refresh();
    return;
  }
  app.selectedCell = cell;
  refreshSectorScreen();
}

function updateSectorHint(cell) {
  const hint = $('sector-hint');
  if (!app.state || app.mode !== 'sector') return;
  const canvas = $('sector-canvas');
  if (app.placingType) {
    const def = BUILDINGS[app.placingType];
    const check = cell === null || cell === undefined ? null : checkBuild(app.state, app.sectorId, cell, app.placingType);
    hint.innerHTML = check
      ? (check.ok ? `${iconHtml(def)} Click to build here!` : `❌ ${esc(check.reason)}`)
      : `${iconHtml(def)} Pick a spot for your ${esc(def.name)}`;
    // While building, the cursor *is* the machine (or 🚫 on a spot where it can't go).
    canvas.style.cursor = check && !check.ok ? CURSORS.no
      : def.image ? imageCursor(buildingImage(def), def.image) : emojiCursor(def.icon, [0.5, 0.5], 'crosshair');
    return;
  }
  if (cell === null || cell === undefined) {
    hint.textContent = '👉 Pick a machine on the right, then click a hexagon';
    canvas.style.cursor = CURSORS.default;
    return;
  }
  const terrain = TERRAIN[generateSectorMap(app.sectorId).cells[cell].terrain];
  const b = app.state.sectors[app.sectorId].buildings.find((x) => x.cell === cell);
  hint.innerHTML = b ? `${iconHtml(BUILDINGS[b.type])} ${esc(BUILDINGS[b.type].name)}` : esc(`${terrain.icon} ${terrain.name}: ${terrain.description}`);
  canvas.style.cursor = b || terrain.buildable ? CURSORS.pointer : CURSORS.default;
}

/** Globe cursor: shows what clicking the hovered place will do. */
function globeCursor({ hovered, dragging }) {
  if (dragging) return CURSORS.grabbing;
  if (!hovered) return CURSORS.grab;
  if (app.mode === 'spawn') return CURSORS.land;
  if (app.mode !== 'globe' || !app.state) return CURSORS.pointer;
  const { state } = app;
  if (state.sectors[hovered].unlocked) return CURSORS.zoom;
  if (state.expeditions.some((e) => e.sectorId === hovered)) return CURSORS.waiting;
  return checkExpedition(state, hovered).ok ? CURSORS.explore : CURSORS.locked;
}

function handleDemolish(cell) {
  const b = app.state.sectors[app.sectorId].buildings.find((x) => x.cell === cell);
  if (!b) return;
  const def = BUILDINGS[b.type];
  showModal({
    art: '🗑️',
    title: `Remove the ${def.name}?`,
    body: '<p>You get half of the materials back.</p>',
    actions: [
      { label: 'Keep it' },
      {
        label: 'Remove',
        className: 'btn--red',
        onClick: () => {
          const res = demolish(app.state, app.sectorId, cell);
          if (!res.ok) toast(res.reason, 'warning');
          else app.selectedCell = null;
          saveGame(app.state);
          refresh();
        },
      },
    ],
  });
}

// ---------------------------------------------------------------- Call Earth & Storm Shelter

const cargoLabel = (cargo) => (cargo.give ? `${Object.values(cargo.give)[0]} ${cargo.name}` : cargo.name);

/** Call Earth for a supply rocket (needs a Rocket Pad). Teaches radio delay and travel time. */
function showCallEarth() {
  const s = app.state;
  const intro = `<p>📡 Your radio call travels at the speed of light. It takes about <b>${RADIO_DELAY_SECONDS} seconds</b> to reach Earth.</p>
    <p>🚀 The rocket then takes <b>${ROCKET_TRAVEL_DAYS} days</b> to fly here. After it lands, Earth needs ${ROCKET_COOLDOWN_DAYS} days to get the next one ready.</p>`;
  const general = checkRocket(s, 'food');
  if (!general.ok) {
    showModal({ art: '🚀', title: 'Call Earth', body: `${intro}<p><b>${esc(general.reason)}</b></p>`, actions: [{ label: 'OK 👍', className: 'btn--green' }] });
    return;
  }
  const crewBlocked = !checkRocket(s, 'crew').ok;
  showModal({
    art: '📡🌍',
    title: 'Call Earth for a rocket',
    body: `${intro}<p><b>What should Earth send?</b>${crewBlocked ? '<br><small>👩‍🚀 New astronauts need free beds - build a Moon Home first.</small>' : ''}</p>`,
    actions: [
      ...ROCKET_CARGOS.map((cargo) => ({
        label: `${cargo.icon} ${cargoLabel(cargo)}`,
        className: 'btn--blue',
        disabled: !checkRocket(s, cargo.id).ok,
        onClick: () => { sendCall(cargo); return false; },
      })),
      { label: 'Not now' },
    ],
  });
}

/** Plays the real radio delay (1.3 s to Earth, 1.3 s back), then launches the rocket. */
function sendCall(cargo) {
  const ms = RADIO_DELAY_SECONDS * 1000;
  const bar = (text) => `<p>${text}</p><div class="radio"><i style="animation-duration:${ms}ms"></i></div>`;
  showModal({ art: '📡', title: 'Calling Earth…', body: bar(`Your message is flying to Earth at the speed of light (${RADIO_DELAY_SECONDS} s)…`), actions: [] });
  setTimeout(() => {
    showModal({ art: '🌍', title: 'Earth is answering…', body: bar(`Earth's reply is flying back to the Moon (${RADIO_DELAY_SECONDS} s)…`), actions: [] });
    setTimeout(() => {
      const res = requestRocket(app.state, cargo.id);
      saveGame(app.state);
      refresh();
      showModal({
        art: res.ok ? '🚀' : '😕',
        title: res.ok ? 'Earth says: "Rocket launched!"' : 'Earth says: "Sorry!"',
        body: `<p>${res.ok ? `Your ${cargo.icon} ${cargoLabel(cargo).toLowerCase()} will land in ${ROCKET_TRAVEL_DAYS} days.` : esc(res.reason)}</p>
          <p class="fact">💡 That call took ${RADIO_DELAY_SECONDS * 2} seconds there and back. From Mars, the same call could take up to 44 minutes!</p>`,
        actions: [{ label: 'Great! 👍', className: 'btn--green' }],
      });
      if (res.ok) queueLearn('call-earth', EVENT_CARDS['call-earth']);
    }, ms);
  }, ms);
}

function toggleShelter() {
  const res = setShelter(app.state, !app.state.shelter);
  if (!res.ok) toast(res.reason, 'warning');
  else if (app.state.shelter) queueLearn('shelter', EVENT_CARDS.shelter);
  saveGame(app.state);
  refresh();
}

// ---------------------------------------------------------------- menus & end states

let recentWeather; // undefined = loading, null = failed, object = live DONKI summary

/** Shows which real NASA datasets the game uses, and whether they were loaded live. */
function showNasaData() {
  showModal({
    art: '📡',
    title: 'Real NASA data in this game',
    body: nasaDataHtml(app.state, recentWeather),
    actions: [{ label: 'Cool! 👍', className: 'btn--green' }],
  });
}

function showMenu() {
  showModal({
    art: '📖',
    title: 'How to play',
    body: `<p>🫁 💧 🥔 Keep the <b>air, water and food</b> bars full.</p>
      <p>⚡ Machines need <b>power</b>. Solar Panels stop at night!</p>
      <p>🔩 🪨 Use <b>metal and Moon dirt</b> to build.</p>
      <p>🔒 Point at a locked place to see what you need to explore it.</p>
      <p>☢️ Solar storm coming? Build 🛡️ Rock Shields, or switch on the Storm Shelter (uses power).</p>
      <p>📡 With a Rocket Pad, call Earth for help. Rockets take 3 days, so call early!</p>
      <p>🔬 A Science Lab breathes air but makes discoveries that improve your machines.</p>
      <p>Your game saves by itself. 💾</p>`,
    actions: [
      { label: '📡 NASA data', className: 'btn--blue', onClick: () => { showNasaData(); return false; } },
      { label: '🌕 Main menu', onClick: () => { saveGame(app.state); if (app.mode === 'sector') { $('sector-screen').classList.add('hidden'); globe.zoomOut(); } setMode('title'); } },
      { label: '🔄 New game', className: 'btn--red', onClick: () => { confirmNewGame(); return false; } },
      { label: '▶ Keep playing', className: 'btn--green' },
    ],
  });
}

function confirmNewGame() {
  showModal({
    art: '🤔',
    title: 'Start a new game?',
    body: '<p>Your Moon base will be gone. Your best record stays!</p>',
    actions: [{ label: 'No, go back' }, { label: 'Yes, start over', className: 'btn--red', onClick: beginSpawn }],
  });
}

let prefetchedRadiation = null;

function beginSpawn() {
  if (app.mode === 'sector') $('sector-screen').classList.add('hidden');
  app.state = null;
  app.learnQueue = [];
  clearSave();
  // Start downloading real radiation data while the player picks a landing place.
  prefetchedRadiation = null;
  loadRadiation().then((r) => { prefetchedRadiation = r; });
  setMode('spawn');
}

function showGameOver() {
  const s = app.state;
  const best = Math.max(loadBestDays(), s.day);
  showModal({
    art: '🌑',
    title: 'Mission over!',
    body: `<p>Your Moon base lasted <b>${s.day} days</b>.</p>
      <p>⭐ Goals: ${s.milestones.length} · 🗺️ Places explored: ${Object.values(s.sectors).filter((x) => x.unlocked).length}/15</p>
      <p>🏆 Your record: ${best} days</p>
      <p class="fact">💡 Real space engineers plan for air, water, food, power AND safety. What will you build first next time?</p>`,
    actions: [{ label: 'Look around' }, { label: '🚀 Try again!', className: 'btn--green', onClick: beginSpawn }],
  });
}

function showVictory() {
  app.state.victoryShown = true;
  saveGame(app.state);
  showModal({
    art: '🏆',
    title: 'You explored the whole Moon!',
    body: `<p>Amazing! You did it in ${app.state.day} days with ${app.state.population} astronauts.</p><p>Keep playing to see how long your Moon town can last!</p>`,
    actions: [{ label: 'Keep playing 🚀', className: 'btn--green' }],
  });
}

// ---------------------------------------------------------------- input

function bindControls() {
  $('btn-new').addEventListener('click', () => (app.state && !app.state.gameOver ? confirmNewGame() : beginSpawn()));
  $('btn-continue').addEventListener('click', () => {
    app.paused = true;
    resetPanelCache();
    setMode('globe');
    if (app.state.gameOver) showGameOver();
  });
  $('btn-pause').addEventListener('click', () => setPaused(!app.paused));
  $('btn-speed').addEventListener('click', () => {
    app.speed = SPEEDS[(SPEEDS.indexOf(app.speed) + 1) % SPEEDS.length];
    refresh();
  });
  $('btn-menu').addEventListener('click', showMenu);
  $('btn-nasa').addEventListener('click', showNasaData);
  $('btn-earth').addEventListener('click', showCallEarth);
  $('btn-shelter').addEventListener('click', toggleShelter);
  $('btn-back').addEventListener('click', exitSector);
  $('sector-canvas').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (app.placingType) selectBuildType(null);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isModalOpen()) closeModal();
      else if (app.placingType) selectBuildType(null);
      else if (app.mode === 'sector') exitSector();
    } else if (e.code === 'Space' && app.state && inPlay() && !isModalOpen()) {
      e.preventDefault();
      setPaused(!app.paused);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && app.state) {
      if (inPlay()) app.paused = true;
      saveGame(app.state);
      refresh();
    }
  });
  window.addEventListener('beforeunload', () => app.state && saveGame(app.state));
}

// Let the loading message paint before generating the Moon geometry. (A timer, not
// requestAnimationFrame, so the game also starts in a background tab.)
setTimeout(init, 30);
