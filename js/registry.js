/*
 * registry.js: shared namespace, card registry and small helpers.
 * OWNER: Person A
 *
 * Every script attaches to window.WASD. We use plain <script> tags (not ES
 * modules) so index.html also works when double-clicked / opened from disk.
 */
window.WASD = window.WASD || {};

(function (WASD) {
  'use strict';

  const cards = {};

  /**
   * Register a card module. Each file in js/cards/ calls this exactly once.
   *
   * @param {object}   def
   * @param {string}   def.id       URL-safe id, e.g. "combat" (used in #/card/combat)
   * @param {string}   def.title    Card heading text
   * @param {Function} def.summary  (character) => plain-text one-liner shown on the
   *                                collapsed card. Put the most-used value FIRST.
   * @param {Function} def.render   (character, ctx) => HTML string for the card body.
   *        ctx.view: "hub" (inside a collapsible card) or "page" (card view)
   *        ctx.sub:  tag name to use for sub-headings ("h3" on hub, "h2" on page)
   *                  so the heading outline is always correct.
   *        Pass every value that comes from the character through WASD.esc().
   */
  WASD.registerCard = function (def) {
    if (cards[def.id]) console.warn('Card registered twice:', def.id);
    cards[def.id] = def;
  };

  WASD.getCard = (id) => cards[id] || null;

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Escape text before putting it in an HTML string. */
  WASD.esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

  /** Display helper: 3 -> "+3", -1 -> "-1". Formatting only, not game rules. */
  WASD.signed = (n) => (n >= 0 ? '+' : '') + n;

  /**
   * Click and input handling for controls inside cards. Cards are re-drawn as
   * HTML strings, so we listen once on the document instead of on each button.
   *   <button data-action="hp-heal">   ->  WASD.actions['hp-heal'](button, event)
   *   <input  data-input="hp-amount">  ->  WASD.inputs['hp-amount'](input, event)
   * Buttons use aria-disabled (not `disabled`) so they keep focus; those clicks are ignored here.
   */
  WASD.actions = {};
  WASD.inputs = {};
  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) { WASD.lastActionId = ''; return; }
    if (el.getAttribute('aria-disabled') === 'true') return;
    // Remember which control was used: Safari doesn't focus a button when it is clicked,
    // and the redraw after the action needs to know where focus belongs.
    WASD.lastActionId = el.id || '';
    const fn = WASD.actions[el.dataset.action];
    if (fn) fn(el, event);
  });
  // Moving focus anywhere else means that control is no longer "the one in use".
  WASD.lastActionId = '';
  document.addEventListener('focusin', (event) => {
    if (event.target.id !== WASD.lastActionId) WASD.lastActionId = '';
  });
  document.addEventListener('input', (event) => {
    const el = event.target.closest('[data-input]');
    const fn = el && WASD.inputs[el.dataset.input];
    if (fn) fn(el, event);
  });

  /**
   * Line icons (24x24, stroke only) drawn inline. Always decorative: the
   * button or heading next to them carries the text label.
   */
  const ICONS = {
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    check: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/>',
    levelup: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  };
  /** Inline SVG icon markup. Decorative (aria-hidden). */
  WASD.icon = (name) => `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  let clearTimer;
  /**
   * Show a short message in the action bar AND announce it to screen readers
   * (the #status element has role="status", a polite live region).
   */
  WASD.announce = function (message) {
    const el = document.getElementById('status');
    if (!el) return;
    el.textContent = '';
    clearTimeout(clearTimer);
    // Small delay so the same message twice in a row is still announced.
    setTimeout(() => { el.textContent = message; }, 50);
    clearTimer = setTimeout(() => { el.textContent = ''; }, 6000);
  };
})(window.WASD);
