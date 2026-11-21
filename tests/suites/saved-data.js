// Saved-data suite (with saved-data-head.js): old, corrupt and unknown saved data must never break the app.
const out = [];
const ok = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
const errors = [];
window.addEventListener('error', (e) => errors.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
const $ = (s) => document.querySelector(s);
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 100));
const click = async (s) => { $(s).click(); await tick(); };
const type = (s, v) => { $(s).value = v; $(s).dispatchEvent(new Event('input', { bubbles: true })); };
(async () => {
  try {
    const q = location.search;
    if (q.includes('old=1') || q.includes('badjson=1')) {
      ok(errors.length === 0, 'app loads without errors: ' + errors.join(' | '));
      ok(document.querySelectorAll('.card').length === 7, 'hub shows 7 cards (got ' + document.querySelectorAll('.card').length + ')');
      ok(!!WASD.character && WASD.character.combat.armorClass === 15, 'character usable, AC ' + (WASD.character && WASD.character.combat.armorClass));
      if (q.includes('badjson')) ok(['parchment', 'dark', 'contrast', 'forest', 'arcane'].includes(document.documentElement.dataset.theme), 'unknown saved theme falls back: ' + document.documentElement.dataset.theme);
    } else {
      // R2: temp HP field shows stale number after temp HP is used up
      WASD.resetCharacter(); await tick();
      type('#temp-hp', '5'); await click('#temp-set');
      type('#hp-amount', '8'); await click('#hp-damage');
      ok(WASD.raw.combat.hp.temp === 0, 'temp HP used up');
      ok($('#temp-hp').value === '0', 'temp field shows current temp HP (shows "' + $('#temp-hp').value + '")');
      // R3: error message survives Reset demo / New character
      type('#hp-amount', 'abc'); await click('#hp-heal');
      ok(!!$('#hp-error'), 'error shown');
      await click('#reset-demo'); await click('#confirm-yes'); await tick(150);
      ok(!$('#hp-error'), 'error cleared after Reset demo');
      ok($('#hp-amount').value === '1', 'amount back to 1 after reset (is "' + $('#hp-amount').value + '")');
      ok(errors.length === 0, 'no JS errors: ' + errors.join(' | '));
    }
  } catch (e) { out.push('EXCEPTION ' + e.stack); }
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
