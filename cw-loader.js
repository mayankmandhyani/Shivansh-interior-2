/* ============================================================================
   SHIVANSH INTERIORS — Consultation Wizard Loader
   The ONLY wizard-related file that loads on every page by default. It is
   intentionally tiny: it just watches for a click on any element carrying
   data-cw-trigger, and only THEN fetches consultation-wizard.css/.js —
   meaning the actual wizard (styles, 9-step engine) is never downloaded or
   parsed unless someone actually opens it. Same engine, same trigger
   contract, on every page — nothing here is page-specific.
   ============================================================================ */

(function () {
  'use strict';

  var WIZARD_CSS = 'consultation-wizard.css';
  var WIZARD_JS = 'consultation-wizard.js';
  var loading = false, ready = false;

  function loadWizard(onReady) {
    if (ready) { onReady(); return; }
    if (loading) {
      document.addEventListener('cw:ready', onReady, { once: true });
      return;
    }
    loading = true;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = WIZARD_CSS;
    document.head.appendChild(link);

    var script = document.createElement('script');
    script.src = WIZARD_JS;
    script.onload = function () {
      ready = true;
      document.dispatchEvent(new Event('cw:ready'));
      onReady();
    };
    document.body.appendChild(script);
  }

  function readProjectContext() {
    // The project detail modal is a single shared element populated by
    // main.js's openModal() before it becomes visible/clickable — reading
    // its title here at click time is always in sync with whichever
    // project the visitor is currently looking at. No separate state to
    // maintain, nothing in main.js needed to change.
    var titleEl = document.querySelector('[data-modal-title]');
    var name = titleEl ? titleEl.textContent.trim() : '';
    return name ? { projectName: name } : null;
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-cw-trigger]');
      if (!trigger) return;
      e.preventDefault();
      var context = trigger.getAttribute('data-cw-mode') === 'project' ? readProjectContext() : null;
      loadWizard(function () { window.ShivanshConsultation.open(context); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
