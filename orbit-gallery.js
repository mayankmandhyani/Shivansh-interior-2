/* SHIVANSH INTERIORS — Orbit gallery (Projects page)
   Desktop only. Nine real project photos settle into a shallow arc on
   entrance, then drift gently as the page scrolls through this
   section — reads scroll position via ScrollTrigger's scrub, never
   captures or hijacks the scroll itself; the page scrolls completely
   normally throughout.

   Mobile/touch gets none of this — see the (max-width:900px),(hover:none)
   block in style.css. That's deliberate: this codebase has already hit
   two separate bugs where a JS-driven mobile reveal/opacity animation
   got permanently stuck invisible. Rather than risk a third, mobile
   here has zero JS-driven positioning or entrance state at all — cards
   are plain, static, and visible from the first frame, full stop.

   Safety: if GSAP/ScrollTrigger fail to load for any reason, this
   whole script no-ops and the cards simply sit in their default CSS
   state. On desktop that's opacity:0 (since positioning is JS-driven),
   so a CSS-only fallback additionally forces them visible after a
   short delay in case the scripts never arrive — see the bottom of
   this file. */
(() => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const stage = document.getElementById('orbitStage');
  const track = document.getElementById('orbitTrack');
  if (!stage || !track) return;

  const cards = gsap.utils.toArray('.orbit-card', track);
  if (!cards.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px) and (hover: hover)', () => {
    const layout = () => {
      const w = stage.offsetWidth;
      const arcWidth = w * 0.78;
      const arcHeight = Math.min(70, w * 0.05);
      const n = cards.length;

      cards.forEach((card, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const centered = t - 0.5;
        const x = centered * arcWidth;
        const y = -arcHeight * (1 - 4 * centered * centered); // shallow upward arc
        const rotation = centered * 10;
        const scale = 1 - Math.abs(centered) * 0.22;

        gsap.set(card, {
          xPercent: -50, yPercent: -50,
          x, y, rotation, scale,
          zIndex: Math.round((1 - Math.abs(centered)) * 10),
        });
      });
    };

    layout();
    window.addEventListener('resize', layout);

    // Entrance: scatter -> settle into the arc, once, on load.
    gsap.set(cards, { opacity: 0 });
    const entrance = gsap.to(cards, {
      opacity: 1,
      duration: prefersReducedMotion ? 0.01 : 1,
      stagger: prefersReducedMotion ? 0 : 0.06,
      ease: 'power2.out',
    });

    // Scroll-linked drift: reads scroll progress through the section,
    // applies a small, restrained horizontal offset to the whole
    // track. Never pins, never captures the scroll event itself.
    let driftTween;
    if (!prefersReducedMotion) {
      driftTween = gsap.to(track, {
        x: 36,
        ease: 'none',
        scrollTrigger: {
          trigger: stage,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }

    // Subtle mouse parallax, additive on top of the scroll drift.
    let mouseHandler;
    if (!prefersReducedMotion) {
      mouseHandler = (e) => {
        const rect = stage.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        gsap.to(track, { rotationY: relX * 4, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      };
      stage.addEventListener('mousemove', mouseHandler);
      stage.style.perspective = '1200px';
    }

    return () => {
      window.removeEventListener('resize', layout);
      if (mouseHandler) stage.removeEventListener('mousemove', mouseHandler);
      entrance.kill();
      if (driftTween) driftTween.scrollTrigger && driftTween.scrollTrigger.kill();
      gsap.set(cards, { clearProps: 'all' });
    };
  });
})();

/* CSS-only safety net: if the GSAP/ScrollTrigger CDN scripts fail to
   load entirely (network issue, ad-blocker), the block above never
   runs, and desktop cards would sit at their CSS default of
   opacity:0 forever with no positioning. Force them visible in a
   simple static row after a short delay as a last-resort fallback —
   never leave them permanently invisible regardless of cause. */
(() => {
  setTimeout(() => {
    if (typeof gsap === 'undefined') {
      document.querySelectorAll('.orbit-card').forEach((card) => {
        card.style.opacity = '1';
        card.style.position = 'static';
        card.style.display = 'inline-block';
        card.style.margin = '0 8px';
      });
    }
  }, 2500);
})();
