import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as L from '../src/logic.js';
import * as M from '../src/model.js';
import { SPECIES, POTS, BEDS, REWARD_DAYS, WATER_BY_AGE } from '../src/catalog.js';

const fixture = (name) => JSON.parse(readFileSync(new URL('./fixtures/' + name, import.meta.url)));
const IDS = SPECIES.map((s) => s.id);
const day = (d, ml = [], extra = {}) => ({ day: d, speciesId: 'tulpe', potId: 0, goalMl: 1400, sportMin: 0, heat: false, entries: ml.map((m, i) => ({ id: 'e' + i, time: '10:00', ml: m })), ...extra });

test('Empfehlung und Tagesziel (Fixtures)', () => {
  for (const f of fixture('empfehlung.json')) {
    const s = M.sanitizeSettings(f.settings);
    assert.equal(L.recommendedMl(s, f.year), f.recommended, f.name);
    assert.equal(L.goalMl(s, f.year), f.goal, f.name);
  }
});

test('Stufen (Fixtures)', () => {
  for (const f of fixture('stufen.json')) {
    assert.equal(L.stageOf(f.p), f.stage, 'p=' + f.p);
    assert.ok(Math.abs(L.stageFrac(f.p) - f.frac) < 1e-6, 'frac p=' + f.p);
  }
});

test('jedes Glas wirkt sichtbar: Stufe oder Anteil ändert sich', () => {
  let d = day('2026-11-11'), last = '';
  for (let i = 0; i < 6; i++) {
    d = day('2026-11-11', Array(i + 1).fill(250));
    const key = L.stageOf(L.progress(d)) + ':' + L.stageFrac(L.progress(d)).toFixed(3);
    assert.notEqual(key, last);
    last = key;
  }
});

test('Zuschlag, Summe und Obergrenze', () => {
  const d = day('2026-11-11', [250, 500], { sportMin: 60, heat: true });
  assert.equal(L.extraMl(d), 1000);
  assert.equal(L.dayGoalMl(d), 2400);
  assert.equal(L.dayTotalMl(d), 750);
  assert.equal(L.isFull(d), false);
  assert.equal(L.isFull(day('2026-11-11', [1400, 1400])), true);
  assert.equal(L.hasVisitor(1.25), true);
});

test('Datum hin und zurück', () => {
  assert.equal(L.numToDay(L.dayToNum('2026-11-11')), '2026-11-11');
  assert.equal(L.dayToNum('2026-03-01') - L.dayToNum('2026-02-28'), 1);
  assert.equal(L.dayToNum('2024-03-01') - L.dayToNum('2024-02-28'), 2);
});

test('Art würfeln: wiederholbar, gültig, nicht doppelt in sieben Tagen', () => {
  const days = [];
  for (let n = L.dayToNum('2026-01-01'); n < L.dayToNum('2026-01-01') + 120; n++) {
    const d = L.newDay(L.numToDay(n), 1400, days, IDS);
    assert.ok(IDS.includes(d.speciesId));
    assert.equal(d.speciesId, L.pickSpecies(d.day, days, IDS));
    assert.ok(!days.slice(-7).some((x) => x.speciesId === d.speciesId), d.day);
    assert.ok(d.potId >= 0 && d.potId <= 4);
    days.push({ ...d, entries: [{ id: 'e', time: '09:00', ml: 1400 }] });
  }
  assert.equal(new Set(days.map((d) => d.speciesId)).size, IDS.length, 'alle Arten kommen vor');
});

test('Beet: leere Tage, Wiese ab drei, Monatsschilder, heute', () => {
  const days = [day('2026-10-30', [250]), day('2026-11-01', [250]), day('2026-11-06', [250]), day('2026-11-08', [])];
  const items = L.bedItems(days, '2026-11-09');
  assert.deepEqual(items.map((i) => i.type), ['month', 'day', 'empty', 'month', 'day', 'gap', 'day', 'empty', 'empty', 'today']);
  const gap = items.find((i) => i.type === 'gap');
  assert.deepEqual([gap.from, gap.to], ['2026-11-02', '2026-11-05']);
  assert.deepEqual(L.bedItems([], '2026-11-09').map((i) => i.type), ['month', 'today']);
  assert.deepEqual(L.bedItems([day('2026-11-09', [250])], '2026-11-09').map((i) => i.type), ['month', 'today']);
});

