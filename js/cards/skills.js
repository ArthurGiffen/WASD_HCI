/*
 * SKILLS CARD
 * OWNER: Person B
 */
WASD.registerCard({
  id: 'skills',
  title: 'Skills',

  summary(ch) {
    const best = ch.skills.reduce((top, s) => (s.bonus > top.bonus ? s : top));
    return `${best.name} ${WASD.signed(best.bonus)} · Passive Perception ${ch.passivePerception}`;
  },

  render(ch) {
    const { esc, signed } = WASD;

    // TODO(Person B): consider sorting/filtering (e.g. "proficient only") and tap-to-roll.
    // Proficiency is shown as a TEXT tag, not just an icon or color.
    const items = ch.skills.map((s) => {
      const tag = s.proficiency === 'none' ? '' : ` <span class="tag">${esc(s.proficiency)}</span>`;
      return `<li>${esc(s.name)} <span class="tag">${esc(s.ability.toUpperCase())}</span> <strong>${signed(s.bonus)}</strong>${tag}</li>`;
    }).join('');

    return `
      <p><strong>Passive Perception:</strong> ${ch.passivePerception}</p>
      <ul class="plain-list">${items}</ul>`;
  },
});
