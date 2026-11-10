/*
 * COMBAT CARD: AC, HP, initiative, speed, attacks.
 * OWNER: Person B
 *
 * This is the most-used card at the table (test task 1: "What's your AC?").
 * Keep Armor Class as the FIRST value in both the summary and the body, so
 * it is seen first AND announced first by screen readers.
 */
WASD.registerCard({
  id: 'combat',
  title: 'Combat',

  summary(ch) {
    const c = ch.combat;
    return `AC ${c.armorClass} · HP ${c.hp.current}/${c.hp.max} · Initiative ${WASD.signed(c.initiative)}`;
  },

  render(ch, ctx) {
    const { esc, signed } = WASD;
    const c = ch.combat;
    const h = ctx.sub;

    // TODO(Person B): replace this placeholder with the real Combat layout:
    // HP +/- controls, temp HP, hit dice, death saves, conditions.
    const attacks = c.attacks.map((a) => {
      const hit = a.toHit === null ? '' : ` ${signed(a.toHit)} to hit ·`;
      const extra = a.range || a.note ? ` (${esc(a.range || a.note)})` : '';
      return `<li><strong>${esc(a.name)}</strong>${hit} ${esc(a.damage)}${extra}</li>`;
    }).join('');

    // "27 / 31" is read as "27 of 31" by screen readers via the hidden text.
    return `
      <dl class="stat-list">
        <div class="stat stat--primary"><dt>Armor Class</dt><dd>${c.armorClass}</dd></div>
        <div class="stat"><dt>Hit Points</dt>
          <dd>${c.hp.current}<span aria-hidden="true"> / </span><span class="visually-hidden"> of </span>${c.hp.max}</dd></div>
        <div class="stat"><dt>Initiative</dt><dd>${signed(c.initiative)}</dd></div>
        <div class="stat"><dt>Speed</dt><dd>${c.speed} ft</dd></div>
      </dl>
      <${h}>Attacks</${h}>
      <ul class="plain-list">${attacks}</ul>`;
  },
});
