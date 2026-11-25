// Warung Rush — render.js
// Every pixel of the warung is drawn in code: the kitchen, the order
// board, the customers, the wok, the plates and the food itself. No images.

import {
  CANVAS_W, CANVAS_H, COLORS, LAYOUT, INGREDIENTS, INGREDIENT_BY_ID,
  RECIPES, RECIPE_BY_ID, binRect, customerHitRect, plateSlotRect,
} from './config.js';
import { wokStatus } from './state.js';

const SKIN_TONES = ['#f2c89b', '#e0a878', '#c98d5f', '#8d5a3b'];
const SHIRT_COLORS = ['#e63946', '#2a9d8f', '#4361ee', '#f4a259', '#8338ec', '#06d6a0'];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ food art
// Each dish is a little pile of coloured shapes, drawn the same way in the
// order bubble, on the plate and in the wok, so the player learns the look.

export function drawDishIcon(ctx, recipeId, cx, cy, scale) {
  const s = scale || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  if (recipeId === 'nasi') {
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath(); ctx.ellipse(0, 2, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.ellipse(-6, -3, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(10, -4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#70c94e';
    ctx.fillRect(-14, 6, 12, 3);
    ctx.fillRect(4, 8, 12, 3);
  } else if (recipeId === 'mie') {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-16, -4 + i * 6);
      ctx.quadraticCurveTo(0, -10 + i * 6, 16, -4 + i * 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(-8, -8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#70c94e';
    ctx.fillRect(6, -12, 10, 4);
  } else if (recipeId === 'sate') {
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(18, -8); ctx.stroke();
    ctx.fillStyle = '#b08954';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-10 + i * 10, 4 - i * 5, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d9a066';
    ctx.beginPath(); ctx.ellipse(2, 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // Es Teh Manis: a tall glass of amber tea with ice and a straw.
    ctx.fillStyle = '#f4e3c2';
    ctx.fillRect(-9, -14, 18, 28);
    ctx.fillStyle = '#c68a3c';
    ctx.fillRect(-7, -6, 14, 18);
    ctx.fillStyle = '#bde8ff';
    ctx.fillRect(-5, -10, 6, 6);
    ctx.fillRect(1, -4, 6, 6);
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(10, -24); ctx.stroke();
  }
  ctx.restore();
}

export function drawIngredientIcon(ctx, ingredientId, cx, cy, scale) {
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return;
  const s = scale || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = ing.dark;
  ctx.lineWidth = 2;
  if (ingredientId === 'rice') {
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(-5, -2, 1.6, 0, Math.PI * 2); ctx.arc(4, 2, 1.6, 0, Math.PI * 2); ctx.fill();
  } else if (ingredientId === 'noodles') {
    ctx.strokeStyle = ing.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(-13, -5 + i * 5);
      ctx.quadraticCurveTo(0, -11 + i * 5, 13, -5 + i * 5); ctx.stroke();
    }
  } else if (ingredientId === 'egg') {
    ctx.beginPath(); ctx.ellipse(0, 1, 11, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4a259';
    ctx.beginPath(); ctx.arc(0, 1, 4, 0, Math.PI * 2); ctx.fill();
  } else if (ingredientId === 'chili') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.moveTo(-12, 6); ctx.quadraticCurveTo(0, -12, 13, 5);
    ctx.quadraticCurveTo(0, 12, -12, 6); ctx.fill();
    ctx.strokeStyle = '#2d6a1e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(11, 5); ctx.quadraticCurveTo(16, 0, 15, -6); ctx.stroke();
  } else if (ingredientId === 'veg') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(-6, -3, 9, 6, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, 4, 9, 6, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(0, 0); ctx.moveTo(0, 0); ctx.lineTo(12, 6); ctx.stroke();
  } else if (ingredientId === 'skewer') {
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(14, -8); ctx.stroke();
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.arc(-8 + i * 8, 4 - i * 4, 5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (ingredientId === 'peanut') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(-4, -2, 7, 9, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, 3, 7, 9, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(6, 3); ctx.stroke();
  } else if (ingredientId === 'tea') {
    ctx.fillStyle = '#f4e3c2';
    ctx.fillRect(-8, -12, 16, 24);
    ctx.fillStyle = ing.color;
    ctx.fillRect(-6, -4, 12, 14);
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
    ctx.strokeRect(-8, -12, 16, 24);
  } else if (ingredientId === 'ice') {
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 1.5;
    ctx.save(); ctx.rotate(0.4); ctx.fillRect(-8, -8, 16, 16); ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
  } else {
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 1.5;
    for (const [dx, dy] of [[-6, -4], [5, -5], [-1, 4], [7, 5]]) {
      ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------- kitchen
function drawKitchenShell(ctx, game) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, 300);
  ctx.fillStyle = COLORS.wallStripe;
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 46, 32, 206);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 300, CANVAS_W, CANVAS_H - 300);
  // A striped awning over the stall, for the street-food look.
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#e63946' : '#fff3d6';
    ctx.fillRect(i * 80, 0, 80, 12);
  }
  text(ctx, 'WARUNG RUSH', 16, 30, 22, COLORS.hudText, 'left', 900);
  // Dark tagline with a soft light halo: the old cream-on-cream text was
  // nearly unreadable against the wall stripes.
  ctx.save();
  ctx.shadowColor = 'rgba(255, 243, 214, 0.9)';
  ctx.shadowBlur = 6;
  text(ctx, 'Masak cepat, sajikan hangat!', 210, 31, 13, '#5b3a1e', 'left', 700);
  ctx.restore();
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, 46);
  drawKitchenShell(ctx, game);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, 46);
  text(ctx, 'WARUNG RUSH', 16, 24, 22, COLORS.hudText, 'left', 900);
  const timerColor = game.timeLeft <= 30 ? '#ff6b6b' : COLORS.hudText;
  text(ctx, `⏱ ${formatTime(game.timeLeft)}`, 480, 24, 22, timerColor, 'center', 900);
  text(ctx, `Skor ${game.score}`, 620, 24, 18, COLORS.hudText, 'left');
  text(ctx, `🪙 ${game.coins}`, 740, 24, 18, '#ffd94d', 'left');
  text(ctx, `Combo x${game.combo}`, 820, 24, 16, game.combo > 1 ? '#7CFC98' : COLORS.hudText, 'left');
  // Lives as hearts along the right edge.
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < game.lives ? '❤' : '🤍', 890 + i * 22, 24, 17, '#ff6b6b', 'left');
  }
}

