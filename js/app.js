/*
 * app.js: bootstrap. Loads the character, fills the header, starts the router.
 * OWNER: Person A
 * Loaded LAST in index.html.
 */
(function (WASD) {
  'use strict';

  // Loads the saved character from localStorage, or the sample (Kira) the first time.
  WASD.loadCharacter();

  /** Header zone: character name plus Level / HP / AC tiles. */
  WASD.renderHeader = function () {
    const ch = WASD.character;
    const id = ch.identity;
    const hp = ch.combat.hp;
    const { esc } = WASD;
    document.getElementById('char-name').textContent = id.name;
    document.getElementById('header-stats').innerHTML = `
      <div class="header-stat"><dt>${esc(id.race)} ${esc(id.className)}</dt><dd>Level ${id.level}</dd></div>
      <div class="header-stat"><dt>Hit points</dt><dd>${hp.current}<span aria-hidden="true">/</span><span class="visually-hidden"> of </span>${hp.max}</dd></div>
      <div class="header-stat"><dt>Armor class</dt><dd>${ch.combat.armorClass}</dd></div>`;
  };

  /** Called by WASD.updateCharacter() after every change. */
  WASD.refresh = function () {
    WASD.renderHeader();
    WASD.router.refresh();
  };

  WASD.renderHeader();
  WASD.router.start();
})(window.WASD);
