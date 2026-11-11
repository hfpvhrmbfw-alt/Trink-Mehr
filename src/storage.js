// Speicher: kleine Schnittstelle, IndexedDB mit localStorage als Ersatz. Die Logik kennt den Speicher nicht.
// In Swift später SwiftData oder Dateien mit demselben JSON-Format.
const DB_NAME = 'vergiessmeinnicht', DB_VERSION = 1, LS_KEY = 'vergiessmeinnicht';
let db = null;

const req = (r) => new Promise((ok, fail) => { r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error); });
const store = (name, mode) => db.transaction(name, mode).objectStore(name);
const lsRead = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || { days: {}, meta: {} }; } catch { return { days: {}, meta: {} }; } };
const lsWrite = (data) => { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* Speicher voll oder gesperrt: Daten bleiben nur bis zum Schließen */ } };

/** Öffnet den Speicher. Ohne IndexedDB (z. B. privates Fenster) läuft alles über localStorage. */
export async function open() {
  try {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('days')) r.result.createObjectStore('days', { keyPath: 'day' });
      if (!r.result.objectStoreNames.contains('meta')) r.result.createObjectStore('meta');
    };
    db = await req(r);
  } catch { db = null; }
}
export async function allDays() { return db ? req(store('days', 'readonly').getAll()) : Object.values(lsRead().days); }
export async function putDay(day) {
  if (db) return req(store('days', 'readwrite').put(day));
  const data = lsRead(); data.days[day.day] = day; lsWrite(data);
}
export async function deleteDay(dayId) {
  if (db) return req(store('days', 'readwrite').delete(dayId));
  const data = lsRead(); delete data.days[dayId]; lsWrite(data);
}
/** Ersetzt alle Tage (Import). */
export async function replaceDays(days) {
  if (!db) { const data = lsRead(); data.days = Object.fromEntries(days.map((d) => [d.day, d])); return lsWrite(data); }
  const tx = db.transaction('days', 'readwrite'), s = tx.objectStore('days');
  s.clear(); days.forEach((d) => s.put(d));
  return new Promise((ok, fail) => { tx.oncomplete = () => ok(); tx.onerror = () => fail(tx.error); });
}
export async function getMeta(key) { return db ? req(store('meta', 'readonly').get(key)) : lsRead().meta[key]; }
export async function setMeta(key, value) {
  if (db) return req(store('meta', 'readwrite').put(value, key));
  const data = lsRead(); data.meta[key] = value; lsWrite(data);
}
