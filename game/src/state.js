// Warung Rush — state.js
// The whole game state and every rule that changes it. No drawing and no
// DOM here: input calls these functions, render reads the result.

import {
  SHIFT_SECONDS, MAX_LIVES, MAX_CUSTOMERS, MAX_PLATES, CHOPS_NEEDED,
  BURN_SECONDS, INGREDIENTS, INGREDIENT_BY_ID, RECIPES, RECIPE_BY_ID,
  recipeForIngredients, wokCanStillMatch, mulberry32, pickFrom, clamp,
} from './config.js';

export const SCREENS = ['title', 'play', 'over'];

export function createGame(seed = 20261125) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: 'title',
    paused: false,
    time: 0,               // seconds since the shift started
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    lives: MAX_LIVES,
    served: 0,
    lost: 0,
    customers: [],         // { id, recipeId, patience, maxPatience, seat, mood, moodTimer }
    nextCustomerId: 1,
    spawnIn: 2.5,          // seconds until the next customer walks in
    wok: [],               // ingredient ids already in the wok
    board: null,           // { ingredientId, chops } or null
    cooking: null,         // { recipeId, progress, burn } or null
    plates: [],            // finished recipe ids waiting on the serving counter
    message: '',           // floating feedback text ("+125 Mantap!")
    messageTimer: 0,
    flash: '',             // 'serve' | 'wrong' | 'burn' — drives sound + shake
    flashTimer: 0,
    overReason: '',
  };
}

// Difficulty ramps with the shift: 0 at the first order, 1 at closing time.
export function shiftProgress(game) {
  return clamp(game.time / SHIFT_SECONDS, 0, 1);
}

export function spawnInterval(game) {
  return 13 - 6.5 * shiftProgress(game);
}

export function customerPatience(game) {
  return 48 - 22 * shiftProgress(game);
}

export function startShift(game) {
  const fresh = createGame(game.seed);
  fresh.screen = 'play';
  return fresh;
}

export function freeSeat(game) {
  for (let seat = 0; seat < MAX_CUSTOMERS; seat += 1) {
    if (!game.customers.some((c) => c.seat === seat)) return seat;
  }
  return -1;
}

export function spawnCustomer(game) {
  const seat = freeSeat(game);
  if (seat < 0) return null;
  const recipe = pickFrom(game.rng, RECIPES);
  const patience = customerPatience(game);
  const customer = {
    id: game.nextCustomerId,
    recipeId: recipe.id,
    patience,
    maxPatience: patience,
    seat,
    mood: 'waiting',
    moodTimer: 0,
  };
  game.nextCustomerId += 1;
  game.customers.push(customer);
  return customer;
}

function setMessage(game, text) {
  game.message = text;
  game.messageTimer = 1.6;
}

function setFlash(game, kind) {
  game.flash = kind;
  game.flashTimer = 0.5;
}

// The player drops an ingredient into the kitchen. Choppable ingredients
// land on the board first; the rest go straight into the wok.
export function addIngredient(game, ingredientId) {
  if (game.screen !== 'play' || game.paused) return false;
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return false;
  if (game.cooking) return false; // wok is busy: finish this dish first
  if (game.board) return false;   // board is busy: chop it first
  if (game.wok.length >= 3) return false;
  if (game.wok.includes(ingredientId)) return false;
  if (ing.chop) {
    game.board = { ingredientId, chops: 0 };
  } else {
    game.wok.push(ingredientId);
  }
  maybeStartCooking(game);
  return true;
}

// One click on the chopping board. After enough chops the piece joins the wok.
export function chopBoard(game) {
  if (game.screen !== 'play' || game.paused || !game.board) return false;
  game.board.chops += 1;
  if (game.board.chops >= CHOPS_NEEDED) {
    game.wok.push(game.board.ingredientId);
    game.board = null;
    maybeStartCooking(game);
  }
  return true;
}

// When the wok holds a full recipe, cooking starts (or the drink is plated).
function maybeStartCooking(game) {
  if (game.cooking || game.wok.length === 0) return;
  const recipe = recipeForIngredients(game.wok);
  if (!recipe) return;
  if (recipe.cookSeconds <= 0) {
    plateDish(game, recipe.id);
    game.wok = [];
    return;
  }
  game.cooking = { recipeId: recipe.id, progress: 0, burn: 0 };
}

export function plateDish(game, recipeId) {
  if (game.plates.length >= MAX_PLATES) return false;
  game.plates.push(recipeId);
  return true;
}

// Click the wok to lift a finished dish onto a plate.
export function takeFromWok(game) {
  if (game.screen !== 'play' || game.paused || !game.cooking) return false;
  if (game.cooking.progress < 1) return false;
  if (!plateDish(game, game.cooking.recipeId)) return false;
  game.wok = [];
  game.cooking = null;
  return true;
}

