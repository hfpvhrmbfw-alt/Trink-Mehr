// Oberfläche: Start, Zustand der Ansicht, Aktionen. Einzige Stelle, die die Uhr liest.
import * as storage from './storage.js';
import * as L from './logic.js';
import { sanitizeSettings, sanitizeDay, buildExport, parseImport, LEVELS } from './model.js';
import { SPECIES, POTS, BEDS, SPORT_ML_PER_30_MIN, HEAT_ML } from './catalog.js';
import * as T from './texts.js';
import { createScene } from './scene.js';
import { renderBeet } from './beet.js';

const $ = (id) => document.getElementById(id);
const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
const IDS = SPECIES.map((s) => s.id);
const fmt = (n) => n.toLocaleString('de-DE') + ' ml';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const longDate = (day) => { const n = L.dayToNum(day); return `${T.WEEKDAYS[(n + 4) % 7]}, ${+day.slice(8, 10)}. ${T.MONTHS[+day.slice(5, 7) - 1]}`; };
const speciesOf = (d) => SPECIES_BY_ID[d.speciesId] || SPECIES[0];
const byId = (list, id) => list.find((x) => x.id === id) || list[0];

// abkürzung: ?stunde=22 stellt die Tageszeit zum Ausprobieren um, Einträge bleiben echt.
const testHour = new URLSearchParams(location.search).get('stunde');
function clock() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return { day: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}`, hour: testHour === null ? d.getHours() : +testHour, year: d.getFullYear(), stamp: d.getTime(), iso: d.toISOString() };
}

const state = { settings: null, days: new Map(), today: null, view: 'heute' };
let scene, sayTimer, toastTimer;

/* ---------- Daten ---------- */
const allDays = () => [...state.days.values()];
async function saveDay(d) { state.days.set(d.day, d); await storage.putDay(d); }
async function saveSettings(s) { state.settings = sanitizeSettings(s); await storage.setMeta('settings', state.settings); }
function ensureToday() {
  const c = clock();
  if (state.today && state.today.day === c.day) return false;
  state.today = state.days.get(c.day) || L.newDay(c.day, L.goalMl(state.settings, c.year), allDays(), IDS);
  return true;
}
function dayFor(date) {
  if (date === state.today.day) return state.today;
  return state.days.get(date) || L.newDay(date, L.goalMl(state.settings, clock().year), allDays().filter((d) => d.day < date), IDS);
}

/* ---------- Heute ---------- */
function defaultSaying() {
  const d = state.today, p = L.progress(d), st = L.stageOf(p), phase = L.phaseOf(clock().hour);
  const key = phase === 'nacht' ? 'nacht' : d.heat && st < 4 ? 'hitze' : ['start', 'keimling', 'jung', 'knospe', 'bluete'][st];
  const list = T.SAYINGS[key];
  return list[(L.dayToNum(d.day) + st) % list.length];
}
function say(text, ms) {
  clearTimeout(sayTimer);
  $('say').textContent = text;
  if (ms) sayTimer = setTimeout(() => { $('say').textContent = defaultSaying(); }, ms);
}
function renderToday(keepSaying) {
  const d = state.today, c = clock(), p = L.progress(d), st = L.stageOf(p), phase = L.phaseOf(c.hour), sp = speciesOf(d);
  scene.update({
    phase, species: sp, stage: st, frac: L.stageFrac(p), potId: d.potId, heat: d.heat, visitor: L.hasVisitor(p),
    mood: phase === 'nacht' || st === 0 ? 'schlaf' : st === 4 ? 'froh' : 'wach',
    pot: byId(POTS, state.settings.pot), moon: L.moonPhase(c.stamp / 86400000),
  });
  $('app').classList.toggle('nacht', phase === 'nacht');
  $('ml').textContent = fmt(L.dayTotalMl(d));
  $('sub').textContent = 'von ' + fmt(L.dayGoalMl(d)) + (L.extraMl(d) ? ' mit Zuschlag' : '');
  $('stage').textContent = st === 4 ? T.SPECIES_NAMES[sp.id] : T.STAGE_NAMES[st];
  $('tag').setAttribute('aria-label', `Heute ${fmt(L.dayTotalMl(d))} von ${fmt(L.dayGoalMl(d))}, Stufe ${T.STAGE_NAMES[st]}. Tagesdetails öffnen`);
  if (!keepSaying) say(defaultSaying());
}
function renderDrops() {
  $('drops').innerHTML = state.settings.sizes.map((ml, i) => `<button class="drop" type="button" data-ml="${ml}" aria-label="${ml} Milliliter eintragen">
    <svg viewBox="0 0 40 52" height="${[36, 44, 54][i]}" aria-hidden="true"><path d="M20 2 C17 10 3 24 3 34 A17 17 0 0 0 37 34 C37 24 23 10 20 2 Z" fill="#3E97D6" stroke="#fff" stroke-width="2"/><path d="M11 33 a9 9 0 0 0 6 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/><text x="20" y="38" text-anchor="middle" font-weight="600" font-size="${ml > 999 ? 9 : 10.5}" fill="#fff">${ml}</text></svg></button>`).join('');
}
async function addEntry(ml, d) {
  if (L.isFull(d)) { say(pick(T.SAYINGS.voll), 2500); return; }
  const c = clock(), isToday = d === state.today, before = L.stageOf(L.progress(d));
  const entry = { id: 'e' + c.stamp.toString(36), time: isToday ? c.time : '12:00', ml };
  d.entries.push(entry);
  await saveDay(d);
  if (isToday) {
    scene.pour();
    setTimeout(() => {
      renderToday(true);
      const now = L.stageOf(L.progress(d)), sp = speciesOf(d);
      if (now === 4 && before < 4) { scene.petals(sp.color); say(`${T.SPECIES_NAMES[sp.id]}! ${pick(T.SAYINGS.bluete)}`, 4000); }
      else say(now > before ? defaultSaying() : pick(T.SAYINGS.danke), 2200);
    }, 500);
  }
  toast(`${fmt(ml)} eingetragen`, 'Rückgängig', () => removeEntry(d, entry.id));
}
async function removeEntry(d, id) {
  d.entries = d.entries.filter((e) => e.id !== id);
  await saveDay(d);
  refresh();
}

