// Monkey test: random keyboard-user actions, invariants checked after every step.
// ?seed=N&steps=M
const out = [];
const errors = [];
window.addEventListener('error', (e) => errors.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
const tick = (ms) => new Promise((r) => setTimeout(r, ms));
const params = new URLSearchParams(location.search);
let seed = Number(params.get('seed') || 1);
const STEPS = Number(params.get('steps') || 800);
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const VALUES = ['', '0', '1', '1', '5', '8', '30', '999', '1000', '-3', 'abc', '2.5', ' 7 '];

const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && !el.closest('[hidden]') && !el.closest('dialog:not([open])');
function candidates() {
  const dlg = document.querySelector('dialog[open]');
  const scope = dlg || document;
  return [...scope.querySelectorAll('button, a[href^="#/"], input, select')].filter((el) => visible(el) && !(dlg === null && el.closest('dialog')));
}

const log = [];
const seen = { maxLevel: 0, names: new Set(), classes: new Set(), levelUps: 0, resets: 0, lastLevel: 4 };
document.addEventListener('wasd:character-replaced', () => { seen.resets++; });
const failures = {};
function fail(kind, detail) {
  if (failures[kind]) { failures[kind].count++; return; }
  failures[kind] = { count: 1, detail, steps: log.slice(-6) };
}
const describe = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')) + (el.textContent ? ' "' + el.textContent.trim().slice(0, 25) + '"' : '');

function checkInvariants(lastEl) {
  if (errors.length) { fail('js-error', errors.join(' | ')); errors.length = 0; }
  const r = WASD.raw;
  if (r.identity.level > seen.lastLevel) seen.levelUps++;
  seen.lastLevel = r.identity.level;
  seen.maxLevel = Math.max(seen.maxLevel, r.identity.level); seen.names.add(r.identity.name); seen.classes.add(r.identity.race + ' ' + r.identity.className);
  const hp = r.combat.hp;
  if (!(hp.max >= 1 && hp.current >= 0 && hp.current <= hp.max && hp.temp >= 0)) fail('hp-bounds', JSON.stringify(hp));
  if (Object.values(r.equipment.coins).some((v) => v < 0)) fail('coins-negative', JSON.stringify(r.equipment.coins));
  if (r.equipment.items.some((i) => i.qty < 0)) fail('qty-negative', '');
  if (!(r.identity.level >= 1 && r.identity.level <= 20)) fail('level-range', r.identity.level);
  if (r.equipment.items.filter((i) => i.armor && i.equipped).length > 1) fail('two-armors', '');
  if (JSON.stringify(WASD.character) !== JSON.stringify(WASD.rules.derive(r))) fail('stale-sheet', 'WASD.character differs from derive(raw)');
  try {
    const saved = localStorage.getItem('wasd.character.v2');
    if (saved && saved !== JSON.stringify(r)) fail('not-saved', 'localStorage differs from current character');
  } catch (e) { /* ignore */ }
  const ids = {};
  document.querySelectorAll('[id]').forEach((el) => { ids[el.id] = (ids[el.id] || 0) + 1; });
  const dup = Object.keys(ids).filter((k) => ids[k] > 1);
  if (dup.length) fail('duplicate-ids', dup.join(','));
  const head = document.getElementById('header-stats').textContent.replace(/\s+/g, ' ');
  const c = WASD.character;
  // The header shows whichever three stats the player chose in Settings; each must match the character right now.
  const want = WASD.settings.headerTiles(c).map((t) => t.value).join('|');
  const got = [...document.querySelectorAll('#header-stats .header-stat dd')].map((x) => x.innerHTML).join('|');
  if (want !== got) fail('header-out-of-date', head);
  const dlg = document.querySelector('dialog[open]');
  const a = document.activeElement;
  if (dlg && !dlg.contains(a)) fail('focus-outside-open-dialog', a && describe(a));
  if (!dlg && (!a || a === document.body)) fail('focus-lost-to-body', 'after ' + (lastEl ? describe(lastEl) : '?'));
  const d = document.documentElement;
  if (d.scrollWidth > d.clientWidth + 1) fail('horizontal-scroll', d.scrollWidth + '>' + d.clientWidth);
  if (document.querySelectorAll('dialog[open]').length > 1) fail('two-dialogs-open', '');
}

(async () => {
  try {
    localStorage.clear(); WASD.resetCharacter(); WASD.hub.resetOrder(); location.hash = '#/'; await tick(100);
    document.getElementById('hub-title').focus();
    for (let step = 0; step < STEPS; step++) {
      const roll = rand();
      const dlg = document.querySelector('dialog[open]');
      let el = null;
      if (dlg && dlg.id === 'wizard-dialog' && params.get('finish') && roll < 0.35) {
        // "finish" mode: push wizards forward so level-ups and new characters actually happen
        el = document.getElementById('wizard-next'); el.focus();
        const sug = document.getElementById('suggest-scores');
        if (sug && rand() < 0.7) { sug.click(); await tick(20); el.focus(); }
        log.push(step + ': Next');
        el.click();
      } else if (dlg && roll < 0.06) {
        log.push(step + ': Escape');
        dlg.dispatchEvent(new Event('cancel', { cancelable: true }));
      } else if (!dlg && roll < 0.04) {
        const route = pick(['#/', '#/card/combat', '#/card/equipment', '#/card/features', '#/card/skills', '#/card/abilities', '#/card/spellcasting', '#/card/identity']);
        log.push(step + ': go ' + route);
        location.hash = route;
      } else {
        const list = candidates();
        if (!list.length) { fail('no-controls', dlg ? dlg.id : 'page'); continue; }
        el = pick(list);
        el.focus();
        if (el.tagName === 'INPUT' && (el.type === 'number' || el.type === 'text')) {
          const v = pick(VALUES);
          log.push(`${step}: type "${v}" in ${describe(el)}`);
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.tagName === 'SELECT') {
          el.selectedIndex = Math.floor(rand() * el.options.length);
          log.push(`${step}: select "${el.value}" in ${describe(el)}`);
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.getAttribute('role') === 'tab' && rand() < 0.5) {
          const key = pick(['ArrowRight', 'ArrowLeft', 'Home', 'End']);
          log.push(`${step}: ${key} on ${describe(el)}`);
          el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        } else if (el.closest('#quick-page') && rand() < 0.4) {
          const key = String(1 + Math.floor(rand() * 7));
          log.push(`${step}: key ${key} in Quick Page`);
          el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        } else {
          log.push(`${step}: click ${describe(el)}`);
          el.click();
        }
      }
      await tick(25);
      checkInvariants(el);
    }
  } catch (e) { out.push('EXCEPTION ' + e.stack); }
  out.push(`INFO seed ${params.get('seed')}: ${STEPS} steps | level-ups ${seen.levelUps}, max level ${seen.maxLevel} | characters replaced ${seen.resets} | builds seen: ${[...seen.classes].join(', ')}`);
  const kinds = Object.keys(failures);
  out.push(kinds.length ? `INFO ${kinds.length} kinds of failure:` : 'PASS no rule broken in any step');
  kinds.forEach((k) => out.push(`FAIL ${k} (x${failures[k].count}): ${failures[k].detail}\n   leading steps:\n     ${failures[k].steps.join('\n     ')}`));
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
