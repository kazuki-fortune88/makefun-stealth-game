/* Midnight Gallery — shared constants: tuning for movement, vision and scoring. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  MG.CONFIG = {
    TILE: 40,
    COLS: 24,
    ROWS: 16,
    CANVAS_W: 960,
    CANVAS_H: 640,
    WALK_SPEED: 132,
    SNEAK_SPEED: 62,
    SPRINT_SPEED: 205,
    PATROL_SPEED: 56,
    CHASE_SPEED: 148,
    SEARCH_SPEED: 78,
    INVESTIGATE_SPEED: 92,
    CONE_RANGE: 215,
    CONE_HALF_ANGLE: 0.62,
    CATCH_RADIUS: 22,
    SUSPECT_AT: 0.35,
    CHASE_AT: 1.0,
    SPRINT_NOISE_RADIUS: 130,
    COIN_NOISE_RADIUS: 175,
    COIN_START: 3,
    DOSSIER_SCORE: 100,
    COIN_SCORE: 25,
    LEVEL_SCORE: 250,
    GHOST_BONUS: 500,
    TIME_BONUS_MAX: 300,
    DOSSIERS_PER_LEVEL: 6,
    LEVELS: 3,
  };
  MG.FIXED_SEED = 7;
})();
