# Luna Outpost — Game Specification

> Living design document. When gameplay numbers change, update the tables here **and** the
> data files they come from (`src/config.js`, `src/data/*.js`). Code is the source of truth
> for numbers; this document is the source of truth for intent.

## 1. Vision

**Luna Outpost** is a browser game where **young kids (about 7–12)** build a base on the Moon and
keep their astronauts alive. It should feel like a toy first and a lesson second: big friendly
buttons, very short sentences, bright colours, and real space science hidden in every choice.

### The challenge we are answering

> Space-themed STEM content often oversimplifies the engineering trade-offs that define a real
> mission, or presents them at a level too complex to hold a young learner's attention. Design an
> interactive game that lets students run a lunar or Martian outpost, balancing competing demands
> like life support, radiation shielding, power, and food production, so they experience first-hand
> the decisions that determine whether a mission fails or succeeds.

### Design principles (kid-friendly)

1. **Short words, big text.** One sentence per idea. Base font 18 px, headings 24–58 px.
2. **Show, don't tell.** Bars, colours, stars and emoji instead of numbers and percentages where possible.
3. **One thing at a time.** Astro the astronaut helper shows a single tip. Learning cards appear one at a time.
4. **Slow, but not too easy.** 8 seconds per day and the game starts paused, but supplies only last about 11 days
   and there is only enough metal for the first few machines, so choices matter from the start.
5. **Learn by doing.** Every building and event teaches one real fact the first time it happens.

### Learning goals

