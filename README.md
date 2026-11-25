# Warung Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/lamvercu-star/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/lamvercu-star/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Rush** is a fast-paced Indonesian street-food stall game. You run the busiest warung in town for one 150-second shift: customers arrive with orders and a draining patience bar, and you have to chop, cook, plate, and serve each dish before their patience runs out. Lose 3 customers and the warung closes early.

## The menu

| Dish | Ingredients | Cook time | Score | Coins |
| --- | --- | --- | --- | --- |
| Nasi Goreng | Nasi + Telur + Cabai | 4 s in the wok | 100 | 25 |
| Mie Goreng | Mie + Telur + Sayur | 4 s in the wok | 100 | 25 |
| Sate Ayam | Sate + Kacang | 5 s in the wok | 120 | 30 |
| Es Teh Manis | Teh + Es Batu + Gula | none — plates instantly | 60 | 15 |

Cabai and Sayur must be chopped on the talenan (3 clicks) before they can join the wok. A finished dish burns if you leave it in the wok more than 3.5 seconds past done — dump it in the trash and start over. Serving the wrong dish makes the customer angry and costs patience. Serve fast for a tip (+5 coins) and build a combo multiplier for extra points. As the shift goes on, customers arrive faster and their patience shrinks.

## How to play

- **Click an ingredient bin** (or press keys **1–0**) to add it to the wok. Cabai and Sayur land on the chopping board first — click the board 3 times to chop.
- When the wok holds a complete recipe, cooking starts automatically. **Click the wok** once the ring turns green to lift the dish onto a plate.
- **Click a customer** to serve the matching plate from the serving counter, or press **Space** to serve the first ready plate to the customer who ordered it.
- **P** pauses, **R** restarts, **M** mutes the sound.

## Run it

The game is plain static files under `game/` — no build step, no network requests. Serve the folder with any static HTTP server and open `game/index.html` in desktop Chrome:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

`main.ts` at the repo root hands the entry in: it copies `game/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `/output/dossier.json` via `buildDossier` from `vendor/makefun-game.ts`.

## How this game was made

Warung Rush is built from scratch in plain 2D canvas — no game engine, no libraries, no external assets. Every pixel of the kitchen is drawn in code (`game/src/render.js`): the awning, the order board, the customers with their order bubbles, the wok with its flame and steam, the chopping board, the serving counter, and each dish. The sounds are WebAudio synth tones (`game/src/audio.js`), not audio files, so the game loads nothing over the network.

The source is split into files with one clear job each: `config.js` holds every tunable number, recipe, ingredient, and screen rectangle; `state.js` holds the whole game state and every rule that changes it (spawning, patience, cooking, burning, serving, combos); `input.js` handles mouse and keyboard; `render.js` draws; `audio.js` synthesises sound; `shots.js` stages the deterministic screenshot scenes (`?shot=start|play|rush|serve&seed=1`); `main.js` boots the loop.

Randomness is a seeded generator (`mulberry32`, seed 20261125 in `config.js`) — the same seed always deals the same shift, so the screenshot scenes are reproducible and the game never uses `Math.random` for gameplay. The four screenshots in `screenshots/` are real renders of the game's own code in a browser: the title screen, a dish mid-assembly, the late-shift rush, and a finished plate ready to serve.

Built by an AI agent for [make.fun](https://make.fun).
