/*
 * EQUIPMENT & INVENTORY CARD
 * OWNER: Person C
 */
WASD.registerCard({
  id: 'equipment',
  title: 'Equipment',

  summary(ch) {
    const e = ch.equipment;
    return `${e.armor} · ${e.weapons.join(', ')} · ${e.coins.gp} gp`;
  },

  render(ch, ctx) {
    const { esc } = WASD;
    const e = ch.equipment;
    const h = ctx.sub;
    const list = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join('');

    // TODO(Person C): add/remove items, quantities, weight/encumbrance, equipped toggle.
    return `
      <dl class="pair-list">
        <div><dt>Armor</dt><dd>${esc(e.armor)}</dd></div>
      </dl>
      <${h}>Weapons</${h}>
      <ul class="plain-list">${list(e.weapons)}</ul>
      <${h}>Gear</${h}>
      <ul class="plain-list">${list(e.items)}</ul>
      <${h}>Coins</${h}>
      <dl class="pair-list">
        <div><dt>Gold</dt><dd>${e.coins.gp}</dd></div>
        <div><dt>Silver</dt><dd>${e.coins.sp}</dd></div>
        <div><dt>Copper</dt><dd>${e.coins.cp}</dd></div>
        <div><dt>Platinum</dt><dd>${e.coins.pp}</dd></div>
      </dl>`;
  },
});
