/* ============================================================================
   SHIVANSH INTERIORS — Project Consultation Wizard
   Self-contained: builds its own modal DOM on first open, appended to
   <body>. Does not touch or require any existing markup on your pages.

   To trigger it, add data-cw-trigger to ANY button/link you already have
   or add a new one, e.g.:

     <button type="button" class="cw-trigger" data-cw-trigger>
       Start Consultation
     </button>

   You choose where that button lives — nothing is auto-inserted into the
   page layout by this file. You can also open it from your own code with
   ShivanshConsultation.open().
   ============================================================================ */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '919106544247';

  const STAGES = [
    { icon: '🏡', label: 'Project Details' },
    { icon: '🎨', label: 'Design Preferences' },
    { icon: '💰', label: 'Budget & Timeline' },
    { icon: '📲', label: 'Review' }
  ];

  const STEPS = [
    { id: 'welcome', type: 'welcome' },

    {
      id: 'propertyType', type: 'single', stage: 0, field: 'propertyType',
      eyebrow: 'Project Details', title: 'What type of property is this?',
      options: ['Apartment', 'Villa', 'Bungalow', 'Office', 'Retail Store', 'Restaurant / Café', 'Commercial Space', 'Other']
    },
    {
      id: 'propertySize', type: 'single', stage: 0, field: 'propertySize',
      eyebrow: 'Project Details', title: 'Approximately how large is the property?',
      options: ['Under 800 sq.ft.', '800–1200 sq.ft.', '1200–1800 sq.ft.', '1800–2500 sq.ft.', '2500–4000 sq.ft.', 'Above 4000 sq.ft.']
    },
    {
      id: 'services', type: 'multi', stage: 0, field: 'services',
      eyebrow: 'Project Details', title: 'What services are you looking for?',
      subtitle: 'Select as many as apply.',
      options: ['Complete Interior Design', 'Full Home Renovation', 'Modular Kitchen', 'Furniture & Wardrobes', 'False Ceiling', 'Painting', 'Electrical Work', 'Bathroom Renovation', 'Office Interiors', 'Turnkey Project']
    },
    {
      id: 'designStyle', type: 'single', stage: 1, field: 'designStyle',
      eyebrow: 'Design Preferences', title: 'Which design style do you prefer?',
      options: ['Modern', 'Minimal Luxury', 'Contemporary', 'Classic', 'Scandinavian', 'Industrial', 'Luxury', 'Not Sure Yet']
    },
    {
      id: 'budget', type: 'single', stage: 2, field: 'budget',
      eyebrow: 'Budget & Timeline', title: 'What is your estimated budget?',
      options: ['Under ₹5 Lakhs', '₹5–10 Lakhs', '₹10–20 Lakhs', '₹20–40 Lakhs', 'Above ₹40 Lakhs', 'Prefer to Discuss']
    },
    {
      id: 'timeline', type: 'single', stage: 2, field: 'timeline',
      eyebrow: 'Budget & Timeline', title: 'When would you like to begin?',
      options: ['Immediately', 'Within 1 Month', '1–3 Months', '3–6 Months', 'Just Exploring']
    },
    {
      id: 'name', type: 'text', stage: 3, field: 'name',
      eyebrow: 'Review', title: 'Almost there — what should we call you?',
      placeholder: 'Enter Your Name'
    },
    { id: 'summary', type: 'summary', stage: 3, eyebrow: 'Review', title: 'Project Summary' },
    { id: 'cta', type: 'cta' }
  ];

  const CHECK_SVG = '<svg viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CLOSE_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const CHECKMARK_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5.5 5.5L20 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.13L2 22l5.13-1.55a9.87 9.87 0 004.91 1.3h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2zm5.83 14.1c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.13.11-1.83-.11-.42-.14-.96-.3-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2 .9 2.15.07.15.12.32.02.51-.1.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.29.29-.12.57.16.29.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.71.81 2 .96.29.14.48.21.55.33.07.12.07.68-.17 1.36z"/></svg>';

  let state = defaultState();
  let current = 0;
  let lastDirection = null;
  let overlay = null, modal = null, refs = null, lastFocused = null;
  let projectContext = null; // set on open() when launched in Project Enquiry mode

  function defaultState() {
    return { propertyType: null, propertySize: null, services: [], designStyle: null, budget: null, timeline: null, name: '' };
  }

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    children.flat().forEach((c) => {
      if (c === null || c === undefined) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function buildMessage() {
    const lines = [
      'Hello Shivansh Interiors,', '',
      'I would like to schedule an interior design consultation.', ''
    ];
    if (projectContext) {
      lines.push('Project of Interest:', projectContext, '');
    }
    lines.push(
      'Here are my project details:', '',
      'Name:', state.name.trim(), '',
      'Property Type:', state.propertyType, '',
      'Property Size:', state.propertySize, '',
      'Services Required:', state.services.join(', '), '',
      'Preferred Style:', state.designStyle, '',
      'Estimated Budget:', state.budget, '',
      'Timeline:', state.timeline, '',
      'I would appreciate discussing my project with your team.', '',
      'Thank you.'
    );
    return lines.join('\n');
  }

  function waLink() {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage());
  }

  function canGoNext() {
    const step = STEPS[current];
    if (step.type === 'multi') return state[step.field].length > 0;
    if (step.type === 'text') return state[step.field].trim().length > 0;
    return true;
  }

  function goTo(index, direction) {
    current = index;
    lastDirection = direction || null;
    updateProgress();
    renderStep();
  }
  function next() { if (current < STEPS.length - 1) goTo(current + 1, 'fwd'); }
  function back() { if (current > 0) goTo(current - 1, 'back'); }

  function updateProgress() {
    const step = STEPS[current];
    const stageEls = refs.progress.querySelectorAll('.cw-stage');
    if (step.stage === undefined) {
      refs.progress.style.opacity = '0';
      return;
    }
    refs.progress.style.opacity = '1';
    stageEls.forEach((s, i) => {
      s.classList.toggle('is-active', i === step.stage);
      s.classList.toggle('is-done', i < step.stage);
    });
  }

  function renderOptions(step, wrap) {
    const grid = el('div', { class: 'cw-grid' });
    step.options.forEach((label) => {
      const isMulti = step.type === 'multi';
      const selected = isMulti ? state[step.field].includes(label) : state[step.field] === label;
      const btnAttrs = { type: 'button', class: 'cw-option' + (selected ? ' is-selected' : '') };
      if (isMulti) btnAttrs['data-multi'] = '';
      const btn = el('button', btnAttrs, el('span', null, label), el('span', { class: 'cw-option__check', html: CHECK_SVG }));

      btn.addEventListener('click', () => {
        if (isMulti) {
          const list = state[step.field];
          const idx = list.indexOf(label);
          if (idx > -1) list.splice(idx, 1); else list.push(label);
          btn.classList.toggle('is-selected', list.includes(label));
          const nextBtn = refs.footer.querySelector('.cw-btn--primary');
          if (nextBtn) nextBtn.disabled = !canGoNext();
        } else {
          state[step.field] = label;
          grid.querySelectorAll('.cw-option').forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          setTimeout(next, 320);
        }
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
  }

  function renderStep() {
    const step = STEPS[current];
    refs.body.innerHTML = '';
    refs.footer.innerHTML = '';
    refs.footer.className = 'cw-footer';
    const panel = el('div', { class: 'cw-panel' + (lastDirection === 'back' ? ' cw-panel--back' : '') });

    if (step.type === 'welcome') {
      panel.className += ' cw-welcome';
      panel.appendChild(el('div', { class: 'cw-welcome__mark' }, '✦'));
      panel.appendChild(el('h2', { class: 'cw-title' }, "Let's Understand Your Project"));
      panel.appendChild(el('p', { class: 'cw-subtitle' }, 'Answer a few quick questions to receive a personalised consultation.'));
      refs.body.appendChild(panel);

      const startBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--primary cw-btn--full' }, 'Start Consultation');
      startBtn.addEventListener('click', next);
      refs.footer.className = 'cw-footer cw-footer--single';
      refs.footer.appendChild(startBtn);
      return;
    }

    if (step.type === 'single' || step.type === 'multi') {
      panel.appendChild(el('p', { class: 'cw-eyebrow' }, step.eyebrow));
      panel.appendChild(el('h2', { class: 'cw-title' }, step.title));
      if (step.subtitle) panel.appendChild(el('p', { class: 'cw-subtitle' }, step.subtitle));
      renderOptions(step, panel);
      refs.body.appendChild(panel);

      const backBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--ghost' }, 'Back');
      backBtn.addEventListener('click', back);
      refs.footer.appendChild(backBtn);

      if (step.type === 'multi') {
        const nextAttrs = { type: 'button', class: 'cw-btn cw-btn--primary' };
        if (!canGoNext()) nextAttrs.disabled = '';
        const nextBtn = el('button', nextAttrs, 'Next');
        nextBtn.addEventListener('click', next);
        refs.footer.appendChild(nextBtn);
      }
      return;
    }

    if (step.type === 'text') {
      panel.appendChild(el('p', { class: 'cw-eyebrow' }, step.eyebrow));
      panel.appendChild(el('h2', { class: 'cw-title' }, step.title));
      const input = el('input', { type: 'text', class: 'cw-field', placeholder: step.placeholder, autocomplete: 'name' });
      input.value = state[step.field];
      panel.appendChild(input);
      refs.body.appendChild(panel);

      const backBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--ghost' }, 'Back');
      backBtn.addEventListener('click', back);
      const nextBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--primary' }, 'Next');
      nextBtn.disabled = !canGoNext();
      nextBtn.addEventListener('click', next);
      refs.footer.appendChild(backBtn);
      refs.footer.appendChild(nextBtn);

      input.addEventListener('input', (e) => {
        state[step.field] = e.target.value;
        nextBtn.disabled = !canGoNext();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && canGoNext()) next();
      });
      setTimeout(() => input.focus(), 350);
      return;
    }

    if (step.type === 'summary') {
      panel.appendChild(el('p', { class: 'cw-eyebrow' }, step.eyebrow));
      panel.appendChild(el('h2', { class: 'cw-title' }, step.title));
      const rows = [
        { k: 'Name', v: state.name, jump: 'name' },
        { k: 'Property Type', v: state.propertyType, jump: 'propertyType' },
        { k: 'Property Size', v: state.propertySize, jump: 'propertySize' },
        { k: 'Services', v: state.services.join(', '), jump: 'services' },
        { k: 'Design Style', v: state.designStyle, jump: 'designStyle' },
        { k: 'Budget', v: state.budget, jump: 'budget' },
        { k: 'Timeline', v: state.timeline, jump: 'timeline' }
      ];
      const box = el('div', { class: 'cw-summary' });
      rows.forEach((r) => {
        const row = el('div', { class: 'cw-summary__row' },
          el('div', { class: 'cw-summary__k' }, r.k),
          el('div', { class: 'cw-summary__v' }, r.v || '—'),
          el('div', { class: 'cw-summary__edit' }, 'Edit'));
        row.addEventListener('click', () => {
          const idx = STEPS.findIndex((s) => s.id === r.jump);
          if (idx > -1) goTo(idx, 'back');
        });
        box.appendChild(row);
      });
      panel.appendChild(box);
      refs.body.appendChild(panel);

      const backBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--ghost' }, 'Back');
      backBtn.addEventListener('click', back);
      const nextBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--primary' }, 'Continue');
      nextBtn.addEventListener('click', next);
      refs.footer.appendChild(backBtn);
      refs.footer.appendChild(nextBtn);
      return;
    }

    if (step.type === 'cta') {
      panel.className += ' cw-welcome';
      panel.appendChild(el('div', { class: 'cw-welcome__mark', html: WA_SVG }));
      panel.appendChild(el('h2', { class: 'cw-title' }, 'Your project brief is ready'));
      panel.appendChild(el('p', { class: 'cw-subtitle' }, "One tap sends your details straight to Shivansh Interiors on WhatsApp — we'll respond personally."));
      refs.body.appendChild(panel);

      const waBtn = el('button', { type: 'button', class: 'cw-btn cw-btn--whatsapp cw-btn--full', html: WA_SVG + '<span>Continue on WhatsApp</span>' });
      waBtn.addEventListener('click', sendToWhatsApp);
      refs.footer.className = 'cw-footer cw-footer--single';
      refs.footer.appendChild(waBtn);
      return;
    }
  }

  function sendToWhatsApp() {
    refs.body.innerHTML = '';
    refs.footer.innerHTML = '';
    refs.progress.style.opacity = '0';
    const success = el('div', { class: 'cw-success' },
      el('div', { class: 'cw-success__mark', html: CHECKMARK_SVG }),
      el('p', { class: 'cw-success__text' }, 'Perfect! Your project brief is ready. Redirecting you to WhatsApp…'));
    refs.body.appendChild(success);
    setTimeout(() => { window.location.href = waLink(); }, 750);
  }

  function trapFocus(e) {
    const focusable = modal.querySelectorAll('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function buildShell() {
    overlay = el('div', { class: 'cw-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Project Consultation' });
    modal = el('div', { class: 'cw-modal' });

    const closeBtn = el('button', { class: 'cw-close', type: 'button', 'aria-label': 'Close', html: CLOSE_SVG });
    closeBtn.addEventListener('click', close);

    const contextBanner = el('div', { class: 'cw-context' });

    const progress = el('div', { class: 'cw-progress' });
    STAGES.forEach((s) => {
      progress.appendChild(el('div', { class: 'cw-stage' },
        el('div', { class: 'cw-stage__bar' }),
        el('div', { class: 'cw-stage__icon' }, s.icon),
        el('div', { class: 'cw-stage__label' }, s.label)));
    });

    const body = el('div', { class: 'cw-body' });
    const footer = el('div', { class: 'cw-footer' });

    modal.appendChild(closeBtn);
    modal.appendChild(contextBanner);
    modal.appendChild(progress);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') trapFocus(e);
    });

    refs = { progress, body, footer, contextBanner };
  }

  function updateContextBanner() {
    if (!refs || !refs.contextBanner) return;
    if (projectContext) {
      refs.contextBanner.textContent = 'Enquiring about: ' + projectContext;
      refs.contextBanner.classList.add('is-visible');
    } else {
      refs.contextBanner.textContent = '';
      refs.contextBanner.classList.remove('is-visible');
    }
  }

  function open(context) {
    if (!overlay) buildShell();
    state = defaultState();
    current = 0;
    lastDirection = null;
    projectContext = (context && context.projectName) ? context.projectName : null;
    updateContextBanner();
    updateProgress();
    renderStep();
    lastFocused = document.activeElement;
    overlay.classList.add('is-open');
    document.body.classList.add('cw-lock');
    setTimeout(() => { const f = modal.querySelector('button, input'); if (f) f.focus(); }, 400);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('cw-lock');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function bindTriggers() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-cw-trigger]');
      if (trigger) { e.preventDefault(); open(); }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTriggers);
  } else {
    bindTriggers();
  }

  window.ShivanshConsultation = { open, close };
})();
