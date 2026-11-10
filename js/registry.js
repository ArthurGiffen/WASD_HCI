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
