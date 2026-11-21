// Combat suite: hub, HP damage/heal/temp/limits, attack rolls, equipment and tabs, coins, dice roller, Reset demo.
const out = [];
const log = (...a) => out.push(a.join(' '));
const ok = (cond, msg) => log(cond ? 'PASS' : 'FAIL', msg);
window.addEventListener('error', (e) => log('JSERROR', e.message, e.filename + ':' + e.lineno));
const $ = (s) => document.querySelector(s);
const click = (sel) => { const el = $(sel); if (!el) { log('FAIL missing', sel); return; } el.click(); };
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 80));
const status = () => $('#status').textContent;
const setVal = (sel, v) => { $(sel).value = v; $(sel).dispatchEvent(new Event('input', { bubbles: true })); };
(async () => {
  try {
    WASD.resetCharacter(); WASD.hub.resetOrder();
    await tick();
    ok(document.querySelectorAll('.card').length === 7, '7 cards on hub');
    ok($('#card-combat-toggle').getAttribute('aria-expanded') === 'true', 'Combat open by default');
    const sum = $('#card-combat-toggle .card__summary').textContent;
    ok(sum.includes('Initiative +3') && sum.includes('Speed 30 ft') && sum.includes('Proficiency +2'), 'Hub summary: ' + sum);
    ok(WASD.character.combat.armorClass === 15, 'AC 15');
    ok($('#header-stats').textContent.includes('Level 4'), 'header shows level 4');

    click('#hp-damage'); await tick(120);
    ok(WASD.raw.combat.hp.current === 26, 'damage 1 -> 26 (got ' + WASD.raw.combat.hp.current + ')');
    ok(/took 1 damage\. HP 26 of 31/.test(status()), 'announce: ' + status());
    ok(document.activeElement.id === 'hp-damage', 'focus stays on Damage button');
    setVal('#hp-amount', '30');
    click('#hp-damage'); await tick(120);
    ok(WASD.raw.combat.hp.current === 0, 'HP floors at 0');
    ok(!!$('.hp-state--down'), 'down state shown at 0 HP: ' + ($('.hp-state--down') || {}).textContent);
    ok(/down at 0 HP/.test(status()), 'announce down: ' + status());
    setVal('#hp-amount', '100');
    click('#hp-heal'); await tick(120);
    ok(WASD.raw.combat.hp.current === 31, 'HP caps at max 31');
    click('#hp-heal'); await tick(120);
    ok(/already at full/.test(status()), 'full HP message: ' + status());
    setVal('#hp-amount', 'abc');
    click('#hp-heal'); await tick(120);
    ok(!!$('#hp-error') && $('#hp-amount').getAttribute('aria-invalid') === 'true', 'invalid amount shows error');
    ok(document.activeElement.id === 'hp-amount', 'focus moves to the bad field');
    setVal('#hp-amount', '1');
    setVal('#temp-hp', '5');
    click('#temp-set'); await tick(120);
    ok(WASD.raw.combat.hp.temp === 5, 'temp HP set');
    setVal('#hp-amount', '8');
    click('#hp-damage'); await tick(120);
    ok(WASD.raw.combat.hp.temp === 0 && WASD.raw.combat.hp.current === 28, 'temp absorbed first (temp ' + WASD.raw.combat.hp.temp + ', hp ' + WASD.raw.combat.hp.current + ')');
    click('#hp-minus'); await tick(120);
    ok(WASD.raw.combat.hp.current === 27, 'quick -1');

    click('#roll-hit-shortsword'); await tick(120);
    ok(WASD.lastRoll && /to hit/.test(WASD.lastRoll.title) && /to hit$/.test(WASD.lastRoll.total), 'roll to hit: ' + JSON.stringify(WASD.lastRoll));
    ok(/to hit: rolled/.test(status()), 'announce hit: ' + status());
    click('#roll-dmg-shortsword'); await tick(120);
    ok(/piercing$/.test(WASD.lastRoll.total), 'damage keeps type: ' + WASD.lastRoll.total);
    ok(!$('#roll-hit-sneak') && !!$('#roll-dmg-sneak'), 'Sneak Attack has damage but no to-hit button');
    ok(WASD.character.combat.attacks[2].damage[0].dice === '2d6', 'sneak 2d6 at L4');

    location.hash = '#/card/equipment'; await tick(150);
    ok(!$('#view-card').hidden, 'equipment page shown');
    ok(document.querySelectorAll('#card-list li').length === 0, 'hub list emptied on card page');
    click('#equip-ring'); await tick(120);
    ok(WASD.character.combat.armorClass === 16, 'ring equipped -> AC 16');
    ok(/Ring of Protection equipped.*Armor Class 16/.test(status()), 'announce: ' + status());
    ok(document.activeElement.id === 'equip-ring', 'focus kept on equip button');
    click('#equip-studded'); await tick(120);
    ok(WASD.character.combat.armorClass === 14, 'armor off, ring on -> 14 (got ' + WASD.character.combat.armorClass + ')');
    click('#equip-shortsword'); await tick(120);
    ok(!WASD.character.combat.attacks.some((a) => a.id === 'shortsword'), 'unequipped sword hides its attack');
    click('#equip-studded'); await tick(100); click('#equip-ring'); await tick(100); click('#equip-shortsword'); await tick(150);
    ok(WASD.character.combat.armorClass === 15, 'back to AC 15');

    const tabs = [...document.querySelectorAll('[role=tab]')];
    ok(tabs.length === 3 && tabs[0].getAttribute('aria-selected') === 'true', '3 tabs, first selected');
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    ok(document.activeElement === tabs[1] && tabs[1].getAttribute('aria-selected') === 'true' && !document.getElementById(tabs[1].getAttribute('aria-controls')).hidden, 'ArrowRight moves tab and panel');
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    ok(document.activeElement === tabs[2], 'End goes to last tab');
    click('#use-arrows'); await tick(120);
    ok(WASD.raw.equipment.items.find((i) => i.id === 'arrows').qty === 19, 'use arrow -> 19');
    ok($('[role=tab][aria-selected=true]').textContent.startsWith('Currency'), 'stays on Currency tab after redraw');
    click('#coin-plus-gp'); await tick(100);
    ok(WASD.raw.equipment.coins.gp === 16, 'gold +1');
    for (let i = 0; i < 3; i++) click('#coin-minus-cp');
    ok(WASD.raw.equipment.coins.cp === 0, 'copper cannot go negative');

    location.hash = '#/card/features'; await tick(150);
    const ft = [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent);
    ok(ft.join('|') === 'Features|Feats|Backstory', 'features tabs: ' + ft.join('|'));
    for (const id of ['abilities', 'spellcasting', 'identity', 'combat']) {
      location.hash = '#/card/' + id; await tick(100);
      ok($('#card-view-body').innerHTML.length > 50, 'card page renders: ' + id);
    }
    location.hash = '#/card/skills'; await tick(100);
    click('#skills-filter'); await tick(100);
    ok(document.querySelectorAll('.skill-row').length === 6, 'proficient-only shows 6 skills (got ' + document.querySelectorAll('.skill-row').length + ')');

    location.hash = '#/'; await tick(100);
    click('#roll-btn'); await tick(100);
    ok($('#roll-dialog').open && document.activeElement.dataset.sides === '20', 'roll dialog open, focus on d20');
    $('#roll-mod').value = '3';
    $('[data-sides="20"]').click(); await tick(150);
    const total = Number($('#roll-total').textContent);
    ok(total >= 4 && total <= 23, 'd20+3 in range: ' + total + ' | ' + $('#roll-detail').textContent);
    ok(/Total/.test($('#roll-result').textContent), 'live region text: ' + $('#roll-result').textContent);
    $('#roll-count').value = '2';
    $('[data-sides="6"]').click(); await tick(150);
    ok(/2d6\+3: rolled \d, \d/.test($('#roll-detail').textContent), 'two dice listed: ' + $('#roll-detail').textContent);
    $('#roll-count').value = '0';
    $('[data-sides="100"]').click(); await tick(100);
    ok(!$('#roll-error').hidden, 'bad count shows error');
    $('#roll-dialog').dispatchEvent(new Event('cancel', { cancelable: true })); await tick(100);
    ok(!$('#roll-dialog').open && document.activeElement.id === 'roll-btn', 'Escape closes, focus returns to Roll');

    click('#reset-demo'); await tick(100);
    ok($('#confirm-dialog').open && document.activeElement.id === 'confirm-no', 'confirm opens with Cancel focused');
    click('#confirm-no'); await tick(100);
    ok(!$('#confirm-dialog').open && document.activeElement.id === 'reset-demo' && WASD.raw.equipment.coins.gp === 16, 'cancel keeps state, focus back');
    click('#reset-demo'); await tick(100); click('#confirm-yes'); await tick(200);
    ok(WASD.raw.combat.hp.current === 27 && WASD.raw.equipment.coins.gp === 15 && WASD.raw.equipment.items.find((i) => i.id === 'arrows').qty === 20, 'reset restores HP 27, gp 15, arrows 20');
    ok(/Demo reset\. Kira is level 4 with 27 of 31 HP/.test(status()), 'announce reset: ' + status());
    ok(WASD.lastRoll === null, 'last roll cleared');
  } catch (e) { log('EXCEPTION', e.stack); }
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
