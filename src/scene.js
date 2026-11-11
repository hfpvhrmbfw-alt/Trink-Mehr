// Oberfläche: die Heute-Szene (Himmel nach Tageszeit, Zaun, Kübel, Gießkanne). Zeichnet nur, rechnet nichts.
import { el, drawUnit } from './plants.js';

const PHASES = {
  morgen: { sky: '#FBDCCB', sun: [36, 300], sunColor: '#FFD36E', sunOn: 1, glow: 0.8, cloud: 0.7, tint: ['#FFB7A0', 0.1], star: 0, fly: 0 },
  mittag: { sky: '#CFE9F7', sun: [212, 248], sunColor: '#FFE07A', sunOn: 1, glow: 0, cloud: 1, tint: ['#FFFFFF', 0], star: 0, fly: 0 },
  abend: { sky: '#F7C08F', sun: [222, 330], sunColor: '#FF9E57', sunOn: 1, glow: 0.9, cloud: 0.5, tint: ['#FF7A3D', 0.16], star: 0.25, fly: 1 },
  nacht: { sky: '#1B2550', sun: [222, 430], sunColor: '#FF9E57', sunOn: 0, glow: 0, cloud: 0.07, tint: ['#16204A', 0.5], star: 1, fly: 0.6 },
};
const again = (node, cls) => { node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); };

/**
 * @param {HTMLElement} root
 * @param {{onPot:Function, onSun:Function}} on
 */
export function createScene(root, on) {
  const S = el('svg', { viewBox: '0 0 260 560', preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' });
  root.appendChild(S);
  const sky = el('rect', { x: -200, y: -400, width: 660, height: 1000, class: 'fade' }, S);
  const glow = el('ellipse', { cx: 130, cy: 390, rx: 230, ry: 100, fill: '#FFE9B8', class: 'fade' }, S);
  const shoot = el('g', {}, S);
  const sun = el('g', { class: 'sun' }, S), sunSize = el('g', {}, sun), rays = el('g', { class: 'rays' }, sunSize);
  for (let i = 0; i < 6; i++) el('path', { d: 'M-9 0 L0 -190 L9 0 Z', fill: '#FFF6C9', opacity: 0.2, transform: `rotate(${i * 60 + 15})` }, rays);
  for (let i = 0; i < 12; i++) el('path', { d: 'M-4 -26 L0 -40 L4 -26 Z', transform: `rotate(${i * 30})`, class: 'ray' }, rays);
  const disc = el('circle', { cx: 0, cy: 0, r: 22 }, sunSize);
  el('path', { d: 'M-8 -2 q2 -4 4 0 M4 -2 q2 -4 4 0 M-6 6 q6 6 12 0', fill: 'none', stroke: '#B5651D', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, sunSize);
  const clouds = el('g', { class: 'fade drift' }, S);
  [[40, 250, 1], [118, 222, 0.7]].forEach(([x, y, s]) => { const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, clouds); [[0, 0, 16], [18, -6, 20], [38, 0, 15], [18, 6, 22]].forEach(([cx, cy, r]) => el('ellipse', { cx, cy, rx: r, ry: r * 0.62, fill: '#FFFFFF' }, g)); });
  const rail = el('rect', { x: -200, y: 356, width: 660, height: 4 }, S);
  const pickets = el('g', {}, S);
  for (let i = -7; i < 16; i++) el('path', { d: `M${4 + i * 29} 386 V342 l9 -9 l9 9 V386 Z`, 'stroke-width': 1 }, pickets);
  el('rect', { x: -200, y: 378, width: 660, height: 400, fill: '#B7D69E' }, S);
  const hook = el('path', { d: 'M186 420 V224 Q186 204 158 204 Q130 204 130 213', fill: 'none', stroke: '#5B5148', 'stroke-width': 3, 'stroke-linecap': 'round' }, S);
  const shadow = el('ellipse', { cx: 130, cy: 421, rx: 44, ry: 6, fill: '#000', opacity: 0.12 }, S);
  const potWrap = el('g', { transform: 'translate(130 365) scale(1.25)' }, S), potWob = el('g', { class: 'tap' }, potWrap);
  const dew = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[108, 368], [150, 366], [131, 373]].forEach(([cx, cy]) => el('ellipse', { cx, cy, rx: 2.2, ry: 2.8, fill: '#CDEBFF', stroke: '#FFFFFF', 'stroke-width': 0.6 }, dew));
  const visitor = el('g', { class: 'hover', 'pointer-events': 'none' }, S), bf = el('g', { transform: 'translate(176 262)' }, visitor);
  el('ellipse', { cx: -5, cy: 0, rx: 5, ry: 7, fill: '#FFB347', class: 'flap' }, bf); el('ellipse', { cx: 5, cy: 0, rx: 5, ry: 7, fill: '#FF8A5B', class: 'flap' }, bf); el('rect', { x: -0.8, y: -5, width: 1.6, height: 10, rx: 0.8, fill: '#2A1A12' }, bf);
  const tint = el('rect', { x: -200, y: -400, width: 660, height: 1400, class: 'fade', 'pointer-events': 'none' }, S);
  const stars = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[24, 196], [52, 150], [78, 228], [36, 262], [92, 174], [18, 316], [66, 296], [176, 172], [232, 232], [204, 280], [240, 306], [186, 316], [222, 150], [40, 120], [150, 134], [112, 110], [244, 104], [14, 232], [200, 90], [70, 70]].forEach(([cx, cy], n) => { const c = el('circle', { cx, cy, r: n % 3 ? 1.3 : 2, fill: '#FFF6D6', class: 'twinkle' }, stars); c.style.animationDelay = ((n * 0.37) % 2.4) + 's'; });
  const moon = el('g', { class: 'fade', transform: 'translate(210 252)', 'pointer-events': 'none' }, S);
  el('circle', { cx: 0, cy: 0, r: 16 }, el('clipPath', { id: 'moonclip' }, moon));
  el('circle', { cx: 0, cy: 0, r: 16, fill: '#F4EFD8' }, moon); el('circle', { cx: -5, cy: -4, r: 3, fill: '#E2DBBE' }, moon); el('circle', { cx: 5, cy: 6, r: 2.2, fill: '#E2DBBE' }, moon);
  const moonDark = el('circle', { cy: 0, r: 16.5, fill: '#1B2550', opacity: 0.93, 'clip-path': 'url(#moonclip)' }, moon);
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
      sky.style.fill = c.sky; glow.style.opacity = c.glow; clouds.style.opacity = c.cloud;
      sun.style.transform = `translate(${c.sun[0]}px,${c.sun[1]}px)`; sun.style.opacity = c.sunOn; disc.setAttribute('fill', c.sunColor);
      sunSize.setAttribute('transform', `scale(${v.heat ? 1.35 : 1})`);
      rays.querySelectorAll('.ray').forEach((r) => r.setAttribute('fill', c.sunColor));
      tint.style.fill = c.tint[0]; tint.style.opacity = c.tint[1];
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
