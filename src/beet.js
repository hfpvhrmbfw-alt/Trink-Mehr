// Oberfläche: das Beet. Bekommt die fertige Reihenfolge aus der Logik (bedItems) und zeichnet Reihen.
import { el, drawPlant, drawUnit } from './plants.js';
import { MONTHS_SHORT } from './texts.js';

const SLOTS = 5, SLOT_W = 60, FIRST_X = 45, SOIL_Y = 136;
const dd = (date) => String(+date.slice(8, 10));

// Jede Reihe ist ein Hochbeet: die Pflanzen stehen in der Wiese hinter einem Brett, das Datum ist ins Brett gebrannt.
const BOARD_Y = SOIL_Y - 14, BOARD_H = 30, TEXT_Y = SOIL_Y + 9.5;
function burn(g, x, text, o = {}) {
  const t = el('text', { x, y: TEXT_Y, 'text-anchor': 'middle', 'font-weight': o.bold ? 800 : 700, 'font-size': o.size || 10.5, fill: o.color || '#5B4130', opacity: o.opacity ?? 1, 'letter-spacing': o.spacing || 0 }, g);
  t.textContent = text;
}
function board(svg, bed) {
  const g = el('g', { filter: 'url(#lage)' }, svg);
  el('rect', { x: 6, y: BOARD_Y, width: 318, height: BOARD_H, rx: 3, fill: bed.color }, g);
  el('rect', { x: 6, y: BOARD_Y, width: 318, height: 6, rx: 2, fill: bed.dark }, g);
  // feine Maserung, immer gleich, damit nichts flackert
  for (const [y, w] of [[BOARD_Y + 12, 0.8], [BOARD_Y + 24, 1.4]]) {
    let d = `M10 ${y}`;
    for (let x = 10; x < 320; x += 26) d += ` q13 ${w} 26 0`;
    el('path', { d, fill: 'none', stroke: bed.dark, 'stroke-width': 0.9, opacity: 0.35, 'stroke-linecap': 'round' }, g);
  }
  return g;
}

function drawRow(svg, row, ctx) {
  const bed = ctx.bed, back = el('g', {}, svg);
  board(svg, bed);
  const labels = el('g', {}, svg), hits = el('g', {}, svg);
  let slot = 0;
  for (const item of row) {
    const x = FIRST_X + slot * SLOT_W;
    if (item.type === 'month') {
      // Monatspfosten mit Schild, unten im Brett der Monatsname
      el('path', { d: `M${x} ${BOARD_Y} V${SOIL_Y - 52}`, stroke: bed.dark, 'stroke-width': 4, 'stroke-linecap': 'round' }, back); // ohne Filter: eine senkrechte Linie hat keine Breite, der Schatten würde sie verschlucken
      const t = MONTHS_SHORT[+item.month.slice(5, 7) - 1];
      const sg = el('g', { filter: 'url(#lage)' }, back);
      el('rect', { x: x - 20, y: SOIL_Y - 70, width: 40, height: 20, rx: 3, fill: bed.color }, sg);
      el('rect', { x: x - 20, y: SOIL_Y - 70, width: 40, height: 4, rx: 2, fill: bed.dark }, sg);
      const tt = el('text', { x, y: SOIL_Y - 55.5, 'text-anchor': 'middle', 'font-weight': 800, 'font-size': 10, fill: '#3B2E24', 'letter-spacing': '.08em' }, sg);
      tt.textContent = t;
    } else if (item.type === 'gap') {
      const cx = x + SLOT_W / 2;
      el('ellipse', { cx, cy: BOARD_Y + 1, rx: 50, ry: 8, fill: '#9EBE84', filter: 'url(#lage)' }, back);
      for (let i = -3; i <= 3; i++) el('path', { d: `M${cx + i * 13} ${BOARD_Y + 1} q-3 -9 -5 -11 M${cx + i * 13} ${BOARD_Y + 1} q1 -10 3 -13 M${cx + i * 13} ${BOARD_Y + 1} q4 -7 7 -8`, fill: 'none', stroke: '#5F8B5B', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, back);
      const same = item.from.slice(0, 7) === item.to.slice(0, 7);
      burn(labels, cx, same ? `${dd(item.from)}.–${dd(item.to)}.` : `${dd(item.from)}.${+item.from.slice(5, 7)}.–${dd(item.to)}.${+item.to.slice(5, 7)}.`, { opacity: 0.7 });
    } else if (item.type === 'empty') {
      burn(labels, x, dd(item.date), { opacity: 0.5 });
    } else if (item.type === 'today') {
      // kleines Plättchen im Brett, damit heute auf einen Blick zu finden ist
      el('rect', { x: x - 17, y: TEXT_Y - 9.5, width: 34, height: 13, rx: 6.5, fill: '#E8735F' }, labels);
      burn(labels, x, 'heute', { color: '#FFFFFF', size: 9 });
    } else {
      const d = item.day, sp = ctx.speciesOf(d), stage = ctx.stageOf(d);
      if (sp.form === 'hang') {
        const top = SOIL_Y - 128;
        el('path', { d: `M${x + 23} ${BOARD_Y + 2} V${top + 14} Q${x + 23} ${top} ${x + 11} ${top} Q${x} ${top} ${x} ${top + 9}`, fill: 'none', stroke: '#5B5148', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, back);
        drawUnit(el('g', { transform: `translate(${x} ${top + 9 + 123 * 0.72}) scale(.72)`, filter: 'url(#lage)' }, back), sp, stage, { pot: ctx.pot });
      } else {
        drawPlant(el('g', { transform: `translate(${x} ${BOARD_Y + 4}) scale(.9)`, filter: 'url(#lage)' }, back), sp, stage);
      }
      burn(labels, x, dd(d.day));
    }
    if (item.type !== 'month') {
      const span = item.type === 'gap' ? 2 : 1;
      const hit = el('rect', { x: x - SLOT_W / 2, y: 4, width: SLOT_W * span, height: BOARD_Y + BOARD_H - 4, fill: 'transparent', class: 'tap', tabindex: 0, role: 'button', 'aria-label': ctx.labelOf(item) }, hits);
      hit.dataset.date = item.type === 'day' ? item.day.day : item.type === 'gap' ? '' : item.date;
    }
    slot += item.type === 'gap' ? 2 : 1;
  }
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
 * @param {{bed:object, pot:object, speciesOf:Function, stageOf:Function, labelOf:Function}} ctx
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
