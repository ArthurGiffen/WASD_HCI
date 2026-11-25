// Features suite: SRD races and subraces, HP undo, death saves, rests, spell slots, conditions,
// export/import and the full-width card. Expected numbers are worked out by hand (2014 rules, SRD 5.1).
const out = [];
const log = (...a) => out.push(a.join(' '));
const ok = (cond, msg) => log(cond ? 'PASS' : 'FAIL', msg);
window.addEventListener('error', (e) => log('JSERROR', e.message, e.filename + ':' + e.lineno));
const $ = (s) => document.querySelector(s);
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 80));
const click = async (sel) => { const el = $(sel); if (!el) { log('FAIL missing', sel); return; } el.click(); await tick(); };
const status = () => $('#status').textContent;
const setVal = (sel, v) => { $(sel).value = v; $(sel).dispatchEvent(new Event('input', { bubbles: true })); };
const hp = () => WASD.raw.combat.hp;
const ds = () => WASD.raw.combat.deathSaves;
const dis = (sel) => $(sel).getAttribute('aria-disabled') === 'true';
/** Make every d-roll from WASD.dice.roll come up as `n` while fn runs. */
const forceRoll = async (n, fn) => {
  const real = WASD.dice.roll;
  WASD.dice.roll = (count) => Array(count).fill(n);
  try { await fn(); } finally { WASD.dice.roll = real; }
};
/** Build a level 1 character with the class's suggested scores. */
const make = (className, race, extra) => {
  const f = { charName: 'Test', className, race, ...(extra || {}) };
  Object.entries(WASD.classData[className].suggested).forEach(([k, v]) => { f['score-' + k] = String(v); });
  return WASD.newCharacter.build(f);
};
const score = (ch, k) => ch.abilities.find((a) => a.key === k).score;
const skill = (ch, n) => ch.skills.find((s) => s.name === n).bonus;

