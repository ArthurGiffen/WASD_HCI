/*
 * app.js: bootstrap. Loads the character, fills the header, starts the router.
 * OWNER: Person A
 * Loaded LAST in index.html.
 */
(function (WASD) {
  'use strict';

  // TODO(Person C): replace with loading the player's own character
  // (localStorage / JSON import) once character creation exists.
  WASD.character = WASD.sampleCharacter;

  /** Header zone summary, e.g. "Kira · Rogue 4 · HP 27/31 · AC 15". */
  WASD.renderHeader = function () {
    const ch = WASD.character;
    const id = ch.identity;
    const hp = ch.combat.hp;
    document.getElementById('char-summary').textContent =
      `${id.name} · ${id.className} ${id.level} · HP ${hp.current}/${hp.max} · AC ${ch.combat.armorClass}`;
  };

  WASD.renderHeader();
  WASD.router.start();
})(window.WASD);
