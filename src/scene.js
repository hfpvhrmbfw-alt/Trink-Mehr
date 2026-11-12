// Oberfläche: die Heute-Szene im Papierschnitt (Landschaft nach Tageszeit, Kübel auf dem Stein, Gießkanne). Zeichnet nur, rechnet nichts.
import { el, drawUnit } from './plants.js';
import { PAPER, drawLand, lightMatrix } from './papier.js';

// Sonne, Sterne und Glühwürmchen je Tageszeit. Landschaft und Licht kommen aus papier.js.
const PHASES = {
  morgen: { sun: [44, 262], sunColor: '#F5C76A', sunOn: 1, star: 0, fly: 0 },
  mittag: { sun: [206, 214], sunColor: PAPER.sun, sunOn: 1, star: 0, fly: 0 },
  abend: { sun: [214, 290], sunColor: '#F09A4E', sunOn: 1, star: 0.2, fly: 1 },
  nacht: { sun: [222, 460], sunColor: '#F09A4E', sunOn: 0, star: 1, fly: 0.6 },
};
const again = (node, cls) => { node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); };

/**
 * @param {HTMLElement} root
 * @param {{onPot:Function, onSun:Function}} on
 */
export function createScene(root, on) {
  const S = el('svg', { viewBox: '0 0 260 560', preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' });
  root.appendChild(S);
  const land = el('g', {}, S);
  const shoot = el('g', {}, S);
  const sun = el('g', { class: 'sun' }, S), sunSize = el('g', {}, sun), rays = el('g', { class: 'rays' }, sunSize);
  // Sonne aus Papier: Scheibe mit einem helleren Kreis dahinter, der sich langsam dreht
  for (let i = 0; i < 8; i++) el('path', { d: 'M-5 -30 L0 -40 L5 -30 Z', transform: `rotate(${i * 45})`, class: 'ray', opacity: 0.55 }, rays);
  const disc = el('circle', { cx: 0, cy: 0, r: 22, filter: 'url(#lage)' }, sunSize);
  el('path', { d: 'M-8 -2 q2 -3 4 0 M4 -2 q2 -3 4 0 M-5 6 q5 5 10 0', fill: 'none', stroke: PAPER.ink, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.75 }, sunSize);
  const light = el('feColorMatrix', { type: 'matrix' }, el('filter', { id: 'licht', 'color-interpolation-filters': 'sRGB' }, S));
  // Alles am Kübel steht in einer Gruppe auf dem Stein; das Licht der Tageszeit liegt darüber.
  const front = el('g', { transform: 'translate(130 408) scale(0.95) translate(-130 -420)', filter: 'url(#licht)' }, S);
  const hook = el('path', { d: 'M194 420 V186 Q194 162 162 162 Q130 162 130 170', fill: 'none', stroke: '#5B5148', 'stroke-width': 3, 'stroke-linecap': 'round' }, front);
  const soft = el('radialGradient', { id: 'schatten' }, S); el('stop', { offset: 0, 'stop-color': '#0B2A1E', 'stop-opacity': 0.32 }, soft); el('stop', { offset: 1, 'stop-color': '#0B2A1E', 'stop-opacity': 0 }, soft);
  const shadow = el('ellipse', { cx: 130, cy: 420, rx: 40, ry: 5, fill: 'url(#schatten)' }, front);
  const potWrap = el('g', { transform: 'translate(130 354) scale(1.5)' }, front), potWob = el('g', { class: 'tap', filter: 'url(#lage)' }, potWrap);
  const visitor = el('g', { class: 'hover', 'pointer-events': 'none' }, front), bf = el('g', { transform: 'translate(176 262)' }, visitor);
  el('ellipse', { cx: -5, cy: 0, rx: 5, ry: 7, fill: '#FFB347', class: 'flap' }, bf); el('ellipse', { cx: 5, cy: 0, rx: 5, ry: 7, fill: '#FF8A5B', class: 'flap' }, bf); el('rect', { x: -0.8, y: -5, width: 1.6, height: 10, rx: 0.8, fill: '#2A1A12' }, bf);
  const stars = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[24, 196], [52, 150], [78, 228], [36, 262], [92, 174], [18, 316], [66, 296], [176, 172], [232, 232], [204, 280], [240, 306], [186, 316], [222, 150], [40, 120], [150, 134], [112, 110], [244, 104], [14, 232], [200, 90], [70, 70]].forEach(([cx, y], n) => { const cy = y > 262 ? y - 190 : y; const c = el('circle', { cx, cy, r: n % 3 ? 1.3 : 2, fill: '#FFF6D6', class: 'twinkle' }, stars); c.style.animationDelay = ((n * 0.37) % 2.4) + 's'; });
  const moon = el('g', { class: 'fade', transform: 'translate(206 214)', 'pointer-events': 'none', filter: 'url(#lage)' }, S);
  el('circle', { cx: 0, cy: 0, r: 16 }, el('clipPath', { id: 'moonclip' }, moon));
  el('circle', { cx: 0, cy: 0, r: 16, fill: '#F4EFD8' }, moon); el('circle', { cx: -5, cy: -4, r: 3, fill: '#E2DBBE' }, moon); el('circle', { cx: 5, cy: 6, r: 2.2, fill: '#E2DBBE' }, moon);
  const moonDark = el('circle', { cy: 0, r: 16.5, fill: '#24325F', opacity: 0.96, 'clip-path': 'url(#moonclip)' }, moon);
  const flies = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [[40, 330], [84, 372], [190, 350], [226, 384], [150, 316]].forEach(([cx, cy], n) => { const c = el('circle', { cx, cy, r: 2.2, fill: '#FFE98A', class: 'fly twinkle' }, flies); c.style.animationDelay = n * 0.9 + 's'; });
  const zz = el('g', { class: 'fade', 'pointer-events': 'none' }, S);
  [0, 1].forEach((n) => { const t = el('text', { x: 172 + n * 6, y: 352 - n * 10, 'font-weight': 700, 'font-size': 12 + n * 3, fill: '#F3F0E6', class: 'zz' }, zz); t.textContent = 'z'; t.style.animationDelay = n * 1.2 + 's'; });
  const can = el('g', { class: 'can' }, el('g', { transform: 'translate(172 262)', 'pointer-events': 'none' }, front));
  el('path', { d: 'M2 22 L-26 4 L-22 0 L4 10 Z', fill: '#6F93B3' }, can); el('ellipse', { cx: -25, cy: 2, rx: 6, ry: 4, fill: '#5F88A9' }, can);
  el('path', { d: 'M44 6 q18 10 0 24 M10 0 q12 -16 24 0', fill: 'none', stroke: '#5F88A9', 'stroke-width': 5, 'stroke-linecap': 'round' }, can);
  el('rect', { x: 0, y: 0, width: 44, height: 34, rx: 6, fill: '#7FA8C9' }, can); el('path', { d: 'M6 6 V28', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.35 }, can);
  const fx = el('g', { 'pointer-events': 'none' }, S), pourFx = el('g', { 'pointer-events': 'none' }, front);

  let key = '', unit = null, phase = '', sky = null;
  potWob.addEventListener('click', () => { again(potWob, 'wobble'); on.onPot(); });
  sun.addEventListener('click', () => { again(rays, 'pulse'); on.onSun(); });
  land.addEventListener('click', (ev) => {
    if (phase !== 'nacht' || ev.target !== sky) return;
    const x = 40 + Math.random() * 120, y = 90 + Math.random() * 80;
    const s = el('path', { d: `M${x} ${y} l70 34`, stroke: '#FFF6D6', 'stroke-width': 2, 'stroke-linecap': 'round', class: 'shoot' }, shoot);
    setTimeout(() => s.remove(), 900);
  });

  return {
    /** @param {{phase:string, species:object, stage:number, frac:number, mood:string, pot:{id:string,color:string,dark:string}, heat:boolean, moon:number, visitor:boolean}} v */
    update(v) {
      if (phase !== v.phase) { sky = drawLand(land, v.phase); light.setAttribute('values', lightMatrix(v.phase)); }
      phase = v.phase;
      const c = PHASES[v.phase], hang = v.species.form === 'hang';
      sun.style.transform = `translate(${c.sun[0]}px,${c.sun[1]}px)`; sun.style.opacity = c.sunOn; disc.setAttribute('fill', c.sunColor);
      sunSize.setAttribute('transform', `scale(${v.heat ? 1.35 : 1})`);
      rays.querySelectorAll('.ray').forEach((r) => r.setAttribute('fill', c.sunColor));
      stars.style.opacity = c.star; flies.style.opacity = c.fly;
      moon.style.opacity = v.phase === 'nacht' ? 1 : 0; zz.style.opacity = v.phase === 'nacht' ? 1 : 0;
      moonDark.setAttribute('cx', v.moon < 0.5 ? -64 * v.moon : 64 * (1 - v.moon));
      hook.style.display = hang ? '' : 'none'; shadow.style.display = hang ? 'none' : '';
      visitor.style.display = v.visitor ? '' : 'none';
      const k = [v.species.id, v.stage, v.mood, v.pot.id].join('|');
      if (k !== key) {
        const grew = key && key.split('|')[0] === v.species.id && +key.split('|')[1] < v.stage;
        potWob.replaceChildren();
        unit = drawUnit(potWob, v.species, v.stage, { pot: v.pot, mood: v.mood });
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
      setTimeout(() => { for (let n = 0; n < 5; n++) { const w = el('g', { class: 'fall' }, pourFx); el('path', { d: 'M0 -6 C-1 -3 -4 0 -4 2 A4 4 0 0 0 4 2 C4 0 1 -3 0 -6 Z', fill: '#5DB0E6', transform: `translate(${128 + n * 5} ${290 + (n % 2) * 6})` }, w); w.style.animationDelay = n * 0.07 + 's'; setTimeout(() => w.remove(), 1200); } }, 250);
      setTimeout(() => can.classList.remove('on'), 950);
    },
    /** Blütenblätter rieseln einmal durchs Bild. */
    petals(color) {
      for (let n = 0; n < 16; n++) { const p = el('ellipse', { cx: 10 + n * 16, cy: 60 + (n % 4) * 14, rx: 4, ry: 7, fill: n % 3 ? color : '#FFFFFF', opacity: 0.9, class: 'petal' }, fx); p.style.animationDelay = (n % 5) * 0.15 + 's'; setTimeout(() => p.remove(), 3200); }
    },
  };
}
