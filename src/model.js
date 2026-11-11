// Modell: Datentypen, Standardwerte, Validierung, Export/Import, Migration.
// Keine Abhängigkeit zu Oberfläche, Speicher oder Uhr. Keine Anzeigetexte.

export const APP_ID = 'vergiessmeinnicht';
export const SCHEMA_VERSION = 1;

/** @typedef {{id:string, time:string, ml:number}} Entry  time = "HH:MM" */
/** @typedef {{day:string, speciesId:string, potId:number, goalMl:number, sportMin:number, heat:boolean, entries:Entry[]}} Day  day = "YYYY-MM-DD" */
/**
 * @typedef {Object} Settings
 * @property {boolean} onboarded
 * @property {string} potName
 * @property {number|null} birthYear
 * @property {number|null} weightKg
 * @property {'schwanger'|'stillend'|null} special
 * @property {'sanft'|'richtwert'|'reichlich'|'frei'} level
 * @property {number} customGoalMl
 * @property {number[]} sizes  drei Tropfengrößen in ml, aufsteigend
 * @property {string} pot  ID aus POTS (Kübel-Design)
 * @property {string} bed  ID aus BEDS
 * @property {string[]} unlocked  freigeschaltete Gestaltungs-IDs ("pot:salbei")
 * @property {string|null} lastBackupDay
 */

export const LEVELS = ['sanft', 'richtwert', 'reichlich', 'frei'];
export const SPECIALS = ['schwanger', 'stillend'];

/** @returns {Settings} */
export function defaultSettings() {
  return {
    onboarded: false, potName: '', birthYear: null, weightKg: null, special: null,
    level: 'richtwert', customGoalMl: 1500, sizes: [150, 250, 500],
    pot: 'terrakotta', bed: 'holz', unlocked: [], lastBackupDay: null,
  };
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const ID_RE = /^[a-z0-9:_-]{1,40}$/;
const int = (v, min, max, fallback) => (Number.isFinite(v) && Math.round(v) >= min && Math.round(v) <= max ? Math.round(v) : fallback);

/** @returns {Settings} immer gültig, Unbekanntes fällt auf den Standard zurück */
export function sanitizeSettings(raw) {
  const d = defaultSettings(), r = raw && typeof raw === 'object' ? raw : {};
  const sizes = Array.isArray(r.sizes) ? r.sizes.map((s) => int(s, 50, 1500, null)).filter((s) => s !== null) : [];
  return {
    onboarded: r.onboarded === true,
    potName: typeof r.potName === 'string' ? r.potName.trim().slice(0, 20) : d.potName,
    birthYear: int(r.birthYear, 1900, 2100, null),
    weightKg: int(r.weightKg, 30, 250, null),
    special: SPECIALS.includes(r.special) ? r.special : null,
    level: LEVELS.includes(r.level) ? r.level : d.level,
    customGoalMl: int(r.customGoalMl, 500, 4000, d.customGoalMl),
    sizes: sizes.length === 3 ? sizes.slice().sort((a, b) => a - b) : d.sizes,
    // Früher gab es Zaunfarben statt Kübel-Designs: gleiche IDs, nur 'weiss' wird zu 'terrakotta'.
    pot: typeof r.pot === 'string' && ID_RE.test(r.pot) ? r.pot : typeof r.fence === 'string' && ID_RE.test(r.fence) && r.fence !== 'weiss' ? r.fence : d.pot,
    bed: typeof r.bed === 'string' && ID_RE.test(r.bed) ? r.bed : d.bed,
    unlocked: Array.isArray(r.unlocked) ? [...new Set(r.unlocked.filter((u) => typeof u === 'string' && ID_RE.test(u)).map((u) => u.replace(/^fence:/, 'pot:')))] : [],
    lastBackupDay: typeof r.lastBackupDay === 'string' && DAY_RE.test(r.lastBackupDay) ? r.lastBackupDay : null,
  };
}

/** @returns {Day|null} null, wenn der Tag nicht zu retten ist */
export function sanitizeDay(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.day !== 'string' || !DAY_RE.test(raw.day)) return null;
  if (typeof raw.speciesId !== 'string' || !ID_RE.test(raw.speciesId)) return null;
  const seen = new Set();
  const entries = (Array.isArray(raw.entries) ? raw.entries : []).filter((e) => {
    const ok = e && typeof e.id === 'string' && ID_RE.test(e.id) && !seen.has(e.id) && typeof e.time === 'string' && TIME_RE.test(e.time) && int(e.ml, 1, 2000, null) !== null;
    if (ok) seen.add(e.id);
    return ok;
  }).map((e) => ({ id: e.id, time: e.time, ml: Math.round(e.ml) }));
  return {
    day: raw.day, speciesId: raw.speciesId, potId: int(raw.potId, 0, 4, 0),
    goalMl: int(raw.goalMl, 500, 5000, 1400), sportMin: int(raw.sportMin, 0, 600, 0), heat: raw.heat === true, entries,
  };
}

/** Hebt Daten einer älteren Schema-Version auf die aktuelle. Idempotent. */
export function upgradeRaw(data) {
  // Version 1 ist die erste. Künftige Umbauten hier ergänzen: if (v < 2) {...}
  return { ...data, version: SCHEMA_VERSION };
}

/** @param {Settings} settings @param {Day[]} days @param {string} exportedAt ISO-Zeitstempel (kommt von der Oberfläche) */
export function buildExport(settings, days, exportedAt) {
  return { app: APP_ID, version: SCHEMA_VERSION, exportedAt, settings, days };
}

/**
 * @param {string} text Inhalt der Sicherungsdatei
 * @returns {{ok:true, settings:Settings, days:Day[], dropped:number}|{ok:false, error:'json'|'app'|'newer'|'empty'}}
 */
export function parseImport(text) {
  let data;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'json' }; }
  if (!data || typeof data !== 'object' || data.app !== APP_ID) return { ok: false, error: 'app' };
  if (!Number.isInteger(data.version) || data.version < 1) return { ok: false, error: 'app' };
  if (data.version > SCHEMA_VERSION) return { ok: false, error: 'newer' };
  data = upgradeRaw(data);
  const raw = Array.isArray(data.days) ? data.days : [];
  const byDay = new Map();
  for (const r of raw) { const d = sanitizeDay(r); if (d) byDay.set(d.day, d); }
  if (!byDay.size && !data.settings) return { ok: false, error: 'empty' };
  const days = [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
  return { ok: true, settings: sanitizeSettings(data.settings), days, dropped: raw.length - days.length };
}
