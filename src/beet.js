// Oberfläche: das Beet. Bekommt die fertige Reihenfolge aus der Logik (bedItems) und zeichnet Reihen.
import { el, drawPlant, drawUnit } from './plants.js';
import { MONTHS_SHORT } from './texts.js';

const SLOTS = 5, SLOT_W = 60, FIRST_X = 45, SOIL_Y = 142;
const dd = (date) => String(+date.slice(8, 10));

function sign(g, x, text, kind) {
  const w = Math.max(17, text.length * 5.4 + 7);
  el('path', { d: `M${x} ${SOIL_Y - 2} V${SOIL_Y - 15}`, stroke: '#8A6F5A', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
  el('rect', { x: x - w / 2, y: SOIL_Y - 27, width: w, height: 12, rx: 2, fill: kind === 'today' ? '#E8451C' : '#FFF8EC', stroke: '#8A6F5A', 'stroke-width': 0.8, opacity: kind === 'empty' ? 0.75 : 1 }, g);
  const t = el('text', { x, y: SOIL_Y - 17.8, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8.5, fill: kind === 'today' ? '#FFFFFF' : '#2A1A12' }, g);
  t.textContent = text;
}

function drawRow(svg, row, ctx) {
  const bed = ctx.bed;
  el('rect', { x: 8, y: SOIL_Y - 13, width: 314, height: 20, rx: 7, fill: '#7A5638' }, svg);
  const signs = el('g', {});
  let slot = 0;
  for (const item of row) {
    const x = FIRST_X + slot * SLOT_W;
    if (item.type === 'month') {
      el('path', { d: `M${x} ${SOIL_Y - 2} V${SOIL_Y - 46}`, stroke: '#8F6540', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      el('rect', { x: x - 19, y: SOIL_Y - 62, width: 38, height: 20, rx: 3, fill: '#B98A5E', stroke: '#8F6540', 'stroke-width': 1 }, svg);
      const t = el('text', { x, y: SOIL_Y - 48, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 10, fill: '#2A1A12', 'letter-spacing': '.06em' }, svg);
      t.textContent = MONTHS_SHORT[+item.month.slice(5, 7) - 1];
    } else if (item.type === 'gap') {
      const cx = x + SLOT_W / 2;
      el('ellipse', { cx, cy: SOIL_Y - 9, rx: 52, ry: 9, fill: '#8CC25C', opacity: 0.8 }, svg);
      for (let i = -3; i <= 3; i++) el('path', { d: `M${cx + i * 13} ${SOIL_Y - 10} q-3 -9 -5 -11 M${cx + i * 13} ${SOIL_Y - 10} q1 -10 3 -13 M${cx + i * 13} ${SOIL_Y - 10} q4 -7 7 -8`, fill: 'none', stroke: '#4E9A3A', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, svg);
      const same = item.from.slice(0, 7) === item.to.slice(0, 7);
      sign(signs, cx, same ? `${dd(item.from)}.–${dd(item.to)}.` : `${dd(item.from)}.${+item.from.slice(5, 7)}.–${dd(item.to)}.${+item.to.slice(5, 7)}.`, 'gap');
    } else if (item.type === 'empty') {
      sign(signs, x, dd(item.date), 'empty');
    } else if (item.type === 'today') {
      sign(signs, x, 'heute', 'today');
    } else {
      const d = item.day, sp = ctx.speciesOf(d), stage = ctx.stageOf(d);
      if (sp.form === 'hang') {
        const top = SOIL_Y - 128;
        el('path', { d: `M${x + 23} ${SOIL_Y - 4} V${top + 14} Q${x + 23} ${top} ${x + 11} ${top} Q${x} ${top} ${x} ${top + 9}`, fill: 'none', stroke: '#5B5148', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg);
        drawUnit(el('g', { transform: `translate(${x} ${top + 9 + 123 * 0.78}) scale(.78)` }, svg), sp, stage, { pot: d.potId, label: dd(d.day) });
      } else {
        drawPlant(el('g', { transform: `translate(${x} ${SOIL_Y - 6}) scale(.9)` }, svg), sp, stage, false);
        sign(signs, x + 19, dd(d.day), 'day');
      }
    }
    if (item.type !== 'month') {
      const span = item.type === 'gap' ? 2 : 1;
      const hit = el('rect', { x: x - SLOT_W / 2, y: 4, width: SLOT_W * span, height: SOIL_Y, fill: 'transparent', class: 'tap', tabindex: 0, role: 'button', 'aria-label': ctx.labelOf(item) }, signs);
      hit.dataset.date = item.type === 'day' ? item.day.day : item.type === 'gap' ? '' : item.date;
    }
    slot += item.type === 'gap' ? 2 : 1;
  }
  svg.appendChild(signs);
  el('rect', { x: 4, y: SOIL_Y, width: 322, height: 18, rx: 3, fill: bed.color }, svg);
  el('rect', { x: 4, y: SOIL_Y + 13, width: 322, height: 5, rx: 2.5, fill: bed.dark }, svg);
  el('rect', { x: 4, y: SOIL_Y, width: 322, height: 2, rx: 1, fill: '#FFFFFF', opacity: 0.22 }, svg);
}

/** Teilt die Dinge in Reihen zu fünf Plätzen. Eine Wiese braucht zwei Plätze. */
function rowsOf(items) {
  const rows = [[]];
  let used = 0;
  for (const item of items) {
    const span = item.type === 'gap' ? 2 : 1;
    if (used + span > SLOTS) { rows.push([]); used = 0; }
    rows[rows.length - 1].push(item); used += span;
  }
  return rows;
}

let observer = null;
/**
 * @param {HTMLElement} root
 * @param {import('./logic.js').BedItem[]} items
 * @param {{bed:object, speciesOf:Function, stageOf:Function, labelOf:Function}} ctx
 */
export function renderBeet(root, items, ctx) {
  if (observer) observer.disconnect();
  // Reihen außerhalb des Bildschirms werden erst gezeichnet, wenn sie in Sicht kommen.
  observer = new IntersectionObserver((seen) => seen.forEach((e) => {
    if (!e.isIntersecting || e.target.childNodes.length) return;
    drawRow(e.target, e.target.row, ctx);
  }), { rootMargin: '300px' });
  root.replaceChildren();
  for (const row of rowsOf(items)) {
    const svg = el('svg', { viewBox: '0 0 330 164', 'aria-hidden': 'false' });
    svg.row = row; root.appendChild(svg); observer.observe(svg);
  }
}
