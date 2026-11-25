// Extra suite: hand-calculated rules checks for each class/race, Quick Page order, browser Back, and a real page reload.
// Extra feature checks. Expected numbers were worked out by hand from the 2014 rules, not from the app.
const out = [];
const ok = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
const errors = [];
window.addEventListener('error', (e) => errors.push(e.message));
const $ = (s) => document.querySelector(s);
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 100));
const click = async (s) => { $(s).click(); await tick(); };
const phase = sessionStorage.getItem('phase') || 'one';
(async () => {
  try {
    if (phase === 'one') {
      WASD.resetCharacter(); WASD.hub.resetOrder(); await tick();
      // --- Rules: hand-calculated builds (suggested standard-array scores) ---
      const make = (className, race) => {
        const f = { charName: 'Test', className, race };
        const s = WASD.classData[className].suggested;
        Object.keys(s).forEach((k) => { f['score-' + k] = String(s[k]); });
        return WASD.rules.derive(WASD.newCharacter.build(f));
      };
      // Fighter Hill Dwarf (SRD 5.1: the only dwarf subrace): Con 14+2=16 (+3), Wis 12+1=13.
      // HP 10+3, +1 Dwarven Toughness = 14. Chain mail 16, no Dex. Speed 25. Longsword: Str 15 (+2) + PB 2 = +4, 1d8+2.
      let c = make('Fighter', 'Dwarf');
      ok(c.identity.race === 'Dwarf' && c.identity.subrace === 'Hill Dwarf', `race Dwarf, subrace Hill Dwarf: ${c.identity.race} / ${c.identity.subrace}`);
      ok(c.combat.hp.max === 14 && c.combat.armorClass === 16 && c.combat.speed === 25, `Fighter Hill Dwarf HP14 AC16 Spd25 (got ${c.combat.hp.max}/${c.combat.armorClass}/${c.combat.speed})`);
      ok(c.abilities.find((a) => a.key === 'wis').score === 13 && c.abilities.find((a) => a.key === 'con').score === 16, 'Hill Dwarf: Con 16, Wis 13');
      const names = (ch) => ch.features.map((f) => f.name);
      ok(['Dwarven Combat Training', 'Tool Proficiency', 'Stonecunning', 'Dwarven Toughness'].every((n) => names(c).includes(n)), 'SRD dwarf traits listed: ' + names(c).join(', '));
      ok(c.combat.attacks[0].toHit === 4 && WASD.rules.formatDamage(c.combat.attacks[0].damage) === '1d8+2 slashing', 'Longsword +4, 1d8+2 slashing: ' + WASD.rules.formatDamage(c.combat.attacks[0].damage));
      ok(c.abilities.find((a) => a.key === 'con').save === 5 && c.abilities.find((a) => a.key === 'str').save === 4, 'Fighter saves: Con +5, Str +4');
      // Cleric Lightfoot Halfling: Dex 12+2=14 (+2), Cha 10+1=11. Con 14 (+2): HP 8+2=10. Scale mail 14 + min(Dex 2, cap 2)=16. Wis 15 (+2): DC 8+2+2=12, attack +4.
      c = make('Cleric', 'Halfling');
      ok(c.identity.race === 'Halfling' && c.identity.subrace === 'Lightfoot Halfling' && c.abilities.find((a) => a.key === 'cha').score === 11, 'Halfling, subrace Lightfoot Halfling, Cha 11');
      ok(c.combat.hp.max === 10 && c.combat.armorClass === 16 && c.combat.speed === 25, `Cleric Halfling HP10 AC16 Spd25 (got ${c.combat.hp.max}/${c.combat.armorClass}/${c.combat.speed})`);
      ok(c.spellcasting.saveDC === 12 && c.spellcasting.attackBonus === 4 && c.spellcasting.ability === 'Wisdom', 'Cleric spell DC 12, +4, Wisdom');
      // SRD 5.1: a 1st-level cleric knows 3 cantrips and picks a Divine Domain (Life is the SRD's only one).
      const cantrips = (ch) => ch.spellcasting.spells.filter((s) => s.level === 0).map((s) => s.name);
      ok(cantrips(c).length === 3 && cantrips(c).includes('Spare the Dying'), 'Cleric knows 3 cantrips incl. Spare the Dying: ' + cantrips(c).join(', '));
      ok(c.identity.subclass === 'Life Domain' && names(c).includes('Disciple of Life') && names(c).includes('Naturally Stealthy'), 'Life Domain and Lightfoot features');
      // Rogue High Elf: Dex 15+2=17 (+3), Int 12+1=13. HP 8+2=10. Leather 11+3=14. Stealth expertise 3+4=+7. Perception (Wis 13, +1) proficient = +3. Sneak 1d6.
      c = make('Rogue', 'Elf');
      ok(c.combat.hp.max === 10 && c.combat.armorClass === 14 && c.combat.speed === 30, `Rogue Elf HP10 AC14 Spd30 (got ${c.combat.hp.max}/${c.combat.armorClass}/${c.combat.speed})`);
      ok(c.skills.find((s) => s.name === 'Stealth').bonus === 7 && c.skills.find((s) => s.name === 'Perception').bonus === 3, 'Rogue Elf Stealth +7, Perception +3');
      ok(c.combat.attacks.find((a) => a.id === 'sneak').damage[0].dice === '1d6', 'level 1 Sneak Attack 1d6');
      ok(c.passivePerception === 13, 'passive Perception 13');
      ok(c.identity.race === 'Elf' && c.identity.subrace === 'High Elf' && c.abilities.find((a) => a.key === 'int').score === 13 && names(c).includes('Elf Weapon Training'), 'High Elf: Int 13, Elf Weapon Training');
      // Human Wizard: every score +1 -> Str 9 (-1), Dex 14 (+2), Con 15 (+2), Int 16 (+3). HP 6+2=8. Unarmored 10+2=12. Quarterstaff Str: -1 +2 = +1, 1d6-1.
      c = make('Wizard', 'Human');
      ok(c.combat.hp.max === 8 && c.combat.armorClass === 12, `Human Wizard HP8 AC12 (got ${c.combat.hp.max}/${c.combat.armorClass})`);
      ok(c.combat.attacks[0].toHit === 1 && WASD.rules.formatDamage(c.combat.attacks[0].damage) === '1d6-1 bludgeoning', 'Quarterstaff +1, 1d6-1: ' + WASD.rules.formatDamage(c.combat.attacks[0].damage));
      ok(c.spellcasting.saveDC === 13, 'Wizard DC 8+2+3 = 13');
      ok(cantrips(c).length === 3 && cantrips(c).includes('Minor Illusion'), 'Wizard knows 3 cantrips incl. Minor Illusion: ' + cantrips(c).join(', '));
      ok(c.identity.race === 'Human' && c.identity.subclass === '', 'Human has no subrace; wizards pick a tradition at level 2, not 1');
      // Hill Dwarf Level Up 1 -> 2: Fighter d10 average 6, +3 Con, +1 Dwarven Toughness = 10.
      {
        const f = { charName: 'Dain', className: 'Fighter', race: 'Dwarf' };
        Object.entries(WASD.classData.Fighter.suggested).forEach(([k, v]) => { f['score-' + k] = String(v); });
        WASD.setCharacter(WASD.newCharacter.build(f)); await tick();
        await click('#level-up-btn');
        const lbl = $('label[for="hp-method-average"]').textContent;
        ok(/6 \+3 Constitution, \+1 Dwarven Toughness = 10 HP/.test(lbl), 'Hill Dwarf level up average 10 HP: ' + lbl);
        await click('#hp-method-average'); await tick();
        ok(/Max HP 14 → 24/.test($('#wizard-body').textContent), 'Max HP 14 -> 24: ' + ($('#wizard-body .callout') || {}).textContent);
        await click('#wizard-cancel');
        WASD.resetCharacter(); WASD.hub.resetOrder(); await tick();
      }
      // Proficiency bonus by level, Sneak Attack dice by level
      ok([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(WASD.rules.proficiencyBonus).join() === '2,2,3,3,4,4,5,5,6,6', 'proficiency bonus table');
      ok([1, 3, 8, 10].map(WASD.rules.abilityMod).join() === '-5,-4,-1,0' && [11, 12, 15, 20].map(WASD.rules.abilityMod).join() === '0,1,2,5', 'ability modifier table');

      // --- Quick Page numbers follow the hub order ---
      await click('#edit-layout');
      for (let i = 0; i < 4; i++) await click('#move-up-equipment');
      await click('#edit-layout');
      ok(WASD.hub.getOrder()[0] === 'equipment', 'Equipment moved to first');
      $('#open-quick-page').focus(); await click('#open-quick-page');
      ok($('#quick-page-list a').textContent === 'Equipment', 'Quick Page item 1 is now Equipment');
      $('#quick-page').dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })); await tick(150);
      ok(location.hash === '#/card/equipment' && document.activeElement.id === 'card-view-title', 'key 1 opens Equipment, focus on its heading');

      // --- Browser Back returns to the hub with focus on the card you came from ---
      history.back(); await tick(200);
      ok(location.hash === '#/' || location.hash === '', 'Back returns to hub');
      ok(document.activeElement.id === 'card-equipment-toggle', 'focus back on the Equipment card (' + document.activeElement.id + ')');

      // --- 2014 rules wording (see CLAUDE.md) ---
      const feature = (list, name) => (list.find((f) => f.name === name) || {}).summary || '';
      const secondWind = feature(WASD.classData.Fighter.features[1], 'Second Wind');
      ok(/short or long rest/.test(secondWind), '2014 Second Wind recharges on a short or long rest: ' + secondWind);
      [feature(WASD.classData.Rogue.features[1], 'Sneak Attack'), feature(WASD.sampleCharacter.features, 'Sneak Attack')].forEach((s) => {
        ok(/finesse or ranged weapon/.test(s) && /disadvantage/.test(s), '2014 Sneak Attack conditions: ' + s);
      });
      const ring = WASD.sampleCharacter.equipment.items.find((i) => i.id === 'ring');
      ok(ring.attunement === true && ring.modifiers.some((m) => m.stat === 'ac' && m.value === 1) && ring.modifiers.some((m) => m.stat === 'save' && m.value === 1),
        '2014 Ring of Protection: +1 AC, +1 saving throws, attunement');
      const words2024 = /\b(species|weapon mastery|cunning strike|origin feat|heroic inspiration|utilize|hit point dice|bloodied)\b/i;
      const allText = JSON.stringify([WASD.classData, WASD.raceData, WASD.sampleCharacter]);
      ok(!words2024.test(allText), 'no 2024-only terms in the data: ' + (allText.match(words2024) || [''])[0]);

      // --- Header stats: players pick which three numbers the header shows ---
      const tiles = () => [...document.querySelectorAll('#header-stats .header-stat')].map((t) => `${t.querySelector('dt').textContent} ${t.querySelector('dd').textContent}`.replace(/\s+/g, ' ').trim());
      ok(tiles().join(' | ') === 'Human Rogue Level 4 | Hit points 27/ of 31 | Armor class 15', 'default header: ' + tiles().join(' | '));
      await click('#settings-btn');
      ok(document.querySelectorAll('#header-stat-pickers select').length === 3 && $('label[for="header-stat-1"]').textContent === 'Second stat', '3 labelled header pickers');
      const pick = $('#header-stat-1'); pick.value = 'initiative'; pick.dispatchEvent(new Event('change', { bubbles: true })); await tick(120);
      ok(tiles()[1] === 'Initiative +3', 'second tile is now Initiative +3: ' + tiles()[1]);
      ok(/Second stat in the header is now Initiative/.test($('#settings-live').textContent), 'change announced: ' + $('#settings-live').textContent);
      const saved = () => (JSON.parse(localStorage.getItem('wasd.settings.v1')) || {}).headerStats || [];
      ok(saved().join() === 'level,initiative,ac', 'choice saved: ' + saved().join());
      await click('#theme-dark');
      ok(saved().join() === 'level,initiative,ac', 'changing the theme keeps the header choice');
      await click('#header-stats-default');
      ok(tiles()[1].startsWith('Hit points') && $('#header-stat-1').value === 'hp', 'default button restores Level, HP, AC');
      await click('#theme-parchment'); await click('#close-settings');

      // --- Persistence: change things, then really reload the page ---
      WASD.updateCharacter((r) => { r.combat.hp.current = 9; });
      document.documentElement.setAttribute('data-theme', 'forest');
      localStorage.setItem('wasd.settings.v1', JSON.stringify({ theme: 'forest', largeText: true, headerStats: ['gold', 'passive', 'spelldc'] }));
      ok(errors.length === 0, 'no JS errors in phase one: ' + errors.join(' | '));
      sessionStorage.setItem('phase', 'two');
      sessionStorage.setItem('results', out.join('\n'));
      location.reload();
      return;
    }
    // phase two: after a real reload
    out.push(...(sessionStorage.getItem('results') || '').split('\n'));
    ok(WASD.raw.combat.hp.current === 9, 'HP 9 survived reload');
    ok(WASD.hub.getOrder()[0] === 'equipment', 'card order survived reload');
    ok(document.documentElement.dataset.theme === 'forest' && document.documentElement.dataset.text === 'large', 'theme + large text survived reload');
    const tiles2 = () => [...document.querySelectorAll('#header-stats .header-stat')].map((t) => `${t.querySelector('dt').textContent} ${t.querySelector('dd').textContent}`.replace(/\s+/g, ' ').trim());
    // Kira: 15 gp, passive Perception 13 (10 + Wis +1 + proficiency 2), no spellcasting.
    ok(tiles2().join(' | ') === 'Gold 15 gp | Passive Perception 13 | Spell save DC None', 'header choice survived reload: ' + tiles2().join(' | '));
    $('#reset-demo').click(); await tick(100); $('#confirm-yes').click(); await tick(200);
    ok(tiles2()[0] === 'Human Rogue Level 4' && tiles2()[2] === 'Armor class 15', 'Reset demo restores Level, HP, AC: ' + tiles2().join(' | '));
    ok(errors.length === 0, 'no JS errors after reload: ' + errors.join(' | '));
    WASD.resetCharacter(); WASD.hub.resetOrder(); localStorage.removeItem('wasd.settings.v1');
  } catch (e) { out.push('EXCEPTION ' + e.stack); }
  sessionStorage.clear();
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
