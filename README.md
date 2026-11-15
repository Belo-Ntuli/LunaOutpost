# 🌕 Luna Outpost

A colourful Moon-base building game for kids (about 7–12). Pick a place to land on a 3D Moon, zoom in,
build machines, and keep your astronauts' **air, water and food** bars full. Along the way kids learn real
space science: why Moon nights are a problem for solar power, how water becomes air, and why astronauts
need shields from solar storms.

Built with **three.js** (3D Moon), **Canvas 2D** (hexagon base map) and **Vite**. No server or database:
progress is saved in the browser (**localStorage**).

## Quick start

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # open the printed URL (default http://localhost:5173)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the game into `dist/` (static files you can host anywhere) |
| `npm run preview` | Serve the built game locally |
| `npm test` | Run the unit tests (Vitest) |
| `npm run balance` | Simulate 200 days from every landing place |
| `npm run radlab:snapshot` | Re-download the bundled NASA radiation data |

## How to play

1. **🚀 New game** → point at the Moon to see what each place has (⭐ stars for sun, ice, metal, dirt).
2. **Click a place to land.** Your **7 astronauts** get a Moon Home (an inflatable Moon base tent). Every other place is 🔒 locked.
3. The camera flies straight into your new base. Read the welcome cards.
4. **Pick a machine and click a hexagon** to build it. A good start: 🫧 Air Maker → 🧊 Ice Drill → 🪴 Greenhouse → ☀️ Solar Panels.
5. Press **▶** (or Space) to start time. One day takes 8 seconds. **📅 Days survived is your score.**
6. Keep the 🫁 💧 🥔 bars full. "⏳ 8 days" means that's how long it will last.
7. **Explore:** point at a 🔒 place to see what you need, then click it to send explorers in the Moon rover.
   **🏆 Big goal: explore the WHOLE Moon** — all 15 sections.
8. Watch out for 🌙 **Moon night** (solar panels stop) and ☢️ **solar storms**: build 🛡️ Rock Shields, or switch on the
   **🛡️ Storm Shelter** at the top (safer, but it uses power).
9. Build a 🚀 Rocket Pad, then tap **📡 Call Earth** to order food, water, metal or astronauts. Your radio call really
   takes 1.3 seconds to reach Earth, and the rocket takes 3 days — so call before you run out!
10. A 🔬 **Science Lab** breathes air and uses power, but makes real NASA discoveries that improve your machines.
11. 📡 The radiation sign at the top uses **real NASA data** measured near the Moon. When the real data shows a solar storm, you get a warning — build Rock Shields!
12. 🧑‍🚀 **Astro** the astronaut gives tips (with pictures of the machines to build), ⭐ **Goals** show what to try next, and 💡 **Did you know?** cards teach real facts.

The game saves by itself. Press **☰** for help or to start over.

## The 15 places

South Pole · Southern Polar Field · North Pole · Northern Ice Fields · Basalt Plains · Wrinkle Ridges ·
Volcanic Domes · Sinuous Rilles · Procellarum Terrane · Northern Poles · Lunar Highlands · Basin Blankets ·
Impact Basin · Massif Concentric Mountains · Deep Shadowed Crater

The poles are the easiest (sun all the time, lots of ice). The Deep Shadowed Crater is always dark — hard mode!

## Real NASA data

The game uses two NASA APIs, and says so in-game on the **📡 Real NASA data** screen:

- [NASA RadLab](https://visualization.osdr.nasa.gov/radlab/gui/overview/) — real Moon radiation (CRaTER, Lunar Reconnaissance Orbiter).
- [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) — the real solar flare behind each storm (sets storm strength) and the real Sun this week.

The game uses the [NASA RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/overview/) to get real Moon radiation
measured by the CRaTER instrument on the Lunar Reconnaissance Orbiter. Each game follows a real month that includes a
real solar storm. It is downloaded through the dev-server proxy (`npm run dev` / `npm run preview`); without internet
(or on a plain static host) the game uses a bundled copy, so it always works. Details: [GAME_SPEC.md §12](docs/GAME_SPEC.md#12-real-nasa-radiation-data-radlab-api).

## Documentation

- [docs/CHALLENGE.md](docs/CHALLENGE.md) — the challenge brief, how the game answers it, judging checklist and known gaps.
- [docs/NASA_DATA.md](docs/NASA_DATA.md) — exactly which NASA data is used, how, and why.
- [docs/GAME_SPEC.md](docs/GAME_SPEC.md) — full game design: design principles, learning goals, places, buildings, rules, numbers.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — code structure, game state, rendering and testing.
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — conventions for AI-assisted development.

## Saving

Saves live in `localStorage` (`lunaOutpost.save.v2` for the game, `lunaOutpost.bestDays.v1` for the record).
Clearing site data or using another browser starts fresh.