/* ---------- Beet ---------- */
function renderBeetView() {
  const days = allDays(), gd = L.gardenDays(days), picks = L.picksAvailable(gd, state.settings.unlocked.length), next = L.nextRewardAt(gd);
  $('beet-stats').textContent = `${gd} ${gd === 1 ? 'Gartentag' : 'Gartentage'} · ${L.bloomCount(days)} ${L.bloomCount(days) === 1 ? 'Blüte' : 'Blüten'}`;
  $('gift').hidden = picks === 0;
  $('beet-next').textContent = picks ? '' : next ? `Noch ${next - gd} ${next - gd === 1 ? 'Gartentag' : 'Gartentage'} bis zur nächsten Überraschung` : '';
  const items = L.bedItems(days, state.today.day);
  $('beet-empty').hidden = items.length > 2;
  renderBeet($('beet-rows'), items, {
    bed: byId(BEDS, state.settings.bed), pot: byId(POTS, state.settings.pot), speciesOf, stageOf: (d) => L.stageOf(L.progress(d)),
    labelOf: (item) => item.type === 'day' ? `${longDate(item.day.day)}, ${L.progress(item.day) >= 1 ? T.SPECIES_NAMES[speciesOf(item.day).id] : T.STAGE_NAMES[L.stageOf(L.progress(item.day))]}`
      : item.type === 'gap' ? `Pause vom ${longDate(item.from)} bis ${longDate(item.to)}` : item.type === 'today' ? 'Heute, noch im Kübel' : `${longDate(item.date)}, kein Eintrag`,
  });
  requestAnimationFrame(() => { $('beet').scrollTop = $('beet').scrollHeight; });
}
function show(view) {
  state.view = view; $('app').dataset.view = view;
  $('heute').hidden = view !== 'heute'; $('beet').hidden = view !== 'beet';
  document.querySelectorAll('.nav button').forEach((b) => b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'));
  if (view === 'beet') renderBeetView();
}
function refresh() {
  renderToday(); renderDrops();
  if (state.view === 'beet') renderBeetView();
}

/* ---------- Hinweis unten ---------- */
function toast(text, action, fn, sticky) {
  clearTimeout(toastTimer);
  $('toast-text').textContent = text;
  $('toast-action').hidden = !action; $('toast-action').textContent = action || '';
  $('toast-action').onclick = () => { $('toast').hidden = true; fn(); };
  $('toast').hidden = false;
  if (!sticky) toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
}

/* ---------- Blätter (Dialog von unten) ---------- */
function sheet(html) {
  const dlg = $('sheet');
  $('sheet-body').innerHTML = html;
  if (!dlg.open) dlg.showModal();
  $('sheet-body').scrollTop = 0;
  return $('sheet-body');
}
const closeSheet = () => $('sheet').close();

function openDay(date) {
  const c = clock(), d = dayFor(date), isToday = date === state.today.day;
  const editable = L.dayToNum(c.day) - L.dayToNum(date) <= 1;
  const p = L.progress(d), st = L.stageOf(p), sp = speciesOf(d), has = d.entries.length > 0;
  const body = sheet(`
    <h2>${isToday ? 'Heute' : esc(longDate(date))}</h2>
    <p class="lead">${has ? (p >= 1 ? `Eine <b>${esc(T.SPECIES_NAMES[sp.id])}</b> ist aufgeblüht.` : `${isToday ? 'Bis jetzt' : 'Es blieb bei'}: <b>${T.STAGE_NAMES[st]}</b>.${isToday ? ' Was es wird, bleibt noch geheim.' : ''}`) : 'Kein Eintrag an diesem Tag.'}</p>
    <p class="big">${fmt(L.dayTotalMl(d))} <small>von ${fmt(L.dayGoalMl(d))}</small></p>
    ${isToday ? `<fieldset><legend>Heute anders?</legend>
      <label class="line">Sport <select id="sport">${[0, 30, 60, 90, 120, 180].map((m) => `<option value="${m}" ${d.sportMin === m ? 'selected' : ''}>${m ? `${m} Minuten (+${fmt(m / 30 * SPORT_ML_PER_30_MIN)})` : 'kein Sport'}</option>`).join('')}</select></label>
      <label class="line"><span>Heißer Tag (+${fmt(HEAT_ML)})</span><input type="checkbox" id="heat" ${d.heat ? 'checked' : ''}></label>
      <p class="hint">Sport kostet laut Verbraucherzentrale 0,5 bis 1,5 Liter je Stunde, hier zählt die untere Grenze. Für Hitze gibt es keine feste Zahl, die 500 ml sind eine vorsichtige Stufe.</p></fieldset>` : ''}
    <h3>Einträge</h3>
    ${has ? `<ul class="entries">${d.entries.map((e) => `<li><span>${e.time} Uhr</span><b>${fmt(e.ml)}</b>${editable ? `<button type="button" class="link" data-del="${esc(e.id)}" aria-label="Eintrag ${e.time} Uhr löschen">Löschen</button>` : ''}</li>`).join('')}</ul>` : '<p class="hint">Noch nichts eingetragen.</p>'}
    ${editable ? `<div class="chips">${state.settings.sizes.map((ml) => `<button type="button" class="chip-btn" data-add="${ml}">+ ${fmt(ml)}</button>`).join('')}</div>` : '<p class="hint">Ältere Tage sind fest und lassen sich nicht mehr ändern.</p>'}
    <button type="button" class="sign wide" data-close>Fertig</button>`);
  body.onclick = async (ev) => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.close !== undefined) return closeSheet();
    if (t.dataset.del) { await removeEntry(d, t.dataset.del); openDay(date); }
    if (t.dataset.add) { await addEntry(+t.dataset.add, d); refresh(); openDay(date); }
  };
  body.onchange = async (ev) => {
    if (ev.target.id === 'sport') d.sportMin = +ev.target.value; else if (ev.target.id === 'heat') d.heat = ev.target.checked; else return;
    await saveDay(d); refresh(); openDay(date);
  };
}

