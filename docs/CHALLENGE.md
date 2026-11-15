# The Challenge and How Luna Outpost Answers It

## The challenge (as given)

> Your challenge is to design and build an interactive game or app that lets kids ages 7–12 manage a lunar or
> Martian outpost, making real decisions about life support, radiation shielding, power budgeting, food
> production, and communication delay, and experiencing how those choices play out over the course of a
> simulated mission.
>
> Think about how your tool can turn genuine mission constraints into gameplay: what does it feel like to trade
> oxygen reserves for an extra research opportunity, or to reinforce shielding against a radiation event at the
> cost of tonight's power supply? How will you represent competing resources so that no choice is free, and every
> decision teaches something true about what astronauts and mission planners actually navigate?
>
> You're encouraged to ground your simulation in real NASA open data wherever possible — for example, using DONKI
> to reflect actual solar activity and radiation risk, the OSDR for real astronaut health and biological research
> findings, or Artemis and Mars surface mission data to inform environmental conditions at your chosen site.
> Incorporating live or archived NASA datasets, rather than fabricated numbers, will make the experience more
> authentic and give players a genuine window into how mission-critical decisions are made.
>
> Format is open: you could build a resource-management survival game, a narrative-driven decision simulator, a
> mission-control-style dashboard experience, or something else entirely — browser-based, mobile, or desktop. The
> goal is a working prototype that demonstrates the trade-off mechanic clearly enough that a young player walks
> away understanding a real constraint of deep space survival, not just having played a fun game. Creative
> interpretations of "outpost," "site," or "mission" beyond the Moon and Mars are welcome, provided the underlying
> educational goal — teaching real engineering trade-offs through play — stays central.

## Our answer in one paragraph

**Luna Outpost** is a browser-based resource-management survival game for ages 7–12. Kids pick one of 15 real
lunar regions on a 3D Moon, land 7 astronauts, and build a base on a hexagon map. Every machine costs scarce
materials and power, and keeps air, water or food flowing — or not. Real NASA data drives the space weather:
**RadLab** (radiation measured at the Moon by CRaTER) decides when storms arrive, and **DONKI** (NASA's
space-weather database) names the real solar flare behind each one and sets how strong it is. The score is how
many days the mission survives.

## Requirement-by-requirement

| Challenge asks for | How Luna Outpost does it | Where |
| --- | --- | --- |
| **Ages 7–12** | Big text and buttons, one-sentence descriptions, emoji and ⭐ ratings instead of numbers, 🧑‍🚀 Astro the astronaut gives one tip at a time, 3-card tutorial, slow clock (8 s/day), starts paused | `docs/GAME_SPEC.md` §1, §3 |
| **Lunar or Martian outpost** | The Moon, split into 15 real regions (South Pole, Procellarum, Deep Shadowed Crater…) with different sunlight, ice, metal and shielding | §4 |
| **Life support** | 🫁 Oxygen, 💧 Water, 🥔 Food bars show "⏳ days left". Running out follows a compressed "rule of threes" (air fastest, food slowest) | §5, §7 |
| **Radiation shielding** | Solar storms with a 3-day warning. Protection from 🛡️ Rock Shields (cost Moon dirt), lava-cave homes, naturally shielded regions, and the 🛡️ **Storm Shelter** switch (+50% safety, but 15 ⚡ a day) | §7, §12 |
| **Power budgeting** | Solar Panels stop during the 15-day lunar night (not at the poles); Batteries store power; Nuclear Power works anywhere but is expensive. When power runs short, life support is powered first and other machines stop. The Storm Shelter and Science Lab compete for the same power | §6, §7 |
| **Food production** | Greenhouses grow food *and* some air, but use water and power | §6 |
| **Communication delay** | 📡 **Call Earth** (needs a Rocket Pad): the radio call really takes **1.3 seconds** to reach Earth and 1.3 s back (speed of light); the rocket takes **3 days** to fly; Earth needs 10 days before the next one. Kids learn to ask for help *before* they run out. Cards compare the Moon (1.3 s) with Mars (up to 22 min each way) | §7 rule 7 |
| **Choices play out over a mission** | A day-by-day simulation; lunar day/night cycle; real storms repeat every 30 days; rockets you call arrive 3 days later; research pays off as discoveries over time; 10 goals; score = days survived | §7, §9 |
| **No choice is free** | Every machine costs metal and/or regolith and most use power; see the trade-off table below | §6 |
| **Teach something true** | Every region, machine and event has a short, true "💡 Did you know?" fact; learning cards pause the game the first time something happens | `src/data/*.js`, `src/data/learn.js` |
| **Real NASA open data** | **RadLab** (CRaTER Moon radiation) + **DONKI** (solar flares, particle events, and the real Sun this week), live with a bundled real-data fallback, attributed in-game on the 📡 NASA data screen | [`docs/NASA_DATA.md`](NASA_DATA.md) |
| **Research opportunity** (from the brief: "trade oxygen reserves for an extra research opportunity") | 🔬 **Science Lab** breathes 3 🫁 oxygen and uses 5 ⚡ a day. Every 6 research = a discovery: a real NASA finding (ISS plants, Moon ice, MOXIE, solar cells, Twins Study) that boosts one machine by 25% (or makes storms gentler) | §6, §7 rule 8 |
| **Working prototype** | Runs in any modern browser (`npm run dev`), saves in localStorage, 29 automated tests, balance simulator | `README.md` |

