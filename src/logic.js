// Logik: reine Funktionen. Daten rein, Ergebnis raus.
// Kein DOM, kein Speicher, keine Uhr: "heute" und die Stunde werden übergeben.
import { WATER_BY_AGE, WATER_SPECIAL, DEFAULT_AGE_GROUP, SPORT_ML_PER_30_MIN, HEAT_ML, REWARD_DAYS } from './catalog.js';

/** @typedef {import('./model.js').Day} Day */
/** @typedef {import('./model.js').Settings} Settings */

/** "YYYY-MM-DD" -> ganze Tage seit 1970 (UTC, zeitzonenfest) */
export function dayToNum(day) { return Math.round(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / 86400000); }
/** ganze Tage seit 1970 -> "YYYY-MM-DD" */
export function numToDay(num) { return new Date(num * 86400000).toISOString().slice(0, 10); }

const round50 = (n) => Math.round(n / 50) * 50;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Empfohlene Getränkemenge in ml nach DGE-Richtwert. @param {Settings} s @param {number} year aktuelles Jahr */
export function recommendedMl(s, year) {
  if (s.special && WATER_SPECIAL[s.special]) return round50(WATER_SPECIAL[s.special].drinks);
  const age = s.birthYear ? year - s.birthYear : null;
  const group = age === null ? WATER_BY_AGE.find((g) => g.id === DEFAULT_AGE_GROUP) : WATER_BY_AGE.find((g) => age <= g.maxAge);
  if (!s.weightKg) return round50(group.drinks);
  return clamp(round50(s.weightKg * group.perKg * group.drinks / (group.drinks + group.food)), 1000, 3000);
}

/** Tagesziel in ml nach Schwierigkeitsgrad. */
export function goalMl(s, year) {
  if (s.level === 'frei') return s.customGoalMl;
  if (s.level === 'reichlich') return 2000;
  const rec = recommendedMl(s, year);
  return s.level === 'sanft' ? round50(rec * 0.8) : rec;
}

/** Zuschlag in ml für Sport und Hitze. @param {Day} d */
export function extraMl(d) { return Math.round(d.sportMin / 30) * SPORT_ML_PER_30_MIN + (d.heat ? HEAT_ML : 0); }
/** @param {Day} d */
export function dayGoalMl(d) { return d.goalMl + extraMl(d); }
/** @param {Day} d */
export function dayTotalMl(d) { return d.entries.reduce((sum, e) => sum + e.ml, 0); }
/** Fortschritt 0..n (1 = Ziel erreicht). @param {Day} d */
export function progress(d) { return dayTotalMl(d) / dayGoalMl(d); }

const STAGE_FROM = [0, 0, 0.35, 0.7, 1];
/** Wachstumsstufe: 0 Erde, 1 Keimling, 2 Jungpflanze, 3 Knospe, 4 Blüte */
export function stageOf(p) { return p >= 1 ? 4 : p >= 0.7 ? 3 : p >= 0.35 ? 2 : p > 0 ? 1 : 0; }
/** Anteil 0..1 innerhalb der Stufe, damit jedes Glas sichtbar wirkt. */
export function stageFrac(p) {
  const st = stageOf(p);
  if (st === 0) return 0;
  if (st === 4) return 1;
  return clamp((p - STAGE_FROM[st]) / (STAGE_FROM[st + 1] - STAGE_FROM[st]), 0, 1);
}
/** Schmetterling ab 125 %. */
export function hasVisitor(p) { return p >= 1.25; }
/** Ab dem Doppelten des Ziels wird nichts mehr eingetragen. @param {Day} d */
export function isFull(d) { return dayTotalMl(d) >= 2 * dayGoalMl(d); }

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/**
 * Würfelt die Art für einen Tag. Fester Startwert aus dem Datum, daher wiederholbar.
 * Keine Art doppelt innerhalb von sieben Tagen, noch nie erblühte Arten doppelt so wahrscheinlich.
 * @param {string} day @param {Day[]} days bisherige Tage @param {string[]} speciesIds Reihenfolge des Katalogs
 * @returns {string} speciesId
 */
