// Katalog: feste Inhalte als reine Daten mit stabilen IDs. Keine Logik, keine Anzeigetexte.
// In Swift später catalog.json im Bundle.

/** Pflanzen-Rezepte. form: single|multi|spike|bell|cactus|hang. IDs nie umbenennen, nur ergänzen. */
export const SPECIES = [
  { id: 'tulpe', form: 'single', flower: 'tulip', color: '#E8506A', color2: '#C93A55', height: 70, size: 26, basal: true },
  { id: 'sonnenblume', form: 'single', flower: 'sun', color: '#FFC62E', color2: '#7A4A21', height: 92, size: 38, leaf: 'heart', leaves: 4 },
  { id: 'margerite', form: 'single', flower: 'daisy', petals: 12, color: '#FFFFFF', color2: '#FFC62E', height: 76, size: 30, leaf: 'oval', leaves: 3 },
  { id: 'mohn', form: 'single', flower: 'poppy', color: '#F0512F', color2: '#2A1A12', height: 78, size: 32, leaf: 'oval', leaves: 2 },
  { id: 'rose', form: 'single', flower: 'rose', color: '#F27A9B', color2: '#D4567B', height: 72, size: 28, leaf: 'oval', leaves: 4 },
  { id: 'kosmee', form: 'multi', flower: 'daisy', petals: 8, color: '#F08BC0', color2: '#FFC62E', height: 82, size: 22, leaf: 'long', leaves: 2 },
  { id: 'vergissmeinnicht', form: 'multi', flower: 'round5', color: '#6FA8F0', color2: '#FFE27A', height: 54, size: 17, leaf: 'oval', leaves: 2 },
  { id: 'krokus', form: 'multi', flower: 'tulip', color: '#9A6BE0', color2: '#7A4BC0', height: 42, size: 19, basal: true },
  { id: 'gaensebluemchen', form: 'multi', flower: 'daisy', petals: 12, color: '#FFFFFF', color2: '#FFC62E', height: 46, size: 17, leaf: 'round', leaves: 2 },
  { id: 'lavendel', form: 'spike', color: '#9B7BE8', height: 82, stems: 3, basal: true },
  { id: 'lupine', form: 'spike', color: '#F06FA0', height: 88, stems: 1, fat: 1.5, leaf: 'long', leaves: 4 },
  { id: 'glockenblume', form: 'bell', flower: 'bell', color: '#6F8BF0', color2: '#4F6BD0', height: 82, size: 17, count: 3, leaf: 'oval', leaves: 2 },
  { id: 'schneegloeckchen', form: 'bell', flower: 'bell', color: '#FFFFFF', color2: '#8FD06E', height: 56, size: 17, count: 1, basal: true },
  { id: 'kaktus', form: 'cactus', flower: 'daisy', petals: 10, color: '#FF7FB0', color2: '#FFE27A', size: 22 },
  { id: 'fuchsie', form: 'hang', flower: 'bell', color: '#E8457A', color2: '#8A4BC0', size: 15, leaf: 'oval' },
  { id: 'haengepetunie', form: 'hang', flower: 'round5', color: '#A85BE0', color2: '#FFE27A', size: 19, leaf: 'oval' },
  { id: 'erdbeere', form: 'hang', flower: 'round5', color: '#FFFFFF', color2: '#FFC62E', size: 13, leaf: 'round', fruit: true },
  { id: 'kapuzinerkresse', form: 'hang', flower: 'round5', color: '#FF8A2E', color2: '#C93A1A', size: 18, leaf: 'round' },
];

/**
 * Richtwerte für die Zufuhr von Wasser, D-A-CH-Referenzwerte 2018 (DGE).
 * drinks/food in ml pro Tag, perKg = Getränke + feste Nahrung in ml je kg Körpergewicht.
 * maxAge: Gruppe gilt bis einschließlich dieses Alters.
 */
export const WATER_BY_AGE = [
  { id: 'a15', maxAge: 18, drinks: 1530, food: 920, perKg: 40 },
  { id: 'a19', maxAge: 24, drinks: 1470, food: 890, perKg: 35 },
  { id: 'a25', maxAge: 50, drinks: 1410, food: 860, perKg: 35 },
  { id: 'a51', maxAge: 64, drinks: 1230, food: 740, perKg: 30 },
  { id: 'a65', maxAge: 999, drinks: 1310, food: 680, perKg: 30 },
];
export const WATER_SPECIAL = {
  schwanger: { drinks: 1470 },
  stillend: { drinks: 1710 },
};
export const DEFAULT_AGE_GROUP = 'a25';

/** Zuschläge: Sport = untere Grenze der Verbraucherzentrale (0,5 l je Stunde), Hitze = eigene vorsichtige Stufe. */
export const SPORT_ML_PER_30_MIN = 250;
export const HEAT_ML = 500;

/** Ab so vielen Gartentagen (Tage mit Eintrag) darf je ein Gestaltungsteil ausgesucht werden. */
export const REWARD_DAYS = [3, 7, 14, 30, 60, 100, 150];

/** Gestaltung. Das jeweils erste Teil ist von Anfang an frei. */
export const POTS = [
  { id: 'terrakotta', color: '#D9825B', dark: '#BF6A45' },
  { id: 'salbei', color: '#9CC196', dark: '#7CA176' },
  { id: 'himmel', color: '#8FB3D1', dark: '#6F93B3' },
  { id: 'rosa', color: '#D29ABB', dark: '#B37A9B' },
  { id: 'honig', color: '#E6B25C', dark: '#C9943F' },
];
export const BEDS = [
  { id: 'holz', color: '#B98A5E', dark: '#8F6540' },
  { id: 'stein', color: '#A9A39A', dark: '#857F76' },
  { id: 'weide', color: '#C9A66B', dark: '#9C7B45' },
  { id: 'terrakotta', color: '#D9825B', dark: '#BF6A45' },
];