test('Belohnungen zählen Gartentage, nie Serien', () => {
  assert.equal(L.gardenDays([day('2026-11-01', [100]), day('2026-11-05', []), day('2026-11-09', [100])]), 2);
  assert.equal(L.bloomCount([day('2026-11-01', [1400]), day('2026-11-02', [100])]), 1);
  assert.equal(L.picksAvailable(2, 0), 0);
  assert.equal(L.picksAvailable(7, 0), 2);
  assert.equal(L.picksAvailable(7, 2), 0);
  assert.equal(L.nextRewardAt(7), 14);
  assert.equal(L.nextRewardAt(999), null);
  assert.equal(REWARD_DAYS.length, POTS.length - 1 + BEDS.length - 1, 'für jede Schwelle gibt es ein Teil');
});

test('Tageszeit, Mond, Sicherung', () => {
  assert.deepEqual([0, 5, 11, 17, 21].map(L.phaseOf), ['nacht', 'morgen', 'mittag', 'abend', 'nacht']);
  const p = L.moonPhase(L.dayToNum('2026-11-09'));
  assert.ok(p < 0.06 || p > 0.94, 'um den 9.11.2026 ist Neumond, p=' + p);
  assert.equal(L.backupDue(null, '2026-11-11', 3, '2026-10-01'), false);
  assert.equal(L.backupDue(null, '2026-11-11', 9, '2026-10-01'), true);
  assert.equal(L.backupDue('2026-11-01', '2026-11-11', 9, '2026-10-01'), false);
});

test('Katalog: IDs eindeutig, Tabelle aufsteigend', () => {
  for (const list of [SPECIES, POTS, BEDS, WATER_BY_AGE]) assert.equal(new Set(list.map((x) => x.id)).size, list.length);
  assert.ok(SPECIES.length >= 18);
  assert.ok(SPECIES.every((s) => ['single', 'multi', 'spike', 'bell', 'cactus', 'hang'].includes(s.form)));
  assert.deepEqual(WATER_BY_AGE.map((g) => g.maxAge), [...WATER_BY_AGE.map((g) => g.maxAge)].sort((a, b) => a - b));
});

test('Einstellungen und Tage werden bereinigt', () => {
  const s = M.sanitizeSettings({ potName: '  Kübelchen  ', birthYear: 1800, weightKg: 'x', level: 'hart', sizes: [500, 150, 250], unlocked: ['pot:salbei', 'fence:salbei', 7], fence: 'himmel' });
  assert.deepEqual([s.potName, s.birthYear, s.weightKg, s.level], ['Kübelchen', null, null, 'richtwert']);
  assert.deepEqual(s.sizes, [150, 250, 500]);
  assert.deepEqual(s.unlocked, ['pot:salbei'], 'alte Zaunfarben werden zu Kübel-Designs');
  assert.equal(s.pot, 'himmel');
  assert.equal(M.sanitizeDay({ day: 'gestern' }), null);
  const d = M.sanitizeDay({ day: '2026-11-11', speciesId: 'tulpe', goalMl: 9, entries: [{ id: 'a', time: '09:00', ml: 250 }, { id: 'a', time: '09:05', ml: 250 }, { id: 'b', time: 'spät', ml: 250 }, { id: 'c', time: '10:00', ml: -5 }] });
  assert.equal(d.entries.length, 1);
  assert.equal(d.goalMl, 1400);
});

test('Export und Import: gültig, kaputt, fremd, neuer, älter gleich idempotent', () => {
  const settings = M.sanitizeSettings({ potName: 'Kurt', onboarded: true });
  const days = [day('2026-11-10', [250]), day('2026-11-09', [500])];
  const text = JSON.stringify(M.buildExport(settings, days, '2026-11-11T10:00:00.000Z'));
  const back = M.parseImport(text);
  assert.equal(back.ok, true);
  assert.deepEqual(back.days.map((d) => d.day), ['2026-11-09', '2026-11-10']);
  assert.equal(back.settings.potName, 'Kurt');
  assert.equal(back.dropped, 0);
  assert.deepEqual(M.parseImport('{kaputt'), { ok: false, error: 'json' });
  assert.deepEqual(M.parseImport('{"app":"anders","version":1}'), { ok: false, error: 'app' });
  assert.deepEqual(M.parseImport(JSON.stringify({ app: M.APP_ID, version: M.SCHEMA_VERSION + 1, days: [] })), { ok: false, error: 'newer' });
  assert.deepEqual(M.parseImport(JSON.stringify({ app: M.APP_ID, version: 1 })), { ok: false, error: 'empty' });
  const once = M.upgradeRaw(JSON.parse(text));
  assert.deepEqual(M.upgradeRaw(once), once);
  assert.equal(M.parseImport(JSON.stringify({ ...JSON.parse(text), days: [...days, { day: 'x' }] })).dropped, 1);
});
