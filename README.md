# Midnight Gallery

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/kazuki-fortune88/makefun-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/kazuki-fortune88/makefun-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game set in a museum at midnight. Lift all six dossiers from each of three galleries, slip past the wardens' lamplight, and reach the green exit unseen.

Built for the [make.fun](https://make.fun/r/4fxhr3y1) best stealth game bounty.

## Play

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

- **WASD / arrows** — move
- **Shift** — sprint (fast, but loud)
- **C** — sneak (slow, silent)
- **Click** — throw a coin; the clink turns a warden's head
- **M** — mute · **R** — restart the gallery

## The game

- **3 galleries**, 6 dossiers each, then the exit opens. A brass key opens the locked doors.
- **Warden AI** with raycast vision cones: suspicion rises → suspect `?` → chase `!` → search → back to patrol. Break line of sight to cool down.
- **Shadows hide you** — standing in the dark halves how fast a warden notices you. Sprinting is loud and draws wardens to your footsteps.
- **Ghost bonus** — clear a gallery without ever being chased for +500.
- **HUD** — dossiers, alert meter, score, coins; title / gallery-clear / caught / win screens.
- **Look** — marble floors, gilt paintings, statues, glass vitrines, a red carpet runner, lamplight pools and night vignette; WebAudio footsteps, coin clinks and alarm stings. No network, no assets — canvas and code only.

## Files

- `main.ts` — entrypoint: copies `game/` + `screenshots/` to the output dir and writes `dossier.json`
- `game/index.html`, `game/style.css`, `game/src/*.js` — the game (config, seeded RNG, levels, world/collision, input, audio, player, warden AI, renderer, screenshot staging, game loop)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `shots.json` — the four staged screenshot queries
