# NASA Open Data in Luna Outpost

Luna Outpost uses **real NASA measurements** instead of made-up numbers for its space-radiation and
solar-storm gameplay. This page explains exactly which data is used, where it comes from, how it is
processed, and what it changes in the game.

| Source | What we take | Used for in the game |
| --- | --- | --- |
| [NASA RadLab](https://visualization.osdr.nasa.gov/radlab/gui/overview/) (Open Science Data Repository) | Hourly radiation dose measured **at the Moon** by CRaTER on the Lunar Reconnaissance Orbiter | Daily radiation level (📡 Calm / Normal / Storm), *when* real solar storms happen |
| [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) (Community Coordinated Modeling Center) | Solar flares (FLR) and solar energetic particle events (SEP) | *What caused* each storm (e.g. "M5.5 solar flare") and *how strong* it is; "the real Sun this week" (live) |

Both are combined into one 30-day "radiation month" per game, stored in the save file
(`state.radiation`), so a saved game never needs the internet again.

---

## 1. NASA RadLab — Moon radiation (CRaTER)

**What it is.** RadLab is NASA's portal for radiation telemetry from many space instruments (ISS, Mars,
deep space, the Moon). It has a public data API.

**The instrument we use.** **CRaTER** — *Cosmic Ray Telescope for the Effects of Radiation* — flies on NASA's
**Lunar Reconnaissance Orbiter (LRO)**, a spacecraft circling the Moon since 2009. CRaTER measures how much
radiation a human body would absorb near the Moon. We use detector pair `CRaTER-D1D2`.

