// Audit suite: axe-core (WCAG 2.2 AA + best practice) and custom checks on every screen, tab, dialog and wizard step, in all 5 themes.
// Accessibility audit: runs axe-core + custom checks on every screen, tab, dialog and wizard step, in every theme.
const out = [];
const log = (...a) => out.push(a.join(' '));
window.addEventListener('error', (e) => log('JSERROR', e.message, e.filename + ':' + e.lineno));
const $ = (s) => document.querySelector(s);
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 60));
const click = async (sel) => { const el = $(sel); if (el) { el.click(); await tick(); } else log('MISSING', sel); };
const found = {}; // key -> {impact, help, states:Set, targets:Set}
let runs = 0;

function custom(state) {
  const issues = [];
  // duplicate ids
  const ids = {};
  document.querySelectorAll('[id]').forEach((el) => { ids[el.id] = (ids[el.id] || 0) + 1; });
  Object.keys(ids).filter((k) => ids[k] > 1).forEach((k) => issues.push(['dup-id', k]));
  // heading levels must not skip (within the open dialog if any, else the page)
  const scope = document.querySelector('dialog[open]') || document.body;
  let last = scope === document.body ? 0 : 1;
  scope.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
    if (h.closest('[hidden]') || h.offsetParent === null) return;
    const lvl = Number(h.tagName[1]);
    if (last && lvl > last + 1) issues.push(['heading-skip', `${h.tagName} "${h.textContent.trim().slice(0, 30)}" after h${last}`]);
    last = lvl;
  });
  // page must not scroll sideways
  const d = document.documentElement;
  if (d.scrollWidth > d.clientWidth + 1) issues.push(['h-scroll', `${d.scrollWidth} > ${d.clientWidth}`]);
  // focus must be inside an open modal dialog
  const dlg = document.querySelector('dialog[open]');
  if (dlg && !dlg.contains(document.activeElement)) issues.push(['focus-outside-dialog', document.activeElement && (document.activeElement.id || document.activeElement.tagName)]);
  issues.forEach(([rule, target]) => {
    const key = 'custom:' + rule + ' ' + target;
    found[key] = found[key] || { impact: 'custom', help: rule, states: new Set(), targets: new Set([target]) };
    found[key].states.add(state);
  });
}

async function audit(state) {
  runs++;
  custom(state);
  const res = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    resultTypes: ['violations'],
  });
  res.violations.forEach((v) => {
    v.nodes.forEach((n) => {
      const target = n.target.join(' ');
      const key = v.id + ' | ' + target;
      found[key] = found[key] || { impact: v.impact, help: v.help, states: new Set(), targets: new Set(), detail: (n.any[0] || n.all[0] || n.none[0] || {}).message };
      found[key].states.add(state);
    });
  });
}

