// Texte: Beschriftungen zu den IDs aus Modell und Katalog. Gehört zur Oberfläche. In Swift später String Catalog.
export const SPECIES_NAMES = {
  tulpe: 'Tulpe', sonnenblume: 'Sonnenblume', margerite: 'Margerite', mohn: 'Mohn', rose: 'Rose', kosmee: 'Kosmee',
  vergissmeinnicht: 'Vergissmeinnicht', krokus: 'Krokus', gaensebluemchen: 'Gänseblümchen', lavendel: 'Lavendel', lupine: 'Lupine',
  glockenblume: 'Glockenblume', schneegloeckchen: 'Schneeglöckchen', kaktus: 'Kaktus', fuchsie: 'Fuchsie',
  haengepetunie: 'Hängepetunie', erdbeere: 'Erdbeere', kapuzinerkresse: 'Kapuzinerkresse',
};
export const STAGE_NAMES = ['Erde', 'Keimling', 'Jungpflanze', 'Knospe', 'Blüte'];
export const LEVEL_NAMES = { sanft: 'Sanft', richtwert: 'Richtwert', reichlich: 'Reichlich', frei: 'Eigene Menge' };
export const LEVEL_HINTS = { sanft: '80 % zum Eingewöhnen', richtwert: 'Empfehlung der DGE', reichlich: 'die Zwei-Liter-Marke', frei: 'du legst sie selbst fest' };
export const POT_NAMES = { terrakotta: 'Terrakotta-Kübel', salbei: 'Salbeigrüner Kübel', himmel: 'Himmelblauer Kübel', rosa: 'Rosa Kübel', honig: 'Honiggelber Kübel' };
export const BED_NAMES = { holz: 'Beet aus Holz', stein: 'Beet aus Stein', weide: 'Beet aus Weide', terrakotta: 'Beet aus Terrakotta' };
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MONTHS_SHORT = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
export const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const IMPORT_ERRORS = {
  json: 'Die Datei ist keine lesbare Sicherung.',
  app: 'Die Datei stammt nicht aus Vergießmeinnicht.',
  newer: 'Die Sicherung stammt aus einer neueren Version der App. Bitte erst die App aktualisieren.',
  empty: 'Die Sicherung ist leer.',
};
/** Sätze des Kübels je Zustand. Die Oberfläche wählt einen aus. */
export const SAYINGS = {
  schlaf: ['Zzz … gieß mich, wenn du wach bist.', 'Noch ganz still in der Erde.'],
  start: ['Guten Morgen! Was wächst heute wohl?', 'Frische Erde. Ich bin gespannt!', 'Ein Glas, und es geht los.'],
  keimling: ['Da spitzt etwas heraus!', 'Ein Keimling! Was wird das wohl?'],
  jung: ['Diese Blätter … hast du eine Idee?', 'Es wächst! Weiter so.'],
  knospe: ['Gleich ist es so weit!', 'Eine Knospe! Nur noch ein bisschen.'],
  bluete: ['Geschafft! Schau, wie schön.', 'Sie blüht! Danke fürs Gießen.'],
  nacht: ['Schlaf gut. Morgen wächst etwas Neues.', 'Psst … die Sterne sind schon da.'],
  kitzel: ['Hihi, das kitzelt!', 'Huch!', 'Nochmal!'],
  kitzelNacht: ['Mmh … noch fünf Minuten.'],
  sonne: ['Die Sonne lacht.', 'Schön warm heute.'],
  danke: ['Danke!', 'Mmh, lecker!', 'Das tut gut!', 'Ahh!'],
  voll: ['Das reicht für heute. Morgen wieder!'],
  hitze: ['Puh, heiß heute. Bei viel Schwitzen darf es auch Mineralwasser oder Schorle sein.'],
};