export function pickSpecies(day, days, speciesIds) {
  const n = dayToNum(day);
  const recent = new Set(days.filter((d) => { const k = dayToNum(d.day); return k < n && k >= n - 7; }).map((d) => d.speciesId));
  const bloomed = new Set(days.filter((d) => progress(d) >= 1).map((d) => d.speciesId));
  let pool = speciesIds.filter((id) => !recent.has(id));
  if (!pool.length) pool = speciesIds;
  const weights = pool.map((id) => (bloomed.has(id) ? 1 : 2));
  let r = rng(hash(day))() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r < 0) return pool[i]; }
  return pool[pool.length - 1];
}

/** Legt einen neuen Tag an. @returns {Day} */
export function newDay(day, goal, days, speciesIds) {
  return { day, speciesId: pickSpecies(day, days, speciesIds), potId: hash(day + 'pot') % 5, goalMl: goal, sportMin: 0, heat: false, entries: [] };
}

/** Tage mit mindestens einem Eintrag. @param {Day[]} days */
export function gardenDays(days) { return days.filter((d) => d.entries.length > 0).length; }
/** Tage, an denen das Ziel erreicht wurde. @param {Day[]} days */
export function bloomCount(days) { return days.filter((d) => d.entries.length > 0 && progress(d) >= 1).length; }
/** Wie viele Gestaltungsteile noch ausgesucht werden dürfen. */
export function picksAvailable(gardenDayCount, unlockedCount) { return Math.max(0, REWARD_DAYS.filter((n) => n <= gardenDayCount).length - unlockedCount); }
/** Nächste Schwelle oder null. */
export function nextRewardAt(gardenDayCount) { const n = REWARD_DAYS.find((x) => x > gardenDayCount); return n === undefined ? null : n; }

/**
 * @typedef {{type:'month', month:string}|{type:'day', day:Day}|{type:'empty', date:string}|{type:'gap', from:string, to:string}|{type:'today', date:string}} BedItem
 */
/**
 * Reihenfolge der Dinge im Beet, vom ersten Tag bis heute. Heute steht noch im Kübel und bekommt nur ein Schild.
 * Ab drei leeren Tagen am Stück wird daraus eine Wiese.
 * @param {Day[]} days @param {string} today
 * @returns {BedItem[]}
 */
export function bedItems(days, today) {
  const withEntries = days.filter((d) => d.entries.length > 0 && d.day < today).sort((a, b) => (a.day < b.day ? -1 : 1));
  const end = dayToNum(today);
  const start = withEntries.length ? dayToNum(withEntries[0].day) : end;
  const byNum = new Map(withEntries.map((d) => [dayToNum(d.day), d]));
  const out = [];
  let month = '';
  const push = (item, date) => { const m = date.slice(0, 7); if (m !== month) { month = m; out.push({ type: 'month', month: m }); } out.push(item); };
  let run = [];
  const flush = () => {
    if (run.length >= 3) push({ type: 'gap', from: numToDay(run[0]), to: numToDay(run[run.length - 1]) }, numToDay(run[0]));
    else run.forEach((n) => push({ type: 'empty', date: numToDay(n) }, numToDay(n)));
    run = [];
  };
  for (let n = start; n < end; n++) {
    const d = byNum.get(n);
    if (d) { flush(); push({ type: 'day', day: d }, d.day); } else run.push(n);
  }
  flush();
  push({ type: 'today', date: today }, today);
  return out;
}

/** Tageszeit für die Szene. @param {number} hour 0..23 */
export function phaseOf(hour) { return hour < 5 ? 'nacht' : hour < 11 ? 'morgen' : hour < 17 ? 'mittag' : hour < 21 ? 'abend' : 'nacht'; }
/** Mondphase 0..1 (0 Neumond, 0.5 Vollmond). @param {number} dayNum ganze Tage seit 1970, darf Bruchteile haben */
export function moonPhase(dayNum) { const p = ((dayNum - 10962.76) % 29.530588) / 29.530588; return p < 0 ? p + 1 : p; }

/** Sicherung fällig: frühestens nach sieben Gartentagen, dann alle 30 Tage. */
export function backupDue(lastBackupDay, today, gardenDayCount, firstDay) {
  if (gardenDayCount < 7) return false;
  const since = lastBackupDay || firstDay;
  return !since || dayToNum(today) - dayToNum(since) >= 30;
}
