/* SHIVANSH INTERIORS — shared behaviour */
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Image load failure fallback ----------
     If any .media__zoom image ever fails to load (network hiccup, a
     dead hotlinked URL, temporary CDN issue), fail gracefully instead
     of leaving a blank gap or a browser's broken-image icon — hide
     the img and let the existing decorative gradient (.media::after)
     show through cleanly. Applies site-wide, present and future
     images alike, via event delegation on the capture phase (image
     load/error events don't bubble). */
  document.addEventListener('error', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('media__zoom')) {
      e.target.setAttribute('data-load-failed', '');
    }
  }, true);

  /* ---------- Shared scroll lock ----------
     Used by both the mobile nav drawer and the project modal. Plain
     `overflow:hidden` on body is what most sites use, but on iOS
     Safari it lets the page rubber-band/scroll behind the fixed
     overlay and can jump the scroll position when toggled. Locking
     via `position:fixed` on body (saving/restoring scrollY) is the
     standard fix. A simple lock counter means the nav and modal can
     never fight over body state even if something ever calls both. */
  let scrollLockCount = 0;
  let savedScrollY = 0;

  const lockScroll = () => {
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.classList.add('no-scroll');
    }
    scrollLockCount++;
  };

  const unlockScroll = () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.classList.remove('no-scroll');
      window.scrollTo(0, savedScrollY);
    }
  };

  /* ---------- Page loader ----------
     First-visit-only (sessionStorage) — once dismissed, it never
     shows again for the rest of the browsing session, on any page,
     so page-to-page navigation and repeat visits open instantly.

     Deliberately NOT gated on window.load. window.load waits for
     every resource on the page, including <video> elements — on the
     About page specifically, that meant two ~2.5MB videos were
     directly delaying the loader's dismissal, even though they
     already lazy-load correctly on their own (see evs.js) and were
     never meant to block anything. Tracked instead: actual <img>
     elements + DOMContentLoaded, which is what's actually needed for
     the page to be usable — video keeps loading in the background on
     its own schedule, completely decoupled from this. */
  const loader = document.getElementById('pageLoader');
  if (loader) {
    const alreadySeen = (() => {
      try { return sessionStorage.getItem('shivansh-loader-seen') === '1'; }
      catch (e) { return false; } // sessionStorage unavailable (rare) — fail open, show loader once
    })();

    if (alreadySeen) {
      loader.remove();
    } else {
      const fill = document.getElementById('loaderFill');
      const pct = document.getElementById('loaderPct');
      lockScroll();

      const imgs = Array.from(document.images);
      const total = imgs.length || 1;
      let loadedCount = 0;
      let finished = false;

      const update = () => {
        const percent = Math.min(100, Math.round((loadedCount / total) * 100));
        if (fill) fill.style.width = percent + '%';
        if (pct) pct.textContent = percent + '%';
      };

      imgs.forEach((img) => {
        if (img.complete) {
          loadedCount++;
        } else {
          const mark = () => { loadedCount++; update(); };
          img.addEventListener('load', mark, { once: true });
          img.addEventListener('error', mark, { once: true });
        }
      });
      update();

      const finish = () => {
        if (finished) return;
        finished = true;
        loadedCount = total;
        update();
        unlockScroll();
        loader.classList.add('is-hidden');
        try { sessionStorage.setItem('shivansh-loader-seen', '1'); } catch (e) {}
      };

      const minDisplay = prefersReducedMotion ? 0 : 450;
      const startedAt = Date.now();
      const allImagesReady = () => loadedCount >= total;

      const attemptFinish = () => {
        if (!allImagesReady()) return;
        setTimeout(finish, Math.max(0, minDisplay - (Date.now() - startedAt)));
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attemptFinish);
      } else {
        attemptFinish();
      }
      imgs.forEach((img) => {
        img.addEventListener('load', attemptFinish, { once: true });
        img.addEventListener('error', attemptFinish, { once: true });
      });

      setTimeout(finish, 6000); // safety net — never block the page indefinitely
    }
  }

  /* ---------- Navbar scroll state ---------- */
  const nav = document.querySelector('.nav');
  if (nav && !nav.classList.contains('nav--solid')) {
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav toggle ----------
     Single source of truth for open/closed state (`isOpen`), so the
     drawer, backdrop, toggle button and body scroll lock can never
     disagree with each other — the "sometimes opens with nothing
     visible / sometimes doesn't open" symptoms were a knock-on effect
     of state living in several places (a CSS class here, a body
     class there) instead of one place. Every listener is bound
     exactly once, here, on page load. */
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  const backdrop = document.querySelector('.nav__backdrop');

  if (toggle && links) {
    let isOpen = false;
    let lastToggleAt = 0;
    const TOGGLE_DEBOUNCE_MS = 350; // ~= the drawer's own .55s slide, felt-cooldown

    const openMenu = () => {
      if (isOpen) return;
      isOpen = true;
      links.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      document.body.classList.add('nav-is-open');
      toggle.setAttribute('aria-expanded', 'true');
      lockScroll();
    };

    const closeMenu = () => {
      if (!isOpen) return;
      isOpen = false;
      links.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      document.body.classList.remove('nav-is-open');
      toggle.setAttribute('aria-expanded', 'false');
      unlockScroll();
    };

    toggle.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastToggleAt < TOGGLE_DEBOUNCE_MS) return; // debounce rapid repeated taps
      lastToggleAt = now;
      if (isOpen) closeMenu(); else openMenu();
    });

    // Click outside (the backdrop) closes the menu.
    if (backdrop) backdrop.addEventListener('click', closeMenu);

    // Clicking any nav link closes the menu. For an anchor link
    // (e.g. Services -> #services, whether that's a same-page jump
    // or a cross-page link that ends in a hash), skip the scroll
    // position restore inside closeMenu()/unlockScroll() — restoring
    // the OLD pre-drawer scroll position via scrollTo() directly
    // fights the anchor jump the user just asked for, whether the
    // race lands on this page or the one being navigated to. Every
    // other close-behavior (drawer slide-out, backdrop, body class,
    // aria state) still happens exactly as before; only the
    // scroll-position restore itself is skipped for these links.
    links.querySelectorAll('a').forEach(a => {
      const isAnchorLink = a.getAttribute('href') && a.getAttribute('href').includes('#');
      a.addEventListener('click', () => {
        if (isAnchorLink) {
          // Same close effects as closeMenu(), minus the scrollTo() restore.
          if (!isOpen) return;
          isOpen = false;
          links.classList.remove('is-open');
          if (backdrop) backdrop.classList.remove('is-open');
          document.body.classList.remove('nav-is-open');
          toggle.setAttribute('aria-expanded', 'false');
          scrollLockCount = Math.max(0, scrollLockCount - 1);
          if (scrollLockCount === 0) {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.classList.remove('no-scroll');
            // deliberately no window.scrollTo() here
          }
        } else {
          closeMenu();
        }
      });
    });

    // Escape closes the menu.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Safety net: force-closed if the viewport crosses back to
    // desktop width while open (e.g. rotating a tablet), so state
    // can never get stuck with body scroll locked on desktop.
    window.addEventListener('resize', () => {
      if (isOpen && window.innerWidth > 920) closeMenu();
    });
  }

  /* ---------- Scroll-reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ---------- Active nav link by page ---------- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a[data-page]').forEach(a => {
    if (a.dataset.page === path) a.classList.add('is-active');
  });

  /* ---------- Project filters (projects.html) ---------- */
  const filterBar = document.querySelector('.filters');
  if (filterBar) {
    const buttons = filterBar.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.pcard');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        cards.forEach(card => {
          const match = cat === 'all' || card.dataset.category === cat;
          card.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Project modal ---------- */
  const modal = document.querySelector('.pmodal');
  if (modal) {
    const modalMedia = modal.querySelector('.pmodal__hero .media');
    const modalImg = modal.querySelector('[data-modal-img]');
    const modalGallery = [
      modal.querySelector('[data-modal-gallery-1]'),
      modal.querySelector('[data-modal-gallery-2]'),
      modal.querySelector('[data-modal-gallery-3]')
    ];
    const modalTitle = modal.querySelector('[data-modal-title]');
    const modalLoc = modal.querySelector('[data-modal-loc]');
    const modalTag = modal.querySelector('[data-modal-tag]');
    const modalDesc = modal.querySelector('[data-modal-desc]');
    const modalYear = modal.querySelector('[data-modal-year]');
    const modalArea = modal.querySelector('[data-modal-area]');
    const modalScope = modal.querySelector('[data-modal-scope]');
    const closeBtn = modal.querySelector('.pmodal__close');
    const scrim = modal.querySelector('.pmodal__scrim');
    let modalOpen = false;

    const openModal = (card) => {
      const d = card.dataset;
      if (modalMedia) modalMedia.className = 'media ' + (d.media || 'media--a');
      if (modalImg && d.img) { modalImg.src = d.img; modalImg.alt = d.title || ''; }
      modalGallery.forEach((el, i) => {
        const src = d['gallery-' + (i + 1)];
        if (el && src) { el.src = src; el.alt = (d.title || '') + ' — detail ' + (i + 1); }
      });
      if (modalTitle) modalTitle.textContent = d.title || '';
      if (modalLoc) modalLoc.textContent = d.location || '';
      if (modalTag) modalTag.textContent = d.tag || '';
      if (modalDesc) modalDesc.textContent = d.desc || '';
      if (modalYear) modalYear.textContent = d.year || '—';
      if (modalArea) modalArea.textContent = d.area || '—';
      if (modalScope) modalScope.textContent = d.scope || '—';
      modal.classList.add('is-open');
      modalOpen = true;
      lockScroll();
    };
    const closeModal = () => {
      if (!modalOpen) return;
      modal.classList.remove('is-open');
      modalOpen = false;
      unlockScroll();
    };

    document.querySelectorAll('.pcard, .orbit-card').forEach(card => {
      card.addEventListener('click', () => openModal(card));
    });
    closeBtn && closeBtn.addEventListener('click', closeModal);
    scrim && scrim.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-current-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
