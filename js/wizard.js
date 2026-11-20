/*
 * wizard.js: one step-by-step dialog, shared by Level Up and the guided build.
 *
 *   WASD.wizard.open({
 *     title: 'Level Up',                 // small label above the step heading
 *     finishLabel: 'Confirm level up',   // text of the button on the last step
 *     opener: buttonEl,                  // focus returns here when the wizard closes
 *     initial: { ... },                  // starting values for state.fields
 *     steps: [{
 *       title: 'Hit points',
 *       render(state) -> HTML string,
 *       validate(state) -> null | { message, field }   // field = id to focus
 *       actions: { name(state, el) },     // <button data-wiz-action="name">
 *       rerenderOnChange: true,           // redraw after a radio/select changes
 *     }, ...],
 *     onFinish(state),                   // after the last step validates
 *   });
 *
 * Accessibility:
 *   - Native <dialog> + showModal(): the page behind is inert, Escape closes.
 *   - Each step's heading reads "Step 2 of 4: Proficiency" and gets focus when
 *     the step changes, so screen readers announce where you are.
 *   - Errors appear in a role="alert" message and focus moves to the field.
 *   - Form fields with a `name` are saved to state.fields automatically.
 *   - Nothing is changed until onFinish; Cancel or Escape discards everything.
 *   - A click outside does NOT close it (no lost choices by accident).
 */
(function (WASD) {
  'use strict';

  const dlg = document.getElementById('wizard-dialog');
  const form = document.getElementById('wizard-form');
  const kicker = document.getElementById('wizard-kicker');
  const heading = document.getElementById('wizard-heading');
  const body = document.getElementById('wizard-body');
  const errorEl = document.getElementById('wizard-error');
  const live = document.getElementById('wizard-live');
  const backBtn = document.getElementById('wizard-back');
  const nextBtn = document.getElementById('wizard-next');
  const cancelBtn = document.getElementById('wizard-cancel');

  let cfg = null;
  let state = null;
  let index = 0;
  let finished = false;

  const modal = WASD.modal(dlg, {
    backdropClose: false,
    onClose() {
      if (cfg && !finished && cfg.onCancel) cfg.onCancel();
      cfg = null;
    },
  });

  const step = () => cfg.steps[index];

  /** Announce inside the dialog (the page's own status region is inert while it is open). */
  function say(message) {
    live.textContent = '';
    setTimeout(() => { live.textContent = message; }, 50);
  }

  function showError(err) {
    body.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (!err) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.textContent = err.message;
    errorEl.hidden = false;
    const field = err.field && document.getElementById(err.field);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  }

  /** Draw the current step. focusHeading: true when arriving at a new step. */
  function render(focusHeading) {
    const total = cfg.steps.length;
    kicker.textContent = cfg.title;
    heading.textContent = `Step ${index + 1} of ${total}: ${step().title}`;
    body.innerHTML = step().render(state);
    showError(null);
    backBtn.hidden = index === 0;
    nextBtn.textContent = index === total - 1 ? cfg.finishLabel : 'Next';
    if (focusHeading) heading.focus();
  }

  /** Redraw the same step after a change, keeping focus on the same control. */
  function redraw(focusId) {
    body.innerHTML = step().render(state);
    const el = focusId && document.getElementById(focusId);
    if (el) el.focus();
  }

  // Save every named field into state.fields.
  function store(el) {
    if (!el.name) return;
    if (el.type === 'radio') { if (el.checked) state.fields[el.name] = el.value; }
    else state.fields[el.name] = el.value;
  }
  body.addEventListener('input', (event) => store(event.target));
  body.addEventListener('change', (event) => {
    store(event.target);
    if (step().rerenderOnChange && event.target.name) redraw(event.target.id);
  });

  body.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-wiz-action]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const fn = step().actions && step().actions[btn.dataset.wizAction];
    if (!fn) return;
    const message = fn(state, btn);
    showError(null);
    redraw(btn.id);
    if (message) say(message);
  });

  // Next / Finish is the form's submit button, so Enter in a text field moves on too.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!cfg) return;
    body.querySelectorAll('[name]').forEach(store);
    const err = step().validate ? step().validate(state) : null;
    if (err) { showError(err); return; }
    if (index === cfg.steps.length - 1) {
      finished = true;
      const done = cfg.onFinish;
      const s = state;
      modal.close();
      done(s);
      return;
    }
    index += 1;
    render(true);
  });

  backBtn.addEventListener('click', () => {
    if (index === 0) return;
    index -= 1;
    render(true);
  });

  cancelBtn.addEventListener('click', () => modal.close());

  WASD.wizard = {
    open(config) {
      cfg = config;
      state = { fields: { ...(config.initial || {}) } };
      index = 0;
      finished = false;
      render(false);
      modal.open(config.opener, heading);
    },
    say,
  };
})(window.WASD);
