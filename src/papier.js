// Oberfläche: der Papierschnitt-Stil. Farben je Tageszeit und die Landschaft (Himmel, Hügel, Zaun, Stein).
// Jede Ebene ist eine Fläche aus "Tonpapier"; der Filter #lage (index.html) legt einen weichen Schatten darunter.
import { el } from './plants.js';

/** Grundfarben am Mittag */
export const PAPER = {
  sky: '#F4E7D4', sun: '#F2B84B', cloud: '#FFFBF3', far: '#C6D7A2', mid: '#9EBE84', front: '#7DA56D', near: '#5F8B5B',
  stone: '#C7BCAB', stoneTop: '#DDD3C4', fence: '#FBF6EC', soil: '#7A563C', ink: '#3B2E24',
};
/** Tageszeit: alle Flächen werden zu einer Lichtfarbe hin gemischt, der Himmel hat eine eigene Farbe. */
export const LIGHT = {
  morgen: { tint: '#F4A98C', amount: 0.12, sky: '#F6D8C4' },
  mittag: { tint: '#FFFFFF', amount: 0, sky: PAPER.sky },
  abend: { tint: '#F08A4B', amount: 0.22, sky: '#F3B987' },
  nacht: { tint: '#1E2D5C', amount: 0.58, sky: '#24325F' },
};

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
/** Farbe im Licht der Tageszeit */
export const lit = (color, phase) => mix(color, LIGHT[phase].tint, LIGHT[phase].amount);
/** Werte für feColorMatrix, die dasselbe Licht auf eine ganze Gruppe legen */
export function lightMatrix(phase) {
  const a = LIGHT[phase].amount, [r, g, b] = rgb(LIGHT[phase].tint).map((v) => (v / 255) * a), k = 1 - a;
  return `${k} 0 0 0 ${r} 0 ${k} 0 0 ${g} 0 0 ${k} 0 ${b} 0 0 0 1 0`;
}

// Gleichbleibend "zufällige" Schnittkanten: immer derselbe Ausschnitt, damit nichts zittert.
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const quad = (p, t) => [(1 - t) * (1 - t) * p[0] + 2 * (1 - t) * t * p[2] + t * t * p[4], (1 - t) * (1 - t) * p[1] + 2 * (1 - t) * t * p[3] + t * t * p[5]];
/** Hügel als geschnittene Fläche entlang einer Kurve p = [x0,y0, cx,cy, x1,y1] bis zum Boden */
export function hill(parent, p, fill, bottom, seed) {
  const R = rng(seed);
  let d = '';
  for (let i = 0; i <= 44; i++) { const [x, y] = quad(p, i / 44); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y + (R() - 0.5) * 2.4).toFixed(1); }
  return el('path', { d: `${d} L${p[4]} ${bottom} L${p[0]} ${bottom} Z`, fill, filter: 'url(#lage)' }, parent);
}
/** Weidezaun, der einer Hügelkurve folgt */
export function fence(parent, p, from, to, color) {
  const g = el('g', { filter: 'url(#lage)' }, parent), top = [], mid = [];
  for (let t = from; t <= to + 1e-6; t += 0.062) {
    const [x, y] = quad(p, t);
    el('rect', { x: (x - 1.7).toFixed(1), y: (y - 14).toFixed(1), width: 3.4, height: 16, rx: 1, fill: color }, g);
    top.push([x, y - 11]); mid.push([x, y - 5]);
  }
  for (const pts of [top, mid]) el('path', { d: pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(''), fill: 'none', stroke: color, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
  return g;
}
export function cloud(parent, x, y, s, fill) {
  return el('path', { d: 'M4 16 q4 -16 20 -14 q8 -14 24 -6 q14 -4 18 10 q12 2 10 12 H0 q-8 -2 4 -2 Z', fill, transform: `translate(${x} ${y}) scale(${s})`, filter: 'url(#lage)' }, parent);
}

/** Landschaft der Heute-Szene (viewBox 260 x 560). Rückgabe: der Himmel, für Klicks. */
export function drawLand(g, phase) {
  g.replaceChildren();
  const c = (k) => lit(PAPER[k], phase), night = phase === 'nacht';
  const sky = el('rect', { x: -200, y: -400, width: 660, height: 1000, fill: LIGHT[phase].sky }, g);
  if (!night) {
    const cl = phase === 'abend' ? mix(PAPER.cloud, '#F7C49E', 0.5) : phase === 'morgen' ? mix(PAPER.cloud, '#F8D3C2', 0.4) : PAPER.cloud;
    cloud(g, 26, 196, 1.15, cl); cloud(g, 150, 150, 0.8, cl);
  } else cloud(g, 30, 200, 1, mix(PAPER.cloud, LIGHT.nacht.sky, 0.78));
  const MID = [-20, 380, 110, 338, 280, 392];
  hill(g, [-20, 342, 90, 300, 280, 330], c('far'), 600, 3);
  hill(g, MID, c('mid'), 600, 5);
  fence(g, MID, 0.05, 0.6, night ? mix(PAPER.fence, '#3A4A7A', 0.55) : c('fence'));
  hill(g, [-20, 452, 120, 392, 280, 432], c('front'), 600, 7);
  // Stein in der Mitte, auf dem der Kübel steht (Oberseite bei y 406)
  const st = el('g', { filter: 'url(#lage)' }, g);
  el('path', { d: 'M62 430 Q63 408 92 403 L170 401 Q198 405 200 426 Q188 438 130 439 Q74 439 62 430 Z', fill: c('stone') }, st);
  el('path', { d: 'M76 410 Q130 398 188 408 Q160 417 88 417 Z', fill: c('stoneTop') }, st);
  hill(g, [-20, 520, 150, 466, 280, 500], c('near'), 600, 11);
  for (let i = 0; i < 9; i++) { const x = 12 + i * 31 + (i % 2) * 7, y = 522 + (i % 3) * 7; el('path', { d: `M${x} ${y + 8} q-2 -10 -6 -14 M${x} ${y + 8} q2 -9 7 -12`, fill: 'none', stroke: c('front'), 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g); }
  return sky;
}

/** Kopf des Beets (viewBox 330 x 150): Himmel, Hügel, Zaun, Wiesenkante */
export function drawBeetHead(g) {
  g.replaceChildren();
  const c = (k) => PAPER[k];
  el('rect', { x: -20, y: -20, width: 370, height: 200, fill: PAPER.sky }, g);
  cloud(g, 30, 30, 0.9, PAPER.cloud); cloud(g, 230, 18, 0.65, PAPER.cloud);
  hill(g, [-10, 108, 120, 74, 340, 100], c('far'), 160, 13);
  const MID = [-10, 126, 170, 100, 340, 122];
  hill(g, MID, c('mid'), 160, 17);
  fence(g, MID, 0.02, 0.98, c('fence'));
  hill(g, [-10, 144, 160, 132, 340, 142], c('front'), 160, 19);
}
