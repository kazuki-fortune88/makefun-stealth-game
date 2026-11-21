/* Midnight Gallery — the wardens: patrol, suspect, chase, search, return.
   Vision is a raycast cone; suspicion grows when the thief is seen. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  var C = MG.CONFIG;

  function createWarden(def, world) {
    var pts = def.waypoints.map(function (w) { return MG.tileCenter(w[0], w[1]); });
    return {
      x: pts[0].x, y: pts[0].y, radius: 14,
      waypoints: pts, wpIndex: 1, pause: def.pause || 1, pauseTimer: 0,
      facing: 0, state: "patrol", suspicion: 0,
      lastSeen: null, lastSeenTimer: 0, searchTimer: 0,
      investigate: null, investigateTimer: 0,
      coneRays: [],
    };
  }

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  /* True when the warden can see the player right now. */
  function canSee(w, player, world) {
    var dx = player.x - w.x;
    var dy = player.y - w.y;
    var dist = Math.hypot(dx, dy);
    if (dist > C.CONE_RANGE) return { seen: false, dist: dist };
    var ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, w.facing)) > C.CONE_HALF_ANGLE && dist > 34) return { seen: false, dist: dist };
    if (!MG.hasLineOfSight(world, w.x, w.y, player.x, player.y)) return { seen: false, dist: dist };
    return { seen: true, dist: dist };
  }

  function moveToward(w, world, tx, ty, speed, dt) {
    var dx = tx - w.x;
    var dy = ty - w.y;
    var dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    var step = Math.min(dist, speed * dt);
    var nx = w.x + (dx / dist) * step;
    var ny = w.y + (dy / dist) * step;
    w.facing = Math.atan2(dy, dx);
    if (!MG.solidAt(world, nx + Math.sign(dx) * w.radius, w.y) &&
        !MG.solidAt(world, nx + Math.sign(dx) * w.radius, w.y + w.radius * 0.5) &&
        !MG.solidAt(world, nx + Math.sign(dx) * w.radius, w.y - w.radius * 0.5)) w.x = nx;
    if (!MG.solidAt(world, w.x, ny + Math.sign(dy) * w.radius) &&
        !MG.solidAt(world, w.x + w.radius * 0.5, ny + Math.sign(dy) * w.radius) &&
        !MG.solidAt(world, w.x - w.radius * 0.5, ny + Math.sign(dy) * w.radius)) w.y = ny;
    return dist <= speed * dt + 2;
  }

  function updateWarden(w, player, world, dt, game) {
    var see = canSee(w, player, world);
    var prevState = w.state;
    if (see.seen) {
      var rate = 1.15 * (1 - see.dist / (C.CONE_RANGE * 1.4));
      if (player.inShadow) rate *= 0.22;
      if (player.sneaking) rate *= 0.6;
      if (player.sprinting) rate *= 1.35;
      w.suspicion = Math.min(1, w.suspicion + rate * dt);
      w.lastSeen = { x: player.x, y: player.y };
      w.lastSeenTimer = 0;
      if (w.suspicion >= C.CHASE_AT && w.state !== "chase") {
        w.state = "chase";
        game.onChaseStart();
      } else if (w.suspicion >= C.SUSPECT_AT && w.state === "patrol") {
        w.state = "suspect";
        game.audio.suspect();
      }
    } else {
      w.suspicion = Math.max(0, w.suspicion - 0.16 * dt);
      if (w.state === "suspect" && w.suspicion < C.SUSPECT_AT * 0.5) w.state = "patrol";
      w.lastSeenTimer += dt;
    }
    if (w.state === "chase") {
      if (see.seen) { w.lastSeen = { x: player.x, y: player.y }; w.lastSeenTimer = 0; }
      if (w.lastSeen) moveToward(w, world, w.lastSeen.x, w.lastSeen.y, C.CHASE_SPEED, dt);
      if (Math.hypot(player.x - w.x, player.y - w.y) < C.CATCH_RADIUS) game.caught(w);
      if (!see.seen && w.lastSeenTimer > 2.5) {
        w.state = "search";
        w.searchTimer = 4;
        if (w.lastSeen) { w.investigate = { x: w.lastSeen.x, y: w.lastSeen.y }; }
      }
    } else if (w.state === "search") {
      if (w.investigate) {
        var arrived = moveToward(w, world, w.investigate.x, w.investigate.y, C.SEARCH_SPEED, dt);
        if (arrived) {
          w.searchTimer -= dt;
          w.facing += dt * 1.6;
          if (w.searchTimer <= 0) { w.state = "patrol"; w.investigate = null; }
        }
      } else { w.state = "patrol"; }
    } else if (w.state === "investigate") {
      if (w.investigate) {
        var done = moveToward(w, world, w.investigate.x, w.investigate.y, C.INVESTIGATE_SPEED, dt);
        if (done) {
          w.investigateTimer -= dt;
          w.facing += dt * 1.2;
          if (w.investigateTimer <= 0) { w.state = "patrol"; w.investigate = null; }
        }
      } else { w.state = "patrol"; }
    } else {
      /* patrol / suspect: walk the waypoints, pausing to look around. */
      if (w.pauseTimer > 0) {
        w.pauseTimer -= dt;
        w.facing += dt * 0.5;
      } else {
        var target = w.waypoints[w.wpIndex];
        var reached = moveToward(w, world, target.x, target.y,
          w.state === "suspect" ? C.SEARCH_SPEED : C.PATROL_SPEED, dt);
        if (reached) {
          w.pauseTimer = w.pause;
          w.wpIndex = (w.wpIndex + 1) % w.waypoints.length;
        }
      }
    }
    if (prevState !== "chase" && w.state === "chase") game.audio.chase();
    /* Precompute the vision-cone rays for the renderer. */
    w.coneRays = [];
    var rays = 26;
    for (var i = 0; i <= rays; i++) {
      var a = w.facing - C.CONE_HALF_ANGLE + (2 * C.CONE_HALF_ANGLE * i) / rays;
      var len = coneRayLength(w, world, a);
      w.coneRays.push({ angle: a, len: len });
    }
  }

  function coneRayLength(w, world, angle) {
    var step = 7;
    var len = 0;
    while (len < C.CONE_RANGE) {
      len += step;
      var x = w.x + Math.cos(angle) * len;
      var y = w.y + Math.sin(angle) * len;
      if (MG.solidAt(world, x, y)) break;
    }
    return Math.min(len, C.CONE_RANGE);
  }

  /* A noise pulls a patrolling warden to investigate its source. */
  function hearNoise(w, x, y, radius) {
    if (w.state === "chase") return;
    var dist = Math.hypot(x - w.x, y - w.y);
    if (dist > radius) return;
    w.suspicion = Math.min(1, w.suspicion + 0.18);
    if (w.state === "patrol" || w.state === "suspect") {
      w.state = "investigate";
      w.investigate = { x: x, y: y };
      w.investigateTimer = 3;
    }
  }

  MG.createWarden = createWarden;
  MG.updateWarden = updateWarden;
  MG.hearNoise = hearNoise;
  MG.canSee = canSee;
})();
