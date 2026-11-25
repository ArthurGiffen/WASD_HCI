/*
 * SPELLCASTING CARD: save DC, spell attack, spell slots (use and regain), spells.
 * OWNER: Person C
 * A long rest (Combat card) restores every slot.
 * Later: "Add Spell" flow starts from this card.
 */
(function () {
  const slotAt = (raw, level) => ((raw.spellcasting && raw.spellcasting.slots) || []).find((s) => s.level === level);

  /** delta +1 uses a slot, -1 regains one. Never below 0 or above the total. */
  function changeSlot(level, delta) {
    const slot = slotAt(WASD.raw, level);
    if (!slot) return;
    if (delta > 0 && slot.used >= slot.total) { WASD.announce(`No level ${level} spell slots left. A long rest restores them.`); return; }
    if (delta < 0 && slot.used <= 0) { WASD.announce(`All level ${level} spell slots are already available.`); return; }
    WASD.updateCharacter((raw) => { slotAt(raw, level).used += delta; });
    const s = slotAt(WASD.raw, level);
    WASD.announce(`${delta > 0 ? 'Used' : 'Regained'} a level ${level} spell slot. ${s.total - s.used} of ${s.total} left.`);
  }
  WASD.actions['slot-use'] = (el) => changeSlot(Number(el.dataset.level), 1);
  WASD.actions['slot-regain'] = (el) => changeSlot(Number(el.dataset.level), -1);
})();

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
    // Each slot level: a count in words, plus Use and Regain buttons (aria-disabled when they can't act).
    const slots = (s.slots || []).map((sl) => {
      const left = sl.total - sl.used;
      return `
      <li class="item-row">
        <span>Level ${sl.level}: <strong>${left} of ${sl.total}</strong> slots left
          <span class="pips" aria-hidden="true">${Array.from({ length: sl.total }, (_, i) => (i < left ? '●' : '○')).join(' ')}</span></span>
        <span class="item-row__buttons">
          <button type="button" class="btn btn--small" id="slot-use-${sl.level}" data-action="slot-use" data-level="${sl.level}"
                  aria-label="Use a level ${sl.level} spell slot"${left ? '' : ' aria-disabled="true"'}>Use a slot</button>
          <button type="button" class="btn btn--small" id="slot-regain-${sl.level}" data-action="slot-regain" data-level="${sl.level}"
                  aria-label="Regain a level ${sl.level} spell slot"${sl.used ? '' : ' aria-disabled="true"'}>Regain</button>
        </span>
      </li>`;
    }).join('');

    return `
      <dl class="stat-list">
        <div class="stat"><dt>Spell save DC</dt><dd>${s.saveDC}</dd></div>
        <div class="stat"><dt>Spell attack</dt><dd>${signed(s.attackBonus)}</dd></div>
        <div class="stat"><dt>Ability</dt><dd>${esc(s.ability)}</dd></div>
      </dl>
      ${slots ? `<${h}>Spell slots</${h}><ul class="item-list">${slots}</ul>` : ''}
      <${h}>Spells</${h}>
      <ul class="plain-list">${spells}</ul>`;
  },
});
