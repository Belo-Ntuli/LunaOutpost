// Themed, context-aware mouse cursors. Cursor images are drawn on a canvas at runtime
// (so emoji always render) and cached as CSS `cursor` values with a keyword fallback.

import { pictureImage } from './icons.js';

const SIZE = 40;
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const cache = new Map();

function canvasCursor(key, draw, hotX, hotY, fallback) {
  if (cache.has(key)) return cache.get(key);
  let value = fallback;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    draw(c.getContext('2d'));
    value = `url(${c.toDataURL('image/png')}) ${hotX} ${hotY}, ${fallback}`;
  } catch {
    // Canvas unavailable: keep the plain keyword cursor.
  }
  cache.set(key, value);
  return value;
}

/**
 * Emoji cursor. `hot` is the click point as a fraction of the image (0..1), e.g. [0.5, 0.5] = centre.
 */
export function emojiCursor(emoji, hot = [0.5, 0.5], fallback = 'pointer') {
  return canvasCursor(`e:${emoji}`, (ctx) => {
    ctx.font = `${Math.round(SIZE * 0.78)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText(emoji, SIZE / 2, SIZE / 2 + 2);
  }, Math.round(hot[0] * (SIZE - 1)), Math.round(hot[1] * (SIZE - 1)), fallback);
}

/** The game's main arrow: a chunky yellow arrow with a dark outline. */
export function arrowCursor() {
  return canvasCursor('arrow', (ctx) => {
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(3, 29);
    ctx.lineTo(10, 23);
    ctx.lineTo(15, 34);
    ctx.lineTo(20, 32);
    ctx.lineTo(15, 21);
    ctx.lineTo(24, 21);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1d2350';
    ctx.fillStyle = '#ffd23f';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
  }, 3, 3, 'default');
}

/** Cursor made from a picture (data URL). Falls back to `fallback` until the picture has loaded. */
export function imageCursor(img, key, fallback = 'crosshair') {
  if (!img?.complete || !img.naturalWidth) return fallback;
  return canvasCursor(`i:${key}`, (ctx) => {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3;
    ctx.drawImage(img, 2, 2, SIZE - 4, SIZE - 4);
  }, SIZE / 2, SIZE / 2, fallback);
}

// Named cursors used around the game.
export const CURSORS = {
  get default() { return arrowCursor(); },
  get pointer() { return emojiCursor('👆', [0.42, 0.12], 'pointer'); },
  get grab() { return emojiCursor('✋', [0.5, 0.5], 'grab'); },
  get grabbing() { return emojiCursor('✊', [0.5, 0.5], 'grabbing'); },
  get land() { return emojiCursor('🚀', [0.82, 0.18], 'pointer'); },
  get zoom() { return emojiCursor('🔍', [0.4, 0.4], 'zoom-in'); },
  get explore() { return imageCursor(pictureImage('rover'), 'rover', 'pointer'); },
  get locked() { return emojiCursor('🔒', [0.5, 0.5], 'not-allowed'); },
  get waiting() { return emojiCursor('⏳', [0.5, 0.5], 'progress'); },
  get no() { return emojiCursor('🚫', [0.5, 0.5], 'not-allowed'); },
};

/** Publishes the shared cursors as CSS variables (used by styles.css). */
export function installCursorVariables(root = document.documentElement) {
  root.style.setProperty('--cur-default', CURSORS.default);
  root.style.setProperty('--cur-pointer', CURSORS.pointer);
  root.style.setProperty('--cur-no', CURSORS.no);
  root.style.setProperty('--cur-grab', CURSORS.grab);
}