(async () => {
  try {
    WASD.resetCharacter(); WASD.hub.resetOrder(); await tick();

    // ---------------- Races (SRD 5.1): race and subrace are separate ----------------
    ok(Object.keys(WASD.raceData).join() === 'Human,Elf,Dwarf,Halfling,Dragonborn,Gnome,Half-Elf,Half-Orc,Tiefling', 'all 9 SRD races: ' + Object.keys(WASD.raceData).join());
    const subs = Object.keys(WASD.raceData).filter((k) => WASD.raceData[k].subraces.length).map((k) => `${k}:${WASD.raceData[k].subraces[0].name}`);
    ok(subs.join() === 'Elf:High Elf,Dwarf:Hill Dwarf,Halfling:Lightfoot Halfling,Gnome:Rock Gnome', 'SRD subraces: ' + subs.join());
    // Old saves stored the subrace as the race.
    const old = JSON.parse(JSON.stringify(WASD.sampleCharacter)); old.identity.race = 'High Elf'; delete old.identity.subrace;
    const oldCh = WASD.rules.derive(old);
    ok(oldCh.identity.race === 'Elf' && oldCh.identity.subrace === 'High Elf' && oldCh.identity.raceLabel === 'High Elf', 'old "High Elf" save splits into race Elf + subrace High Elf');

    // Dragonborn Fighter, red: Str 15+2=17, Cha 10+1=11. Con 14 (+2): HP 10+2=12. Breath: 2d6 fire, 15 ft. cone, DC 8+2+2=12 Dex.
    let raw = make('Fighter', 'Dragonborn', { ancestry: 'red' });
    let ch = WASD.rules.derive(raw);
    const breath = ch.combat.attacks.find((a) => a.id === 'breath');
    ok(score(ch, 'str') === 17 && score(ch, 'cha') === 11 && ch.combat.hp.max === 12, `Dragonborn Fighter: Str 17, Cha 11, HP 12 (got ${score(ch, 'str')}, ${score(ch, 'cha')}, ${ch.combat.hp.max})`);
    ok(breath && WASD.rules.formatDamage(breath.damage) === '2d6 fire' && breath.range === '15 ft. cone' && /DC 12 Dexterity save/.test(breath.note), 'red breath weapon 2d6 fire, cone, DC 12 Dex: ' + (breath && breath.note));
    ok(['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'].every((n) => ch.features.some((x) => x.name === n))
      && /fire/.test(ch.features.find((x) => x.name === 'Damage Resistance').summary), 'ancestry features listed, fire resistance');
    raw.identity.level = 6; ch = WASD.rules.derive(raw);
    ok(ch.combat.attacks.find((a) => a.id === 'breath').damage[0].dice === '3d6', 'breath weapon 3d6 at level 6');
    raw.identity.level = 11; ok(WASD.rules.derive(raw).combat.attacks.find((a) => a.id === 'breath').damage[0].dice === '4d6', 'breath weapon 4d6 at level 11');
    // White dragon: Con save.
    ch = WASD.rules.derive(make('Fighter', 'Dragonborn', { ancestry: 'white' }));
    ok(/Constitution save/.test(ch.combat.attacks.find((a) => a.id === 'breath').note) && ch.combat.attacks.find((a) => a.id === 'breath').damage[0].type === 'cold', 'white dragon: cold, Con save');

    // Half-Elf Rogue, +1 Dex and Con, Insight and Persuasion: Dex 15+1=16, Con 14+1=15 (+2), Cha 10+2=12 (+1).
    // HP 8+2=10. Insight: Wis 13 (+1) + PB 2 = +3. Persuasion: Cha +1 + 2 = +3.
    ch = WASD.rules.derive(make('Rogue', 'Half-Elf', { racePick1: 'dex', racePick2: 'con', raceSkill1: 'Insight', raceSkill2: 'Persuasion' }));
    ok(score(ch, 'dex') === 16 && score(ch, 'con') === 15 && score(ch, 'cha') === 12 && ch.combat.hp.max === 10, `Half-Elf picks applied: Dex 16, Con 15, Cha 12, HP 10 (got ${score(ch, 'dex')}, ${score(ch, 'con')}, ${score(ch, 'cha')}, ${ch.combat.hp.max})`);
    ok(skill(ch, 'Insight') === 3 && skill(ch, 'Persuasion') === 3, 'Skill Versatility: Insight +3, Persuasion +3');
    // Half-Orc Fighter: Str 15+2=17, Con 14+1=15. Intimidation: Cha 10 (+0) + 2 = +2.
    ch = WASD.rules.derive(make('Fighter', 'Half-Orc'));
    ok(score(ch, 'str') === 17 && score(ch, 'con') === 15 && skill(ch, 'Intimidation') === 2 && ch.identity.subrace === '', 'Half-Orc: Str 17, Con 15, Intimidation +2, no subrace');
    // Tiefling Wizard: Int 15+1=16 (+3), Cha 10+2=12. DC 8+2+3=13.
    ch = WASD.rules.derive(make('Wizard', 'Tiefling'));
    ok(score(ch, 'int') === 16 && score(ch, 'cha') === 12 && ch.spellcasting.saveDC === 13 && ch.features.some((x) => x.name === 'Hellish Resistance'), 'Tiefling Wizard: Int 16, Cha 12, DC 13, Hellish Resistance');
    // Rock Gnome Wizard: Int 15+2=17, Con 14+1=15. Speed 25.
    ch = WASD.rules.derive(make('Wizard', 'Gnome'));
    ok(ch.identity.race === 'Gnome' && ch.identity.subrace === 'Rock Gnome' && score(ch, 'int') === 17 && score(ch, 'con') === 15 && ch.combat.speed === 25, 'Rock Gnome: Int 17, Con 15, speed 25');

    // The build wizard: separate subrace choice, Dragonborn ancestry and Half-Elf picks are required.
    await click('#new-character');
    setVal('#char-name-input', 'Vex'); $('#char-name-input').dispatchEvent(new Event('change', { bubbles: true }));
    await click('#wizard-next'); await click('#className-Rogue'); await click('#wizard-next');
    await click('#race-Human');
    ok(/Human has no subraces/.test($('#wizard-body').textContent) && !$('#subrace-High-Elf'), 'Human: no subrace choice');
    await click('#race-Dragonborn'); await click('#wizard-next');
    ok(/Choose a draconic ancestry/.test($('#wizard-error').textContent) && document.activeElement.id === 'ancestry', 'Dragonborn needs an ancestry; focus on it');
    await click('#race-Half-Elf'); await click('#wizard-next');
    ok(/first ability/.test($('#wizard-error').textContent), 'Half-Elf needs ability picks');
    const pickSel = (id, v) => { $(id).value = v; $(id).dispatchEvent(new Event('change', { bubbles: true })); };
    pickSel('#racePick1', 'dex'); await tick(); pickSel('#racePick2', 'dex'); await tick(); await click('#wizard-next');
    ok(/two different abilities/.test($('#wizard-error').textContent), 'same ability twice rejected');
    ok(![...$('#raceSkill1').options].some((o) => o.value === 'Stealth'), 'skills the Rogue already has are not offered');
    pickSel('#racePick2', 'wis'); await tick(); pickSel('#raceSkill1', 'Insight'); await tick(); pickSel('#raceSkill2', 'History'); await tick();
    await click('#wizard-next');
    ok(/Step 4 of 5/.test($('#wizard-heading').textContent), 'Half-Elf choices accepted');
    ok(/15 \+1 Half-Elf = 16/.test($('#score-dex-result').textContent) || /\+1 Half-Elf/.test($('#score-dex-result').textContent), 'ability step shows the Half-Elf +1: ' + $('#score-dex-result').textContent);
    await click('#wizard-cancel');

    // ---------------- HP undo ----------------
    WASD.resetCharacter(); await tick();
    ok(dis('#hp-undo') && /No HP changes/.test($('#hp-undo-hint').textContent), 'Undo is disabled until something changes');
    setVal('#hp-amount', '5'); await click('#hp-damage');
    ok(hp().current === 22 && /Last HP change: 5 damage/.test($('#hp-undo-hint').textContent), 'after 5 damage: 22, undo says what it will undo');
    $('#hp-undo').focus(); await click('#hp-undo');
    ok(hp().current === 27 && /^Undid 5 damage\. HP 27 of 31\.$/.test(status()), 'undo -> 27, announced: ' + status());
    ok(document.activeElement.id === 'hp-undo', 'focus stays on Undo');
    setVal('#temp-hp', '4'); await click('#temp-set'); await click('#hp-undo');
    ok(hp().temp === 0, 'undo temporary HP');

    // ---------------- Death saves ----------------
    setVal('#hp-amount', '30'); await click('#hp-damage');
    // 27 HP, 30 damage: 3 left over after 0, less than the 31 maximum, so not instant death.
    ok(hp().current === 0 && $('#death-saves-title') && ds().failures === 0, '0 HP: death saves appear, no failures yet');
    await click('#death-failure');
    ok(ds().failures === 1 && /0 successes, 1 failure/.test(status()), 'mark failure: ' + status());
    setVal('#hp-amount', '1'); await click('#hp-damage');
    ok(ds().failures === 2 && /failed death save \(2 of 3\)/.test(status()), 'damage at 0 HP adds a failure: ' + status());
    await click('#hp-plus');
    ok(hp().current === 1 && ds().failures === 0 && ds().successes === 0 && !$('#death-saves-title'), 'healing resets death saves');
    await click('#hp-minus');
    await forceRoll(20, () => click('#death-roll'));
    ok(hp().current === 1 && /rolled 20\. Kira regains 1 hit point/.test(status()), 'natural 20: back up with 1 HP: ' + status());
    await click('#hp-minus');
    await forceRoll(1, () => click('#death-roll'));
    ok(ds().failures === 2 && /natural 1 counts as two failures/.test(status()), 'natural 1 = two failures');
    await forceRoll(5, () => click('#death-roll'));
    ok(ds().failures === 3 && /Third failure: Kira dies/.test(status()) && /Dead\./.test($('.hp-state--down').textContent), 'third failure: dead');
    ok(dis('#death-roll') && dis('#death-success') && dis('#death-failure'), 'death save buttons disabled once dead');
    await click('#hp-undo');
    ok(ds().failures === 2 && !dis('#death-roll'), 'undo the last death save');
    await click('#hp-plus'); // back to 1 HP, saves reset
    await click('#hp-minus');
    for (let i = 0; i < 3; i++) await forceRoll(12, () => click('#death-roll'));
    ok(ds().successes === 3 && /stable/.test(status()), 'three successes: stable');
    // Instant death: from full HP, 31 + 31 damage leaves 31 after 0, equal to the maximum.
    WASD.resetCharacter(); await tick();
    setVal('#hp-amount', '58'); await click('#hp-damage');
    ok(ds().failures === 3 && /instant death/.test(status()), '58 damage at 27/31: 31 left over = instant death');
    setVal('#hp-amount', '1');

    // ---------------- Rests ----------------
    WASD.resetCharacter(); await tick();
    setVal('#hp-amount', '10'); await click('#hp-damage'); // 17 of 31
    // Kira: d8, Con 14 (+2). Roll 5 -> 7 HP.
    await forceRoll(5, () => click('#spend-hit-die'));
    ok(hp().current === 24 && WASD.character.combat.hitDiceLeft === 3 && /rolled 5, \+2 Constitution, regain 7 HP\. HP 24 of 31\. 3 hit dice left/.test(status()), 'spend a hit die: ' + status());
    ok(/3 of 4/.test($('#spend-hit-die').closest('.combat-col').textContent), 'hit dice left shown in words');
    await click('#long-rest'); await click('#confirm-yes'); await tick(120);
    // Level 4: a long rest gives back up to 2 spent hit dice (1 was spent).
    ok(hp().current === 31 && WASD.character.combat.hitDiceLeft === 4 && /Long rest finished\. HP 31 of 31\. 4 of 4 hit dice left/.test(status()), 'long rest: ' + status());
    ok(dis('#hp-undo'), 'long rest clears the undo history');
    setVal('#hp-amount', '40'); await click('#hp-damage');
    await click('#long-rest');
    ok(!$('#confirm-dialog').open && /needs at least 1 hit point/.test(status()), 'no long rest at 0 HP');
    setVal('#hp-amount', '1');

    // ---------------- Spell slots (a level 1 Wizard has 2) ----------------
    WASD.setCharacter(make('Wizard', 'Human')); await tick();
    location.hash = '#/card/spellcasting'; await tick(150);
    await click('#slot-use-1');
    ok(WASD.raw.spellcasting.slots[0].used === 1 && /Used a level 1 spell slot\. 1 of 2 left/.test(status()), 'use a slot: ' + status());
    await click('#slot-use-1');
    ok(dis('#slot-use-1') && /0 of 2/.test($('#card-view-body').textContent), 'no slots left: Use disabled');
    await click('#slot-regain-1');
    ok(WASD.raw.spellcasting.slots[0].used === 1, 'regain a slot');
    location.hash = '#/card/combat'; await tick(150);
    await click('#long-rest'); await click('#confirm-yes'); await tick(120);
    ok(WASD.raw.spellcasting.slots[0].used === 0 && /Spell slots restored/.test(status()), 'long rest restores spell slots');

    // ---------------- Conditions and exhaustion ----------------
    WASD.resetCharacter(); await tick();
    location.hash = '#/card/combat'; await tick(150);
    await click('#cond-poisoned');
    ok(WASD.raw.combat.conditions.join() === 'poisoned' && /Poisoned on\. Disadvantage on attack rolls and ability checks/.test(status()), 'poisoned on: ' + status());
    ok($('#cond-poisoned').checked && /Poisoned:/.test($('.condition-active').textContent), 'listed as active with its reminder');
    ok(document.activeElement.id === 'cond-poisoned', 'focus stays on the checkbox');
    await click('#cond-grappled');
    ok(WASD.character.combat.speed === 0 && /Grappled: speed 0/.test(WASD.character.combat.speedNote), 'grappled: speed 0');
    setVal('#exhaustion', '2'); await tick();
    ok(WASD.raw.combat.exhaustion === 2 && /Exhaustion level 2: Disadvantage on ability checks; Speed halved/.test(status()), 'exhaustion 2 announced: ' + status());
    await click('#cond-grappled');
    ok(WASD.character.combat.speed === 15, 'exhaustion 2: speed 30 halved to 15');
    location.hash = '#/'; await tick(150);
    ok(/Poisoned, Exhaustion 2/.test($('#card-combat-toggle .card__summary').textContent), 'hub summary lists conditions');
    await click('#long-rest'); await click('#confirm-yes'); await tick(120);
    ok(WASD.raw.combat.exhaustion === 1 && WASD.character.combat.speed === 30, 'long rest lowers exhaustion by 1 (speed back to 30)');

    // ---------------- Full width card ----------------
    WASD.resetCharacter(); WASD.hub.resetOrder(); await tick();
    const cols = () => getComputedStyle($('#card-combat-body .combat-cols')).gridTemplateColumns.split(' ').length;
    ok(cols() === 1, 'normal hub card: one column (' + cols() + ')');
    await click('#wide-combat');
    ok($('[data-card-id="combat"]').classList.contains('card--wide') && $('#wide-combat').getAttribute('aria-pressed') === 'true' && document.activeElement.id === 'wide-combat', 'Full width on, focus kept');
    ok(cols() === 2, 'full-width Combat card: two columns (' + cols() + ')');
    ok(/Combat card is now full width/.test(status()), 'announced: ' + status());
    ok(JSON.parse(localStorage.getItem('wasd.cardWide.v1')).join() === 'combat', 'saved');
    WASD.hub.resetOrder(); await tick();
    ok(!$('[data-card-id="combat"]').classList.contains('card--wide'), 'Reset layout clears full width');

    // ---------------- Export and import ----------------
    WASD.resetCharacter(); await tick();
    location.hash = '#/card/identity'; await tick(150);
    ok(/Race\s*Human/.test($('#card-view-body').textContent) && /Subrace\s*None/.test($('#card-view-body').textContent), 'Identity shows race and subrace separately');
    let blob = null; let fileName = '';
    const realCreate = URL.createObjectURL; const realClick = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (b) => { blob = b; return 'blob:test'; };
    HTMLAnchorElement.prototype.click = function () { fileName = this.download; };
    try { await click('#export-character'); } finally { URL.createObjectURL = realCreate; HTMLAnchorElement.prototype.click = realClick; }
    const exported = JSON.parse(await blob.text());
    ok(fileName === 'Kira.json' && exported.character.identity.name === 'Kira' && /Exported Kira as Kira\.json/.test(status()), 'export: ' + fileName);
    const importText = async (text) => {
      const dt = new DataTransfer(); dt.items.add(new File([text], 'x.json', { type: 'application/json' }));
      const input = $('#import-character'); input.files = dt.files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Reading a file is asynchronous: wait for an error or the confirm dialog (up to 3 s).
      for (let i = 0; i < 30 && !$('#import-error') && !$('#confirm-dialog').open; i++) await tick(100);
    };
    await importText('not json');
    ok(/not valid JSON/.test($('#import-error').textContent) && document.activeElement.id === 'import-character', 'bad file: error shown, focus on the file field');
    const evil = JSON.parse(JSON.stringify(exported)); evil.character.identity.name = '<img src=x onerror=alert(1)>';
    $('#import-error').remove();
    await importText(JSON.stringify(evil));
    ok(/not allowed/.test($('#import-error').textContent) && WASD.raw.identity.name === 'Kira', 'HTML in a file is rejected');
    const wrong = JSON.parse(JSON.stringify(exported)); wrong.character.combat.hp.current = 99;
    $('#import-error').remove();
    await importText(JSON.stringify(wrong));
    ok(/impossible numbers/.test($('#import-error').textContent), 'impossible HP rejected');
    const good = JSON.parse(JSON.stringify(exported)); good.character.identity.name = 'Kiri'; good.character.combat.hp.current = 20;
    $('#import-error').remove();
    await importText(JSON.stringify(good));
    ok($('#confirm-dialog').open && /Import Kiri\?/.test($('#confirm-title').textContent), 'valid file asks before replacing');
    await click('#confirm-yes'); await tick(150);
    ok(WASD.raw.identity.name === 'Kiri' && hp().current === 20 && /Imported Kiri, a level 4 Human Rogue\. HP 20 of 31/.test(status()), 'imported: ' + status());
    ok(!$('#import-error'), 'error cleared after a good import');

    WASD.resetCharacter(); WASD.hub.resetOrder(); location.hash = '#/'; await tick(150);
  } catch (e) { log('EXCEPTION', e.stack); }
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