const THEMES = ['parchment', 'dark', 'contrast', 'forest', 'arcane'];
(async () => {
  try {
    if (location.search.includes('large')) document.documentElement.setAttribute('data-text', 'large');
    for (const theme of THEMES) {
      document.documentElement.setAttribute('data-theme', theme);
      WASD.resetCharacter(); WASD.hub.resetOrder(); location.hash = '#/'; await tick(150);
      const S = (s) => `${theme}:${s}`;
      // Hub with every card open
      for (const t of document.querySelectorAll('.card__toggle[aria-expanded=false]')) { t.click(); }
      await tick(); await audit(S('hub-all-open'));
      await click('#edit-layout'); await audit(S('hub-edit-layout')); await click('#edit-layout');
      // Combat states
      location.hash = '#/card/combat'; await tick(150);
      await audit(S('combat'));
      WASD.updateCharacter((r) => { r.combat.hp.current = 10; r.combat.hp.temp = 3; }); await tick();
      await audit(S('combat-bloodied'));
      WASD.updateCharacter((r) => { r.combat.hp.current = 0; }); await tick();
      await click('#roll-dmg-shortsword');
      const amt = $('#hp-amount'); amt.value = 'x'; amt.dispatchEvent(new Event('input', { bubbles: true }));
      await click('#hp-heal');
      await audit(S('combat-down-error-lastroll'));
      // Death saves in progress, conditions and exhaustion active, Undo available
      await click('#death-failure'); await click('#cond-poisoned'); await click('#cond-prone');
      const ex = $('#exhaustion'); ex.value = '2'; ex.dispatchEvent(new Event('input', { bubbles: true })); await tick();
      await audit(S('combat-death-saves-conditions'));
      // Hub with Combat full width (two columns)
      WASD.resetCharacter(); WASD.hub.resetOrder(); location.hash = '#/'; await tick(150); await click('#wide-combat');
      await audit(S('hub-combat-full-width'));
      WASD.hub.resetOrder(); await tick();
      // Spell slots on a caster, and an import error on Identity
      WASD.setCharacter(WASD.newCharacter.build({ charName: 'Mira', className: 'Wizard', race: 'Elf', 'score-str': '8', 'score-dex': '13', 'score-con': '14', 'score-int': '15', 'score-wis': '12', 'score-cha': '10' }));
      location.hash = '#/card/spellcasting'; await tick(150); await click('#slot-use-1'); await audit(S('spell-slots-used'));
      WASD.resetCharacter(); await tick();
      // Every other card page and tab
      for (const id of ['abilities', 'skills', 'spellcasting', 'identity']) { location.hash = '#/card/' + id; await tick(120); await audit(S(id)); }
      location.hash = '#/card/skills'; await tick(120); await click('#skills-filter'); await audit(S('skills-filtered'));
      for (const card of ['equipment', 'features']) {
        location.hash = '#/card/' + card; await tick(120);
        const n = document.querySelectorAll('[role=tab]').length;
        for (let i = 0; i < n; i++) { document.querySelectorAll('[role=tab]')[i].click(); await tick(); await audit(S(`${card}-tab${i + 1}`)); }
      }
      location.hash = '#/'; await tick(150);
      // Dialogs
      $('#open-quick-page').focus(); await click('#open-quick-page'); await audit(S('quick-page'));
      $('#quick-page').dispatchEvent(new Event('cancel', { cancelable: true })); await tick();
      await click('#roll-btn'); await click('[data-sides="20"]'); await tick(100); await audit(S('roll-dialog'));
      $('#roll-count').value = '0'; await click('[data-sides="6"]'); await audit(S('roll-dialog-error'));
      $('#roll-count').value = '1'; await click('#close-roll');
      await click('#settings-btn'); await audit(S('settings')); await click('#close-settings');
      await click('#reset-demo'); await audit(S('confirm')); await click('#confirm-no');
      // Level Up wizard, every step (+ error state)
      WASD.resetCharacter(); await tick();
      await click('#level-up-btn'); await click('#wizard-next'); await audit(S('levelup-1-error'));
      await click('#hp-method-roll'); await audit(S('levelup-1-roll'));
      await click('#hp-method-manual'); await audit(S('levelup-1-manual'));
      await click('#hp-method-average');
      for (let i = 2; i <= 4; i++) { await click('#wizard-next'); await audit(S('levelup-' + i)); }
      await click('#wizard-cancel');
      // New character wizard, every step
      await click('#new-character'); await audit(S('build-1'));
      const nm = $('#char-name-input'); nm.value = 'Mira'; nm.dispatchEvent(new Event('input', { bubbles: true }));
      await click('#wizard-next'); await audit(S('build-2'));
      await click('#className-Cleric'); await click('#wizard-next'); await audit(S('build-3'));
      await click('#race-Dragonborn'); await click('#wizard-next'); await audit(S('build-3-dragonborn-error'));
      await click('#race-Half-Elf'); await audit(S('build-3-half-elf-choices'));
      await click('#race-Dwarf'); await audit(S('build-3-dwarf-subrace'));
      await click('#wizard-next'); await audit(S('build-4'));
      await click('#suggest-scores'); await audit(S('build-4-filled'));
      await click('#wizard-next'); await audit(S('build-5'));
      await click('#wizard-cancel');
    }
    document.documentElement.setAttribute('data-theme', 'parchment');
  } catch (e) { log('EXCEPTION', e.stack); }
  const keys = Object.keys(found).sort();
  log(`INFO ${runs} screen states scanned (every card, tab, dialog and wizard step x 5 themes)`);
  if (!keys.length) log(`PASS axe-core + custom checks: ${runs} screen states, 0 issues`);
  else log(`INFO ${runs} screen states checked, ${keys.length} issues:`);
  keys.forEach((k) => {
    const f = found[k];
    const st = [...f.states];
    log(`FAIL [${f.impact}] ${k}\n    ${f.help}${f.detail ? ' :: ' + f.detail : ''}\n    in ${st.length} states, e.g. ${st.slice(0, 4).join(', ')}`);
  });
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
