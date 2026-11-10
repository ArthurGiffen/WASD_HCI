/*
 * SPELLCASTING CARD
 * OWNER: Person C
 * Later: "Add Spell" flow starts from this card.
 */
WASD.registerCard({
  id: 'spellcasting',
  title: 'Spellcasting',

  summary(ch) {
    const s = ch.spellcasting;
    if (!s) return 'No spells for this character';
    return `Save DC ${s.saveDC} · Spell attack ${WASD.signed(s.attackBonus)}`;
  },

  render(ch, ctx) {
    const s = ch.spellcasting;
    if (!s) {
      return '<p>This character has no spellcasting. Classes and subclasses that cast spells will show their spells here.</p>';
    }

    const { esc, signed } = WASD;
    const h = ctx.sub;

    // TODO(Person C): real layout: slots tracker, prepared toggle, spell details, Add Spell button.
    // Shape of ch.spellcasting is sketched in js/data/sample-character.js.
    const spells = (s.spells || []).map((sp) => `<li>${esc(sp.name)} <span class="tag">level ${sp.level}</span></li>`).join('');

    return `
      <dl class="stat-list">
        <div class="stat"><dt>Spell save DC</dt><dd>${s.saveDC}</dd></div>
        <div class="stat"><dt>Spell attack</dt><dd>${signed(s.attackBonus)}</dd></div>
        <div class="stat"><dt>Ability</dt><dd>${esc(s.ability)}</dd></div>
      </dl>
      <${h}>Spells</${h}>
      <ul class="plain-list">${spells}</ul>`;
  },
});