function swatches(kind, list, names) {
  const s = state.settings;
  return list.filter((x, i) => i === 0 || s.unlocked.includes(`${kind}:${x.id}`)).map((x) => `<label class="swatch"><input type="radio" name="${kind}" value="${x.id}" ${s[kind] === x.id ? 'checked' : ''}><span style="background:${x.color}"></span>${esc(names[x.id])}</label>`).join('');
}
function openSettings(first) {
  const s = state.settings, year = clock().year;
  const body = sheet(`<form id="form" novalidate>
    <h2>${first ? 'Willkommen im Garten' : 'Gartenschild'}</h2>
    ${first ? '<p class="lead">Jeden Morgen steht hier ein Kübel mit frischer Erde. Mit jedem Glas Wasser wächst eine Pflanze. Welche es wird, zeigt sich erst über den Tag.</p>' : ''}
    <label class="field">Wie heißt dein Kübel?<input name="potName" maxlength="20" value="${esc(s.potName)}" placeholder="zum Beispiel Kurt" autocomplete="off"></label>
    <fieldset><legend>Über dich</legend>
      <div class="pair"><label class="field">Geburtsjahr<input name="birthYear" inputmode="numeric" pattern="[0-9]*" value="${s.birthYear || ''}" placeholder="1996"></label>
      <label class="field">Gewicht in kg<input name="weightKg" inputmode="numeric" pattern="[0-9]*" value="${s.weightKg || ''}" placeholder="freiwillig"></label></div>
      <label class="field">Besonderes<select name="special"><option value="">nichts</option><option value="schwanger" ${s.special === 'schwanger' ? 'selected' : ''}>schwanger</option><option value="stillend" ${s.special === 'stillend' ? 'selected' : ''}>stillend</option></select></label>
      <p class="hint">Alter und Gewicht bestimmen die empfohlene Menge. Die Angaben bleiben auf diesem Gerät.</p></fieldset>
    <fieldset><legend>Tagesziel</legend>
      <div id="levels"></div>
      <label class="field" id="custom-field">Eigene Menge in ml<input name="customGoalMl" inputmode="numeric" pattern="[0-9]*" value="${s.customGoalMl}"></label></fieldset>
    ${first ? '' : `<fieldset><legend>Tropfen</legend><div class="trio">${s.sizes.map((ml, i) => `<label class="field">${['Klein', 'Mittel', 'Groß'][i]}<input name="size${i}" inputmode="numeric" pattern="[0-9]*" value="${ml}"></label>`).join('')}</div>
      <p class="hint">Stell sie auf dein Glas und deine Flasche ein, in ml.</p></fieldset>
    <fieldset><legend>Garten gestalten</legend><div class="swatches">${swatches('pot', POTS, T.POT_NAMES)}</div><div class="swatches">${swatches('bed', BEDS, T.BED_NAMES)}</div>
      <p class="hint">Neue Kübel und Beetkanten gibt es für Gartentage, also für jeden Tag mit einem Eintrag. Was freigeschaltet ist, bleibt.</p></fieldset>
    <fieldset><legend>App</legend><p class="hint" id="upd-hint">Neue Versionen kommen von selbst, sobald du die App öffnest.</p><div class="chips"><button type="button" class="chip-btn" id="upd">Nach neuer Version suchen</button></div></fieldset>
    <fieldset><legend>Sicherung</legend>
      <p class="hint">${s.lastBackupDay ? `Zuletzt gesichert am ${esc(longDate(s.lastBackupDay))}.` : 'Noch nie gesichert.'} Dein Garten liegt nur auf diesem Gerät.</p>
      <div class="chips"><button type="button" class="chip-btn" id="export">Sicherung speichern</button><label class="chip-btn">Sicherung einspielen<input type="file" id="import" accept="application/json,.json" hidden></label></div>
      <div id="import-box"></div></fieldset>
    <details><summary>Erinnerungen einrichten</summary><ol class="hint"><li>Kurzbefehle-App öffnen, unten „Automation“, dann „Neue Automation“.</li><li>„Tageszeit“ wählen, zum Beispiel 10 Uhr, täglich, „Sofort ausführen“.</li><li>Aktion „Mitteilung anzeigen“ mit einem Text wie „Dein Kübel hat Durst“.</li><li>Für weitere Uhrzeiten wiederholen.</li></ol><p class="hint">Eine Web-App darf auf dem iPhone keine eigenen Mitteilungen planen. Mit der späteren Swift-App geht das direkt.</p></details>
    <details><summary>Quellen und Hinweis</summary><p class="hint">Richtwerte: D-A-CH-Referenzwerte für die Nährstoffzufuhr 2018 (Deutsche Gesellschaft für Ernährung). „Sanft“ und „Reichlich“ sind eigene Stufen der App. Zuschläge: Verbraucherzentrale (Sport) und eine eigene vorsichtige Stufe (Hitze). Die App ersetzt keinen ärztlichen Rat, etwa bei Herz- oder Nierenerkrankungen.</p></details>`}
    <button class="sign wide" type="submit">${first ? 'Los geht’s' : 'Speichern'}</button>
    ${first ? '' : '<button class="link wide" type="button" data-close>Abbrechen</button>'}
  </form>`);
  const form = $('form');
  const read = () => {
    const v = Object.fromEntries(new FormData(form)), num = (x) => (x === undefined || x === '' ? null : +x);
    const next = { ...s, potName: v.potName, birthYear: num(v.birthYear), weightKg: num(v.weightKg), special: v.special || null, level: v.level || s.level, customGoalMl: num(v.customGoalMl) ?? s.customGoalMl };
    if (!first) Object.assign(next, { sizes: [num(v.size0), num(v.size1), num(v.size2)], pot: v.pot || s.pot, bed: v.bed || s.bed });
    return sanitizeSettings(next);
  };
  const levels = () => {
    const cur = read();
    $('levels').innerHTML = LEVELS.map((id) => `<label class="level"><input type="radio" name="level" value="${id}" ${cur.level === id ? 'checked' : ''}><span><b>${T.LEVEL_NAMES[id]}</b> ${id === 'frei' ? '' : fmt(L.goalMl({ ...cur, level: id }, year))}<small>${T.LEVEL_HINTS[id]}</small></span></label>`).join('');
    $('custom-field').hidden = cur.level !== 'frei';
  };
  levels();
  form.oninput = (ev) => { if (ev.target.name !== 'potName' && ev.target.id !== 'import') levels(); };
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    await saveSettings({ ...read(), onboarded: true });
    const t = state.today;
    t.goalMl = L.goalMl(state.settings, year);
    if (state.days.has(t.day)) await saveDay(t);
    closeSheet(); refresh();
    if (first) say(`Hallo! Ich bin ${state.settings.potName || 'dein Kübel'}. Tipp auf einen Tropfen.`, 6000);
  };
  body.onclick = (ev) => {
    if (ev.target.closest('[data-close]')) closeSheet();
    if (ev.target.id === 'export') exportData();
    if (ev.target.id === 'upd') {
      $('upd-hint').textContent = 'Suche …';
      checkForUpdate().then((r) => { $('upd-hint').textContent = { neu: 'Neue Version gefunden, die App lädt neu.', aktuell: 'Du hast schon die neueste Version.', offline: 'Gerade keine Verbindung. Versuch es später noch einmal.' }[r]; });
    }
  };
  if (!first) $('import').onchange = async (ev) => {
    const file = ev.target.files[0]; if (!file) return;
    const res = parseImport(await file.text()), box = $('import-box');
    if (!res.ok) { box.innerHTML = `<p class="warn">${T.IMPORT_ERRORS[res.error]}</p>`; return; }
    box.innerHTML = `<p class="warn">Die Sicherung enthält ${res.days.length} Tage${res.dropped ? ` (${res.dropped} unlesbare ausgelassen)` : ''}. Einspielen ersetzt alles, was jetzt im Garten ist.</p><button type="button" class="chip-btn" id="import-go">Ja, ersetzen</button>`;
    $('import-go').onclick = async () => {
      await storage.replaceDays(res.days);
      state.days = new Map(res.days.map((d) => [d.day, d]));
      await saveSettings({ ...res.settings, onboarded: true });
      state.today = null; ensureToday(); closeSheet(); refresh(); toast('Sicherung eingespielt');
    };
  };
}

