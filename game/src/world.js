/* Midnight Gallery — the world: map parsing, collision and line of sight. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  var TILE = MG.CONFIG.TILE;

  function parseLevel(def) {
    var grid = [];
    var dossiers = [];
    var coins = [];
    var playerStart = { x: 1.5 * TILE, y: 15.5 * TILE };
    var exit = { x: 20.5 * TILE, y: 15.5 * TILE };
    var keyPos = null;
    var lockedDoors = [];
    for (var row = 0; row < def.map.length; row++) {
      var line = def.map[row];
      var grow = [];
      for (var col = 0; col < line.length; col++) {
        var ch = line[col];
        var cx = (col + 0.5) * TILE;
        var cy = (row + 0.5) * TILE;
        if (ch === "#") grow.push(1);
        else if (ch === "S" || ch === "V") grow.push(2);
        else if (ch === "+") { grow.push(3); lockedDoors.push({ col: col, row: row, x: cx, y: cy, open: false }); }
        else grow.push(0);
        if (ch === "D") dossiers.push({ x: cx, y: cy, col: col, row: row, taken: false });
        if (ch === "o") coins.push({ x: cx, y: cy, taken: false });
        if (ch === "K") keyPos = { x: cx, y: cy, taken: false };
        if (ch === "P") playerStart = { x: cx, y: cy };
        if (ch === "E") exit = { x: cx, y: cy };
      }
      grid.push(grow);
    }
    return {
      name: def.name, hint: def.hint, grid: grid, cols: def.map[0].length, rows: def.map.length,
      dossiers: dossiers, coins: coins, key: keyPos, lockedDoors: lockedDoors,
      playerStart: playerStart, exit: exit, wardenDefs: def.wardens,
    };
  }

  /* Tile kinds: 0 floor, 1 wall, 2 cover (statue/vitrine), 3 locked door. */
  function tileAt(world, col, row) {
    if (col < 0 || row < 0 || col >= world.cols || row >= world.rows) return 1;
    return world.grid[row][col];
  }
  function isShadowTile(world, col, row) {
    var def = MG.LEVELS[world.levelIndex];
    var ch = def.map[row] && def.map[row][col];
    return ch === "~";
  }
  function solidAt(world, x, y) {
    var col = Math.floor(x / TILE);
    var row = Math.floor(y / TILE);
    var t = tileAt(world, col, row);
    return t === 1 || t === 2 || t === 3;
  }
  /* Circle-vs-grid collision: slide along walls. */
  function moveCircle(world, pos, dx, dy, radius) {
    var nx = pos.x + dx;
    if (!solidAt(world, nx + Math.sign(dx) * radius, pos.y - radius * 0.6) &&
        !solidAt(world, nx + Math.sign(dx) * radius, pos.y + radius * 0.6)) pos.x = nx;
    var ny = pos.y + dy;
    if (!solidAt(world, pos.x - radius * 0.6, ny + Math.sign(dy) * radius) &&
        !solidAt(world, pos.x + radius * 0.6, ny + Math.sign(dy) * radius)) pos.y = ny;
  }
  /* Line of sight: sample along the segment; blocked by wall, cover or closed door. */
  function hasLineOfSight(world, x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.max(1, Math.ceil(dist / 6));
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      if (solidAt(world, x0 + dx * t, y0 + dy * t)) return false;
    }
    return true;
  }
  function tileCenter(col, row) {
    return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
  }
  MG.parseLevel = parseLevel;
  MG.tileAt = tileAt;
  MG.isShadowTile = isShadowTile;
  MG.solidAt = solidAt;
  MG.moveCircle = moveCircle;
  MG.hasLineOfSight = hasLineOfSight;
  MG.tileCenter = tileCenter;
})();
