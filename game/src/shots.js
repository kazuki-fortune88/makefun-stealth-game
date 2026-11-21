/* Midnight Gallery — staged screenshots and a scripted self-test.
   ?shot=title|play|hidden|complete stages one frozen frame for the camera.
   ?selftest=1 plays the real update code and reports into document.title. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  var TILE = MG.CONFIG.TILE;

  function stageCones(game) {
    for (var i = 0; i < game.wardens.length; i++) {
      MG.updateWarden(game.wardens[i], game.player, game.world, 0.001, game);
    }
  }

  function applyShot(game, name) {
    var w, p;
    if (name === "title") {
      game.loadLevel(0);
      game.state = "title";
      w = game.wardens[1];
      w.x = (12 + 0.5) * TILE; w.y = (7 + 0.5) * TILE; w.facing = Math.PI;
      game.wardens[0].facing = Math.PI / 2;
      stageCones(game);
      return true;
    }
    if (name === "play") {
      game.loadLevel(0);
      game.state = "playing";
      game.startPlay();
      p = game.player;
      p.x = (5 + 0.5) * TILE; p.y = (7 + 0.5) * TILE; p.facing = 0;
      game.world.dossiers[0].taken = true;
      game.world.dossiers[1].taken = true;
      game.dossiersGot = 2;
      game.score = 200;
      w = game.wardens[1];
      w.x = (12 + 0.5) * TILE; w.y = (7 + 0.5) * TILE; w.facing = Math.PI;
      w.suspicion = 0.55; w.state = "suspect";
      game.wardens[0].facing = Math.PI / 2;
      game.flash("Dossier lifted  +100", 99);
      stageCones(game);
      return true;
    }
    if (name === "hidden") {
      game.loadLevel(0);
      game.state = "playing";
      game.startPlay();
      p = game.player;
      p.x = (3 + 0.5) * TILE; p.y = (7 + 0.5) * TILE; p.facing = 0;
      p.inShadow = true; p.hidden = true;
      w = game.wardens[1];
      w.x = (9 + 0.5) * TILE; w.y = (7 + 0.5) * TILE; w.facing = Math.PI;
      w.suspicion = 0.25; w.state = "suspect";
      game.wardens[0].facing = -Math.PI / 2;
      game.flash("Hidden in shadow — the warden looks right past you.", 99);
      stageCones(game);
      return true;
    }
    if (name === "complete") {
      game.loadLevel(0);
      game.state = "playing";
      game.startPlay();
      for (var i = 0; i < game.world.dossiers.length; i++) game.world.dossiers[i].taken = true;
      game.dossiersGot = 6;
      game.score = 600;
      game.player.x = (19 + 0.5) * TILE;
      game.player.y = (15 + 0.5) * TILE;
      game.player.facing = 0;
      game.levelStartTime = game.time - 96;
      game.levelComplete();
      stageCones(game);
      return true;
    }
    return false;
  }

  /* Drive the real update code through its paces and report the result. */
  function runSelfTest(game) {
    var out = [];
    var ok = true;
    function check(label, cond) {
      out.push(label + "=" + (cond ? "ok" : "FAIL"));
      if (!cond) ok = false;
    }
    game.loadLevel(0);
    game.state = "playing";
    game.startPlay();
    var d0 = game.world.dossiers[0];
    game.player.x = d0.x; game.player.y = d0.y;
    MG.updatePlayer(game.player, game.input, game.world, 0.016, game);
    check("dossier", game.dossiersGot === 1 && game.score === 100);
    var coinsBefore = game.player.coins;
    game.player.coins -= 1;
    game.throwCoin(game.player.x + 120, game.player.y);
    check("coin-thrown", game.player.coins === coinsBefore - 1 && !!game.coinFlight);
    for (var i = 0; i < 40; i++) game.tick(0.016);
    check("coin-landed", !game.coinFlight && game.noises.length > 0);
    var w = game.wardens[0];
    game.player.x = w.x + 70; game.player.y = w.y;
    w.facing = 0;
    w.suspicion = 0;
    for (var j = 0; j < 60; j++) MG.updateWarden(w, game.player, game.world, 0.016, game);
    check("vision", w.suspicion > 0.3);
    game.player.hasKey = true;
    var door = game.world.lockedDoors[0];
    game.player.x = door.x; game.player.y = door.y;
    MG.updatePlayer(game.player, game.input, game.world, 0.016, game);
    check("door", door.open === true);
    document.title = "SELFTEST " + (ok ? "PASS" : "FAIL") + " " + out.join(" ");
    return ok;
  }

  MG.applyShot = applyShot;
  MG.runSelfTest = runSelfTest;
})();