async function exportData() {
  const c = clock();
  const text = JSON.stringify(buildExport(state.settings, allDays().sort((a, b) => (a.day < b.day ? -1 : 1)), c.iso), null, 1);
  const name = `vergiessmeinnicht-${c.day}.json`, file = new File([text], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file] });
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  } catch { return; /* Teilen abgebrochen: nicht als gesichert merken */ }
  await saveSettings({ ...state.settings, lastBackupDay: c.day });
  toast('Sicherung gespeichert');
}

function openReward() {
  const s = state.settings;
  const locked = [...POTS.slice(1).map((x) => ['pot', x, T.POT_NAMES]), ...BEDS.slice(1).map((x) => ['bed', x, T.BED_NAMES])].filter(([kind, x]) => !s.unlocked.includes(`${kind}:${x.id}`));
  const body = sheet(`<h2>Such dir etwas aus</h2><p class="lead">Für deine Gartentage. Was du wählst, gehört dir für immer.</p>
    <div class="rewards">${locked.map(([kind, x, names]) => `<button type="button" class="reward" data-kind="${kind}" data-id="${x.id}"><span style="background:${x.color}"></span>${esc(names[x.id])}</button>`).join('')}</div>
    <button type="button" class="link wide" data-close>Später</button>`);
  body.onclick = async (ev) => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.kind && L.picksAvailable(L.gardenDays(allDays()), s.unlocked.length) > 0) await saveSettings({ ...s, unlocked: [...s.unlocked, `${t.dataset.kind}:${t.dataset.id}`], [t.dataset.kind]: t.dataset.id });
    closeSheet(); refresh();
  };
}

