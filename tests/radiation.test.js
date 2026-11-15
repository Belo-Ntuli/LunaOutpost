import { describe, expect, it } from 'vitest';
import { RADLAB_SNAPSHOT } from '../src/data/radlabSnapshot.js';
import { FIRST_STORM_DAY, dailyMeans, isStormStart, makeRadiation, radiationOn, stormCauses, strengthFromFlare } from '../src/game/radiation.js';
import { advanceDay } from '../src/game/simulation.js';
import { createNewGame } from '../src/game/state.js';

const never = () => 0.99;

describe('RadLab radiation data', () => {
  it('turns hourly RadLab rows into daily means, with null for missing days', () => {
    const response = {
      columns: ['timestamp', 'instrument_id', 'absorbed_dose_rate'],
      data: [
        ['2017-09-10T00:59:59', 'CRaTER-D1D2', 10],
        ['2017-09-10T01:59:59', 'CRaTER-D1D2', 20],
        ['2017-09-12T00:59:59', 'CRaTER-D1D2', 7],
        ['2017-09-12T01:59:59', 'CRaTER-D1D2', null],
      ],
    };
    expect(dailyMeans(response, '2017-09-10', 3)).toEqual([15, null, 7]);
  });

  it('labels days calm / normal / storm against the typical dose and starts the first storm on day 12', () => {
    const daily = Array(30).fill(10);
    daily[20] = 500;
    daily[21] = 300;
    daily[25] = 5;
    const rad = makeRadiation({ start: '2017-08-28', daily, source: 'snapshot' });
    expect(radiationOn(rad, FIRST_STORM_DAY)).toMatchObject({ level: 'storm', dose: 500, date: '2017-09-17' });
    expect(isStormStart(rad, FIRST_STORM_DAY)).toBe(true);
    expect(isStormStart(rad, FIRST_STORM_DAY + 1)).toBe(false); // same storm, second day
    expect(radiationOn(rad, FIRST_STORM_DAY + 5).level).toBe('calm');
    expect(radiationOn(rad, 0).level).toBe('normal');
  });

  it('every bundled snapshot window contains a real storm', () => {
    for (const w of RADLAB_SNAPSHOT) {
      const rad = makeRadiation({ ...w, source: 'snapshot' });
      expect(isStormStart(rad, FIRST_STORM_DAY)).toBe(true);
    }
  });

  it('starts a solar storm warning on the day the real data shows a storm', () => {
    const rad = { ...makeRadiation({ ...RADLAB_SNAPSHOT[0], source: 'snapshot' }), storms: RADLAB_SNAPSHOT[0].storms };
    const s = createNewGame(5, rad);
    s.day = FIRST_STORM_DAY - 1;
    const entries = advanceDay(s, never);
    expect(s.flare).toMatchObject({ real: true, flare: 'M8.7', strength: 'medium' });
    expect(entries.some((e) => e.event === 'real-storm')).toBe(true);
  });
});

describe('DONKI storm causes', () => {
  const daily = Array(30).fill(10);
  daily[5] = 500;
  const rad = makeRadiation({ start: '2017-08-28', daily, source: 'snapshot' }); // storm on 2017-09-02
  const flares = [
    { flrID: 'F-big', classType: 'X8.2', peakTime: '2017-09-01T12:00Z' },
    { flrID: 'F-linked', classType: 'M5.5', peakTime: '2017-09-01T20:00Z' },
  ];

  it('prefers the flare DONKI linked to the particle event, and grades storms by flare class', () => {
    const seps = [{ eventTime: '2017-09-02T01:00Z', linkedEvents: [{ activityID: 'F-linked' }] }];
    expect(stormCauses(rad, flares, seps)).toEqual([
      { index: 5, date: '2017-09-02', flare: 'M5.5', flareTime: '2017-09-01T20:00Z', sepTime: '2017-09-02T01:00Z', strength: 'medium' },
    ]);
    expect([strengthFromFlare('X1.1'), strengthFromFlare('M8.7'), strengthFromFlare('C3.0')]).toEqual(['strong', 'medium', 'small']);
  });

  it('falls back to the biggest nearby flare, or a small storm when DONKI has nothing', () => {
    expect(stormCauses(rad, flares, [])[0]).toMatchObject({ flare: 'X8.2', strength: 'strong' });
    expect(stormCauses(rad, [], [])[0]).toMatchObject({ flare: null, strength: 'small' });
  });

  it('stronger real flares send more unprotected astronauts home', () => {
    const lost = (strength) => {
      const s = createNewGame(5);
      s.population = 20;
      s.flare = { daysLeft: 1, real: true, strength };
      advanceDay(s, never);
      return 20 - s.population;
    };
    expect(lost('strong')).toBeGreaterThan(lost('medium'));
    expect(lost('medium')).toBeGreaterThan(lost('small'));
  });
});
