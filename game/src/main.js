// Warung Rush — main.js
// Boot, game loop and wiring: input, state, render, audio and the staged
// screenshot scenes all meet here. Reads ?shot= from the URL to stage a
// deterministic scene instead of starting at the title screen.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createGame, updateGame } from './state.js';
import { renderGame } from './render.js';
import { attachInput } from './input.js';
import { SoundEngine } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Warung Rush: canvas #game tidak ditemukan');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Warung Rush: 2D context tidak tersedia');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const sounds = new SoundEngine();
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;

let game;
if (shotName) {
  // Screenshot mode: stage the scene and render one exact frame.
  game = stageShot(shotName, seed);
  renderGame(ctx, game);
} else {
  game = createGame(seed);
  attachInput(game, canvas, sounds, onPlayerAction);

  // Hiding the tab pauses the shift, so the clock never runs while the
  // player cannot see it.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.screen === 'play' && !game.paused) {
      game.paused = true;
      sounds.stopAll();
    }
  });

  let lastTime = performance.now();
  let sizzleOn = false;

  function frame(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    updateGame(game, dt);
    // Sizzle only while something is actually frying.
    const cooking = Boolean(game.cooking);
    if (cooking && !sizzleOn) {
      sounds.sizzleStart();
      sizzleOn = true;
    } else if (!cooking && sizzleOn) {
      sounds.sizzleStop();
      sizzleOn = false;
    }
    renderGame(ctx, game);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// One sound per player action, matched to what just happened.
function onPlayerAction(result) {
  switch (result) {
    case 'add':
    case 'plate':
      sounds.click();
      break;
    case 'chop':
      sounds.chop();
      break;
    case 'served':
      sounds.ding();
      break;
    case 'wrong':
      sounds.buzz();
      break;
    case 'start':
      break;
    default:
      break;
  }
  if (game.flash === 'burn') sounds.burn();
}
