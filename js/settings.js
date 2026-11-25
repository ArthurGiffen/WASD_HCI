/*
 * settings.js: the Settings dialog (sliders button in the header): color theme,
 * Large text, and which three stats the header shows.
 * OWNER: Person A
 *
 * Changes apply immediately (live preview) and are saved per browser in
 * localStorage. The <head> of index.html applies the saved choice before the
 * page is drawn, so there is no flash of the wrong theme.
 */
(function (WASD) {
  'use strict';

  const KEY = 'wasd.settings.v1';
  const THEMES = [
    { id: 'parchment', name: 'Parchment', desc: 'Default. Warm paper and crimson.', colors: ['#faf7f2', '#9b1c1c', '#1f1b16'] },
    { id: 'dark', name: 'Dark', desc: 'Light text on dark gray. For low-light tables.', colors: ['#1b1815', '#ff9b8f', '#f4efe9'] },
    { id: 'contrast', name: 'High contrast', desc: 'Black on white with thick borders. For low vision.', colors: ['#ffffff', '#000000', '#000000'] },
    { id: 'forest', name: 'Forest', desc: 'Green instead of red. Errors stay red.', colors: ['#f5f8f3', '#1d5c38', '#16201a'] },
    { id: 'arcane', name: 'Arcane', desc: 'Deep indigo with an orange focus ring.', colors: ['#f5f6fb', '#3d2f91', '#181a2a'] },
  ];

  /*
   * Header stats: the three tiles at the top of every screen. Players asked to
   * pick their own, so each slot can show any of these. `label` is plain text
   * (escaped when drawn); `value` is HTML built from numbers only.
   */
  const signed = (n) => WASD.signed(n);
  const HEADER_STATS = [
    { id: 'level', name: 'Level (race and class)', tile: (ch) => ({ label: `${ch.identity.raceLabel} ${ch.identity.className}`, value: `Level ${ch.identity.level}` }) },
    { id: 'hp', name: 'Hit points', tile: (ch) => ({ label: 'Hit points', value: `${ch.combat.hp.current}<span aria-hidden="true">/</span><span class="visually-hidden"> of </span>${ch.combat.hp.max}` }) },
    { id: 'ac', name: 'Armor class', tile: (ch) => ({ label: 'Armor class', value: `${ch.combat.armorClass}` }) },
    { id: 'initiative', name: 'Initiative', tile: (ch) => ({ label: 'Initiative', value: signed(ch.combat.initiative) }) },
    { id: 'speed', name: 'Speed', tile: (ch) => ({ label: 'Speed', value: `${ch.combat.speed} ft` }) },
    { id: 'proficiency', name: 'Proficiency bonus', tile: (ch) => ({ label: 'Proficiency', value: signed(ch.proficiencyBonus) }) },
    { id: 'passive', name: 'Passive Perception', tile: (ch) => ({ label: 'Passive Perception', value: `${ch.passivePerception}` }) },
    { id: 'spelldc', name: 'Spell save DC', tile: (ch) => ({ label: 'Spell save DC', value: ch.spellcasting ? `${ch.spellcasting.saveDC}` : 'None' }) },
    { id: 'hitdice', name: 'Hit dice', tile: (ch) => ({ label: 'Hit dice', value: WASD.esc(ch.combat.hitDice) }) },
    { id: 'gold', name: 'Gold', tile: (ch) => ({ label: 'Gold', value: `${ch.equipment.coins.gp} gp` }) },
  ];
  const DEFAULT_HEADER = ['level', 'hp', 'ac'];
  const findStat = (id) => HEADER_STATS.find((x) => x.id === id);

  /** The saved header choice, or the default if nothing valid is saved. */
  function readHeaderStats() {
    try {
      const h = (JSON.parse(localStorage.getItem(KEY)) || {}).headerStats;
      if (Array.isArray(h) && h.length === 3 && h.every(findStat)) return h.slice();
    } catch (e) { /* ignore: fall back to the default */ }
    return DEFAULT_HEADER.slice();
  }
  let headerStats = readHeaderStats();

  const root = document.documentElement;
  const dialog = document.getElementById('settings-dialog');
  const openBtn = document.getElementById('settings-btn');
  const list = document.getElementById('theme-list');
  const largeBox = document.getElementById('large-text');
  const live = document.getElementById('settings-live');
  const modal = WASD.modal(dialog);

  const current = () => ({
    theme: root.getAttribute('data-theme') || 'parchment',
    largeText: root.getAttribute('data-text') === 'large',
    headerStats: headerStats.slice(),
  });

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  function apply(s) {
    root.setAttribute('data-theme', s.theme);
    if (s.largeText) root.setAttribute('data-text', 'large');
    else root.removeAttribute('data-text');
  }

  function say(message) {
    live.textContent = '';
    setTimeout(() => { live.textContent = message; }, 50);
  }

  list.innerHTML = THEMES.map((t) => `
    <div class="choice">
      <input type="radio" name="theme" id="theme-${t.id}" value="${t.id}" aria-describedby="theme-${t.id}-desc">
      <label for="theme-${t.id}">
        <span class="swatch" aria-hidden="true">${t.colors.map((c) => `<span style="background:${c}"></span>`).join('')}</span><strong>${t.name}</strong>
        <span class="choice__desc" id="theme-${t.id}-desc">${t.desc}</span>
      </label>
    </div>`).join('');

  list.addEventListener('change', (event) => {
    const s = { ...current(), theme: event.target.value };
    apply(s);
    save(s);
    say(`${THEMES.find((t) => t.id === s.theme).name} theme on.`);
  });

  largeBox.addEventListener('change', () => {
    const s = { ...current(), largeText: largeBox.checked };
    apply(s);
    save(s);
    say(s.largeText ? 'Large text on.' : 'Large text off.');
  });

  // ----- Header stats pickers -----
  const pickers = document.getElementById('header-stat-pickers');
  const SLOT_NAMES = ['First stat', 'Second stat', 'Third stat'];
  pickers.innerHTML = SLOT_NAMES.map((slotName, i) => `
    <div class="field">
      <label for="header-stat-${i}">${slotName}</label>
      <select class="input" id="header-stat-${i}" data-slot="${i}">
        ${HEADER_STATS.map((x) => `<option value="${x.id}">${x.name}</option>`).join('')}
      </select>
    </div>`).join('');
  const syncPickers = () => headerStats.forEach((id, i) => { document.getElementById(`header-stat-${i}`).value = id; });

  function setHeaderStats(list, message) {
    headerStats = list.slice();
    save(current());
    syncPickers();
    WASD.renderHeader();
    say(message);
  }
  pickers.addEventListener('change', (event) => {
    const slot = Number(event.target.dataset.slot);
    const list = headerStats.slice();
    list[slot] = event.target.value;
    setHeaderStats(list, `${SLOT_NAMES[slot]} in the header is now ${findStat(list[slot]).name}.`);
  });
  document.getElementById('header-stats-default').addEventListener('click', () => {
    setHeaderStats(DEFAULT_HEADER, 'Header shows Level, Hit points and Armor class again.');
  });

  openBtn.addEventListener('click', () => {
    const s = current();
    const radio = document.getElementById(`theme-${s.theme}`);
    if (radio) radio.checked = true;
    largeBox.checked = s.largeText;
    syncPickers();
    modal.open(openBtn, radio);
  });
  document.getElementById('close-settings').addEventListener('click', () => modal.close());

  /** The three header tiles for this character: [{ label, value }]. */
  const headerTiles = (ch) => headerStats.map((id) => findStat(id).tile(ch));
  /** Back to Level, Hit points, Armor class (used by Reset demo). */
  const resetHeaderStats = () => { headerStats = DEFAULT_HEADER.slice(); save(current()); };

  WASD.settings = { THEMES, HEADER_STATS, apply, current, headerTiles, resetHeaderStats };
})(window.WASD);
