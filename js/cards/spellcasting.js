/*
 * SPELLCASTING CARD
 * OWNER: Person C
 * Later: "Add Spell" flow starts from this card.
 */
WASD.registerCard({
  id: 'spellcasting',
  title: 'Spellcasting',
  icon: 'star',

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

    const spells = (s.spells || []).map((sp) =>
      `<li>${esc(sp.name)} <span class="tag">${sp.level === 0 ? 'cantrip' : `level ${sp.level}`}</span></li>`).join('');
    const slots = (s.slots || []).map((sl) =>
      `<li>Level ${sl.level}: ${sl.total - sl.used} of ${sl.total} slots left</li>`).join('');

    return `
      <dl class="stat-list">
        <div class="stat"><dt>Spell save DC</dt><dd>${s.saveDC}</dd></div>
        <div class="stat"><dt>Spell attack</dt><dd>${signed(s.attackBonus)}</dd></div>
        <div class="stat"><dt>Ability</dt><dd>${esc(s.ability)}</dd></div>
      </dl>
      ${slots ? `<${h}>Spell slots</${h}><ul class="plain-list">${slots}</ul>` : ''}
      <${h}>Spells</${h}>
      <ul class="plain-list">${spells}</ul>`;
  },
});
