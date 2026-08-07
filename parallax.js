/* ==========================================================================
   SHIVANSH INTERIORS — Projects page cinematic parallax hero
   Pins the section for a scroll span, plays a one-time staggered
   entrance (fade + settle from 105% scale), then drives each image at
   an independent vertical speed (some also rotating 1-2deg) over a
   single scroll-scrubbed timeline for the remainder of the pin.

   Safety: if GSAP/ScrollTrigger fail to load (CDN blocked, offline,
   JS disabled), this script bails out immediately at the top and the
   images stay in their normal CSS state — fully visible, statically
   positioned. Nothing on the page depends on this script succeeding.
   ========================================================================== */
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const section = document.querySelector('.pin-collage');
  if (!section) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  const images = gsap.utils.toArray('.ph-img');
  if (!images.length) return;

  const mm = gsap.matchMedia();

  /* ---------- Desktop / tablet: pinned parallax ---------- */
  mm.add('(min-width: 901px)', () => {
    // Hidden starting state is set here, not in CSS — see the note
    // in style.css above .parallax-hero for why.
    gsap.set(images, { opacity: 0, scale: 1.05 });

    // One-time entrance: fade + settle, staggered, reverses if the
    // user scrolls back above the section before it's finished.
    gsap.to(images, {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });

    // Pinned, scroll-scrubbed parallax drift. One shared timeline on
    // one top-level ScrollTrigger (not on the child tweens) per GSAP
    // best practice. ease:'none' throughout so motion tracks scroll
    // position 1:1 — the "scrub" is what supplies the smoothing.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=120%',
        scrub: 1,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.to('.ph-img--1', { y: -40, ease: 'none' }, 0)
      .to('.ph-img--2', { y: 70, rotate: -1.5, ease: 'none' }, 0)
      .to('.ph-img--3', { y: -22, ease: 'none' }, 0)
      .to('.ph-img--4', { y: 95, rotate: 1.5, ease: 'none' }, 0)
      .to('.ph-img--5', { y: 55, rotate: -1, ease: 'none' }, 0)
      .to('.ph-img--6', { y: -32, rotate: 1, ease: 'none' }, 0);

    // matchMedia cleanup: kill this context's triggers if the
    // viewport crosses back under 901px (e.g. device rotation).
    return () => {
      tl.scrollTrigger && tl.scrollTrigger.kill();
    };
  });

  /* ---------- Mobile: simple stacked reveal, no pin ---------- */
  mm.add('(max-width: 900px)', () => {
    gsap.set(images, { opacity: 0, y: 24 });
    const anim = gsap.to(images, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '.parallax-hero__stage',
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });
    return () => {
      anim.scrollTrigger && anim.scrollTrigger.kill();
    };
  });
})();
