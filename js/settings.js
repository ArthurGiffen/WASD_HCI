/*
 * settings.js: the Settings dialog (gear button in the header): color theme and Large text.
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

  openBtn.addEventListener('click', () => {
    const s = current();
    const radio = document.getElementById(`theme-${s.theme}`);
    if (radio) radio.checked = true;
    largeBox.checked = s.largeText;
    modal.open(openBtn, radio);
  });
  document.getElementById('close-settings').addEventListener('click', () => modal.close());

  WASD.settings = { THEMES, apply, current };
})(window.WASD);
