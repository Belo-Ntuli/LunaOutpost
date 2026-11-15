import { RADIATION_WINDOW_DAYS, RADLAB_INSTRUMENT, addDays } from '../game/radiation.js';

// Real 30-day stretches of Moon radiation that each contain at least one real solar storm
// (solar particle event) seen by the CRaTER instrument. One is picked at random per game.
export const RADIATION_WINDOWS = [
  { start: '2012-01-10', label: 'January 2012 solar storm' },
  { start: '2012-03-01', label: 'March 2012 solar storm' },
  { start: '2012-05-05', label: 'May 2012 solar storm' },
  { start: '2013-04-01', label: 'April 2013 solar storms' },
  { start: '2014-01-01', label: 'January 2014 solar storm' },
  { start: '2017-08-28', label: 'September 2017 solar storm' },
];

/** RadLab query (without the base URL) for one window of daily data. */
export function radlabUrl(start) {
  const end = addDays(start, RADIATION_WINDOW_DAYS);
  return `?instrument_id=${RADLAB_INSTRUMENT}&absorbed_dose_rate&timestamp%3E=${start}&timestamp%3C${end}&format=json`;
}
