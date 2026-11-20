/*
 * SKILLS CARD
 * OWNER: Person B
 *
 * "Proficient only" filter: a toggle button (aria-pressed) that hides untrained skills.
 */
(function (WASD) {
  'use strict';

  let proficientOnly = false;

  WASD.actions['skills-filter'] = () => {
    proficientOnly = !proficientOnly;
    WASD.refresh();
    WASD.announce(proficientOnly ? 'Showing proficient skills only.' : 'Showing all skills.');
  };

  WASD.registerCard({
    id: 'skills',
    title: 'Skills',
    icon: 'check',

    summary(ch) {
      const best = ch.skills.reduce((top, s) => (s.bonus > top.bonus ? s : top));
      return `${best.name} ${WASD.signed(best.bonus)} · Passive Perception ${ch.passivePerception}`;
    },

    render(ch) {
      const { esc, signed } = WASD;

      // Proficiency is shown as a TEXT tag, not just an icon or color.
      const shown = ch.skills.filter((s) => !proficientOnly || s.proficiency !== 'none');
      const rows = shown.map((s) => {
        const tag = s.proficiency === 'none' ? '' : ` <span class="tag tag--on">${esc(s.proficiency)}</span>`;
        return `<li class="skill-row"><span>${esc(s.name)} <span class="tag">${esc(s.ability.toUpperCase())}</span>${tag}</span><strong>${signed(s.bonus)}</strong></li>`;
      }).join('');

      return `
        <p><strong>Passive Perception:</strong> ${ch.passivePerception}</p>
        <button type="button" class="btn btn--small btn--toggle" id="skills-filter" data-action="skills-filter"
                aria-pressed="${proficientOnly}">Proficient only</button>
        <ul class="skill-list">${rows}</ul>`;
    },
  });
})(window.WASD);
