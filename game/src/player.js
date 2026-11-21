/* Midnight Gallery — the thief: sneak, sprint, noisy steps, coin decoys. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  var C = MG.CONFIG;
  var TILE = C.TILE;

  function createPlayer(start) {
    return {
      x: start.x, y: start.y, radius: 13, facing: 0,
      sneaking: false, sprinting: false, moving: false,
      coins: C.COIN_START, hasKey: false,
      stepTimer: 0, hidden: false, inShadow: false,
    };
  }

  function updatePlayer(p, input, world, dt, game) {
    var ax = input.axis();
    p.moving = ax.x !== 0 || ax.y !== 0;
    p.sneaking = input.sneak() && !input.sprint();
    p.sprinting = input.sprint() && p.moving;
    var speed = p.sneaking ? C.SNEAK_SPEED : p.sprinting ? C.SPRINT_SPEED : C.WALK_SPEED;
    if (p.moving) {
      p.facing = Math.atan2(ax.y, ax.x);
      MG.moveCircle(world, p, ax.x * speed * dt, ax.y * speed * dt, p.radius);
      p.stepTimer -= dt;
      if (p.stepTimer <= 0) {
        p.stepTimer = p.sprinting ? 0.26 : p.sneaking ? 0.55 : 0.38;
        game.audio.step(p.sprinting);
        if (p.sprinting) game.emitNoise(p.x, p.y, C.SPRINT_NOISE_RADIUS, 0.5);
      }
    }
    var col = Math.floor(p.x / TILE);
    var row = Math.floor(p.y / TILE);
    p.inShadow = MG.isShadowTile(world, col, row);
    /* Pick up dossiers, coins and the key by walking over them. */
    var i, d;
    for (i = 0; i < world.dossiers.length; i++) {
      d = world.dossiers[i];
      if (!d.taken && Math.hypot(d.x - p.x, d.y - p.y) < 26) {
        d.taken = true;
        game.score += C.DOSSIER_SCORE;
        game.dossiersGot += 1;
        game.audio.pickup();
        game.flash("Dossier lifted  +100");
        if (game.dossiersGot === C.DOSSIERS_PER_LEVEL) game.flash("All dossiers! Reach the green exit.");
      }
    }
    for (i = 0; i < world.coins.length; i++) {
      d = world.coins[i];
      if (!d.taken && Math.hypot(d.x - p.x, d.y - p.y) < 26) {
        d.taken = true;
        p.coins += 1;
        game.score += C.COIN_SCORE;
        game.audio.pickup();
        game.flash("Coin pocketed  +25");
      }
    }
    if (world.key && !world.key.taken && Math.hypot(world.key.x - p.x, world.key.y - p.y) < 26) {
      world.key.taken = true;
      p.hasKey = true;
      game.audio.unlock();
      game.flash("Brass key taken — locked doors will open.");
    }
    /* Locked doors open on touch when the key is held. */
    for (i = 0; i < world.lockedDoors.length; i++) {
      d = world.lockedDoors[i];
      if (!d.open && p.hasKey && Math.hypot(d.x - p.x, d.y - p.y) < TILE * 0.75) {
        d.open = true;
        world.grid[d.row][d.col] = 0;
        game.audio.unlock();
        game.flash("Locked door opened with the brass key.");
      }
    }
    /* The exit opens only once every dossier is lifted. */
    if (Math.hypot(world.exit.x - p.x, world.exit.y - p.y) < 26) {
      if (game.dossiersGot >= C.DOSSIERS_PER_LEVEL) game.levelComplete();
      else if (!game.exitWarned) {
        game.exitWarned = true;
        game.flash("The exit is sealed — " + (C.DOSSIERS_PER_LEVEL - game.dossiersGot) + " dossiers remain.");
      }
    } else {
      game.exitWarned = false;
    }
    /* Throw a coin toward the click: it lands with a clink that turns heads. */
    var click = input.takeClick();
    if (click && game.state === "playing") {
      if (p.coins > 0) {
        p.coins -= 1;
        game.audio.coin();
        game.throwCoin(click.x, click.y);
      } else {
        game.flash("No coins left — find a coin on the floor.");
      }
    }
  }
  MG.createPlayer = createPlayer;
  MG.updatePlayer = updatePlayer;
})();
