// Warung Rush — config.js
// Every tunable number, recipe, ingredient and screen rectangle lives here,
// so the rest of the game reads the rules from one place.

export const CANVAS_W = 960;
export const CANVAS_H = 600;

export const SHIFT_SECONDS = 150;
export const MAX_LIVES = 3;
export const MAX_CUSTOMERS = 4;
export const MAX_PLATES = 3;
export const CHOPS_NEEDED = 3;
export const BURN_SECONDS = 3.5;

// Seeded random: the same seed always deals the same shift, so the
// screenshot scenes are reproducible. Never use Math.random for gameplay.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  if (list.length === 0) return undefined;
  return list[Math.floor(rng() * list.length)];
}

// Clamp a value into [min, max]; used for progress bars and timers.
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------- ingredients
// key: keyboard shortcut. chop: true means the ingredient must be chopped
// on the board (3 clicks) before it can join the wok.

export const INGREDIENTS = [
  { id: 'rice',    name: 'Nasi',    short: 'Nasi',   key: '1', color: '#fff7e0', dark: '#d9c48f', chop: false },
  { id: 'noodles', name: 'Mie',     short: 'Mie',    key: '2', color: '#ffd94d', dark: '#c79a1d', chop: false },
  { id: 'egg',     name: 'Telur',   short: 'Telur',  key: '3', color: '#fff3b0', dark: '#e0a800', chop: false },
  { id: 'chili',   name: 'Cabai',   short: 'Cabai',  key: '4', color: '#e63946', dark: '#9d0208', chop: true },
  { id: 'veg',     name: 'Sayur',   short: 'Sayur',  key: '5', color: '#70c94e', dark: '#2d6a1e', chop: true },
  { id: 'skewer',  name: 'Sate',    short: 'Sate',   key: '6', color: '#b08954', dark: '#6b4423', chop: false },
  { id: 'peanut',  name: 'Kacang',  short: 'Kacang', key: '7', color: '#d9a066', dark: '#8a5a2b', chop: false },
  { id: 'tea',     name: 'Teh',     short: 'Teh',    key: '8', color: '#c68a3c', dark: '#7a4a12', chop: false },
  { id: 'ice',     name: 'Es Batu', short: 'Es',     key: '9', color: '#bde8ff', dark: '#5aa9d6', chop: false },
  { id: 'sugar',   name: 'Gula',    short: 'Gula',   key: '0', color: '#ffffff', dark: '#b8b8b8', chop: false },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

// -------------------------------------------------------------------- recipes
// cookSeconds 0 means the dish needs no wok time: it is plated at once.

export const RECIPES = [
  {
    id: 'nasi', name: 'Nasi Goreng', price: 25, score: 100, cookSeconds: 4,
    ingredients: ['rice', 'egg', 'chili'], color: '#f4a259', emoji: '🍚',
  },
  {
    id: 'mie', name: 'Mie Goreng', price: 25, score: 100, cookSeconds: 4,
    ingredients: ['noodles', 'egg', 'veg'], color: '#e9c46a', emoji: '🍜',
  },
  {
    id: 'sate', name: 'Sate Ayam', price: 30, score: 120, cookSeconds: 5,
    ingredients: ['skewer', 'peanut'], color: '#bc6c25', emoji: '🍢',
  },
  {
    id: 'esteh', name: 'Es Teh Manis', price: 15, score: 60, cookSeconds: 0,
    ingredients: ['tea', 'ice', 'sugar'], color: '#dda15e', emoji: '🧋',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe]),
);

// A dish is done when the wok holds exactly this recipe's ingredients.
export function recipeForIngredients(ids) {
  const sorted = [...ids].sort().join(',');
  return RECIPES.find((r) => [...r.ingredients].sort().join(',') === sorted) || null;
}

// True when the current wok contents could still become some recipe.
export function wokCanStillMatch(ids) {
  return RECIPES.some((r) =>
    ids.every((id) => r.ingredients.includes(id)) &&
    ids.length <= r.ingredients.length,
  );
}

// --------------------------------------------------------------------- layout
// All hit-testing and drawing share these rectangles.

export const LAYOUT = {
  hud: { x: 0, y: 0, w: 960, h: 46 },
  orderBoard: { x: 16, y: 54, w: 928, h: 62 },
  customerRow: { y: 150, seatXs: [150, 370, 590, 810] },
  counter: { x: 16, y: 252, w: 928, h: 10 },
  wok: { x: 92, y: 300, r: 62 },
  board: { x: 268, y: 296, w: 190, h: 92 },
  serveCounter: { x: 520, y: 292, w: 300, h: 100 },
  trash: { x: 852, y: 296, w: 76, h: 92 },
  bins: { x: 16, y: 462, w: 928, h: 112, cols: 5, rows: 2 },
  help: { x: 16, y: 582, w: 928, h: 16 },
};

export function binRect(index) {
  const { x, y, w, h, cols, rows } = LAYOUT.bins;
  const cw = w / cols;
  const ch = h / rows;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: x + col * cw + 4, y: y + row * ch + 4, w: cw - 8, h: ch - 8 };
}

export function customerHitRect(seatIndex) {
  const cx = LAYOUT.customerRow.seatXs[seatIndex];
  return { x: cx - 62, y: 122, w: 124, h: 132 };
}

export function plateSlotRect(slot) {
  const { x, y } = LAYOUT.serveCounter;
  return { x: x + 14 + slot * 96, y: y + 14, w: 84, h: 72 };
}

// Colours for the warung itself.
export const COLORS = {
  wall: '#ffe8c2',
  wallStripe: '#ffd9a0',
  floor: '#c98f5e',
  counterWood: '#8a5a2b',
  counterTop: '#b07a3f',
  board: '#e8c890',
  wokIron: '#3d3d3d',
  wokInner: '#232323',
  plate: '#ffffff',
  hudBg: '#7a3b12',
  hudText: '#ffe8c2',
  title: '#fff3d6',
};
