# Copilot instructions — Luna Outpost

Luna Outpost is an educational Moon-base builder for **young kids (about 7–12)**. A 3D three.js Moon shows
15 place **continents**; clicking an explored place opens a 2D Canvas **hexagon** map where kids build machines.
The game makes real mission trade-offs (air, water, food, power, radiation, exploring) simple, visual and fun.
Read `docs/GAME_SPEC.md` (design) and `docs/ARCHITECTURE.md` (code) before larger changes.

## Stack & commands

- Vanilla JS ES modules, three.js, Canvas 2D, Vite, Vitest, `@fontsource` fonts. No framework, no TypeScript, no backend.
- `npm run dev` · `npm run build` · `npm test` · `npm run balance`
- Persistence is **localStorage only** (`src/game/storage.js`). Never add a database or server.
- External data: **NASA RadLab** (real Moon radiation, `src/api/radlab.js`) and **NASA DONKI** (solar flares,
  `src/api/donki.js`). RadLab has no CORS headers, so the browser goes through the `/radlab-api` Vite proxy; DONKI allows
  CORS and is called directly. Both must always fall back to the bundled snapshot (`src/data/radlabSnapshot.js`) — the
  game must work offline. Document any new dataset in `docs/NASA_DATA.md`, attribute it on the 📡 NASA data screen, and
  never label archived or bundled data as live. Keep data features small: they start real storm warnings, set storm
  strength from the real flare class, make calm days safer, and show the 📡 pill. See `docs/GAME_SPEC.md` §12.
- Every choice must have a cost (no "safe" free option), and keep the player's view to three systems
  (Life support · Power · Building) — see `docs/CHALLENGE.md`.

## Kid-friendly rules (most important)

- **Short and simple.** UI text is one short sentence, everyday words, no jargon ("Air Maker", not
  "Electrolysis unit"; "had to go home", not "died"). Aim for a 7–9 year-old reading level.
- **Big and visual.** Keep base font ≥ 16 px, buttons large (candy style), hexes big. Prefer emoji, stars,
  bars and colours over numbers and percentages.
- **One thing at a time.** Astro (the astronaut helper) shows one tip; learning cards queue and show one at a time.
- **Slow and forgiving.** Don't speed up `SECONDS_PER_DAY` (8 s) or make early game harsher without running
  `npm run balance` — the start should be challenging but fair: a sensible player survives 200 days from almost every place.
- **Educational.** Every building has a `short` description and a `fact`; every place has a `summary` and `science`
  fact; events have cards in `src/data/learn.js`. Facts must be true (NASA/ESA-level), positive, 1–2 sentences.
- Don't add complexity kids must manage (staffing, repairs, micro-management) — these were removed on purpose.

## Architecture rules

- `src/data/` = content and numbers only. `src/game/` = pure logic: **no DOM, no `window`, no three.js**.
  It must run in Node (tests and `tools/balance-sim.mjs`).
- Views (`src/globe`, `src/sector`, `src/ui`) render state and report input to `src/main.js`.
  Only `main.js` calls actions, saves, changes modes and queues learning cards.
- Game state is one JSON-serialisable object (see `createNewGame` in `src/game/state.js`). Don't store
  derived values; compute them with helpers in `state.js`. Bump `SAVE_VERSION` (and the save key) in
  `src/config.js` when the shape changes incompatibly.
- Player actions return `{ ok, reason? }`, mutate state only when `ok`, and have a matching `check*` validator.
  `reason` is shown to kids — friendly and short.
- Random events must use the injected `rng` parameter. Map generation is deterministic (seeded by place id).
- Don't rebuild interactive DOM (buttons) every tick — update classes, or re-render only on change.
- Pictures: every building has a drawn SVG in `src/ui/icons.js` (`image` key in `buildings.js`); show it with
  `iconHtml()` / `pictureHtml()`, not a circle or frame. Emoji stay for plain text. In Astro tips write `{buildingId}`
  (or `{rover}`) where the machine's picture should appear.
- Cursors: use `CURSORS` / `emojiCursor()` from `src/ui/cursors.js` (or the `--cur-*` CSS variables), not plain
  `cursor: pointer`, and make the cursor show what a click will do.
- Top-bar tooltips: use `data-tip-title` / `data-tip` (shown by `src/ui/hudTips.js` below the bar), not `title`.
- Tag log entries with an `event` id in `addLog(state, text, type, event)` when an event deserves a learning card.

## Adding content

- **Building:** add to `src/data/buildings.js` (`category`, cost, energyUse, produces/consumes, optional bonuses,
  `short`, `fact`). It appears in the build menu automatically and gets a "Did you know?" card. Update the spec table.
- **Place traits/costs:** edit `src/data/sectors.js` and the spec table. There must always be exactly 15 places,
  in this order and with these names: South Pole, Southern Polar Field, North Pole, Northern Ice Fields,
  Basalt Plains, Wrinkle Ridges, Volcanic Domes, Sinuous Rilles, Procellarum Terrane, Northern Poles,
  Lunar Highlands, Basin Blankets, Impact Basin, Massif Concentric Mountains, Deep Shadowed Crater.
- **Learning card:** add to `EVENT_CARDS` in `src/data/learn.js` and tag the matching `addLog` with its id.

## Required features (don't regress)

- 3D rotatable Moon with 15 continent places; hover = lift + glow + info card; click = zoom into the 2D base.
- Choose a landing place; a Moon Home is auto-built there; every other place starts locked.
- Hovering a locked place shows the materials + explorers needed; expeditions unlock places.
- Resources: oxygen, water, food, energy, metal, regolith. Start with 7 astronauts.
- Day counter (score), big pause/play button + Space, speed toggle, autosave to localStorage, best-days record.
- Tutorial cards, Astro helper, Goals card (next 3 goals + the pinned 🏆 big goal: explore all 15 sections), "Did you know?" cards.
- Landing flies straight into the new base. The selected-building card is sticky at the top of the build panel.
- 📡 real NASA radiation (RadLab) with offline snapshot fallback.
- 📡 Call Earth (real 1.3 s radio delay + 3-day rocket), 🛡️ Storm Shelter (safety for power), 🔬 Science Lab (air for discoveries).
  Each new mechanic = one simple choice with a clear cost, a hover card, and one true fact.

## Testing

- Add focused Vitest cases in `tests/` for new game logic (pure functions in `src/game`).
- Use `createNewGame(sectorId)` and pass `() => 0.99` as rng to disable random events.
- After UI changes, run `npm run dev` and check at ~1000 px and ~1600 px wide: title, landing, tutorial,
  hover card, base view (build + remove), pause, exploring.