function drawOrderBoard(ctx, game) {
  const board = LAYOUT.orderBoard;
  ctx.fillStyle = '#5b3a1e';
  roundRect(ctx, board.x - 4, board.y - 4, board.w + 8, board.h + 8, 10);
  ctx.fill();
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(board.x, board.y, board.w, board.h);
  text(ctx, 'PESANAN', board.x + 10, board.y + 16, 12, '#ffd9a0', 'left', 900);
  if (game.customers.length === 0) {
    text(ctx, 'Belum ada pesanan — pelanggan segera datang...', board.x + 110, board.y + 32, 15, '#ffe8c2', 'left', 400);
    return;
  }
  game.customers.forEach((customer, i) => {
    const recipe = RECIPE_BY_ID[customer.recipeId];
    const x = board.x + 110 + i * 200;
    const frac = Math.max(0, customer.patience / customer.maxPatience);
    ctx.fillStyle = '#6b4423';
    roundRect(ctx, x, board.y + 8, 186, 46, 8);
    ctx.fill();
    drawDishIcon(ctx, recipe.id, x + 26, board.y + 31, 0.9);
    text(ctx, recipe.name, x + 50, board.y + 20, 13, '#fff3d6', 'left');
    ctx.fillStyle = '#2b1c10';
    ctx.fillRect(x + 50, board.y + 34, 124, 8);
    ctx.fillStyle = frac > 0.5 ? '#7CFC98' : frac > 0.25 ? '#ffd94d' : '#ff6b6b';
    ctx.fillRect(x + 50, board.y + 34, 124 * frac, 8);
  });
}

