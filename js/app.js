/*
 * app.js: bootstrap. Loads the character, fills the header, starts the router.
 * OWNER: Person A
 * Loaded LAST in index.html.
 */
(function (WASD) {
  'use strict';

  // Loads the saved character from localStorage, or the sample (Kira) the first time.
  WASD.loadCharacter();

  /** Header zone: character name plus three stat tiles (Level, HP, AC unless changed in Settings). */
  WASD.renderHeader = function () {
    const ch = WASD.character;
    document.getElementById('char-name').textContent = ch.identity.name;
    document.getElementById('header-stats').innerHTML = WASD.settings.headerTiles(ch)
      .map((t) => `<div class="header-stat"><dt>${WASD.esc(t.label)}</dt><dd>${t.value}</dd></div>`).join('');
  };

  /** Called by WASD.updateCharacter() after every change. */
  WASD.refresh = function () {
    WASD.renderHeader();
    WASD.router.refresh();
  };

  WASD.renderHeader();
  WASD.router.start();
})(window.WASD);