// Dump the wok (and the board) into the trash and start the dish over.
export function dumpWok(game) {
  if (game.screen !== 'play' || game.paused) return false;
  if (game.wok.length === 0 && !game.board && !game.cooking) return false;
  game.wok = [];
  game.board = null;
  game.cooking = null;
  setMessage(game, 'Dibuang — mulai lagi!');
  return true;
}

export function customerBySeat(game, seat) {
  return game.customers.find((c) => c.seat === seat) || null;
}

// Serve the first ready plate that matches this customer's order.
export function serveCustomer(game, customerId) {
  if (game.screen !== 'play' || game.paused) return 'none';
  const customer = game.customers.find((c) => c.id === customerId);
  if (!customer) return 'none';
  const plateIndex = game.plates.indexOf(customer.recipeId);
  if (plateIndex < 0) {
    if (game.plates.length > 0) {
      // Wrong dish on the counter: the customer shakes their head.
      customer.mood = 'angry';
      customer.moodTimer = 1.2;
      customer.patience = Math.max(1, customer.patience - 6);
      game.combo = 0;
      setFlash(game, 'wrong');
      setMessage(game, 'Salah pesanan!');
      return 'wrong';
    }
    setMessage(game, 'Belum ada piring siap!');
    return 'none';
  }
  const recipe = RECIPE_BY_ID[customer.recipeId];
  game.plates.splice(plateIndex, 1);
  game.customers = game.customers.filter((c) => c.id !== customerId);
  game.served += 1;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const hurry = customer.patience / customer.maxPatience;
  const tip = hurry > 0.5 ? 5 : 0;
  const points = Math.round((recipe.score + hurry * 50) * (1 + 0.1 * (game.combo - 1)));
  game.score += points;
  game.coins += recipe.price + tip;
  setFlash(game, 'serve');
  setMessage(game, `+${points} ${recipe.name}!${tip ? ' Tip +5' : ''}${game.combo > 1 ? ` Combo x${game.combo}` : ''}`);
  return 'served';
}

// Space: serve the oldest ready plate to the customer who ordered it.
export function serveFirstReady(game) {
  for (const plate of game.plates) {
    const customer = game.customers.find((c) => c.recipeId === plate);
    if (customer) return serveCustomer(game, customer.id);
  }
  return 'none';
}

function loseCustomer(game, customer) {
  game.customers = game.customers.filter((c) => c.id !== customer.id);
  game.lost += 1;
  game.lives -= 1;
  game.combo = 0;
  setFlash(game, 'wrong');
  setMessage(game, 'Pelanggan pergi marah-marah!');
  if (game.lives <= 0) endShift(game, 'Semua pelanggan kabur — warung tutup lebih awal.');
}

export function endShift(game, reason) {
  game.screen = 'over';
  game.overReason = reason;
  game.cooking = null;
}

// One simulation step. Returns nothing; callers read the changed state.
export function updateGame(game, dt) {
  if (game.screen !== 'play' || game.paused) return;
  game.time += dt;
  game.timeLeft = Math.max(0, SHIFT_SECONDS - game.time);
  if (game.messageTimer > 0) game.messageTimer -= dt;
  if (game.flashTimer > 0) game.flashTimer -= dt;

  // Customers walk in on a quickening schedule.
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    spawnCustomer(game);
    game.spawnIn = spawnInterval(game);
  }

  // Patience drains; an empty bar costs a life.
  for (const customer of [...game.customers]) {
    customer.patience -= dt;
    if (customer.moodTimer > 0) {
      customer.moodTimer -= dt;
      if (customer.moodTimer <= 0) customer.mood = 'waiting';
    }
    if (customer.patience <= 0) loseCustomer(game, customer);
    if (game.screen !== 'play') return;
  }

  // Cooking advances; a finished dish burns if it sits too long.
  if (game.cooking) {
    const recipe = RECIPE_BY_ID[game.cooking.recipeId];
    if (game.cooking.progress < 1) {
      game.cooking.progress = Math.min(1, game.cooking.progress + dt / recipe.cookSeconds);
    } else {
      game.cooking.burn += dt;
      if (game.cooking.burn >= BURN_SECONDS) {
        game.wok = [];
        game.cooking = null;
        setFlash(game, 'burn');
        setMessage(game, 'Gosong! Buang dan masak lagi.');
      }
    }
  }

  // The shift ends when the clock runs out.
  if (game.timeLeft <= 0) {
    endShift(game, `Shift selesai! ${game.served} porsi tersaji.`);
  }
}

// Helpers the renderer and input use to describe the wok at a glance.
export function wokStatus(game) {
  if (game.cooking) {
    if (game.cooking.progress >= 1) return game.cooking.burn > 0 ? 'siap — angkat!' : 'matang!';
    return 'memasak...';
  }
  if (game.wok.length === 0 && !game.board) return 'wok kosong';
  if (!wokCanStillMatch(game.wok)) return 'campuran salah — buang!';
  const recipe = recipeForIngredients(game.wok);
  if (recipe) return recipe.name;
  return `${game.wok.length} bahan di wok`;
}

export { INGREDIENTS, RECIPES };