function drawCustomer(ctx, game, customer) {
  const cx = LAYOUT.customerRow.seatXs[customer.seat];
  const cy = 196;
  const skin = SKIN_TONES[customer.id % SKIN_TONES.length];
  const shirt = SHIRT_COLORS[customer.id % SHIRT_COLORS.length];
  const bob = customer.mood === 'angry' ? Math.sin(game.time * 20) * 3 : Math.sin(game.time * 2 + customer.seat) * 2;
  // Stool and body.
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(cx - 26, cy + 42, 52, 8);
  ctx.fillStyle = shirt;
  roundRect(ctx, cx - 30, cy + 2 + bob, 60, 46, 14);
  ctx.fill();
  // Head.
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(cx, cy - 18 + bob, 22, 0, Math.PI * 2); ctx.fill();
  // Hair or cap.
  ctx.fillStyle = customer.seat % 2 === 0 ? '#2b2b2b' : '#e63946';
  ctx.beginPath(); ctx.arc(cx, cy - 24 + bob, 22, Math.PI, 0); ctx.fill();
  if (customer.seat % 2 === 1) ctx.fillRect(cx - 22, cy - 26 + bob, 44, 6);
  // Eyes: angry customers get a frown.
  ctx.fillStyle = '#1d1d1d';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 18 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy - 18 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1d1d1d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (customer.mood === 'angry') {
    ctx.moveTo(cx - 8, cy - 4 + bob); ctx.quadraticCurveTo(cx, cy - 10 + bob, cx + 8, cy - 4 + bob);
  } else {
    ctx.moveTo(cx - 8, cy - 8 + bob); ctx.quadraticCurveTo(cx, cy - 2 + bob, cx + 8, cy - 8 + bob);
  }
  ctx.stroke();
  // Order bubble with the dish picture and its name. Clamped inside the
  // canvas: the 4th seat's bubble used to run off the right edge.
  const recipe = RECIPE_BY_ID[customer.recipeId];
  const bx = Math.min(cx + 34, CANVAS_W - 118 - 6);
  const by = cy - 66 + bob;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, bx, by, 118, 44, 10);
  ctx.fill();
  ctx.strokeStyle = '#d9c48f';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, 118, 44, 10);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx - 4, by + 34); ctx.lineTo(bx - 16, by + 44); ctx.lineTo(bx + 2, by + 44); ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  drawDishIcon(ctx, recipe.id, bx + 24, by + 22, 0.85);
  text(ctx, recipe.name, bx + 46, by + 15, 11, '#3d2b1f', 'left');
  const frac = Math.max(0, customer.patience / customer.maxPatience);
  ctx.fillStyle = '#e5d5b8';
  ctx.fillRect(bx + 46, by + 30, 62, 6);
  ctx.fillStyle = frac > 0.5 ? '#2a9d8f' : frac > 0.25 ? '#e9a13b' : '#e63946';
  ctx.fillRect(bx + 46, by + 30, 62 * frac, 6);
}

function drawCounterAndStations(ctx, game) {
  // The long serving counter customers sit behind.
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(LAYOUT.counter.x, LAYOUT.counter.y, LAYOUT.counter.w, LAYOUT.counter.h);
  ctx.fillStyle = COLORS.counterWood;
  ctx.fillRect(LAYOUT.counter.x, LAYOUT.counter.y + 10, LAYOUT.counter.w, 34);
  text(ctx, 'MEJA SAJI', LAYOUT.serveCounter.x + 4, LAYOUT.serveCounter.y - 12, 12, '#fff3d6', 'left', 900);
  text(ctx, 'TALENAN', LAYOUT.board.x + LAYOUT.board.w / 2, LAYOUT.board.y - 12, 13, '#fff3d6', 'center', 900);
  text(ctx, 'BUANG', LAYOUT.trash.x + LAYOUT.trash.w / 2, LAYOUT.trash.y - 12, 13, '#fff3d6', 'center', 900);
  drawWok(ctx, game);
  // WOK label last, in dark brown: it used to sit under the wok's steam
  // and vanish against the cream wall.
  text(ctx, 'WOK', LAYOUT.wok.x, LAYOUT.wok.y - LAYOUT.wok.r - 22, 13, '#5b3a1e', 'center', 900);
  drawChoppingBoard(ctx, game);
  drawServeCounter(ctx, game);
  drawTrash(ctx, game);
}

