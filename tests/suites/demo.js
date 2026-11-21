// Demo suite: runs DEMO-SCRIPT.md click by click and checks every number the script promises.
// Runs DEMO-SCRIPT.md step by step and checks every number the script promises.
const out = [];
const ok = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
window.addEventListener('error', (e) => out.push('JSERROR ' + e.message));
const $ = (s) => document.querySelector(s);
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 100));
const click = async (s) => { $(s).click(); await tick(); };
const type = (s, v) => { $(s).value = v; $(s).dispatchEvent(new Event('input', { bubbles: true })); };
const header = () => $('#header-stats').innerText.replace(/\s+/g, ' ').replace('/ of ', '/'); // drop the screen-reader-only "of"
const status = () => $('#status').textContent;
(async () => {
  try {
    localStorage.clear(); WASD.resetCharacter(); WASD.hub.resetOrder(); await tick();
    ok(/Level 4/.test(header()) && /27\s*\/\s*31/.test(header()) && /15/.test(header()), 'start: ' + header());
    // 1 Hub
    await click('#edit-layout'); await click('#move-down-combat');
    ok(WASD.hub.getOrder()[1] === 'combat', 'Combat moved down');
    await click('#reset-layout'); await click('#edit-layout');
    ok(WASD.hub.getOrder()[0] === 'combat', 'order reset');
    // 2 Combat
    type('#hp-amount', '5'); await click('#hp-damage');
    ok(WASD.raw.combat.hp.current === 22 && status() === 'Kira took 5 damage. HP 22 of 31.', '5 damage: ' + status());
    type('#hp-amount', '10'); await click('#hp-damage');
    ok(WASD.raw.combat.hp.current === 12 && !!$('.hp-state--bloodied'), '10 damage -> 12, Bloodied');
    type('#hp-amount', '5'); await click('#hp-heal');
    ok(WASD.raw.combat.hp.current === 17 && !$('.hp-state--bloodied'), 'heal 5 -> 17, not bloodied');
    await click('#roll-hit-shortsword'); await click('#roll-dmg-shortsword');
    ok(/piercing/.test($('.roll-result').textContent), 'damage shown as piercing');
    // 3 Quick Page + Equipment
    await click('#open-quick-page');
    $('#quick-page').dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true })); await tick(150);
    ok(location.hash === '#/card/equipment', 'Quick Page key 5 -> Equipment');
    await click('#equip-studded');
    ok(/13/.test(header()) && WASD.character.combat.armorClass === 13, 'armor off -> AC 13');
    await click('#equip-studded');
    ok(WASD.character.combat.armorClass === 15, 'armor on -> AC 15');
    await click('#equip-tab-modifiers');
    ok(/Ring of Protection/.test($('#equip-panel-modifiers').textContent) && /Not equipped/.test($('#equip-panel-modifiers').textContent), 'modifiers tab');
    await click('.back-link');
    // 4 Level Up
    await click('#level-up-btn');
    ok($('#wizard-heading').textContent === 'Step 1 of 4: Hit points', 'level up step 1');
    await click('#hp-method-average');
    ok(/Max HP 31 → 38 \(gain 7\)/.test($('#wizard-body').innerText), 'average 31 -> 38');
    await click('#wizard-next');
    ok(/14 values/.test($('#wizard-body').innerText), '14 changes listed');
    await click('#wizard-next');
    ok(/Uncanny Dodge/.test($('#wizard-body').innerText), 'Uncanny Dodge');
    await click('#wizard-next'); await click('#wizard-next'); await tick(150);
    ok(/Kira is now level 5/.test(status()), 'status: ' + status());
    ok(/Level 5/.test(header()) && /24\s*\/\s*38/.test(header()), 'header after level up: ' + header());
    // 5 Guided build
    await click('#new-character'); type('#char-name-input', 'Mira');
    $('#wizard-form').requestSubmit(); await tick();
    ok($('#wizard-heading').textContent === 'Step 2 of 5: Class', 'Enter -> class step');
    await click('#className-Wizard'); await click('#wizard-next'); await click('#race-Elf'); await click('#wizard-next');
    await click('#suggest-scores'); await click('#wizard-next');
    const rv = $('#wizard-body').innerText.replace(/\s+/g, ' ');
    ok(/Hit points 8/.test(rv) && /Armor Class 12/.test(rv) && /Magic Missile/.test(rv), 'review HP 8, AC 12, spells');
    await click('#wizard-next'); await tick(150);
    ok(/^Created Mira, a level 1 Elf Wizard\./.test(status()), 'status: ' + status());
    // 6 Themes
    await click('#settings-btn'); await click('#theme-contrast'); await click('#large-text');
    ok(document.documentElement.dataset.theme === 'contrast' && document.documentElement.dataset.text === 'large', 'contrast + large text');
    await click('#theme-parchment'); await click('#large-text'); await click('#close-settings');
    ok(document.documentElement.dataset.theme === 'parchment' && !document.documentElement.dataset.text, 'back to parchment');
    ok(document.activeElement.id === 'settings-btn', 'focus back on gear');
    // 7 Reset
    await click('#reset-demo');
    ok(document.activeElement.id === 'confirm-no', 'Cancel focused');
    await click('#confirm-yes'); await tick(150);
    ok(status() === 'Demo reset. Kira is level 4 with 27 of 31 HP.', 'status: ' + status());
  } catch (e) { out.push('EXCEPTION ' + e.stack); }
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