| What kids experience | Real-world idea |
| --- | --- |
| Astronauts need air, water and food every day | Life support and consumables |
| Solar Panels stop for 15 days at night (not at the poles) | The Moon's long day/night; why NASA's Artemis aims for the South Pole |
| Batteries or Nuclear Power keep the lights on | Energy storage vs. fission surface power |
| Air Makers use water to make air | Electrolysis (splitting water) |
| Ice is easy to find at the poles, hard at the equator | Water ice in permanently shadowed craters |
| Rock Shields and lava caves protect from solar storms | Space radiation and shielding |
| Water Cleaners reuse water | Recycling on the International Space Station |
| When power runs short, air and water machines keep going | Priorities / load shedding |
| Exploring new places costs materials and explorers | Planning an expedition |
| Calling Earth: the radio call takes 1.3 s each way, the rocket 3 days | Communication delay and supply logistics (Mars: up to 22 min each way) |
| The Storm Shelter makes everyone safer but uses power | Shielding vs. the power budget (Orion's storm-shelter plan) |
| A Science Lab breathes air but makes discoveries | Trading resources now for research that pays off later |

## 2. Core loop

1. **Pick a landing place** on the 3D Moon (one of 15 places). The others start locked 🔒.
2. A **Moon Home** is built automatically. You start with **7 astronauts**.
3. The camera **flies straight down into your new base** (2D hexagon map) — no extra click needed.
4. A short **3-card tutorial** plus a "Real NASA data!" card explain the goal. Then build machines.
5. Press **▶** to start time. Each day astronauts use air, water and food; machines use power.
6. **Explore** new places (needs materials + explorers + travel days).
7. Survive Moon nights and solar storms. The **day counter** is your score.

## 3. Screens

### 3.1 Title screen

Big yellow title, 4 picture steps (Pick a place · Build machines · Keep everyone alive · Explore the Moon),
**▶ Keep playing** (if there is a save) and **🚀 New game**, plus "🏆 Your record: N days".

### 3.2 Moon (3D, Three.js)

- Rotate by dragging, zoom with the scroll wheel.
- The 15 places are **continents**: raised, organically shaped landmasses separated by dark channels.
  (Earlier versions used hex tiles on the globe; that was changed to continents on request. Hexes are
  still used in the 2D map.)
- Name labels float over each continent: 🚩 home base (yellow, like the flags Apollo astronauts planted), 🔒 locked, 🚙 explorers on the way.
- **Hover** a place: it lifts up, glows, and a card shows its name, one-line description, **star ratings**
  (☀️ Sun, 🧊 Ice, 🔩 Metal, 🪨 Dirt, 🛡️ Safe — 1 to 3 stars, "no night!" for polar places) and a
  💡 fact. Then:
  - Picking a landing place: "👆 Click to land here!"
  - Your places: "Click to build".
  - Locked places: **what you need to explore**, as green ✅ / red ❌ chips for metal, dirt, energy,
    explorers, plus travel days.
- **Click** an explored place to fly down into it, or a locked place to open the explore dialog.

### 3.3 Base (2D hexagon map)

- **9 × 6** big hexagons per place, the same map every time for that place.

| Ground | Can build? | Bonus |
| --- | --- | --- |
| Flat ground | ✅ | — |
| 🧊 Ice | ✅ | Ice Drill ×1.5 |
| 🔩 Metal rocks | ✅ | Metal Maker ×1.5 |
| ⛰️ Sunny hill | ✅ | Solar Panel ×1.25 |
| 🕳️ Lava cave | ✅ | A Moon Home here is 100% safe from radiation |
| Crater | ❌ | — |

- **Build menu** (right): big cards with icon, name, one-line description and cost. A coloured stripe
  shows the group: green = life support, yellow = power, orange = building materials, purple = safety.
- Pick a card, then click a hexagon. Green/red preview; the hint bar says why a spot doesn't work.
- The **selected card** sits at the **top of the build panel** (sticky, yellow border, ✕ to close), so it is always visible
  even when the build list is scrolled. It shows the machine you are about to build (what it does + cost), or the
  hexagon / building you clicked: what it does, how well it's working ("Working at 125% here 🎉"), its fact, and a
  **🗑️ Remove** button (half the materials back).
- The map darkens at night. **Esc** / right-click cancels building; "⬅ Back to Moon" flies back out.

### 3.4 Top bar (always visible in a game)

- Resources are grouped under three labels — **❤️ Life support** (oxygen, water, food) · **⚡ Power** (energy) ·
  **🏗️ Building** (metal, regolith) — so young players think in three systems, not six numbers.
- **Six resource cards** with icon, name, amount and a coloured bar:
  - Oxygen, Water, Food: the bar shows **days of supply** (full = 20 days) and "⏳ 8 days" when going down.
    The card pulses red under 5 days.
  - Energy: bar = battery fullness. Metal and Regolith: "▲ 6 a day" or a short hint.
- 👩‍🚀 astronauts / beds, 🚙 explorers away, 🛡️ % safe from solar storms, 📡 **today's real space radiation**
  (Calm 🟢 / Normal 🟡 / Storm! 🔴 — hover for the real NASA reading and date, see section 12).
- **Day badge**: "Day 12 · ☀️ Daytime · 3d to night" (purple at night).
- Big round **⏸ / ▶** button (also **Space**), **1x/2x/4x** speed, **☰** menu.
- Buttons that only appear when useful: **🛡️ Shelter OFF/ON** (during a storm warning, pulses until switched on) and
  **📡 Call Earth** (with a Rocket Pad; shows "🚀 Landing in 3d" or "🌍 Next rocket 6d" while busy). A **🔬 4/6** pill
  shows research progress once a Science Lab exists. Every item has a hover card explaining it in one or two sentences.
- **Hover cards:** pointing at anything in the top bar shows a short card in the same style as the Moon hover card
  (title + one or two kid-friendly sentences, e.g. what Oxygen is, how to make more, and "⏳ 8 days left").
  So it's never in the way, the card appears **below** the top bar, centred under the item with a little arrow,
  only after the mouse rests for about a third of a second, and disappears when the mouse leaves or you click.
  Moving from item to item switches the card instantly. (These replace the browser's plain tooltips.)

### 3.5 Mouse cursors

The cursor always shows what a click will do (drawn at runtime by `src/ui/cursors.js`, normal cursors as fallback):

| Where | Situation | Cursor |
| --- | --- | --- |
| Everywhere | Default | Chunky yellow arrow (game style) |
| Buttons, build cards, ✕ | Clickable | 👆 (🚫 on disabled buttons) |
| Moon | Empty space / dragging to turn it | ✋ / ✊ |
| Moon, choosing a landing place | Over a place | 🚀 land here |
| Moon | Your explored places | 🔍 zoom in |
| Moon | Locked place you can explore now / can't afford yet | 🚙 / 🔒 |
| Moon | Explorers on the way | ⏳ |
| Base map | Building something, on a good spot | The machine itself (e.g. 🫧, 🌱) |
| Base map | Building something, on a bad spot | 🚫 |
| Base map | Over a building or buildable ground (not building) | 👆 |

### 3.6 Helpers

- **🧑‍🚀 Astro** (bottom-left: an astronaut floating in a glass helmet, with a speech bubble): one tip at a time,
  most urgent first. In the first days Astro walks
  kids through the build order: Air Maker → Ice Drill → Greenhouse → Solar Panels.
- **⭐ Goals** card (Moon view): the next 3 goals and how many are done.
- **💡 Did you know? cards** (pause the game while open), each shown once per game:
  - the first time you build each machine (its fact),
  - first night, first solar storm warning, first time power runs short, first time air/water/food runs out,
    first expedition sent, first place explored, first rocket delivery, first call to Earth (radio delay: Moon 1.3 s,
    Mars up to 22 min), first Storm Shelter use (Orion's storm plan), and each Science Lab discovery (real NASA finding),
  - "📡 Real NASA data!" at the start of every game and "☀️📡 A real solar storm!" the first time real data starts a storm.
- **Toasts** (bottom-right) for important news.

## 4. The 15 places

Traits multiply the matching building's output (`src/data/sectors.js`). "Constant sun" places have no night.

| # | Place | Lat, Lon | Sun | Constant sun | Ice | Regolith | Metal | Shielding | Reactor | Explore cost (metal/regolith/energy, explorers, days) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | South Pole | -90, 0 | 0.9 | yes | 1.6 | 1 | 0.8 | 0 | 1 | 90/60/30, 3, 4 |
| 2 | Southern Polar Field | -48, 20 | 0.75 | yes | 1.2 | 1.1 | 0.9 | 0 | 1 | 70/50/25, 2, 3 |
| 3 | North Pole | 90, 0 | 0.85 | yes | 1.3 | 1 | 0.8 | 0 | 1 | 90/60/30, 3, 4 |
| 4 | Northern Ice Fields | 48, 80 | 0.6 | yes | 1.8 | 1 | 0.8 | 0 | 1 | 80/50/30, 2, 4 |
| 5 | Basalt Plains | 8, 0 | 1 | no | 0.5 | 1.3 | 1.4 | 0 | 1 | 60/40/20, 2, 3 |
| 6 | Wrinkle Ridges | -12, 51 | 1 | no | 0.5 | 1 | 1.2 | 0.1 | 1 | 60/40/20, 2, 3 |
| 7 | Volcanic Domes | 12, 103 | 1 | no | 0.7 | 1.1 | 1.5 | 0 | 1 | 70/50/25, 2, 3 |
| 8 | Sinuous Rilles | -10, 154 | 1 | no | 0.55 | 1 | 1.1 | 0.45 | 1 | 80/50/30, 3, 4 |
| 9 | Procellarum Terrane | 10, 206 | 1 | no | 0.5 | 1 | 1.6 | 0 | 1.3 | 100/60/35, 3, 5 |
| 10 | Northern Poles | 52, 200 | 0.7 | yes | 1.4 | 1 | 0.9 | 0 | 1 | 80/50/30, 2, 4 |
| 11 | Lunar Highlands | -12, 257 | 1.05 | no | 0.5 | 1.2 | 1.3 | 0 | 1 | 70/50/25, 2, 3 |
| 12 | Basin Blankets | 45, 320 | 1 | no | 0.55 | 1.7 | 1 | 0 | 1 | 60/30/20, 2, 3 |
| 13 | Impact Basin | -45, 260 | 1 | no | 0.7 | 1.2 | 1.4 | 0 | 1 | 90/60/30, 3, 4 |
| 14 | Massif Concentric Mountains | 10, 309 | 1.15 | no | 0.5 | 1 | 1.2 | 0.2 | 1 | 90/60/30, 3, 4 |
| 15 | Deep Shadowed Crater | -55, 140 | 0 | yes | 3 | 1 | 0.7 | 0.1 | 1 | 120/80/50, 4, 6 |

Star ratings shown to players: 0 → "—", < 0.8 → ★, < 1.3 → ★★, otherwise ★★★ (shielding × 4).

- **Polar places** (1–4, 10): sun all the time and lots of ice — the easiest starts, like Artemis.
- **Lava plains & highlands** (5–9, 11–14): lots of metal and dirt, but 15-day nights and little ice.
- **Sinuous Rilles / Massifs**: natural protection from radiation.
- **Procellarum Terrane**: Nuclear Power +30%.
- **Deep Shadowed Crater**: no sunlight ever, but 3× ice — the hardest start.

## 5. Resources

Shown in this order (life first):

| Resource | Icon | Kid hint | Used for |
| --- | --- | --- | --- |
| Oxygen | 🫁 | Air to breathe | Each astronaut uses 1 a day |
| Water | 💧 | To drink | Each astronaut uses 1 a day; Greenhouses and Air Makers use some |
| Food | 🥔 | To eat | Each astronaut uses 1 a day |
| Energy | ⚡ | Power for machines | Machines; stored up to 150 + 200 per Battery |
| Metal | 🔩 | For building | Building and exploring |
| Regolith | 🪨 | Moon dirt | Building, Rock Shields, Metal Makers, exploring |

Start: 80 oxygen, 80 water, 80 food, 100 energy, 300 metal, 120 regolith (about 11 days of air, water and food for 7
astronauts, and metal for roughly the first 5 machines). Max 1,500 each (except energy).

## 6. Buildings

All per day (`src/data/buildings.js`). There is **no staffing** — machines run by themselves.

| Building | Group | Cost | Energy | Makes | Uses | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Moon Home (custom Moon-base tent picture) | life | 80 metal, 40 regolith | -2 | — | — | 8 beds |
| 🧊 Ice Drill | life | 40 metal | -4 | 8 water | — | × place ice; ×1.5 on ice |
| 🫧 Air Maker | life | 45 metal | -6 | 9 oxygen | 3 water | Electrolysis |
| 🪴 Greenhouse | life | 40 metal, 20 regolith | -5 | 9 food, 2 oxygen | 2 water | |
| ♻️ Water Cleaner | life | 50 metal, 10 regolith | -3 | up to 6 water back | — | Max 60% of what astronauts drink |
| ☀️ Solar Panel | power | 35 metal | 0 | 10 energy | — | × place sun; 0 at night (except constant sun); ×1.25 on sunny hills |
| 🔋 Battery | power | 40 metal, 10 regolith | 0 | — | — | +200 energy storage |
| ⚛️ Nuclear Power | power | 140 metal, 20 regolith | 0 | 30 energy | — | Day and night; × place reactor |
| ⛏️ Moon Digger | build | 25 metal | -2 | 9 regolith | — | × place regolith |
| ⚙️ Metal Maker | build | 30 metal, 50 regolith | -8 | 6 metal, 1 oxygen | 6 regolith | × place metal; ×1.5 on metal rocks |
| 🛡️ Rock Shield | safety | 70 regolith | 0 | — | — | +25% safety in its place |
| 🚀 Rocket Pad | safety | 80 metal, 120 regolith | -1 | — | — | Max 1; unlocks **📡 Call Earth** |
| 🔬 Science Lab | science | 60 metal, 30 regolith | -5 | 1 research | 3 oxygen | Every 6 research = 1 discovery (blue group) |

"Life" machines get power first when there isn't enough.

## 7. Rules

One day = **8 real seconds** at 1x (2x and 4x available). Each day (`advanceDay` in `src/game/simulation.js`):

1. **Power:** all generation + stored energy powers life machines first, then the rest. Leftovers are stored.
2. **Machines** make their output × place traits × ground bonus × power.
3. Machines that **use** water/dirt share it, but never take the astronauts' own daily water.
4. **Astronauts** use 1 oxygen, 1 water and 1 food each.
5. **Running out** (a compressed "rule of threes"):

   | Resource | First astronaut lost after | Then every |
   | --- | --- | --- |
   | Oxygen | 1 day | 1 day |
   | Water | 3 days | 2 days |
   | Food | 5 days | 3 days |

   Lost astronauts "had to go home" (kid-friendly wording).
6. **Explorers** count down; when they arrive the place unlocks and they come back.
7. **Call Earth (needs a Rocket Pad).** The player chooses a cargo: 🥔 50 food, 💧 50 water, 🔩 60 metal, or 👩‍🚀 2 new
   astronauts (needs at least 1 free bed; extra astronauts without a bed fly home). The radio call plays a **real
   1.3-second delay each way** (speed of light, Moon ↔ Earth). The rocket lands after **3 days** (like Apollo); Earth then
   needs **10 days** before the next rocket. One rocket at a time. Lesson: call *before* you run out.
   (This replaces the old automatic delivery every 20 days.)
8. **Science Lab research.** Each lab makes 1 🔬 research a day using 3 🫁 oxygen and 5 ⚡ (the crew's own air is always
   reserved first). Every **6 research = 1 discovery**, in this order. Each is a real NASA finding plus a bonus:

   | Discovery | Real finding (source) | Bonus |
   | --- | --- | --- |
   | 🌱 Space plants | Plants on the ISS grow toward light (NASA Veggie / ISS plant research) | Greenhouses +25% |
   | 🧊 Hidden Moon ice | Water ice in dark polar craters (LCROSS, LRO) | Ice Drills +25% |
   | 🫧 Making air on another world | MOXIE made oxygen from Mars air (Mars 2020) | Air Makers +25% |
   | ☀️ Better solar cells | Best space solar cells convert ~30% of sunlight (home panels ~20%) | Solar Panels +25% |
   | 🧑‍🚀 Astronaut health | NASA Twins Study: most changes went back to normal after landing | Storms send 25% fewer astronauts home |

   After all 5 discoveries, research stops (the lab can be removed to save air and power).
9. **Solar storms** (3-day warning before they hit) start in two ways:
   - **Real storms** from NASA data: on the first day of a real storm in the radiation data (from day 5 on). See section 12.
   - **Random storms:** 2% chance a day after day 15, halved on days the real data is "calm".

   **🛡️ Storm Shelter:** while a warning is active, a switch appears in the top bar. When ON it uses **15 ⚡ a day**
   (powered like life support) and adds **+50% safety** when the storm hits (scaled down if there wasn't enough power).
   It switches off after the storm. Lesson: shielding vs. tonight's power budget.

   When a storm hits, `round(astronauts × (1 − safety) × loss)` must go home, where loss = 30% (strong / random),
   20% (medium) or 10% (small), ×0.75 after the Astronaut-health discovery. Safety = per-bed protection (natural
   shielding + Rock Shields, or 100% in a lava cave) + Storm Shelter, max 100%.
10. **Goals** are checked; the game ends when no astronauts are left.

**Day and night:** places without constant sun have 15 days of light then 15 days of dark (30-day cycle).
The Deep Shadowed Crater is always dark.

## 8. Exploring

- Hover a 🔒 place to see what you need; click it to open "Explore …?".
- Cost = base cost × `(1 + 0.35 × (places explored − 1))` for materials. Explorers and days are fixed.
- **At least one astronaut must stay home**, so explorers available = astronauts at base − 1.
- Several places can be explored at the same time. All places share one pool of resources and astronauts.

## 9. Goals, winning and losing

Goals (⭐, in order): Survive 7 days · Survive a whole Moon night (30 days) · Explore 3 places ·
Build Nuclear Power · Build a Rocket Pad · Have 12 astronauts · Survive 100 days · Explore 8 places ·
Have 25 astronauts · **Explore the WHOLE Moon (you win! — you can keep playing)**.

When no astronauts are left: "Mission over!" with days survived, goals done, places explored, your record
and a reflection prompt ("What will you build first next time?").

## 10. Pause & time

- Big ⏸/▶ button or **Space**. The game starts paused after landing and when continuing.
- On the Moon view a yellow "⏸ Paused" badge shows; in the base view the ▶ button pulses instead.
- Time also stops while any card/dialog is open, on the title screen, during camera flights, and when the
  browser tab is hidden.
- You can build and explore while paused.

## 11. Saving (no database)

- Browser **localStorage** only:
  - `lunaOutpost.save.v2` — the game (JSON). Version 1 saves are ignored.
  - `lunaOutpost.bestDays.v1` — best days survived.
- Saves every day, after every action, on pause, when the tab is hidden and when the page closes.
- The 30 days of real radiation data are saved inside the game, so a saved game never needs the internet.

## 12. Real NASA data (RadLab + DONKI)

> Full data documentation: [NASA_DATA.md](NASA_DATA.md). Challenge mapping: [CHALLENGE.md](CHALLENGE.md).

### 12.1 Moon radiation (RadLab API)

**What it is.** [NASA RadLab](https://visualization.osdr.nasa.gov/radlab/gui/overview/) collects radiation measurements
from instruments in space. Its data API (`https://visualization.osdr.nasa.gov/radlab/api`) returns readings as JSON.
The game uses **CRaTER** (Cosmic Ray Telescope for the Effects of Radiation, detector pair `CRaTER-D1D2`) on NASA's
**Lunar Reconnaissance Orbiter** — a spacecraft circling the Moon — which reports the **absorbed dose rate** in μGy/hour.

**What it does.** Every new game follows a **real 30-day stretch of Moon radiation**. Game day 1, 2, 3… use real days in
a row (looping after 30 days). Six real stretches are available, each containing a real solar storm
(Jan 2012, Mar 2012, May 2012, Apr 2013, Jan 2014, Sep 2017); one is picked at random per game.

| Step | Detail |
| --- | --- |
| Request | `?instrument_id=CRaTER-D1D2&absorbed_dose_rate&timestamp>=START&timestamp<START+30d&format=json` (~720 hourly rows) |
| Daily value | Mean of that day's hourly readings (missing days = the typical value) |
| Typical value | Median of the 30 daily values |
| Level | **Storm 🔴** ≥ 2 × typical · **Calm 🟢** < 0.9 × typical · otherwise **Normal 🟡** |
| Timing | The stretch is shifted so its first real storm begins on **game day 12**, giving kids time to build shields |

**What it changes in the game (kept deliberately small).**

1. **Real storms start solar storm warnings.** On the *first* day of a real storm (from game day 5), the usual
   ☢️ 3-day storm warning begins: "📡 Real NASA data shows a solar storm!". Rock Shields and lava-cave homes protect
   astronauts exactly like before.
2. **Calm days are safer.** Random storms are half as likely on calm days.
3. **You can see it.** A 📡 pill in the top bar shows today's level; hovering it shows the real reading and date
   (e.g. "8.47 microgray per hour on 2012-05-05").
4. **You learn about it.** A "📡 Real NASA data!" card at the start, and a "A real solar storm!" card at the first real storm.

Nothing else changes: resources, buildings, and how storm damage is calculated are the same.

**How it loads.**

- RadLab doesn't allow direct browser requests (no CORS headers), so the game calls it through a same-origin proxy
  (`/radlab-api`, set up in `vite.config.js` for `npm run dev` and `npm run preview`).
- The download starts while the player is choosing a landing place, so there is no waiting.
- If the API can't be reached (offline, or the game is hosted as plain static files), the game uses a **bundled snapshot**
  of the same six stretches (`src/data/radlabSnapshot.js`, refreshed with `npm run radlab:snapshot`). The game always works.
- Saves from before this feature simply have no radiation data: no 📡 pill and only random storms.

### 12.2 Solar flares (DONKI API)

NASA DONKI (`https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` and `/SEP`) is matched to each real storm: the particle event on
the storm day and the flare linked to it (or the biggest flare in the 2 days before). The **flare class sets the storm strength**:
X → strong ☢️☢️☢️ (30% of unprotected astronauts sent home), M → medium ☢️☢️ (20%), C/none → small ☢️ (10%).
Random storms keep 30%. Warnings read e.g. "📡 NASA data: the Sun made a real M5.5 solar flare! A medium storm ☢️☢️ arrives in 3 days."
DONKI allows browser requests, so it is called directly; the bundled snapshot includes the matched causes as a fallback.

### 12.3 In-game attribution

- **📡 Real NASA data** screen (title screen + ☰ menu) lists sources, effects, credits, and whether this game's data was
  downloaded live or is the built-in copy. Archived months are always described as replayed from the past.
- **The real Sun this week:** live DONKI flares from the last 7 days on the title screen and NASA data screen (context only).

**Why it matters for learning.** Kids see that solar storms are real events that spacecraft measure, that radiation
changes from day to day, and that shielding is a real engineering decision for Moon bases.

## 13. Controls

| Input | Action |
| --- | --- |
| Drag / scroll on the Moon | Turn / zoom |
| Point at a place | Lift, glow and info card |
| Click a place | Land / go to base / explore |
| Click a card, then a hexagon | Build |
| Right-click or Esc | Stop building |
| Esc | Close card, or go back to the Moon |
| Space | Pause / play |

## 14. Balance targets

Check with `npm run balance` (`tools/balance-sim.mjs`): a simple scripted player for 200 days from each place.

- Building nothing: the colony is lost in about 12 days.
- It should feel challenging but fair: a sensible player survives 200 days from almost every place, usually losing
  some astronauts along the way. The scripted player sometimes fails (e.g. one Basin Blankets run), and the
  Deep Shadowed Crater ends with very few astronauts — it is the hard mode.
- Polar places grow fastest; the Deep Shadowed Crater and Lunar Highlands are the hardest.
- Maps are small (9 × 6), so players eventually need to explore to keep growing.
- A player who calls Earth early and uses the Storm Shelter ends with clearly more astronauts than one who doesn't
  (the scripted player does both), so planning ahead is rewarded.
- With real radiation data a real storm repeats every 30 days. The scripted player (which ignores storm warnings)
  still survives 200 days in almost every run; places with natural shielding (Sinuous Rilles, Massifs) lose the fewest astronauts.

## 15. Out of scope / ideas

Mars mode, read-aloud (text-to-speech) for pre-readers, sound effects and music, touch-screen tuning,
colour-blind palette, teacher dashboard / lesson plans, multiple save slots, rovers moving between places.
