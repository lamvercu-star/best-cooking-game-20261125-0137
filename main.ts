// Warung Rush — main.ts
// The hand-in program: copies game/ and screenshots/ from this repository
// into the output directory and writes dossier.json with buildDossier from
// vendor/makefun-game.ts. Node 22, standard library only, no network.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDir = resolve(
  process.env.MAKEFUN_OUTPUT_DIR || '/output',
);

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(name: string): void {
  const source = join(repoRoot, name);
  const target = join(outputDir, name);
  if (!existsSync(source)) return;
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree('game');
copyTree('screenshots');

if (!existsSync(join(outputDir, 'game', 'index.html'))) {
  throw new Error('Warung Rush: game/index.html tidak ditemukan di output');
}

const dossier = buildDossier(outputDir, caps);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
