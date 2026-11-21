/* Midnight Gallery — sound: tiny WebAudio bleeps, no audio files, no network. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  function createAudio() {
    var ctx = null;
    var muted = false;
    function ensure() {
      if (ctx) return ctx;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      } catch (e) { ctx = null; }
      return ctx;
    }
    function tone(freq, dur, type, vol, slideTo) {
      if (muted) return;
      var c = ensure();
      if (!c) return;
      try {
        if (c.state === "suspended") c.resume();
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(freq, c.currentTime);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
        g.gain.setValueAtTime(vol || 0.08, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        o.connect(g); g.connect(c.destination);
        o.start(); o.stop(c.currentTime + dur);
      } catch (e) { /* audio is decoration; never break the game */ }
    }
    return {
      toggleMute: function () { muted = !muted; return muted; },
      step: function (loud) { tone(loud ? 140 : 95, 0.06, "triangle", loud ? 0.05 : 0.025); },
      pickup: function () { tone(660, 0.12, "sine", 0.09); setTimeout(function () { tone(990, 0.16, "sine", 0.09); }, 70); },
      coin: function () { tone(1568, 0.1, "square", 0.05, 1200); },
      clink: function () { tone(2400, 0.08, "square", 0.06, 1800); setTimeout(function () { tone(1900, 0.12, "square", 0.04); }, 90); },
      unlock: function () { tone(392, 0.1, "triangle", 0.08); setTimeout(function () { tone(523, 0.14, "triangle", 0.08); }, 90); },
      suspect: function () { tone(220, 0.25, "sawtooth", 0.05, 330); },
      chase: function () { tone(110, 0.4, "sawtooth", 0.09, 220); },
      caught: function () { tone(220, 0.7, "sawtooth", 0.1, 55); },
      clear: function () { tone(523, 0.14, "sine", 0.08); setTimeout(function () { tone(784, 0.2, "sine", 0.08); }, 110); },
    };
  }
  MG.createAudio = createAudio;
})();
