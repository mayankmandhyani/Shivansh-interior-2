/* ==========================================================================
   "Almoayyed" mesh gradient (Bloom Field) — recreated per spec.
   One radial blob per palette colour, blended via layered CSS
   radial-gradients over a solid backdrop (defined in style.css as
   .mesh-gradient). This file only drives the MOTION: it writes each
   blob's animated centre into CSS custom properties every frame, so
   the browser repaints cheaply instead of us rebuilding the whole
   background-image string each tick.

   Two independent, additive motions, both provably continuous:
   1. Ambient drift — a deterministic per-blob phase (seeded hash,
      fixed once at load) feeds sin(ph*k + p) - sin(p), which is
      exactly 0 when ph = 0, so the gradient never snaps when the
      animation starts.
   2. Pointer interactivity — an eased (lerp) offset toward the
      cursor position, which also starts at (0,0) and eases in, so
      it composes with the ambient drift without any discontinuity.

   The seed is fixed (not re-derived from time), so the ambient motion
   is smooth and repeatable rather than chaotic frame-to-frame noise.
   ========================================================================== */
(function () {
  var el = document.getElementById('heroGradient');
  if (!el) return;

  /* Deterministic PRNG (mulberry32), seeded once — used only at init
     to derive each blob's STATIC phase. Never called again inside the
     animation loop, so motion stays continuous rather than chaotic. */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(174074637); // fixed seed from the gradient spec

  /* Base (rest-frame) blob centres — identical to the static CSS
     fallback values in .mesh-gradient, one per palette colour. */
  var blobs = [
    { cx: 66.94, cy: 46.43 }, // Mauve    #D7D5D5
    { cx: 34.69, cy: 66.31 }, // Midnight #310527
    { cx: 48.93, cy: 19.32 }, // Charcoal #39051F
    { cx: 80.23, cy: 87.54 }  // White    #FFFFFF
  ];
  blobs.forEach(function (b) {
    b.p1 = rand() * Math.PI * 2; // static phase driving x
    b.p2 = rand() * Math.PI * 2; // static phase driving y
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // leave the static CSS fallback frame in place

  var amt = 0.40;  // motionAmount
  var dir = 1;      // motionReverse: false
  var wave = 14;    // wave / spatial amplitude in percentage points

  /* ---------- pointer interactivity ---------- */
  var targetX = 0, targetY = 0, curX = 0, curY = 0;
  function setTarget(clientX, clientY) {
    var r = el.getBoundingClientRect();
    var nx = ((clientX - r.left) / r.width) * 2 - 1;
    var ny = ((clientY - r.top) / r.height) * 2 - 1;
    targetX = Math.max(-1, Math.min(1, nx));
    targetY = Math.max(-1, Math.min(1, ny));
  }
  window.addEventListener('pointermove', function (e) { setTarget(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('pointerleave', function () { targetX = 0; targetY = 0; }, { passive: true });

  /* ---------- animation loop ---------- */
  var start = null;
  function frame(now) {
    if (start === null) start = now;
    var t = (now - start) / 1000;   // elapsed seconds
    var ph = t * 1.00;
    var spin = ph * dir;            // defined for parity with the spec

    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;

    blobs.forEach(function (b, i) {
      var dx = (Math.sin(ph * 0.55 + b.p1) - Math.sin(b.p1)) * wave * amt;
      var dy = (Math.sin(ph * 0.43 + b.p2) - Math.sin(b.p2)) * wave * amt;
      var px = curX * 6 * (i % 2 === 0 ? 1 : -1);
      var py = curY * 6 * (i < 2 ? 1 : -1);
      el.style.setProperty('--bx' + (i + 1), (b.cx + dx + px).toFixed(3) + '%');
      el.style.setProperty('--by' + (i + 1), (b.cy + dy + py).toFixed(3) + '%');
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
