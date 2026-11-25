// Wizards suite: Level Up (4 -> 5, missing data, cancel, Escape) and the New character build, step by step.
const out = [];
const log = (...a) => out.push(a.join(' '));
const ok = (cond, msg) => log(cond ? 'PASS' : 'FAIL', msg);
window.addEventListener('error', (e) => log('JSERROR', e.message, e.filename + ':' + e.lineno));
const $ = (s) => document.querySelector(s);
const click = (sel) => { const el = $(sel); if (!el) { log('FAIL missing', sel); return; } el.click(); };
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 80));
const status = () => $('#status').textContent;
const heading = () => $('#wizard-heading').textContent;
const body = () => $('#wizard-body').innerText.replace(/\s+/g, ' ');
const next = async () => { click('#wizard-next'); await tick(100); };
const setVal = (sel, v, ev) => { const el = $(sel); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles: true })); };
(async () => {
  try {
    WASD.resetCharacter(); WASD.hub.resetOrder(); await tick();

    // ---------------- Level Up 4 -> 5 ----------------
    $('#level-up-btn').focus(); click('#level-up-btn'); await tick(100);
    ok($('#wizard-dialog').open, 'level up dialog opens');
    ok(heading() === 'Step 1 of 4: Hit points', 'step 1 heading: ' + heading());
    ok(document.activeElement.id === 'wizard-heading', 'focus on step heading');
    ok($('#wizard-kicker').textContent === 'Level Up: Kira, Rogue 4 → 5', 'kicker: ' + $('#wizard-kicker').textContent);
    ok($('#wizard-back').hidden, 'no Back on step 1');
    await next();
    ok(!$('#wizard-error').hidden && /Choose how/.test($('#wizard-error').textContent) && document.activeElement.id === 'hp-method-average', 'empty choice -> error + focus first radio');
    click('#hp-method-manual'); await tick(100);
    setVal('#hp-manual', '9'); await next();
    ok(/1 to 8/.test($('#wizard-error').textContent) && document.activeElement.id === 'hp-manual', 'manual 9 rejected: ' + $('#wizard-error').textContent);
    click('#hp-method-roll'); await tick(100);
    await next();
    ok(/Roll d8/.test($('#wizard-error').textContent), 'roll required before Next');
    click('#hp-roll'); await tick(150);
    ok(/You rolled \d/.test(body()) && /Max HP 31 → \d\d/.test(body()), 'roll shown with preview: ' + (body().match(/You rolled.*?\)\./) || [''])[0]);
    ok(/Rolled \d\. Gain \d+ HP/.test($('#wizard-live').textContent), 'roll announced in dialog: ' + $('#wizard-live').textContent);
    click('#hp-method-average'); await tick(100);
    ok(/Max HP 31 → 38/.test(body()), 'average preview 31 -> 38');
    ok(document.activeElement.id === 'hp-method-average', 'focus kept on radio after redraw');
    await next();
    ok(heading() === 'Step 2 of 4: Proficiency and bonuses', 'step 2: ' + heading());
    ok(document.activeElement.id === 'wizard-heading', 'focus moves to new step heading');
    const b2 = body();
    ok(/\+2 → \+3/.test(b2), 'proficiency +2 -> +3 shown');
    ['Stealth +7 +9', 'Sleight of Hand +7 +9', 'Dexterity save +5 +6', 'Intelligence save +3 +4', 'Passive Perception 13 14',
      'Shortsword to hit +5 +6', 'Shortbow to hit +5 +6', 'Sneak Attack damage 2d6 same type as the weapon 3d6 same type as the weapon', 'Hit dice 4d8 5d8', 'Perception +3 +4']
      .forEach((t) => ok(b2.includes(t), 'change listed: ' + t));
    ok(!b2.includes('Athletics'), 'untrained skills not listed');
    await next();
    ok(heading() === 'Step 3 of 4: New features' && body().includes('Uncanny Dodge'), 'step 3 shows Uncanny Dodge');
    await next();
    ok(heading() === 'Step 4 of 4: Review' && $('#wizard-next').textContent === 'Confirm level up', 'review + confirm label');
    const b4 = body();
    ok(/Max HP 31 → 38/.test(b4) && /Current HP 27 → 34/.test(b4), 'review HP: ' + (b4.match(/Max HP.*?Constitution\)/) || [''])[0]);
    click('#wizard-back'); await tick(100);
    ok(heading() === 'Step 3 of 4: New features', 'Back goes to step 3');
    await next();
    ok(WASD.raw.identity.level === 4, 'nothing saved before confirm');
    await next(); await tick(150);
    ok(!$('#wizard-dialog').open, 'dialog closed after confirm');
    ok(WASD.raw.identity.level === 5 && WASD.raw.combat.hp.max === 38 && WASD.raw.combat.hp.current === 34, 'level 5, HP 34/38');
    ok(WASD.character.proficiencyBonus === 3 && WASD.character.skills.find((s) => s.name === 'Stealth').bonus === 9, 'PB +3, Stealth +9');
    ok(WASD.raw.features.some((f) => f.name === 'Uncanny Dodge' && f.source === 'Rogue 5'), 'Uncanny Dodge added (Rogue 5)');
    ok(/Kira is now level 5/.test(status()), 'announced: ' + status());
    ok(document.activeElement.id === 'level-up-btn', 'focus back on Level Up button');
    ok($('#header-stats').textContent.includes('Level 5') && $('#header-stats').textContent.includes('34'), 'header updated');
    ok($('#card-combat-toggle .card__summary').textContent.includes('Proficiency +3'), 'hub summary updated');

    // 5 -> 6: no data
    click('#level-up-btn'); await tick(100);
    click('#hp-method-average'); await tick(80); await next(); await next();
    ok(/no Rogue level 6 feature data/.test(body()), 'missing level 6 data is stated, not invented');
    click('#wizard-cancel'); await tick(150);
    ok(!$('#wizard-dialog').open && WASD.raw.identity.level === 5, 'cancel discards');
    ok(/cancelled/.test(status()) && document.activeElement.id === 'level-up-btn', 'cancel announced, focus back');
    // Escape
    click('#level-up-btn'); await tick(100);
    $('#wizard-dialog').dispatchEvent(new Event('cancel', { cancelable: true })); await tick(100);
    ok(!$('#wizard-dialog').open && document.activeElement.id === 'level-up-btn', 'Escape closes, focus back');
    // backdrop click does not close
    click('#level-up-btn'); await tick(100);
    $('#wizard-dialog').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    ok($('#wizard-dialog').open, 'backdrop click does not close wizard');
    click('#wizard-cancel'); await tick(100);

    // ---------------- New character ----------------
    $('#new-character').focus(); click('#new-character'); await tick(100);
    ok(heading() === 'Step 1 of 5: Name', 'build step 1: ' + heading());
    await next();
    ok(/Enter a name/.test($('#wizard-error').textContent) && document.activeElement.id === 'char-name-input', 'name required');
    setVal('#char-name-input', 'Mira');
    $('#char-name-input').form.requestSubmit(); await tick(100); // Enter in the field
    ok(heading() === 'Step 2 of 5: Class', 'Enter in name field moves on');
    ok(document.querySelectorAll('input[name=className]').length === 4, '4 classes');
    await next();
    ok(/Choose a class/.test($('#wizard-error').textContent), 'class required');
    click('#className-Wizard'); await tick(100); await next();
    ok(heading() === 'Step 3 of 5: Race', 'race step');
    ok(/Subrace: High Elf/.test($('label[for="race-Elf"]').textContent), 'Elf choice names its SRD subrace');
    click('#race-Elf'); await tick(100);
    // Race and subrace are separate choices; the SRD's only elf subrace is pre-selected.
    ok($('#subrace-High-Elf') && $('#subrace-High-Elf').checked && /Elf subrace/.test($('#subrace-High-Elf').closest('fieldset').querySelector('legend').textContent), 'separate Elf subrace choice, High Elf selected');
    ok(document.activeElement.id === 'race-Elf', 'focus stays on the race radio after the redraw');
    await next();
    ok(heading() === 'Step 4 of 5: Ability scores', 'scores step');
    await next();
    ok(/Choose a score for Strength/.test($('#wizard-error').textContent) && document.activeElement.id === 'score-str', 'scores required');
    click('#suggest-scores'); await tick(120);
    ok($('#score-int').value === '15' && $('#score-str').value === '8', 'suggested scores filled');
    ok(/Numbers left: none/.test(body()), 'no numbers left');
    ok(/13 \+2 Elf = 15/.test($('#score-dex-result').textContent), 'race bonus shown: ' + $('#score-dex-result').textContent);
    ok(/15 \+1 High Elf = 16/.test($('#score-int-result').textContent), 'subrace bonus shown: ' + $('#score-int-result').textContent);
    setVal('#score-str', '14', 'change'); await tick(100);
    ok(document.activeElement.id === 'score-str', 'focus kept on select after change');
    ok(/used by Constitution/.test($('#score-str').innerHTML), 'options say which ability uses a number');
    await next();
    ok(/14 is used for both/.test($('#wizard-error').textContent), 'duplicate rejected: ' + $('#wizard-error').textContent);
    click('#suggest-scores'); await tick(100); await next();
    ok(heading() === 'Step 5 of 5: Review' && $('#wizard-next').textContent === 'Create character', 'review step');
    const r = body();
    ok(/Hit points 8/.test(r) && /Armor Class 12 \(No armor\)/.test(r) && /Speed 30 ft/.test(r), 'review numbers (HP 8, AC 12): ' + (r.match(/Hit points.*?Speed 30 ft/) || [''])[0]);
    // High Elf Int 15+1=16 (+3): Arcana +3 +2 = +5. Wis 12 (+1): Perception +1 +2 = +3.
    ok(r.includes('Perception +3') && r.includes('Arcana +5'), 'skills incl. elf Perception: ' + (r.match(/Proficient skills.*?Features/) || [''])[0]);
    ok(/replaces Kira/.test(r), 'replace warning shown');
    await next(); await tick(150);
    ok(!$('#wizard-dialog').open && WASD.raw.identity.name === 'Mira' && WASD.raw.identity.level === 1, 'Mira created');
    ok(/Created Mira, a level 1 High Elf Wizard\. HP 8, AC 12/.test(status()), 'announced: ' + status());
    ok(document.activeElement.id === 'new-character', 'focus back on New character');
    ok($('#char-name').textContent === 'Mira', 'header name Mira');
    // Spell save DC 8 + PB 2 + Int 3 = 13; spell attack 2 + 3 = +5.
    ok($('#card-spellcasting-toggle .card__summary').textContent === 'Save DC 13 · Spell attack +5', 'spell card: ' + $('#card-spellcasting-toggle .card__summary').textContent);
    location.hash = '#/card/spellcasting'; await tick(120);
    ok(/cantrip/.test($('#card-view-body').textContent) && /2 of 2 slots left/.test($('#card-view-body').textContent), 'cantrips and slots shown');
    location.hash = '#/card/identity'; await tick(120);
    ok(!/\(\)/.test($('#card-view-body').textContent), 'no empty subclass parentheses');
    location.hash = '#/card/combat'; await tick(120);
    ok(!!$('#roll-hit-quarterstaff') && !$('#roll-dmg-sneak'), 'wizard has quarterstaff, no sneak attack');
    location.hash = '#/'; await tick(120);
    // level up Mira 1 -> 2: hit die d6, avg 4 + 2
    click('#level-up-btn'); await tick(100);
    ok(/d6 hit die/.test(body()) && /4 \+2 Constitution = 6 HP/.test(body()), 'wizard level up uses d6: ' + (body().match(/Take the average.*?HP/) || [''])[0]);
    click('#wizard-cancel'); await tick(100);

    // Reset brings Kira back
    click('#reset-demo'); await tick(100); click('#confirm-yes'); await tick(200);
    ok(WASD.raw.identity.name === 'Kira' && WASD.raw.identity.level === 4 && !WASD.raw.features.some((f) => f.name === 'Uncanny Dodge'), 'Reset demo restores level 4 Kira');
  } catch (e) { log('EXCEPTION', e.stack); }
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
