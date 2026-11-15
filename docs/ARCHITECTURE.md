# Luna Outpost — Architecture

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | Vanilla JavaScript (ES modules), no framework |
| 3D | [three.js](https://threejs.org/) (`WebGLRenderer`, `OrbitControls`) |
| 2D | HTML Canvas 2D |
| UI | Plain DOM + CSS (`index.html`, `src/styles.css`), fonts Fredoka + Nunito bundled via `@fontsource` (works offline) |
| Build / dev server | [Vite](https://vite.dev/) |
| Tests | [Vitest](https://vitest.dev/) (Node environment) |
| Persistence | Browser `localStorage` — no backend, no database |
| Real data | [NASA RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) (Moon radiation from CRaTER on LRO), via a Vite proxy, with a bundled snapshot fallback |

## Folder layout

```
index.html              App shell: top bar, Astro helper, Goals card, base screen, title screen, modal, toasts
vite.config.js          Vite + Vitest config (relative base; /radlab-api proxy to NASA RadLab)
src/
  main.js               App controller: modes, game clock, input, wiring of all views
  config.js             Global tuning constants (timing, starting stock, events, save keys)
  styles.css            All styling
  data/                 Static game content (no logic)
    sectors.js          The 15 sectors: position, colour, traits, terrain weights, unlock cost, science text
    buildings.js        Building catalogue: kid names, cost, energy, production, bonuses, short text, fact
    resources.js        Resource ids, names, kid hints, icons, colours (display order = life first)
    learn.js            Intro tutorial cards + "Did you know?" event cards
    discoveries.js      Science Lab discoveries: real NASA findings + bonuses
    radlabWindows.js    The 6 real 30-day radiation windows (each with a solar storm) + RadLab query builder
    radlabSnapshot.js   GENERATED bundled copy of those windows (npm run radlab:snapshot)
    milestones.js       Mission goals with test functions; the `big` goal (explore all 15) is always shown
  game/                 Pure game logic — no DOM, fully unit-testable
    state.js            createNewGame + derived queries (housing, crew at base, shielding, sunlight, unlock cost)
    simulation.js       computeDay (pure daily economy) and advanceDay (events, shortages, milestones)
    actions.js          Player actions: build, demolish, startExpedition (+ check* validators)
    sectorMap.js        Deterministic 9×6 hex terrain map per sector (big hexes for small hands)
    advisor.js          Astro helper tips from state + computeDay report; `{buildingId}` / `{rover}` tokens mark pictures
    storage.js          localStorage save/load/clear + best-days record
    rng.js              Seeded PRNG (mulberry32) and string hash
    radiation.js        Pure RadLab helpers: hourly rows -> daily means, calm/normal/storm levels, storm onsets
  api/
    radlab.js           Browser fetch of a radiation window through /radlab-api (+ DONKI causes), falls back to the snapshot
    donki.js            NASA DONKI: flares/particle events for a window (storm causes) and "the real Sun this week"
  globe/                3D Moon overview
    noise.js            3D value noise + fBm
    continents.js       Builds the 15 continent meshes (pure geometry data, testable)
    globeView.js        Three.js scene, hover lift/glow, picking, labels, camera fly-to
  sector/
    sectorView.js       2D Canvas hex map renderer + hit-testing
  ui/                   DOM rendering helpers
    hud.js              Resource cards (days-left bars), crew, day badge, Astro tip, Goals card
    sectorInfo.js       Sector hover card, star ratings, expedition "need" chips
    sectorPanel.js      Build cards + selected-hex info panel
    modal.js            Modal dialog + toasts
    icons.js            Drawn SVG pictures for all 13 buildings + the explorer rover; iconHtml()/pictureHtml() helpers
    cursors.js          Themed, context-aware cursors drawn on a canvas (emoji + yellow arrow), exposed as CSS vars
    nasaData.js         "📡 Real NASA data" screen: sources, effects, live vs built-in, real Sun this week
    hudTips.js          Delayed hover cards for top-bar items (data-tip-title / data-tip), shown below the bar
    format.js           Escaping and number/cost formatting
tests/                  Vitest unit tests (game logic, storage, continents)
tools/balance-sim.mjs   Scripted-player balance harness (npm run balance)
tools/radlab-snapshot.mjs  Downloads the radiation windows from RadLab into src/data/radlabSnapshot.js
docs/                   GAME_SPEC.md (design), ARCHITECTURE.md (this file)
```

## Layering rules

```
data/  ──►  game/  ──►  ui/, globe/, sector/  ──►  main.js
(content)   (pure logic)   (rendering)              (controller)
```

- `data/` contains only content and numbers.
- `game/` must never touch the DOM, `window`, or three.js. Everything takes and returns plain
  objects, so it runs in Node for tests and the balance tool.
- `globe/continents.js` and `globe/noise.js` are pure (they use three.js math types only) and are unit-tested.
- Views (`globeView`, `sectorView`, `ui/*`) read state and call back into `main.js`; they never mutate game state directly.
- `main.js` owns the single `app` object (current state, mode, pause, speed, selection) and is the only
  place that calls actions, saves and triggers re-renders.

## Game state

A single JSON-serialisable object (created by `createNewGame`, saved verbatim to localStorage):

```js
{
  version: 1, createdAt, day, homeSectorId, population,
  resources: { water, food, energy, oxygen, metal, regolith },
  sectors: { [id]: { unlocked, buildings: [{ type, cell }] } },
  expeditions: [{ sectorId, crew, daysLeft }],
  flare: null | { daysLeft, real?, strength?, flare? },
  shelter: boolean,                 // Storm Shelter on (only during a warning)
  rocket: null | { cargo, daysLeft }, rocketReadyDay,   // Call Earth
  discoveries: [id],                // Science Lab (research points live in resources.research)
  radiation: null | { source, donki: "live" | "snapshot", start, label, typical, daily: [30 μGy/h], offset,
               storms: [{ index, date, flare, flareTime, sepTime, strength }] },
  shortageDays: { water, food, oxygen },
  milestones: [id], learned: [cardId], log: [{ day, type, text, event? }],
  stats: { peakPopulation, crewLost, crewArrived },
  gameOver, victory, victoryShown?
}
```

Derived values (housing, crew at base, shielding, energy cap, unlock costs, sunlight) are **never stored**;
they are computed from this state by functions in `game/state.js`. Bump `SAVE_VERSION` in
`config.js` when the shape changes incompatibly (old saves are then ignored).

## Modes & flow (`main.js`)

```
title ──New──► spawn ──click sector + confirm──► globe ◄──► sector
  ▲                                               │  (transition: camera fly-in/out)
  └────────────────── menu ◄──────────────────────┘
```

- **title**: title card over the auto-rotating Moon.
- **spawn**: choose a landing site; all sectors are selectable.
- **globe**: 3D overview + Goals card + Astro; hover/click sectors.
- **transition**: camera animation; the clock and input are paused.
- **sector**: 2D map + build panel.

The game clock (`tick`) runs only in `globe`/`sector` mode, when not paused, with no modal open and
the game not over. Each `SECONDS_PER_DAY / speed` (8 s at 1x) it calls `advanceDay`, autosaves and re-renders.
`main.js` sets `body[data-mode]` and `body[data-paused]` so CSS can adapt (e.g. hide the pause badge in the base view).

### Learning cards

`advanceDay` tags some log entries with an `event` id (`night`, `flare`, `power`, `out-oxygen`,
`explored`, `rocket`, …). `main.js` maps them to cards in `data/learn.js` and queues each card **once per
game** (ids stored in `state.learned`, along with `b:<building>` for build facts and `intro-N` for the tutorial).
The `tick` loop shows the next queued card whenever no other dialog is open; open cards pause the clock.

## Real NASA radiation (RadLab)

```
beginSpawn() ──► api/radlab.loadRadiation() ──fetch──► /radlab-api/?instrument_id=CRaTER-D1D2… ──Vite proxy──► NASA RadLab
                         │ (fails/offline)                                                        (no CORS headers)
                         └──► data/radlabSnapshot.js
startNewGame() ──► createNewGame(sector, radiation) ──► state.radiation (saved with the game)
advanceDay()   ──► game/radiation.isStormStart / radiationOn ──► real storm warning, calmer random storms
renderHud()    ──► 📡 pill
```

- `game/radiation.js` is pure and unit-tested (`tests/radiation.test.js`); only `api/radlab.js` touches the network.
- `makeRadiation` fills missing days with the median and sets `offset` so the first storm onset lands on game day 12.
- Production static hosting has no proxy, so the snapshot is used; host the proxy rule on your server to get live data there.

## Rendering notes

### Continents (globe)

`buildContinents()` samples an icosphere. For every vertex it computes warped, size-scaled angular
distances to the 15 sector seeds. Each sector has a continuous *landness* field
`f_s = (distance to nearest other seed) − (distance to own seed) − channelWidth(noise)`.
Each triangle is clipped against `f_s > 0` (marching triangles), giving smooth coastlines. Coast edges
get vertical cliff walls so the continents read as raised plates. Each sector is a separate mesh, so
hover lift is just `mesh.scale` and the highlight is the material's `emissive` colour.

Tuning knobs: `GLOBE_DETAIL` (mesh resolution vs. load time, ~0.7 s at 44), `WARP_STRENGTH`
(coastline wiggle), `MIN_CHANNEL`/`CHANNEL_VARIATION` (gap between continents), and each sector's
`size` (relative area; the poles are enlarged).

### Sector map (2D)

Pointy-top hexes in "odd-r" offset layout, sized to fit the canvas. The map is redrawn every animation
frame from state (cheap). Hit-testing uses the nearest hex centre.

### DOM updates

The top bar, Astro tip and Goals card use `innerHTML` (no interactive children). Astro's text is escaped first, then
its `{buildingId}` tokens are swapped for the machine's picture (`tipHtml` in `hud.js`), so the logic stays DOM-free. The build menu is created once and
then only its classes update; the "Selected" panel re-renders only when its content changes. This
stops buttons from being replaced under the cursor while the clock ticks.

## Testing

- `npm test` — Vitest unit tests:
  - `tests/game.test.js`: new-game setup, daily economy, power priority, lunar night, shortages and
    crew loss, expeditions (one astronaut stays home), supply ships, flares/shielding, build/demolish validation.
  - `tests/storage.test.js`: save/load round-trip, corrupt/incompatible saves, best record.
  - `tests/continents.test.js`: 15 landmasses exist, each seed lies in its own sector, channels exist.
  - `tests/radiation.test.js`: RadLab parsing, calm/normal/storm levels, storm timing, real storm starts a warning.
- `npm run balance [-- <seed>]` — balance regression harness (not a pass/fail test; read the table).
- Manual: `npm run dev`, then play through landing → build → pause → expedition.

Random events take an injectable `rng` (`advanceDay(state, rng)`), so tests pass `() => 0.99` to disable them.
