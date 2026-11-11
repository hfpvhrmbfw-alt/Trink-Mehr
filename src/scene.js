// Oberfläche: die Heute-Szene (gemalter Hintergrund nach Tageszeit, Zaun, Kübel, Gießkanne). Zeichnet nur, rechnet nichts.
import { el, drawUnit } from './plants.js';

// light: Farbfaktoren (R, G, B) für alles Gezeichnete, damit es zum gemalten Hintergrund der Tageszeit passt.
const PHASES = {
  morgen: { sun: [40, 236], sunColor: '#FFD9A0', sunOn: 1, light: [1, 0.93, 0.9], grass: '#6F9A5E', star: 0, fly: 0 },
  mittag: { sun: [212, 236], sunColor: '#FFE07A', sunOn: 1, light: null, grass: '#6FB045', star: 0, fly: 0 },
  abend: { sun: [222, 258], sunColor: '#FFB25E', sunOn: 1, light: [1, 0.86, 0.68], grass: '#8A8A3A', star: 0.2, fly: 1 },
  nacht: { sun: [222, 430], sunColor: '#FF9E57', sunOn: 0, light: [0.4, 0.58, 0.82], grass: '#12586A', star: 1, fly: 0.6 },
};
const again = (node, cls) => { node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); };

/**
 * @param {HTMLElement} root
 * @param {{onPot:Function, onSun:Function}} on
 */
