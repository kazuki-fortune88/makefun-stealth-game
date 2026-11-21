// Midnight Gallery — the entrypoint: hand the game in.
//
// What it does, in order:
//   1. Wipes the output directory and recreates it, so a stale file from an
//      earlier run can never leak into the entry.
//   2. Copies game/ and screenshots/ from this repository into it.
//   3. Writes /output/dossier.json with buildDossier from the kit's
//      vendor/makefun-game.ts, so the dossier is byte for byte the one the
//      gate rebuilds from the same files.
//
// Run it locally with MAKEFUN_OUTPUT_DIR set to a scratch directory:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice: both runs must write the same bytes. The program uses only
// the Node standard library and the kit's vendored dossier library.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-game.ts";

// Gate caps for this bounty (competition.yaml): the dossier text cap, the
// screenshot caps, and the game tree caps buildDossier is held to.
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 48 * 1024 * 1024;
const GAME_PATH_MAX_BYTES = 1000;
const TEXT_MAX_BYTES = 163840;
const SCREENSHOT_MAX = 4;
const SCREENSHOT_MAX_BYTES = 256 * 1024;
// The grader's output directory when MAKEFUN_OUTPUT_DIR is not set.
const DEFAULT_OUTPUT_DIR = "/output";

function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.length > 0) return resolve(fromEnv);
  return DEFAULT_OUTPUT_DIR;
}

function main(): void {
  const root = resolve(import.meta.dirname);
  const out = outputDir();
  const gameDir = join(root, "game");
  const shotsDir = join(root, "screenshots");
  if (!existsSync(gameDir)) throw new Error("main.ts: game/ is missing from the repository");
  if (!existsSync(shotsDir)) throw new Error("main.ts: screenshots/ is missing from the repository");
  // Guard: never let the output directory be the repository itself.
  if (out === root) throw new Error("main.ts: refusing to write the dossier into the repository root");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(gameDir, join(out, "game"), { recursive: true });
  cpSync(shotsDir, join(out, "screenshots"), { recursive: true });
  const dossier = buildDossier(out, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: GAME_PATH_MAX_BYTES,
  });
  writeFileSync(join(out, "dossier.json"), dossier);
}

main();
