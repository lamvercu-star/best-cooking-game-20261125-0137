// Warung Rush — input.js
// Mouse clicks and keyboard shortcuts, translated into game actions.
// Hit-testing uses the same layout rectangles the renderer draws, so a
// click always lands where the picture says it should.

import {
  LAYOUT, INGREDIENTS, binRect, customerHitRect, plateSlotRect,
} from './config.js';
import {
  addIngredient, chopBoard, takeFromWok, dumpWok, serveCustomer,
  serveFirstReady, customerBySeat, startShift,
} from './state.js';

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function pointInCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Canvas pixels from a mouse event, accounting for CSS scaling.
export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

// One click. Returns a short tag describing what happened, for sounds.
export function handleClick(game, canvas, event, sounds) {
  const { x, y } = canvasPoint(canvas, event);
  if (game.screen === 'title') {
    return startFromTitle(game, sounds);
  }
  if (game.screen === 'over') {
    return startFromTitle(game, sounds);
  }
  if (game.screen !== 'play') return 'none';
  if (game.paused) return 'none';

  // Customers first: clicking one serves them if their dish is ready.
  for (let seat = 0; seat < 4; seat += 1) {
    const customer = customerBySeat(game, seat);
    if (customer && pointInRect(x, y, customerHitRect(seat))) {
      return serveCustomer(game, customer.id);
    }
  }

  // The wok: click to lift a finished dish onto a plate.
  if (pointInCircle(x, y, LAYOUT.wok.x, LAYOUT.wok.y, LAYOUT.wok.r + 8)) {
    if (takeFromWok(game)) return 'plate';
    return 'none';
  }

  // The chopping board: each click is one chop.
  if (pointInRect(x, y, LAYOUT.board)) {
    if (chopBoard(game)) return 'chop';
    return 'none';
  }

  // The trash dumps the wok and the board.
  if (pointInRect(x, y, LAYOUT.trash)) {
    if (dumpWok(game)) return 'dump';
    return 'none';
  }

  // The serving counter: clicking a plate does nothing yet — plates are
  // served by clicking the matching customer (or pressing Space).
  for (let slot = 0; slot < 3; slot += 1) {
    if (pointInRect(x, y, plateSlotRect(slot))) return 'plate';
  }

  // Ingredient bins along the bottom.
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (pointInRect(x, y, binRect(i))) {
      if (addIngredient(game, INGREDIENTS[i].id)) return 'add';
      return 'none';
    }
  }
  return 'none';
}

function startFromTitle(game, sounds) {
  const fresh = startShift(game);
  Object.assign(game, fresh);
  if (sounds) sounds.jingle();
  return 'start';
}

// Keyboard: 1-0 ingredients, Space serve, R restart, P pause, M mute.
export function handleKey(game, event, sounds) {
  const key = event.key.toLowerCase();
  if (game.screen === 'title' || game.screen === 'over') {
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      return startFromTitle(game, sounds);
    }
    return 'none';
  }
  if (key === 'p') {
    game.paused = !game.paused;
    return 'pause';
  }
  if (key === 'r') {
    return startFromTitle(game, sounds);
  }
  if (game.paused) return 'none';
  if (key === ' ') {
    event.preventDefault();
    return serveFirstReady(game);
  }
  if (key === 'm') {
    if (sounds) sounds.toggleMute();
    return 'mute';
  }
  if (key === 'x' || key === 'backspace') {
    if (dumpWok(game)) return 'dump';
    return 'none';
  }
  const ingredient = INGREDIENTS.find((ing) => ing.key === key);
  if (ingredient) {
    if (addIngredient(game, ingredient.id)) return 'add';
    return 'none';
  }
  return 'none';
}

// Wire both listeners onto the canvas; returns a detach function.
export function attachInput(game, canvas, sounds, onAction) {
  const onClick = (event) => {
    if (sounds) sounds.prime();
    const result = handleClick(game, canvas, event, sounds);
    if (onAction) onAction(result);
  };
  const onKey = (event) => {
    const result = handleKey(game, event, sounds);
    if (onAction) onAction(result);
  };
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return () => {
    canvas.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
  };
}
