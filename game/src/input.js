/* Midnight Gallery — keyboard and mouse input. */
(function () {
  var MG = globalThis.MG || (globalThis.MG = {});
  function createInput(canvas) {
    var keys = {};
    var mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    function keyOf(e) { return (e.key || "").toLowerCase(); }
    window.addEventListener("keydown", function (e) {
      var k = keyOf(e);
      keys[k] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(k) >= 0) e.preventDefault();
    });
    window.addEventListener("keyup", function (e) { keys[keyOf(e)] = false; });
    window.addEventListener("blur", function () { for (var k in keys) keys[k] = false; });
    canvas.addEventListener("mousemove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener("mousedown", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.clickX = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.clickY = (e.clientY - r.top) * (canvas.height / r.height);
      mouse.clicked = true;
    });
    return {
      keys: keys, mouse: mouse,
      axis: function () {
        var x = 0, y = 0;
        if (keys["a"] || keys["arrowleft"]) x -= 1;
        if (keys["d"] || keys["arrowright"]) x += 1;
        if (keys["w"] || keys["arrowup"]) y -= 1;
        if (keys["s"] || keys["arrowdown"]) y += 1;
        if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
        return { x: x, y: y };
      },
      sprint: function () { return !!(keys["shift"]); },
      sneak: function () { return !!(keys["c"]); },
      pressed: function (k) { return !!keys[k]; },
      takeClick: function () {
        if (!mouse.clicked) return null;
        mouse.clicked = false;
        return { x: mouse.clickX, y: mouse.clickY };
      },
    };
  }
  MG.createInput = createInput;
})();
