/* SHIVANSH INTERIORS — "In Motion" video showcase (About page)
   Ported from a Web Component-based Shopify section to plain
   init-once functions — matching every other script on this site.
   The original's connectedCallback/disconnectedCallback lifecycle
   exists to survive a Shopify theme editor re-rendering the section
   on every settings change; that never happens on a static page that
   renders once, so it's dropped rather than ported for its own sake.

   Autoplay is intentionally not gated behind prefers-reduced-motion —
   these are silent, looping, non-flashing clips, not the large-scale
   page motion that preference targets. The section's own entrance
   animation (opacity/transform) DOES fully respect it. Same reasoning
   as the original component. */
(() => {
  const section = document.querySelector('.evs');
  if (!section) return;

  const grid = section.querySelector('.evs-grid');
  const cards = Array.from(section.querySelectorAll('.evs-card'));
  if (!grid || !cards.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Entrance animation ---------- */
  if (prefersReducedMotion) {
    section.classList.add('is-in-view');
  } else {
    const entranceObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-in-view');
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });
    entranceObserver.observe(section);
  }

  /* ---------- Per-card setup ---------- */
  cards.forEach((card) => {
    const video = card.querySelector('.evs-video');
    const poster = card.querySelector('.evs-poster');
    const media = card.querySelector('.evs-media');

    /* Skeleton removal.
       The skeleton should clear once there's something real to show —
       for a video card, that's the poster image (the video itself may
       not load for a while yet, if this card is still off-screen; see
       the lazy-load strategy below). Once the real video does start
       playing, it visually replaces the poster in the same box with
       no shimmer involved either way. */
    const removeSkeleton = () => card.classList.add('is-loaded');
    if (video) {
      const videoPoster = video.getAttribute('poster');
      if (videoPoster) {
        const posterProbe = new Image();
        posterProbe.onload = removeSkeleton;
        posterProbe.onerror = removeSkeleton; // don't get stuck on a broken poster
        posterProbe.src = videoPoster;
      } else {
        removeSkeleton();
      }
    } else if (poster) {
      if (poster.complete) removeSkeleton();
      else poster.addEventListener('load', removeSkeleton, { once: true });
    } else {
      removeSkeleton();
    }

    /* Autoplay + pause-when-offscreen.
       video.play() only fires from inside the IntersectionObserver
       callback below — never unconditionally on load. Combined with
       preload="none"/"metadata" in the HTML (see about.html), this
       means a video genuinely doesn't touch the network until it's
       actually near the viewport, not just "playback is paused while
       secretly still downloading in the background". rootMargin gives
       it a 200px head start so playback is ready by the time it's
       actually visible, not starting cold at that exact moment. */
    if (video) {
      video.muted = true; // belt-and-braces, same as the source component

      const playObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      }, { threshold: 0.1, rootMargin: '200px 0px' });
      playObserver.observe(video);
    }

    /* Sound toggle */
    const soundBtn = card.querySelector('.evs-sound');
    if (soundBtn && video) {
      soundBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        video.muted = !video.muted;
        const unmuted = !video.muted;
        soundBtn.setAttribute('aria-pressed', String(unmuted));
        soundBtn.setAttribute('aria-label', unmuted ? 'Mute video' : 'Unmute video');
        const iconMuted = soundBtn.querySelector('.evs-icon-muted');
        const iconUnmuted = soundBtn.querySelector('.evs-icon-unmuted');
        if (iconMuted) iconMuted.hidden = unmuted;
        if (iconUnmuted) iconUnmuted.hidden = !unmuted;
      });
    }

    /* Cursor-follow dot — mouse only */
    const dot = card.querySelector('.evs-dot');
    if (dot && media) {
      let rafId = null;
      let pendingEvent = null;
      const update = () => {
        const rect = media.getBoundingClientRect();
        dot.style.transform = `translate(${pendingEvent.clientX - rect.left}px, ${pendingEvent.clientY - rect.top}px)`;
        rafId = null;
      };
      media.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        pendingEvent = e;
        if (!rafId) rafId = requestAnimationFrame(update);
      });
      media.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') dot.classList.add('is-visible');
      });
      media.addEventListener('pointerleave', () => dot.classList.remove('is-visible'));
    }
  });

  /* ---------- Drag-to-scroll (mouse only; touch uses native scroll) ---------- */
  let isDown = false, moved = false, startX = 0, scrollStart = 0;

  grid.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    isDown = true; moved = false;
    startX = e.clientX; scrollStart = grid.scrollLeft;
    grid.classList.add('is-dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const delta = e.clientX - startX;
    if (Math.abs(delta) > 4) moved = true;
    grid.scrollLeft = scrollStart - delta;
  });

  window.addEventListener('pointerup', () => {
    if (!isDown) return;
    isDown = false;
    grid.classList.remove('is-dragging');
    if (moved) {
      // A drag shouldn't also fire the card's link click, if it has one.
      const suppressNextClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        grid.removeEventListener('click', suppressNextClick, true);
      };
      grid.addEventListener('click', suppressNextClick, true);
    }
  });
})();
