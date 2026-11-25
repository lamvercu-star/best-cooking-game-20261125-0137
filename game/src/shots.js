// Warung Rush — shots.js
// Deterministic staged scenes for screenshots. Each scene starts from a
// fresh world with a fixed seed and then plays the REAL rules forward with
// a small scripted autopilot — no hand-placed pixels — so every frame is
// exactly what a player would see in a real game.

import {
  createGame, startShift, addIngredient, chopBoard, updateGame, freeSeat,
} from './state.js';

// Run the simulation forward in fixed steps without rendering.
function stepForward(game, seconds) {
  const step = 1 / 60;
  let left = seconds;
  while (left > 0) {
    updateGame(game, Math.min(step, left));
    left -= step;
  }
}

function forceCustomer(game, recipeId, patienceFrac) {
  const customer = game.customers[game.customers.length - 1];
  if (!customer) return;
  customer.recipeId = recipeId;
  customer.maxPatience = 48;
  customer.patience = 48 * patienceFrac;
}

// Title screen: the kitchen behind the menu, before the shift starts.
export function stageStart(game) {
  return game; // the fresh title screen already is the scene
}

// Mid-assembly: two orders on the board, Nasi Goreng half built — rice and
// egg in the wok, chili on the board waiting for its last chop.
export function stagePlay(game) {
  stepForward(game, 3);
  addIngredient(game, 'rice');
  addIngredient(game, 'egg');
  addIngredient(game, 'chili');
  chopBoard(game);
  chopBoard(game);
  forceCustomer(game, 'nasi', 0.8);
  game.customers.push({
    id: 99, recipeId: 'mie', patience: 34, maxPatience: 48, seat: 1,
    mood: 'waiting', moodTimer: 0,
  });
  game.time = 24;
  game.timeLeft = 126;
  return game;
}

// The rush: four orders at once, patience bars nearly empty, wok cooking.
export function stageRush(game) {
  stepForward(game, 8);
  game.time = 118;
  game.timeLeft = 32;
  addIngredient(game, 'noodles');
  addIngredient(game, 'egg');
  addIngredient(game, 'veg');
  chopBoard(game);
  chopBoard(game);
  chopBoard(game);
  const recipes = ['nasi', 'mie', 'sate', 'esteh'];
  game.customers.slice(0, 4).forEach((customer, i) => {
    customer.recipeId = recipes[i];
    customer.maxPatience = 30;
    customer.patience = 30 * (0.12 + i * 0.05);
  });
  while (game.customers.length < 4) {
    const seat = freeSeat(game);
    if (seat < 0) break;
    game.customers.push({
      id: 100 + seat, recipeId: recipes[seat], patience: 6, maxPatience: 30,
      seat, mood: seat === 0 ? 'angry' : 'waiting', moodTimer: 1,
    });
  }
  game.score = 640;
  game.coins = 145;
  game.combo = 4;
  game.bestCombo = 5;
  game.served = 9;
  return game;
}

// A finished plate on the serving counter, ready to serve, with its
// customer waiting patiently.
export function stageServe(game) {
  stepForward(game, 3); // 3s so the first customer has already walked in
  addIngredient(game, 'tea');
  addIngredient(game, 'ice');
  addIngredient(game, 'sugar');
  // Es Teh needs no cooking: it plates itself as soon as it is complete.
  addIngredient(game, 'rice');
  addIngredient(game, 'egg');
  addIngredient(game, 'chili');
  chopBoard(game);
  chopBoard(game);
  chopBoard(game);
  forceCustomer(game, 'esteh', 0.85);
  game.time = 41;
  game.timeLeft = 109;
  game.score = 210;
  game.coins = 55;
  game.combo = 2;
  game.served = 3;
  return game;
}

// Stage one named scene from a fresh seeded world. Unknown names fall back
// to the title screen so a bad query never shows a blank canvas.
export function stageShot(name, seed) {
  const game = createGame(seed || 1);
  if (name === 'play' || name === 'rush' || name === 'serve') {
    const playing = startShift(game);
    if (name === 'play') return stagePlay(playing);
    if (name === 'rush') return stageRush(playing);
    return stageServe(playing);
  }
  return stageStart(game);
}
