/* ==========================================================================
   SHIVANSH INTERIORS — "Up Close" 3D tilt cards (Projects page)
   Mechanics adapted from a CodePen original by Adrian Payne, MIT
   licensed: https://codepen.io/dazulu/pen/VVZrQv — credited per its
   license. Rebuilt scoped to its own section (the original listened
   on `document`, reacting to the mouse anywhere on the page; here it
   only reacts within the card stage itself, so it doesn't feel
   disconnected from wherever the cursor actually is on a full,
   multi-section page) and desktop/mouse only. A cursor-position
   effect has no honest touch equivalent, so it's skipped entirely on
   touch/coarse-pointer devices rather than faked.
   ========================================================================== */
(function () {
  const stage = document.getElementById('tiltStage');
  const group = document.getElementById('tiltCards');
  if (!stage || !group) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const images = group.querySelectorAll('.tilt-card__img');
  const RANGE = 14; // max rotation in degrees — kept subtle on purpose

  const calc = (pos, size) => (pos / size * RANGE - RANGE / 2).toFixed(2);

  let raf = null;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const yValue = calc(y, rect.height);
      const xValue = calc(x, rect.width);

      group.style.transform = `rotateX(${yValue}deg) rotateY(${xValue}deg)`;
      images.forEach((img) => {
        img.style.transform = `translateX(${(-xValue * 1.6).toFixed(1)}px) translateY(${(yValue * 1.6).toFixed(1)}px)`;
      });
    });
  });

  stage.addEventListener('mouseleave', () => {
    if (raf) cancelAnimationFrame(raf);
    group.style.transform = '';
    images.forEach((img) => { img.style.transform = ''; });
  });
})();
