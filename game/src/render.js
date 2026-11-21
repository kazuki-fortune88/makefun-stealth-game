/* Midnight Gallery — the renderer: marble halls, lamplight, vision cones. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  var C = MG.CONFIG;
  var TILE = C.TILE;

  function hash(col, row) {
    var s = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function drawFloor(ctx, world) {
    for (var row = 0; row < world.rows; row++) {
      for (var col = 0; col < world.cols; col++) {
        var x = col * TILE;
        var y = row * TILE;
        var t = world.grid[row][col];
        var h = hash(col, row);
        if (t === 1) {
          ctx.fillStyle = "#241d33";
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = "#2e2542";
          ctx.fillRect(x, y, TILE, 5);
          ctx.fillStyle = "#171223";
          ctx.fillRect(x, y + TILE - 4, TILE, 4);
          /* A gilt-framed painting hangs on some wall faces. */
          if (row + 1 < world.rows && world.grid[row + 1][col] === 0 && h > 0.45) {
            var pw = 26, ph = 18;
            var px = x + (TILE - pw) / 2, py = y + 8;
            ctx.fillStyle = "#8a6d2b";
            ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
            var palettes = [["#3a5a8c", "#7a9cc6"], ["#7a3a3a", "#c68a7a"], ["#3a6b4a", "#8cc6a0"], ["#6b4a7a", "#b08cc6"]];
            var pal = palettes[Math.floor(h * palettes.length) % palettes.length];
            ctx.fillStyle = pal[0];
            ctx.fillRect(px, py, pw, ph);
            ctx.fillStyle = pal[1];
            ctx.beginPath();
            ctx.arc(px + pw * (0.3 + h * 0.4), py + ph * 0.6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px + 4, py + ph - 6, pw - 8, 2);
          }
          continue;
        }
        var shadow = MG.isShadowTile(world, col, row);
        var checker = (col + row) % 2 === 0;
        ctx.fillStyle = shadow ? "#191423" : checker ? "#b8a888" : "#a89880";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = shadow ? "#211a2e" : checker ? "#c4b498" : "#b3a38a";
        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = shadow ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.06)";
        ctx.fillRect(x + 5, y + 5, 3, 3);
        ctx.fillRect(x + TILE - 10, y + TILE - 9, 3, 3);
        if (shadow) {
          ctx.fillStyle = "rgba(10,8,20,0.55)";
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = "rgba(120,140,255,0.05)";
          ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        }
      }
    }
    /* A red carpet runner down the middle hall. */
    ctx.fillStyle = "#5e1f24";
    ctx.fillRect(TILE, 7 * TILE + 6, 22 * TILE, 28);
    ctx.fillStyle = "#7a2a30";
    ctx.fillRect(TILE, 7 * TILE + 10, 22 * TILE, 20);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(TILE, 7 * TILE + 6, 22 * TILE, 2);
    ctx.fillRect(TILE, 8 * TILE - 6, 22 * TILE, 2);
  }

  function drawProps(ctx, world, time) {
    for (var row = 0; row < world.rows; row++) {
      for (var col = 0; col < world.cols; col++) {
        var def = MG.LEVELS[world.levelIndex];
        var ch = def.map[row][col];
        var x = col * TILE, y = row * TILE, cx = x + TILE / 2, cy = y + TILE / 2;
        if (ch === "S") {
          ctx.fillStyle = "#4a4450";
          ctx.fillRect(x + 8, y + 24, 24, 10);
          ctx.fillStyle = "#8f8a96";
          ctx.beginPath();
          ctx.arc(cx, y + 20, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7a7580";
          ctx.fillRect(x + 13, y + 26, 14, 8);
          ctx.fillStyle = "#a9a4b0";
          ctx.beginPath();
          ctx.arc(cx, y + 12, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (ch === "V") {
          ctx.fillStyle = "#3a2e1e";
          ctx.fillRect(x + 6, y + 26, 28, 8);
          ctx.fillStyle = "rgba(180,220,255,0.28)";
          ctx.fillRect(x + 6, y + 6, 28, 22);
          ctx.strokeStyle = "#c9a227";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 6, y + 6, 28, 22);
          ctx.fillStyle = "#e8c84a";
          ctx.beginPath();
          ctx.arc(cx, y + 17, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (ch === "+") {
          var door = null;
          for (var i = 0; i < world.lockedDoors.length; i++) {
            if (world.lockedDoors[i].col === col && world.lockedDoors[i].row === row) door = world.lockedDoors[i];
          }
          if (door && !door.open) {
            ctx.fillStyle = "#4a3416";
            ctx.fillRect(x + 2, y, TILE - 4, TILE);
            ctx.fillStyle = "#c9a227";
            ctx.fillRect(x + TILE / 2 - 1, y, 2, TILE);
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    /* Warm lamp pools in the hall corners. */
    var lamps = [[2, 6], [21, 6], [2, 10], [21, 10]];
    for (var li = 0; li < lamps.length; li++) {
      var lx = (lamps[li][0] + 0.5) * TILE, ly = (lamps[li][1] + 0.5) * TILE;
      var g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 90);
      g.addColorStop(0, "rgba(255,214,120,0.20)");
      g.addColorStop(1, "rgba(255,214,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9a227";
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPickups(ctx, game, time) {
    var world = game.world;
    var bob = Math.sin(time * 3) * 2;
    var i, d;
    for (i = 0; i < world.dossiers.length; i++) {
      d = world.dossiers[i];
      if (d.taken) continue;
      ctx.save();
      ctx.translate(d.x, d.y + bob);
      ctx.fillStyle = "rgba(255,220,120,0.25)";
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f2e6c8";
      ctx.fillRect(-10, -7, 20, 14);
      ctx.fillStyle = "#8c2f2f";
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#6b5a2e";
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -7, 20, 14);
      ctx.restore();
    }
    for (i = 0; i < world.coins.length; i++) {
      d = world.coins[i];
      if (d.taken) continue;
      ctx.save();
      ctx.translate(d.x, d.y + bob);
      ctx.fillStyle = "#e8c84a";
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#a8821a";
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (world.key && !world.key.taken) {
      ctx.save();
      ctx.translate(world.key.x, world.key.y + bob);
      ctx.fillStyle = "rgba(255,220,120,0.3)";
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#e8c84a";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-3, 0, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(11, 0); ctx.moveTo(8, 0); ctx.lineTo(8, 5); ctx.moveTo(11, 0); ctx.lineTo(11, 5); ctx.stroke();
      ctx.restore();
    }
    /* The exit: sealed brass doors, green when all dossiers are lifted. */
    var e = world.exit;
    var open = game.dossiersGot >= C.DOSSIERS_PER_LEVEL;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = open ? "#1d5c33" : "#3a3a3a";
    ctx.fillRect(-14, -16, 28, 32);
    ctx.strokeStyle = open ? "#4aff88" : "#c9a227";
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -16, 28, 32);
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 16); ctx.stroke();
    ctx.fillStyle = open ? "#4aff88" : "#8a7a4a";
    ctx.font = "bold 9px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", 0, -20);
    ctx.restore();
  }

  function drawWarden(ctx, w, time) {
    /* Vision cone, built from the precomputed raycast rays. */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    for (var i = 0; i < w.coneRays.length; i++) {
      var r = w.coneRays[i];
      ctx.lineTo(w.x + Math.cos(r.angle) * r.len, w.y + Math.sin(r.angle) * r.len);
    }
    ctx.closePath();
    var chasing = w.state === "chase";
    var suspect = w.state === "suspect" || w.state === "investigate" || w.state === "search";
    ctx.fillStyle = chasing ? "rgba(255,70,50,0.30)" : suspect ? "rgba(255,200,60,0.26)" : "rgba(255,214,110,0.20)";
    ctx.fill();
    ctx.restore();
    /* Body: navy uniform, brass buttons, peaked cap. */
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.facing);
    ctx.fillStyle = "#1e2a52";
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2c3f73";
    ctx.beginPath(); ctx.arc(3, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e8dcc0";
    ctx.beginPath(); ctx.arc(11, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#141c38";
    ctx.fillRect(-4, -9, 10, 5);
    ctx.restore();
    /* Suspicion marker. */
    var mark = null;
    if (w.state === "chase") mark = { ch: "!", color: "#ff5a4e" };
    else if (w.state === "suspect" || w.state === "search" || w.state === "investigate") mark = { ch: "?", color: "#f0c040" };
    if (mark) {
      ctx.save();
      ctx.font = "bold 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = mark.color;
      ctx.shadowColor = mark.color;
      ctx.shadowBlur = 8;
      ctx.fillText(mark.ch, w.x, w.y - 20 + Math.sin(time * 5) * 2);
      ctx.restore();
    }
    /* Suspicion arc under the warden. */
    if (w.suspicion > 0.02) {
      ctx.save();
      ctx.strokeStyle = w.suspicion >= 1 ? "#ff5a4e" : "#f0c040";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 18, -Math.PI / 2, -Math.PI / 2 + w.suspicion * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlayer(ctx, p, time) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.inShadow) {
      ctx.globalAlpha = 0.75;
    }
    /* A hooded thief: dark cloak, pale face, a small lantern glow. */
    ctx.fillStyle = "#2b2118";
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3d2f22";
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(p.facing);
    ctx.fillStyle = "#e8dcc0";
    ctx.beginPath(); ctx.arc(6, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2b2118";
    ctx.beginPath(); ctx.arc(7, -2.5, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (p.hidden) {
      ctx.save();
      ctx.font = "bold 11px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#7fb3d5";
      ctx.shadowColor = "#7fb3d5";
      ctx.shadowBlur = 6;
      ctx.fillText("HIDDEN", p.x, p.y - 20);
      ctx.restore();
    }
  }

  function drawCoinFlight(ctx, coin) {
    if (!coin) return;
    var t = coin.t / coin.dur;
    var x = coin.x0 + (coin.x1 - coin.x0) * t;
    var y = coin.y0 + (coin.y1 - coin.y0) * t - Math.sin(t * Math.PI) * 34;
    ctx.save();
    ctx.fillStyle = "#e8c84a";
    ctx.shadowColor = "#e8c84a";
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawNoiseRings(ctx, noises, time) {
    for (var i = 0; i < noises.length; i++) {
      var n = noises[i];
      var age = (time - n.born) / n.life;
      if (age < 0 || age > 1) continue;
      ctx.save();
      ctx.strokeStyle = "rgba(240,192,64," + (0.7 * (1 - age)) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius * (0.3 + 0.7 * age), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function render(ctx, game, time) {
    var world = game.world;
    ctx.clearRect(0, 0, C.CANVAS_W, C.CANVAS_H);
    drawFloor(ctx, world);
    drawProps(ctx, world, time);
    drawPickups(ctx, game, time);
    for (var i = 0; i < game.wardens.length; i++) drawWarden(ctx, game.wardens[i], time);
    drawPlayer(ctx, game.player, time);
    drawCoinFlight(ctx, game.coinFlight);
    drawNoiseRings(ctx, game.noises, time);
    /* Flash message at the bottom. */
    if (game.flashText && game.flashUntil > time) {
      ctx.save();
      ctx.font = "bold 16px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(6,4,12,0.75)";
      var w = ctx.measureText(game.flashText).width + 28;
      ctx.fillRect((C.CANVAS_W - w) / 2, C.CANVAS_H - 40, w, 28);
      ctx.fillStyle = "#f2e6c8";
      ctx.fillText(game.flashText, C.CANVAS_W / 2, C.CANVAS_H - 20);
      ctx.restore();
    }
    /* Vignette: the museum at night. */
    var vg = ctx.createRadialGradient(480, 320, 260, 480, 320, 640);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);
  }

  MG.render = render;
})();