export function createScene(root, on) {
  const S = el('svg', { viewBox: '0 0 260 560', preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' });
  root.appendChild(S);
  // Gemalte Hintergründe: je Tageszeit ein Bild, gleiche Landschaft, weich überblendet. Geladen wird erst bei Bedarf.
  const sky = el('g', {}, S), bg = {};
  for (const name of Object.keys(PHASES)) bg[name] = el('image', { x: -46, y: -65, width: 352, height: 625, preserveAspectRatio: 'xMidYMid slice', class: 'fade', opacity: 0 }, sky);
  const shoot = el('g', {}, S);
  const sun = el('g', { class: 'sun' }, S), sunSize = el('g', {}, sun), rays = el('g', { class: 'rays' }, sunSize);
  for (let i = 0; i < 6; i++) el('path', { d: 'M-9 0 L0 -190 L9 0 Z', fill: '#FFF6C9', opacity: 0.2, transform: `rotate(${i * 60 + 15})` }, rays);
  for (let i = 0; i < 12; i++) el('path', { d: 'M-4 -26 L0 -40 L4 -26 Z', transform: `rotate(${i * 30})`, class: 'ray' }, rays);
  const disc = el('circle', { cx: 0, cy: 0, r: 22 }, sunSize);
  el('path', { d: 'M-8 -2 q2 -4 4 0 M4 -2 q2 -4 4 0 M-6 6 q6 6 12 0', fill: 'none', stroke: '#B5651D', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, sunSize);
  const drawn = el('g', {}, S);
  const light = el('feColorMatrix', { type: 'matrix' }, el('filter', { id: 'licht', 'color-interpolation-filters': 'sRGB' }, S));
  const rail = el('rect', { x: -200, y: 356, width: 660, height: 4 }, drawn);
  const pickets = el('g', {}, drawn);
  for (let i = -7; i < 16; i++) el('path', { d: `M${4 + i * 29} 386 V342 l9 -9 l9 9 V386 Z`, 'stroke-width': 1 }, pickets);
  // Grasbüschel verdecken den Fuß des Zauns, damit er in der gemalten Wiese steht.
  const tufts = el('g', { class: 'fade' }, S);
  for (let i = -8; i < 40; i++) { const x = i * 9 + (i % 3) * 2, h = 9 + (i * 7 % 5) * 2; el('path', { d: `M${x - 5} 392 Q${x - 4} ${386 - h / 2} ${x - 6} ${386 - h} Q${x} ${388 - h / 2} ${x + 1} 392 Q${x + 3} ${384 - h / 2} ${x + 6} ${388 - h} Q${x + 6} 388 ${x + 7} 392 Z` }, tufts); }
  const front = el('g', {}, S);
  const hook = el('path', { d: 'M194 420 V186 Q194 162 162 162 Q130 162 130 170', fill: 'none', stroke: '#5B5148', 'stroke-width': 3, 'stroke-linecap': 'round' }, front);
  const soft = el('radialGradient', { id: 'schatten' }, S); el('stop', { offset: 0, 'stop-color': '#0B2A1E', 'stop-opacity': 0.32 }, soft); el('stop', { offset: 1, 'stop-color': '#0B2A1E', 'stop-opacity': 0 }, soft);
  const shadow = el('ellipse', { cx: 130, cy: 421, rx: 40, ry: 7, fill: 'url(#schatten)' }, S);
  const potWrap = el('g', { transform: 'translate(130 354) scale(1.5)' }, front), potWob = el('g', { class: 'tap' }, potWrap);
  const dew = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[106, 356], [154, 354], [131, 361]].forEach(([cx, cy]) => el('ellipse', { cx, cy, rx: 2.2, ry: 2.8, fill: '#CDEBFF', stroke: '#FFFFFF', 'stroke-width': 0.6 }, dew));
  const visitor = el('g', { class: 'hover', 'pointer-events': 'none' }, S), bf = el('g', { transform: 'translate(176 262)' }, visitor);
  el('ellipse', { cx: -5, cy: 0, rx: 5, ry: 7, fill: '#FFB347', class: 'flap' }, bf); el('ellipse', { cx: 5, cy: 0, rx: 5, ry: 7, fill: '#FF8A5B', class: 'flap' }, bf); el('rect', { x: -0.8, y: -5, width: 1.6, height: 10, rx: 0.8, fill: '#2A1A12' }, bf);
  const stars = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[24, 196], [52, 150], [78, 228], [36, 262], [92, 174], [18, 316], [66, 296], [176, 172], [232, 232], [204, 280], [240, 306], [186, 316], [222, 150], [40, 120], [150, 134], [112, 110], [244, 104], [14, 232], [200, 90], [70, 70]].forEach(([cx, y], n) => { const cy = y > 262 ? y - 190 : y; const c = el('circle', { cx, cy, r: n % 3 ? 1.3 : 2, fill: '#FFF6D6', class: 'twinkle' }, stars); c.style.animationDelay = ((n * 0.37) % 2.4) + 's'; });
  const moon = el('g', { class: 'fade', transform: 'translate(210 252)', 'pointer-events': 'none' }, S);
  el('circle', { cx: 0, cy: 0, r: 16 }, el('clipPath', { id: 'moonclip' }, moon));
  el('circle', { cx: 0, cy: 0, r: 16, fill: '#F4EFD8' }, moon); el('circle', { cx: -5, cy: -4, r: 3, fill: '#E2DBBE' }, moon); el('circle', { cx: 5, cy: 6, r: 2.2, fill: '#E2DBBE' }, moon);
  const moonDark = el('circle', { cy: 0, r: 16.5, fill: '#00266B', opacity: 0.93, 'clip-path': 'url(#moonclip)' }, moon);
  const flies = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[40, 330], [84, 372], [190, 350], [226, 384], [150, 316]].forEach(([cx, cy], n) => { const c = el('circle', { cx, cy, r: 2.2, fill: '#FFE98A', class: 'fly twinkle' }, flies); c.style.animationDelay = n * 0.9 + 's'; });
  const zz = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [0, 1].forEach((n) => { const t = el('text', { x: 172 + n * 6, y: 352 - n * 10, 'font-weight': 700, 'font-size': 12 + n * 3, fill: '#F3F0E6', class: 'zz' }, zz); t.textContent = 'z'; t.style.animationDelay = n * 1.2 + 's'; });
  const can = el('g', { class: 'can' }, el('g', { transform: 'translate(172 262)', 'pointer-events': 'none' }, S));
  el('path', { d: 'M2 22 L-26 4 L-22 0 L4 10 Z', fill: '#6F93B3' }, can); el('ellipse', { cx: -25, cy: 2, rx: 6, ry: 4, fill: '#5F88A9' }, can);
  el('path', { d: 'M44 6 q18 10 0 24 M10 0 q12 -16 24 0', fill: 'none', stroke: '#5F88A9', 'stroke-width': 5, 'stroke-linecap': 'round' }, can);
  el('rect', { x: 0, y: 0, width: 44, height: 34, rx: 6, fill: '#7FA8C9' }, can); el('path', { d: 'M6 6 V28', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.35 }, can);
  const fx = el('g', { 'pointer-events': 'none' }, S);

  let key = '', unit = null, phase = 'mittag';
  potWob.addEventListener('click', () => { again(potWob, 'wobble'); on.onPot(); });
  sun.addEventListener('click', () => { again(rays, 'pulse'); on.onSun(); });
  sky.addEventListener('click', () => {
    if (phase !== 'nacht') return;
    const x = 40 + Math.random() * 120, y = 90 + Math.random() * 80;
    const s = el('path', { d: `M${x} ${y} l70 34`, stroke: '#FFF6D6', 'stroke-width': 2, 'stroke-linecap': 'round', class: 'shoot' }, shoot);
    setTimeout(() => s.remove(), 900);
  });

  return {
    /** @param {{phase:string, species:object, stage:number, frac:number, mood:string, potId:number, fence:{color:string,line:string}, heat:boolean, moon:number, visitor:boolean}} v */
    update(v) {
      phase = v.phase;
      const c = PHASES[v.phase], hang = v.species.form === 'hang';
      if (!bg[v.phase].getAttribute('href')) bg[v.phase].setAttribute('href', `bilder/${v.phase}.webp`);
      for (const name in bg) bg[name].style.opacity = name === v.phase ? 1 : 0;
      if (c.light) { light.setAttribute('values', `${c.light[0]} 0 0 0 0 0 ${c.light[1]} 0 0 0 0 0 ${c.light[2]} 0 0 0 0 0 1 0`); for (const g of [drawn, front]) g.setAttribute('filter', 'url(#licht)'); } else for (const g of [drawn, front]) g.removeAttribute('filter');
      tufts.style.fill = c.grass;
      sun.style.transform = `translate(${c.sun[0]}px,${c.sun[1]}px)`; sun.style.opacity = c.sunOn; disc.setAttribute('fill', c.sunColor);
      sunSize.setAttribute('transform', `scale(${v.heat ? 1.35 : 1})`);
      rays.querySelectorAll('.ray').forEach((r) => r.setAttribute('fill', c.sunColor));
      stars.style.opacity = c.star; flies.style.opacity = c.fly;
      moon.style.opacity = v.phase === 'nacht' ? 1 : 0; zz.style.opacity = v.phase === 'nacht' ? 1 : 0;
      moonDark.setAttribute('cx', v.moon < 0.5 ? -64 * v.moon : 64 * (1 - v.moon));
      dew.style.opacity = v.phase === 'morgen' && !hang ? 1 : 0;
      rail.setAttribute('fill', v.fence.line);
      pickets.setAttribute('fill', v.fence.color); pickets.setAttribute('stroke', v.fence.line);
      hook.style.display = hang ? '' : 'none'; shadow.style.display = hang ? 'none' : '';
      visitor.style.display = v.visitor ? '' : 'none';
      const k = [v.species.id, v.stage, v.mood, v.potId].join('|');
      if (k !== key) {
        const grew = key && key.split('|')[0] === v.species.id && +key.split('|')[1] < v.stage;
        potWob.replaceChildren();
        unit = drawUnit(potWob, v.species, v.stage, { pot: v.potId, mood: v.mood, detail: true });
        unit.plant.setAttribute('class', 'grow' + (unit.hang && v.stage >= 2 ? ' down' : ''));
        if (grew) again(unit.plant, 'pop');
        key = k;
      }
      const scale = 0.84 + 0.16 * v.frac;
      requestAnimationFrame(() => { if (unit) unit.plant.style.transform = `scale(${scale})`; });
    },
    /** Gießkanne kippt, Wasser fällt. */
    pour() {
      can.classList.add('on');
      setTimeout(() => { for (let n = 0; n < 5; n++) { const w = el('g', { class: 'fall' }, fx); el('path', { d: 'M0 -6 C-1 -3 -4 0 -4 2 A4 4 0 0 0 4 2 C4 0 1 -3 0 -6 Z', fill: '#5DB0E6', transform: `translate(${128 + n * 5} ${290 + (n % 2) * 6})` }, w); w.style.animationDelay = n * 0.07 + 's'; setTimeout(() => w.remove(), 1200); } }, 250);
      setTimeout(() => can.classList.remove('on'), 950);
    },
    /** Blütenblätter rieseln einmal durchs Bild. */
    petals(color) {
      for (let n = 0; n < 16; n++) { const p = el('ellipse', { cx: 10 + n * 16, cy: 60 + (n % 4) * 14, rx: 4, ry: 7, fill: n % 3 ? color : '#FFFFFF', opacity: 0.9, class: 'petal' }, fx); p.style.animationDelay = (n % 5) * 0.15 + 's'; setTimeout(() => p.remove(), 3200); }
    },
  };
}