## The trade-offs players feel

| Decision | What you gain | What it costs you | Real-world lesson |
| --- | --- | --- | --- |
| Build an **Air Maker** | 🫁 air | 💧 water + ⚡ power | Electrolysis turns water into oxygen — air and water compete |
| Build a **Greenhouse** | 🥔 food + a little air | 💧 water + ⚡ power | Growing food in space needs water, light and energy |
| **Solar Panels** vs **Nuclear Power** | Cheap power vs power day *and* night | Dark for 15 days vs lots of metal | Why lunar night is a mission-design problem |
| Build **Batteries** | Power through the night | Metal you can't use elsewhere | Energy storage is heavy and expensive |
| Build **Rock Shields** before a storm | Fewer astronauts hurt | Regolith you wanted for metal or homes | Shielding must be built *before* the storm |
| Land at a **pole** vs the **equator** | Sun all the time + ice vs lots of metal | Less metal vs long nights, little ice | Why Artemis targets the lunar South Pole |
| Send **explorers** | A new region with new resources | Materials, astronauts away for days, at least one must stay home | Expeditions take crew away from running the base |
| Build a **Rocket Pad** | Lets you call Earth for help | Big material cost | Supply lines are a big investment |
| **📡 Call Earth** for food, water, metal *or* astronauts | The one thing you need most | Only one rocket at a time, 3 days to arrive, 10 days before the next; new crew need beds and then eat | Communication and travel delays mean you must plan ahead |
| Switch on the **🛡️ Storm Shelter** | +50% safety when the storm hits | 15 ⚡ every day it is on, which can drain batteries at night | Shielding competes with the power budget (Orion's storm plan) |
| Build a **🔬 Science Lab** | Discoveries that make machines 25% better (real NASA findings) | 3 🫁 oxygen + 5 ⚡ every day, plus materials | Research costs resources now and pays off later |

## How the NASA data makes it authentic

- Storms are not random surprises; they are **real events** from 2012–2017 that a NASA spacecraft actually
  measured at the Moon (RadLab/CRaTER).
- Each storm is linked to the **real solar flare** that caused it (DONKI), and the flare's class (C, M, X — each
  10× stronger) sets how dangerous it is.
- The 📡 sign shows kids the real reading and date, so they can see the numbers came from NASA.
- Full details: [`docs/NASA_DATA.md`](NASA_DATA.md).

## What a young player should walk away knowing

1. Astronauts need air, water and food **every day**, and air runs out fastest.
2. On the Moon, a night lasts about **two weeks**, so solar power alone isn't enough.
3. The Sun sends real **radiation storms**; Moon bases need **shielding** built in advance, or must spend power to hide.
4. Making one thing (air, food) usually **uses up** something else (water, power).
5. Messages to Earth take time (1.3 s from the Moon, up to 22 min from Mars) and rockets take days, so you must **plan ahead**.
6. Science costs air and power today but makes the base better tomorrow.
7. Real scientists measure all of this — the game's storms really happened.