function drawWok(ctx, game) {
  const { x, y, r } = LAYOUT.wok;
  // Flame glow while cooking.
  if (game.cooking) {
    const flicker = 6 + Math.sin(game.time * 14) * 4;
    ctx.fillStyle = 'rgba(255, 140, 40, 0.85)';
    ctx.beginPath(); ctx.ellipse(x, y + r + 8, r - 8 + flicker, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.ellipse(x, y + r + 6, r - 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  }
  // The wok itself.
  ctx.fillStyle = COLORS.wokIron;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = game.cooking && game.cooking.progress >= 1 && game.cooking.burn > 1.5
    ? '#111111' : COLORS.wokInner;
  ctx.beginPath(); ctx.arc(x, y, r - 8, 0, Math.PI * 2); ctx.fill();
  // Ingredients bubbling inside.
  game.wok.forEach((ingredientId, i) => {
    const angle = (i / Math.max(1, game.wok.length)) * Math.PI * 2 + game.time * 0.4;
    const ix = x + Math.cos(angle) * 22;
    const iy = y + Math.sin(angle) * 14;
    drawIngredientIcon(ctx, ingredientId, ix, iy, 0.8);
  });
  // Steam while cooking.
  if (game.cooking) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const sx = x - 24 + i * 24;
      const sway = Math.sin(game.time * 3 + i * 2) * 5;
      const rise = (game.time * 30 + i * 18) % 40;
      ctx.beginPath();
      ctx.moveTo(sx + sway, y - r - 4 - rise * 0.4);
      ctx.quadraticCurveTo(sx - sway, y - r - 18 - rise * 0.4, sx + sway, y - r - 30 - rise * 0.4);
      ctx.stroke();
    }
  }
  // Cook progress ring around the wok.
  if (game.cooking) {
    const p = game.cooking.progress;
    ctx.strokeStyle = '#e5d5b8';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(x, y, r + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = p >= 1 ? '#7CFC98' : '#ffd94d';
    ctx.beginPath(); ctx.arc(x, y, r + 8, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    if (p >= 1) {
      const burnFrac = Math.min(1, game.cooking.burn / 3.5);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(x - 30, y + r + 20, 60 * burnFrac, 6);
      text(ctx, 'ANGKAT!', x, y + r + 40, 13, '#ff6b6b', 'center', 900);
    }
  }
  text(ctx, wokStatus(game), x, y + r + 52, 12, '#fff3d6', 'center', 400);
}

function drawChoppingBoard(ctx, game) {
  const b = LAYOUT.board;
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#a67c52';
  ctx.lineWidth = 2;
  roundRect(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.stroke();
  if (game.board) {
    const ing = INGREDIENT_BY_ID[game.board.ingredientId];
    drawIngredientIcon(ctx, game.board.ingredientId, b.x + b.w / 2, b.y + 34, 1.4);
    text(ctx, `Cincang ${ing.name}!`, b.x + b.w / 2, b.y + 68, 13, '#5b3a1e', 'center', 900);
    // Chop progress pips.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < game.board.chops ? '#2a9d8f' : '#d9c48f';
      ctx.beginPath(); ctx.arc(b.x + b.w / 2 - 22 + i * 22, b.y + 82, 6, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    text(ctx, '🔪  Klik Cabai / Sayur', b.x + b.w / 2, b.y + 34, 13, '#8a6a42', 'center');
    text(ctx, 'untuk dicincang di sini', b.x + b.w / 2, b.y + 56, 12, '#8a6a42', 'center', 400);
  }
}

function drawServeCounter(ctx, game) {
  const sc = LAYOUT.serveCounter;
  ctx.fillStyle = '#f4e3c2';
  roundRect(ctx, sc.x, sc.y, sc.w, sc.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#a67c52';
  ctx.lineWidth = 2;
  roundRect(ctx, sc.x, sc.y, sc.w, sc.h, 10);
  ctx.stroke();
  for (let slot = 0; slot < 3; slot += 1) {
    const r = plateSlotRect(slot);
    const recipeId = game.plates[slot];
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2 + 6, 36, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c48f';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2 + 6, 36, 26, 0, 0, Math.PI * 2); ctx.stroke();
    if (recipeId) {
      drawDishIcon(ctx, recipeId, r.x + r.w / 2, r.y + r.h / 2, 1);
      text(ctx, 'SIAP!', r.x + r.w / 2, r.y + r.h - 6, 11, '#2a9d8f', 'center', 900);
    } else {
      text(ctx, '—', r.x + r.w / 2, r.y + r.h / 2, 16, '#cbb98f', 'center', 400);
    }
  }
}

function drawTrash(ctx, game) {
  const t = LAYOUT.trash;
  ctx.fillStyle = '#5b5b5b';
  roundRect(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  text(ctx, '🗑', t.x + t.w / 2, t.y + 30, 26, '#ffffff', 'center');
  text(ctx, 'Klik untuk', t.x + t.w / 2, t.y + 62, 11, '#ffffff', 'center', 400);
  text(ctx, 'membuang', t.x + t.w / 2, t.y + 76, 11, '#ffffff', 'center', 400);
}

function drawIngredientBins(ctx, game) {
  text(ctx, 'BAHAN — klik atau tekan 1-0', LAYOUT.bins.x + 4, LAYOUT.bins.y - 12, 13, '#fff3d6', 'left', 900);
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const disabled = Boolean(game.cooking) || Boolean(game.board);
    ctx.fillStyle = disabled ? '#8a6a42' : '#fff3d6';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#a67c52';
    ctx.lineWidth = 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    // Icon lifted and shrunk, name given its own row, key hint moved to
    // the top-right corner: the icon used to sit over the name, and the
    // name painted over the key hint so [1]-[0] never showed.
    drawIngredientIcon(ctx, ing.id, r.x + r.w / 2, r.y + 16, 0.85);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 40, 13, '#3d2b1f', 'center', 900);
    text(ctx, `[${ing.key}]${ing.chop ? ' 🔪' : ''}`, r.x + r.w - 8, r.y + 10, 11, disabled ? '#ffe8c2' : '#8a6a42', 'right', 400);
  });
}

function drawHelpLine(ctx, game) {
  const h = LAYOUT.help;
  text(ctx, 'Klik bahan → cincang bila perlu → masak di wok → angkat ke piring → klik pelanggan  •  Spasi: sajikan  •  P: jeda  •  R: mulai ulang  •  M: bisu', h.x, h.y + 6, 12, '#ffe8c2', 'left', 400);
}

function drawMessage(ctx, game) {
  if (game.messageTimer <= 0 || !game.message) return;
  const alpha = Math.min(1, game.messageTimer);
  ctx.save();
  ctx.globalAlpha = alpha;
  text(ctx, game.message, CANVAS_W / 2, 440, 22, '#fff3d6', 'center', 900);
  ctx.restore();
}

// ------------------------------------------------------------------- screens
function drawTitleScreen(ctx, game) {
  drawKitchenShell(ctx, game);
  ctx.fillStyle = 'rgba(43, 20, 5, 0.55)';
  ctx.fillRect(0, 46, CANVAS_W, CANVAS_H - 46);
  text(ctx, 'WARUNG RUSH', CANVAS_W / 2, 150, 64, '#ffd94d', 'center', 900);
  text(ctx, 'Warung kaki lima paling sibuk di kota!', CANVAS_W / 2, 196, 20, '#fff3d6', 'center', 400);
  text(ctx, 'Pelanggan datang lapar. Masak pesanan mereka sebelum sabarnya habis!', CANVAS_W / 2, 224, 16, '#ffe8c2', 'center', 400);
  // Recipe cards so the player learns the menu before starting.
  RECIPES.forEach((recipe, i) => {
    const x = 120 + i * 190;
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, x, 260, 170, 120, 12);
    ctx.fill();
    drawDishIcon(ctx, recipe.id, x + 85, 300, 1.2);
    text(ctx, recipe.name, x + 85, 336, 15, '#3d2b1f', 'center', 900);
    const names = recipe.ingredients.map((id) => INGREDIENT_BY_ID[id].name).join(' + ');
    text(ctx, names, x + 85, 358, 11, '#6b4423', 'center', 400);
    text(ctx, `🪙 ${recipe.price}`, x + 85, 372, 12, '#b08954', 'center', 900);
  });
  text(ctx, '▶  KLIK atau tekan ENTER untuk buka warung', CANVAS_W / 2, 430, 20, '#7CFC98', 'center', 900);
  text(ctx, 'Klik bahan (atau 1-0) → cincang di talenan → masak di wok → klik pelanggan untuk menyajikan', CANVAS_W / 2, 462, 14, '#ffe8c2', 'center', 400);
  text(ctx, '3 pelanggan marah = warung tutup  •  Shift 2:30 menit  •  Spasi sajikan  •  P jeda  •  R ulang', CANVAS_W / 2, 486, 13, '#ffd9a0', 'center', 400);
}

function drawGameOverScreen(ctx, game) {
  ctx.fillStyle = 'rgba(43, 20, 5, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SHIFT SELESAI', CANVAS_W / 2, 130, 52, '#ffd94d', 'center', 900);
  text(ctx, game.overReason, CANVAS_W / 2, 178, 18, '#fff3d6', 'center', 400);
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, 300, 210, 360, 190, 14);
  ctx.fill();
  text(ctx, `Skor akhir: ${game.score}`, CANVAS_W / 2, 246, 24, '#3d2b1f', 'center', 900);
  text(ctx, `🪙 Koin: ${game.coins}`, CANVAS_W / 2, 282, 20, '#b08954', 'center');
  text(ctx, `Porsi tersaji: ${game.served}   •   Pelanggan kabur: ${game.lost}`, CANVAS_W / 2, 316, 16, '#3d2b1f', 'center', 400);
  text(ctx, `Combo terbaik: x${game.bestCombo}`, CANVAS_W / 2, 344, 16, '#3d2b1f', 'center', 400);
  const verdict = game.score >= 800 ? 'Warungmu legendaris! 🏆'
    : game.score >= 400 ? 'Pelanggan puas, warung ramai! 👍'
    : 'Besok masak lebih cepat, ya!';
  text(ctx, verdict, CANVAS_W / 2, 372, 16, '#2a9d8f', 'center', 900);
  text(ctx, 'Tekan R atau KLIK untuk masak lagi', CANVAS_W / 2, 440, 18, '#7CFC98', 'center', 900);
}

function drawPauseOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(43, 20, 5, 0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'JEDA — tekan P untuk lanjut', CANVAS_W / 2, CANVAS_H / 2, 30, '#fff3d6', 'center', 900);
}

// ---------------------------------------------------------------------- main
export function renderGame(ctx, game) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (game.screen === 'title') {
    drawTitleScreen(ctx, game);
    return;
  }
  drawHud(ctx, game);
  drawOrderBoard(ctx, game);
  for (const customer of game.customers) drawCustomer(ctx, game, customer);
  drawCounterAndStations(ctx, game);
  drawIngredientBins(ctx, game);
  drawHelpLine(ctx, game);
  drawMessage(ctx, game);
  if (game.screen === 'over') {
    drawGameOverScreen(ctx, game);
  } else if (game.paused) {
    drawPauseOverlay(ctx, game);
  }
}
