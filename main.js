/* SHIVANSH INTERIORS — shared behaviour */
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('no-scroll', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }));
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
    const modalTitle = modal.querySelector('[data-modal-title]');
    const modalLoc = modal.querySelector('[data-modal-loc]');
    const modalTag = modal.querySelector('[data-modal-tag]');
    const modalDesc = modal.querySelector('[data-modal-desc]');
    const modalYear = modal.querySelector('[data-modal-year]');
    const modalArea = modal.querySelector('[data-modal-area]');
    const modalScope = modal.querySelector('[data-modal-scope]');
    const closeBtn = modal.querySelector('.pmodal__close');
    const scrim = modal.querySelector('.pmodal__scrim');

    const openModal = (card) => {
      const d = card.dataset;
      if (modalMedia) modalMedia.className = 'media media__zoom ' + (d.media || 'media--a');
      if (modalTitle) modalTitle.textContent = d.title || '';
      if (modalLoc) modalLoc.textContent = d.location || '';
      if (modalTag) modalTag.textContent = d.tag || '';
      if (modalDesc) modalDesc.textContent = d.desc || '';
      if (modalYear) modalYear.textContent = d.year || '—';
      if (modalArea) modalArea.textContent = d.area || '—';
      if (modalScope) modalScope.textContent = d.scope || '—';
      modal.classList.add('is-open');
      document.body.classList.add('no-scroll');
    };
    const closeModal = () => {
      modal.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    };

    document.querySelectorAll('.pcard, .masonry__item').forEach(card => {
      card.addEventListener('click', () => openModal(card));
    });
    closeBtn && closeBtn.addEventListener('click', closeModal);
    scrim && scrim.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