## Judging guidance checklist

### Grounding in real data

| Guidance | How we meet it |
| --- | --- |
| Pull from NASA public APIs / open datasets rather than inventing numbers | Radiation levels come from **NASA RadLab** (CRaTER on LRO); storm causes and strength from **NASA DONKI**; "the real Sun this week" is live from DONKI. See [NASA_DATA.md](NASA_DATA.md) |
| Clearly attribute data sources **inside the tool** | **📡 Real NASA data** screen on the title screen and in the ☰ menu (sources, what each changes, credits); the 📡 pill's hover card names CRaTER/RadLab and DONKI; two "Did you know?" cards explain the data; storm warnings say "NASA data: the Sun made a real M5.5 solar flare" |
| Curated embedded dataset is OK — **but don't present static data as live** | The game says exactly what happened for *this* game: "🟢 Downloaded live from NASA for your game" or "📦 Built-in copy of real NASA data". Archived months are called "a real month from the past, replayed" with the real date. Only the "real Sun this week" line is labelled "live", and only when it really is |

### Gameplay and design pitfalls

| Pitfall | How we avoid it |
| --- | --- |
| A "safe" choice with no cost | Every building costs metal and/or regolith; most also use power or water (see trade-off table). Exploring costs materials **and** crew time. Even shields compete with Metal Makers and homes for regolith. The Storm Shelter costs power, the Science Lab costs air, and Call Earth costs time |
| Visual polish instead of mechanical accuracy | Rules follow real constraints: 15-day lunar night, electrolysis uses water, greenhouses need water + light, shielding before storms, life support powered first, "rule of threes" for shortages. 29 automated tests check these rules |
| Too many systems to track | The top bar is grouped into **three systems — ❤️ Life support · ⚡ Power · 🏗️ Building** — plus one 🛡️ safety number. Kids watch the *days left* on the three life bars; Astro shows only the single most urgent tip. (Six resources were a project requirement, so we grouped them rather than cutting them) |

### What makes it stand out

| Stand-out idea | Status |
| --- | --- |
| Link a shielding decision to actual space weather | ✅ Real storms (RadLab) with real causes (DONKI) set when and how hard storms hit, so building Rock Shields is a response to real events. The title / NASA data screen shows **this week's real solar flares live** and says if real Moon bases would be checking their shields |
| Replayability | ✅ 15 landing sites with different strengths, 6 different real storm months, random storms, different strategies (solar + batteries vs nuclear, poles vs equator, explore early vs build up). Losing is quick to retry and the record is kept |
| Short, traceable explanation of datasets | ✅ [NASA_DATA.md](NASA_DATA.md): endpoints, exact queries, fields, processing, matched events, limitations, credits. The bundled copy can be regenerated with `npm run radlab:snapshot` |

## Gaps and possible next steps

Kept honest, so we know what to build next:

| Challenge idea | Status | Small way to add it |
| --- | --- | --- |
| **Communication delay** | ✅ Done: 📡 Call Earth with a real 1.3 s radio delay each way + 3-day rocket trip | A "Mars mode" where the delay is up to 22 minutes (scaled) and Astro's tips arrive late |
| **Trade oxygen for a research opportunity** | ✅ Done: 🔬 Science Lab (oxygen + power → discoveries) | More discoveries, or letting kids choose which machine to improve |
| **Shielding at the cost of tonight's power** | ✅ Done: 🛡️ Storm Shelter switch (+50% safety, 15 ⚡ a day) | — |
| **OSDR astronaut-health / biology findings** | Partly: discoveries use real, well-known NASA research findings (ISS plants, Twins Study), written as short facts — not live OSDR data | Pull study titles/results live from the OSDR API for the discovery cards |
| **Artemis / Mars surface environment data** | Used only as facts in text | Site temperatures or sunlight from mission data per region |