/* ---------- Start ---------- */
async function start() {
  await storage.open();
  state.settings = sanitizeSettings(await storage.getMeta('settings'));
  for (const raw of await storage.allDays()) { const d = sanitizeDay(raw); if (d) state.days.set(d.day, d); }
  scene = createScene($('scene'), {
    onPot: () => say(pick(L.phaseOf(clock().hour) === 'nacht' ? T.SAYINGS.kitzelNacht : T.SAYINGS.kitzel), 1800),
    onSun: () => say(pick(T.SAYINGS.sonne), 1800),
  });
  ensureToday();
  refresh();
  show(location.hash === '#beet' ? 'beet' : 'heute');

  $('drops').onclick = (ev) => { const b = ev.target.closest('.drop'); if (b) addEntry(+b.dataset.ml, state.today); };
  $('tag').onclick = () => openDay(state.today.day);
  $('gear').onclick = () => openSettings(false);
  $('gift').onclick = openReward;
  document.querySelector('.nav').onclick = (ev) => { const b = ev.target.closest('button'); if (b) { history.replaceState(null, '', '#' + b.dataset.view); show(b.dataset.view); } };
  const openFromBeet = (ev) => { const hit = ev.target.closest('[data-date]'); if (hit && hit.dataset.date) openDay(hit.dataset.date); };
  $('beet-rows').onclick = openFromBeet;
  $('beet-rows').onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openFromBeet(ev); } };
  $('sheet').onclick = (ev) => { if (ev.target === $('sheet') && state.settings.onboarded) closeSheet(); };
  $('sheet').oncancel = (ev) => { if (!state.settings.onboarded) ev.preventDefault(); };

  const tick = () => {
    if (ensureToday()) { refresh(); toast('Ein neuer Tag. Die Pflanze von gestern steht jetzt im Beet.'); }
    else if (!$('sheet').open) renderToday(true);
  };
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  if (!state.settings.onboarded) openSettings(true);
  else {
    const days = allDays().sort((a, b) => (a.day < b.day ? -1 : 1));
    if (L.backupDue(state.settings.lastBackupDay, state.today.day, L.gardenDays(days), days[0] && days[0].day)) toast('Zeit für eine Sicherung deines Gartens.', 'Sichern', exportData);
  }
  watchUpdates();
}

