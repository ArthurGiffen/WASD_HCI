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
      // Fighter Dwarf: Con 14+2=16 (+3). HP 10+3=13. Chain mail 16, no Dex. Speed 25. Longsword: Str 15 (+2) + PB 2 = +4, 1d8+2.
      let c = make('Fighter', 'Dwarf');
      ok(c.combat.hp.max === 13 && c.combat.armorClass === 16 && c.combat.speed === 25, `Fighter Dwarf HP13 AC16 Spd25 (got ${c.combat.hp.max}/${c.combat.armorClass}/${c.combat.speed})`);
      ok(c.combat.attacks[0].toHit === 4 && WASD.rules.formatDamage(c.combat.attacks[0].damage) === '1d8+2 slashing', 'Longsword +4, 1d8+2 slashing: ' + WASD.rules.formatDamage(c.combat.attacks[0].damage));
      ok(c.abilities.find((a) => a.key === 'con').save === 5 && c.abilities.find((a) => a.key === 'str').save === 4, 'Fighter saves: Con +5, Str +4');
      // Cleric Halfling: Dex 12+2=14 (+2). Con 14 (+2): HP 8+2=10. Scale mail 14 + min(Dex 2, cap 2)=16. Wis 15 (+2): DC 8+2+2=12, attack +4.
      c = make('Cleric', 'Halfling');
      ok(c.combat.hp.max === 10 && c.combat.armorClass === 16 && c.combat.speed === 25, `Cleric Halfling HP10 AC16 Spd25 (got ${c.combat.hp.max}/${c.combat.armorClass}/${c.combat.speed})`);
      ok(c.spellcasting.saveDC === 12 && c.spellcasting.attackBonus === 4 && c.spellcasting.ability === 'Wisdom', 'Cleric spell DC 12, +4, Wisdom');
      // Rogue Elf: Dex 15+2=17 (+3). HP 8+2=10. Leather 11+3=14. Stealth expertise 3+4=+7. Perception (Wis 13, +1) proficient = +3. Sneak 1d6.
      c = make('Rogue', 'Elf');
      ok(c.combat.hp.max === 10 && c.combat.armorClass === 14 && c.combat.speed === 30, `Rogue Elf HP10 AC14 Spd30 (got ${c.combat.hp.max}/${c.combat.armorClass}/${c.combat.speed})`);
      ok(c.skills.find((s) => s.name === 'Stealth').bonus === 7 && c.skills.find((s) => s.name === 'Perception').bonus === 3, 'Rogue Elf Stealth +7, Perception +3');
      ok(c.combat.attacks.find((a) => a.id === 'sneak').damage[0].dice === '1d6', 'level 1 Sneak Attack 1d6');
      ok(c.passivePerception === 13, 'passive Perception 13');
      // Human Wizard: every score +1 -> Str 9 (-1), Dex 14 (+2), Con 15 (+2), Int 16 (+3). HP 6+2=8. Unarmored 10+2=12. Quarterstaff Str: -1 +2 = +1, 1d6-1.
      c = make('Wizard', 'Human');
      ok(c.combat.hp.max === 8 && c.combat.armorClass === 12, `Human Wizard HP8 AC12 (got ${c.combat.hp.max}/${c.combat.armorClass})`);
      ok(c.combat.attacks[0].toHit === 1 && WASD.rules.formatDamage(c.combat.attacks[0].damage) === '1d6-1 bludgeoning', 'Quarterstaff +1, 1d6-1: ' + WASD.rules.formatDamage(c.combat.attacks[0].damage));
      ok(c.spellcasting.saveDC === 13, 'Wizard DC 8+2+3 = 13');
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

      // --- Persistence: change things, then really reload the page ---
      WASD.updateCharacter((r) => { r.combat.hp.current = 9; });
      document.documentElement.setAttribute('data-theme', 'forest');
      localStorage.setItem('wasd.settings.v1', JSON.stringify({ theme: 'forest', largeText: true }));
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
    ok(errors.length === 0, 'no JS errors after reload: ' + errors.join(' | '));
    WASD.resetCharacter(); WASD.hub.resetOrder(); localStorage.removeItem('wasd.settings.v1');
  } catch (e) { out.push('EXCEPTION ' + e.stack); }
  sessionStorage.clear();
  const pre = document.createElement('pre'); pre.id = 'test-out'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
})();
