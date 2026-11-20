/*
 * ROLL action (bottom action bar): a free dice roller in a dialog.
 * OWNER: Person B
 *
 * Choose how many dice and a modifier, then press a die button to roll it.
 * The result shows every individual die AND the total, in text, and is
 * announced through the dialog's own live region (the page behind a modal
 * dialog is inert, so the action-bar status can't be heard while it is open).
 * Attack to-hit and damage rolls live on the Combat card (cards/combat.js).
 */
(function (WASD) {
  'use strict';

  const dialog = document.getElementById('roll-dialog');
  const openBtn = document.getElementById('roll-btn');
  const countEl = document.getElementById('roll-count');
  const modEl = document.getElementById('roll-mod');
  const errorEl = document.getElementById('roll-error');
  const resultEl = document.getElementById('roll-result');
  const historyEl = document.getElementById('roll-history');
  const modal = WASD.modal(dialog);

  const DICE = [4, 6, 8, 10, 12, 20, 100];
  const history = [];
  let clearTimer;

  document.getElementById('roll-dice').innerHTML = DICE.map((s) =>
    `<button type="button" class="btn die-btn" data-sides="${s}" aria-label="Roll d${s}">d${s}</button>`).join('');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
    countEl.toggleAttribute('aria-invalid', !!msg);
    modEl.toggleAttribute('aria-invalid', !!msg);
  }

  function say(message) {
    // Clear then set, so the same text twice in a row is still announced.
    resultEl.textContent = '';
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => { resultEl.textContent = message; }, 50);
  }

  function rollDie(sides) {
    const countText = countEl.value.trim();
    const modText = modEl.value.trim() === '' ? '0' : modEl.value.trim();
    if (!/^\d+$/.test(countText) || Number(countText) < 1 || Number(countText) > 20) {
      showError('Number of dice must be a whole number from 1 to 20.');
      countEl.focus();
      return;
    }
    if (!/^-?\d+$/.test(modText) || Math.abs(Number(modText)) > 99) {
      showError('Modifier must be a whole number from -99 to 99.');
      modEl.focus();
      return;
    }
    showError('');

    const count = Number(countText);
    const mod = Number(modText);
    const rolls = WASD.dice.roll(count, sides);
    const total = WASD.dice.sum(rolls) + mod;

    const expr = `${count}d${sides}${mod ? WASD.signed(mod) : ''}`;
    const detail = `${expr}: rolled ${rolls.join(', ')}${mod ? `, modifier ${WASD.signed(mod)}` : ''}`;
    let note = '';
    if (sides === 20 && count === 1) {
      if (rolls[0] === 20) note = ' Natural 20.';
      else if (rolls[0] === 1) note = ' Natural 1.';
    }

    resultEl.dataset.total = String(total);
    say(`${detail}. Total ${total}.${note}`);
    document.getElementById('roll-total').textContent = String(total);
    document.getElementById('roll-detail').textContent = `${detail}${note}`;

    history.unshift(`${expr} = ${total}`);
    history.length = Math.min(history.length, 5);
    historyEl.innerHTML = history.map((h) => `<li>${WASD.esc(h)}</li>`).join('');
  }

  document.getElementById('roll-dice').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-sides]');
    if (btn) rollDie(Number(btn.dataset.sides));
  });

  openBtn.addEventListener('click', () => {
    showError('');
    modal.open(openBtn, dialog.querySelector('[data-sides="20"]'));
  });
  document.getElementById('close-roll').addEventListener('click', () => modal.close());
})(window.WASD);
