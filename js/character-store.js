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

  /*
   * Checking a character file someone imports (Identity card). The file is
   * untrusted, so before it is used:
   *   - no text anywhere may contain < > " or ` (nothing in a character needs
   *     them, and that rules out HTML injection wherever a value is drawn);
   *   - the key numbers must be sensible whole numbers;
   *   - it must be our saved shape (schema) and work with the rules engine.
   * Returns { raw } or { error: 'reason in plain words' }.
   */
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  function unsafeText(value) {
    if (typeof value === 'string') return /[<>"`]/.test(value);
    if (Array.isArray(value)) return value.some(unsafeText);
    if (value && typeof value === 'object') return Object.keys(value).some((k) => unsafeText(k) || unsafeText(value[k]));
    return false;
  }
  WASD.checkImport = function (text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return { error: 'This file is not a character file (it is not valid JSON).' }; }
    const raw = data && data.character ? data.character : data;
    if (!raw || typeof raw !== 'object' || !raw.identity || !raw.combat || !raw.abilityScores) {
      return { error: 'This file does not contain a character.' };
    }
    if (raw.schema !== SCHEMA) return { error: 'This character file is from a different version of the app.' };
    if (unsafeText(raw)) return { error: 'This file contains characters that are not allowed (< > " or `).' };
    const id = raw.identity;
    const hp = raw.combat.hp || {};
    const scoresOk = ['str', 'dex', 'con', 'int', 'wis', 'cha'].every((k) => int(raw.abilityScores[k], 1, 30));
    if (typeof id.name !== 'string' || !id.name.trim() || !int(id.level, 1, 20) || !scoresOk
      || !int(hp.max, 1, 9999) || !int(hp.current, 0, hp.max) || !int(hp.temp, 0, 9999)) {
      return { error: 'This character file has missing or impossible numbers (level, ability scores or hit points).' };
    }
    if (!usable(raw)) return { error: 'This character file could not be read.' };
    return { raw };
  };

  WASD.SCHEMA = SCHEMA;
})(window.WASD);
