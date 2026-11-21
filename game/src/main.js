/* Midnight Gallery — the game loop, screens, scoring and the HUD. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  var C = MG.CONFIG;

  function $(id) { return document.getElementById(id); }

  function createGame() {
    var canvas = $("game");
    var ctx = canvas.getContext("2d");
    var game = {
      state: "title",
      levelIndex: 0,
      world: null,
      player: null,
      wardens: [],
      input: MG.createInput(canvas),
      audio: MG.createAudio(),
      score: 0,
      dossiersGot: 0,
      alert: 0,
      levelGhost: true,
      levelStartTime: 0,
      time: 0,
      noises: [],
      coinFlight: null,
      flashText: "",
      flashUntil: 0,
      exitWarned: false,
      totalTime: 0,
    };

    game.loadLevel = function (idx) {
      game.levelIndex = idx;
      var world = MG.parseLevel(MG.LEVELS[idx]);
      world.levelIndex = idx;
      game.world = world;
      game.player = MG.createPlayer(world.playerStart);
      game.wardens = world.wardenDefs.map(function (d) { return MG.createWarden(d, world); });
      game.dossiersGot = 0;
      game.levelGhost = true;
      game.noises = [];
      game.coinFlight = null;
      game.flashText = "";
      game.exitWarned = false;
      game.levelStartTime = game.time;
      $("hud-level").textContent = world.name;
    };

    game.startPlay = function () {
      game.state = "playing";
      showOnly(null);
    };

    game.flash = function (text, seconds) {
      game.flashText = text;
      game.flashUntil = game.time + (seconds || 2.5);
    };

    game.emitNoise = function (x, y, radius, life) {
      game.noises.push({ x: x, y: y, radius: radius, born: game.time, life: life || 1 });
      for (var i = 0; i < game.wardens.length; i++) MG.hearNoise(game.wardens[i], x, y, radius);
    };

    game.throwCoin = function (x, y) {
      game.coinFlight = { x0: game.player.x, y0: game.player.y, x1: x, y1: y, t: 0, dur: 0.45 };
    };

    game.onChaseStart = function () {
      game.levelGhost = false;
      game.flash("SPOTTED! Break line of sight — now!");
    };

    game.caught = function () {
      if (game.state !== "playing") return;
      game.state = "caught";
      game.audio.caught();
      var lines = "A warden's lamp found you in " + game.world.name + ".\n" +
        "Dossiers lifted: " + game.dossiersGot + " / " + C.DOSSIERS_PER_LEVEL + "   ·   Score: " + game.score;
      $("caught-lines").textContent = lines;
      showOnly("screen-caught");
    };

    game.levelComplete = function () {
      if (game.state !== "playing") return;
      var elapsed = Math.max(0, Math.round(game.time - game.levelStartTime));
      var timeBonus = Math.max(0, C.TIME_BONUS_MAX - elapsed * 2);
      var ghost = game.levelGhost ? C.GHOST_BONUS : 0;
      if (game.levelGhost) game.ghostLevels = (game.ghostLevels || 0) + 1;
      game.score += C.LEVEL_SCORE + timeBonus + ghost;
      game.audio.clear();
      var lines = game.world.name + " cleared in " + elapsed + "s.\n" +
        "Dossiers  " + C.DOSSIERS_PER_LEVEL + " × " + C.DOSSIER_SCORE + "   ·   Gallery bonus +" + C.LEVEL_SCORE +
        "   ·   Time bonus +" + timeBonus +
        (ghost ? "   ·   GHOST bonus +" + ghost + " (never chased!)" : "   ·   Spotted once — no ghost bonus") +
        "\nScore: " + game.score;
      if (game.levelIndex + 1 >= C.LEVELS) {
        game.state = "win";
        $("win-lines").textContent = lines + "\n\nFinal score: " + game.score +
          "  ·  " + (game.ghostLevels === 3 ? "A perfect ghost run." : "The gallery remembers every shadow you kept.");
        showOnly("screen-win");
      } else {
        game.state = "complete";
        $("complete-title").textContent = "GALLERY CLEARED";
        $("complete-lines").textContent = lines;
        showOnly("screen-complete");
      }
    };

    game.tick = function (dt) {
      game.time += dt;
      if (game.coinFlight) {
        var cf = game.coinFlight;
        cf.t += dt;
        if (cf.t >= cf.dur) {
          game.coinFlight = null;
          game.audio.clink();
          game.emitNoise(cf.x1, cf.y1, C.COIN_NOISE_RADIUS, 1.0);
        }
      }
      game.noises = game.noises.filter(function (n) { return game.time - n.born < n.life; });
      if (game.state !== "playing") return;
      MG.updatePlayer(game.player, game.input, game.world, dt, game);
      for (var i = 0; i < game.wardens.length; i++) {
        MG.updateWarden(game.wardens[i], game.player, game.world, dt, game);
      }
      /* Alert meter follows the most suspicious warden. */
      var top = 0;
      var chasing = false;
      for (var j = 0; j < game.wardens.length; j++) {
        if (game.wardens[j].suspicion > top) top = game.wardens[j].suspicion;
        if (game.wardens[j].state === "chase") chasing = true;
      }
      var target = Math.round(top * 100);
      game.alert += (target - game.alert) * Math.min(1, dt * 6);
      game.player.hidden = game.player.inShadow && top < C.SUSPECT_AT && !chasing;
      updateHud(game, top, chasing);
    };

    function showOnly(id) {
      var ids = ["screen-title", "screen-complete", "screen-caught", "screen-win"];
      for (var i = 0; i < ids.length; i++) {
        $(ids[i]).classList.toggle("hidden", ids[i] !== id);
      }
    }

    function updateHud(game, top, chasing) {
      $("hud-dossiers").textContent = "Dossiers " + game.dossiersGot + " / " + C.DOSSIERS_PER_LEVEL;
      $("hud-coins").textContent = "Coins " + game.player.coins + (game.player.hasKey ? "  ·  Key" : "");
      $("hud-score").textContent = "Score " + game.score;
      $("alert-fill").style.width = Math.round(game.alert) + "%";
      var status = $("hud-status");
      if (chasing) { status.textContent = "SPOTTED!"; status.className = "chase"; }
      else if (top >= C.SUSPECT_AT) { status.textContent = "SUSPECTED?"; status.className = "suspect"; }
      else if (game.player.hidden) { status.textContent = "HIDDEN"; status.className = "hidden"; }
      else { status.textContent = "UNSEEN"; status.className = "unseen"; }
    }

    function loop(ts) {
      var now = ts / 1000;
      var dt = Math.min(0.05, now - (game._last || now));
      game._last = now;
      game.tick(dt);
      MG.render(ctx, game, game.time);
      if (!game._frozen) requestAnimationFrame(loop);
    }

    game.start = function () {
      game.loadLevel(0);
      var params = new URLSearchParams(window.location.search);
      var shot = params.get("shot");
      if (params.get("selftest") === "1") {
        MG.runSelfTest(game);
        MG.render(ctx, game, 1.2);
        game._frozen = true;
        return;
      }
      if (shot && MG.applyShot(game, shot)) {
        game._frozen = true;
        var topShot = 0;
        var chasingShot = false;
        for (var wi = 0; wi < game.wardens.length; wi++) {
          if (game.wardens[wi].suspicion > topShot) topShot = game.wardens[wi].suspicion;
          if (game.wardens[wi].state === "chase") chasingShot = true;
        }
        updateHud(game, topShot, chasingShot);
        MG.render(ctx, game, 1.2);
        return;
      }
      showOnly("screen-title");
      updateHud(game, 0, false);
      requestAnimationFrame(loop);
    };

    $("btn-start").addEventListener("click", function () {
      game.loadLevel(0);
      game.score = 0;
      game.startPlay();
    });
    $("btn-next").addEventListener("click", function () {
      game.loadLevel(game.levelIndex + 1);
      game.startPlay();
    });
    $("btn-retry").addEventListener("click", function () {
      game.loadLevel(game.levelIndex);
      game.startPlay();
    });
    $("btn-again").addEventListener("click", function () {
      game.score = 0;
      game.loadLevel(0);
      game.startPlay();
    });
    window.addEventListener("keydown", function (e) {
      var k = (e.key || "").toLowerCase();
      if (k === "m") { var muted = game.audio.toggleMute(); game.flash(muted ? "Sound off." : "Sound on."); }
      if (k === "r" && game.state === "playing") { game.loadLevel(game.levelIndex); game.startPlay(); }
      if (k === "enter" && game.state === "title") { game.score = 0; game.loadLevel(0); game.startPlay(); }
    });

    window.__mg = game;
    return game;
  }

  document.addEventListener("DOMContentLoaded", function () {
    createGame().start();
  });
})();
