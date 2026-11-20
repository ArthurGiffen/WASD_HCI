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

  const STORAGE_KEY = 'wasd.character.v1';

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.identity && saved.abilityScores && saved.combat) return saved;
    } catch (e) { /* storage blocked or bad JSON: fall back to the sample */ }
    return clone(WASD.sampleCharacter);
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
    save();
    rebuild();
    if (WASD.refresh) WASD.refresh();
  };

  WASD.resetCharacter = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    WASD.raw = clone(WASD.sampleCharacter);
    rebuild();
    if (WASD.refresh) WASD.refresh();
  };
})(window.WASD);