| Field | Value |
| --- | --- |
| API | `GET https://visualization.osdr.nasa.gov/radlab/api/` ([docs](https://visualization.osdr.nasa.gov/radlab/gui/data-api/)) |
| Query | `?instrument_id=CRaTER-D1D2&absorbed_dose_rate&timestamp>=START&timestamp<START+30d&format=json` |
| Response | `{ columns: ["timestamp", "instrument_id", "absorbed_dose_rate"], data: [[…], …] }` — ~720 hourly rows |
| Measurement | `absorbed_dose_rate` in **μGy/hour** (microgray per hour) |
| Data range | About 2009 – 2024 (archived data, not real-time) |
| CORS | **Not allowed** — the browser calls it through the dev-server proxy `/radlab-api` (`vite.config.js`) |

**How we process it** (`src/game/radiation.js`):

1. Average each day's hourly readings → 30 daily values (`dailyMeans`). Missing days get the month's typical value.
2. *Typical* = the median of the 30 days. Normal days are about 7–19 μGy/h.
3. Each day gets a level: **Storm 🔴** ≥ 2 × typical · **Calm 🟢** < 0.9 × typical · otherwise **Normal 🟡**.
4. A **storm onset** is the first storm day after a non-storm day.
5. The month is shifted so its first onset lands on **game day 12** (time for kids to build shields), then loops every 30 days.

---

## 2. NASA DONKI — what caused each storm

**What it is.** DONKI (*Space Weather Database Of Notifications, Knowledge, Information*) is where NASA's
space-weather forecasters record solar events every day: flares, coronal mass ejections, particle storms and more.

| Field | Value |
| --- | --- |
| API | `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/{FLR|SEP}?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` ([docs](https://ccmc.gsfc.nasa.gov/DONKI/api/)) |
| Window | Radiation month start − 3 days → start + 30 days (API maximum is 60 days) |
| FLR fields used | `flrID`, `classType` (e.g. `X1.1`, `M5.5`), `peakTime` |
| SEP fields used | `eventTime`, `linkedEvents[].activityID` (links a particle event to its flare/CME) |
| CORS | Allowed (`Access-Control-Allow-Origin: *`) — the browser calls it directly |

**How we match a storm to its cause** (`stormCauses` in `src/game/radiation.js`):

1. Find a DONKI **SEP** (solar energetic particle) event on the storm day or the day before.
2. Use the **flare DONKI linked** to that SEP event.
3. If none is linked, use the **biggest flare** in the 2 days before the storm.
4. If DONKI has nothing, the storm is recorded as "no flare" and treated as small.

**Flare classes → storm strength.** Solar flares are graded A, B, C, M, X; each letter is **10× stronger**
than the one before.

| Flare class | Game storm | Unprotected astronauts sent home |
| --- | --- | --- |
| X (e.g. X1.1) | Strong ☢️☢️☢️ | 30% |
| M (e.g. M5.5) | Medium ☢️☢️ | 20% |
| C or none found | Small ☢️ | 10% |

"Unprotected" means `1 − safety`, where safety comes from Rock Shields, natural shielding and lava-cave homes.
Random (non-data) storms keep the original 30%.

---

## 3. The six real radiation months

Each new game picks one at random. Every month contains a real solar storm that both CRaTER *measured*
and DONKI *recorded*.

| Month (start) | Storm onset(s) seen by CRaTER | DONKI cause | Game strength |
| --- | --- | --- | --- |
| 2012-01-10 | 2012-01-23 | M8.7 flare (+ particle events 23 Jan) | Medium |
| 2012-03-01 | 2012-03-05 | X1.1 flare (X5.4 followed on 7 Mar) | **Strong** |
| 2012-05-05 | 2012-05-17, 2012-05-27 | M5.1 flare (a famous "ground level event"), then no flare | Medium, Small |
| 2013-04-01 | 2013-04-11, 04-21, 04-25 | M6.5 flare, then no flare | Medium, Small, Small |
| 2014-01-01 | 2014-01-06 | M4.0 flare | Medium |
| 2017-08-28 | 2017-09-05 | M5.5 flare (the X8.2 / X9.3 flares came days later) | Medium |

The CRaTER storm days line up with DONKI's particle events in **every** month, which is a nice check
that the two independent NASA datasets agree.

---

## 4. What the data changes in the game

Deliberately small — the core game is unchanged:

1. **Real storms start storm warnings.** On a real storm onset (from game day 5), a ☢️ 3-day warning begins:
   *"📡 NASA data: the Sun made a real M5.5 solar flare! A medium storm ☢️☢️ arrives in 3 days. Build Rock Shields!"*
2. **Real flare class sets storm strength** (table above).
3. **Calm days are safer.** Random storms are half as likely on days CRaTER measured as calm.
4. **Visible and explained.** The 📡 pill shows today's level; its hover card shows the real reading and date
   (e.g. "8.47 microgray per hour on 2012-05-05") and the flare causing the current storm. Two "Did you know?"
   cards explain the data (CRaTER/LRO at the start of a game; DONKI and flare classes at the first real storm).

**The trade-off it creates:** regolith spent on Rock Shields can't be spent on Metal Makers or homes. Kids
learn that shielding is an investment you make *before* the storm, and that bigger flares need more protection.

---

## 5. Attribution and honesty inside the game

- **📡 Real NASA data screen** (title screen button and ☰ menu): what RadLab and DONKI are, what each changes in
  the game, the real month being replayed, the real flares in it, credits, and *for this game* whether each dataset was
  "🟢 Downloaded live from NASA" or a "📦 Built-in copy of real NASA data".
- **We never call archived data "live".** Replayed months are described as "a real measurement from the past, replayed"
  with the real date. Saves made before DONKI was added say so instead of pretending.
- **The real Sun this week** (title screen + NASA data screen) is the only *current* data: DONKI flares and particle
  events from the last 7 days, fetched live and labelled "(NASA DONKI, live)". If NASA can't be reached it says so.
  It is shown for context and does not change the game.

## 6. Loading, offline use and refreshing

```
New game ─► RadLab (via /radlab-api proxy) ─► daily radiation ─┐
         └► DONKI (direct)                 ─► storm causes   ─┴─► state.radiation (saved)
            any failure ─► src/data/radlabSnapshot.js (bundled copy of the same real data)
```

- Data is downloaded while the player chooses a landing place (no waiting).
- RadLab and DONKI fall back **independently**; `state.radiation.source` and `state.radiation.donki` record
  `'live'` or `'snapshot'`.
- Plain static hosting has no proxy, so RadLab uses the snapshot there; DONKI still works live.
- Refresh the bundled copy with `npm run radlab:snapshot` (`tools/radlab-snapshot.mjs`).
- Saves from before this feature have no radiation data: no 📡 pill, only random storms.

## 7. Limitations

- CRaTER data in RadLab is archived (ends ~2024), so the game replays real past months, not today's space weather.
- CRaTER is on a spacecraft orbiting the Moon (tens of kilometres up), not on the surface; we use it as "radiation at the Moon".
- Game numbers are simplified for kids: we use *levels* and *flare classes*, not the exact dose for each astronaut.

## 8. Credits

- NASA Open Science Data Repository — RadLab: <https://visualization.osdr.nasa.gov/radlab/>
- CRaTER instrument team / NASA LRO mission.
- NASA Community Coordinated Modeling Center — DONKI: <https://ccmc.gsfc.nasa.gov/tools/DONKI/>