/* ---------- Neue Version ---------- */
// Der Service Worker lädt eine neue Version im Hintergrund und wartet. Kurz nach dem Öffnen der App wird sie
// still übernommen (neu geladen), sonst erscheint ein Hinweis mit Knopf. In den Einstellungen kann man selbst suchen.
let swReg = null, wokeAt = 0;
function applyUpdate(worker) { worker.postMessage('skip'); }
function offerUpdate(worker) {
  if (!worker || !navigator.serviceWorker.controller) return;
  if (Date.now() - wokeAt < 5000 && !$('sheet').open) applyUpdate(worker);
  else toast('Eine neue Version ist da.', 'Aktualisieren', () => applyUpdate(worker), true);
}
function installed(reg) {
  return new Promise((ok) => {
    const w = reg.installing;
    if (!w) return ok(reg.waiting);
    w.addEventListener('statechange', () => { if (w.state === 'installed') ok(w); else if (w.state === 'redundant') ok(null); });
  });
}
/** Für den Knopf in den Einstellungen. Antwort: 'neu' | 'aktuell' | 'offline'. */
async function checkForUpdate() {
  if (!swReg) return 'offline';
  try { await swReg.update(); } catch { return 'offline'; }
  const w = swReg.waiting || await installed(swReg);
  if (w) { applyUpdate(w); return 'neu'; }
  return 'aktuell';
}
function watchUpdates() {
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  wokeAt = Date.now();
  let reloading = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    swReg = reg;
    if (reg.waiting) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => installed(reg).then(offerUpdate));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { wokeAt = Date.now(); reg.update().catch(() => {}); } });
  });
}
start();
