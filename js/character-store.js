/*
 * character-store.js: the ONE place the character is loaded, changed and saved.
 *
 *   WASD.raw          the raw inputs (what gets saved)
 *   WASD.character    the derived sheet the cards read (rebuilt on every change)
 *
 *   WASD.updateCharacter((raw) => { raw.combat.hp.current -= 5; });
 *     -> applies the change, saves to localStorage, re-derives, redraws the screen.
 *   WASD.resetCharacter()
 *     -> back to the sample character (use between usability-test participants).
 */
(function (WASD) {
  'use strict';

  // Bump SCHEMA whenever the saved shape changes. A character saved in an older
  // shape is ignored (Kira is loaded instead) rather than crashing the app.
  const STORAGE_KEY = 'wasd.character.v2';
  const SCHEMA = 2;

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  /** True if this saved object can actually be turned into a sheet. */
  function usable(raw) {
    if (!raw || raw.schema !== SCHEMA) return false;
    try { WASD.rules.derive(raw); return true; } catch (e) { return false; }
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (usable(saved)) return saved;
      if (saved) console.warn('WASD: saved character could not be loaded; using the sample character.');
    } catch (e) { /* storage blocked or bad JSON: fall back to the sample */ }
    return clone(WASD.sampleCharacter);
  }

  /** Tell cards that a whole new character was loaded, so they clear typed values and errors. */
  function announceReplaced() {
    document.dispatchEvent(new Event('wasd:character-replaced'));
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(WASD.raw)); } catch (e) { /* ignore */ }
  }

  function rebuild() {
    WASD.character = WASD.rules.derive(WASD.raw);
  }

  WASD.loadCharacter = function () {
    WASD.raw = load();
    rebuild();
  };

  /** Change the character. `change` receives the raw object and edits it in place. */
  WASD.updateCharacter = function (change) {
    change(WASD.raw);
    save();
    rebuild();
    if (WASD.refresh) WASD.refresh();
  };

  /** Replace the whole character (e.g. at the end of the guided build). */
  WASD.setCharacter = function (raw) {
    WASD.raw = clone(raw);
    WASD.raw.schema = SCHEMA;
    save();
    rebuild();
    announceReplaced();
    if (WASD.refresh) WASD.refresh();
  };

  WASD.resetCharacter = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    WASD.raw = clone(WASD.sampleCharacter);
    rebuild();
    announceReplaced();
    if (WASD.refresh) WASD.refresh();
  };

  WASD.SCHEMA = SCHEMA;
})(window.WASD);
