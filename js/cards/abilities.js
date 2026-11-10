/*
 * ABILITIES & SAVING THROWS CARD
 * OWNER: Person B
 */
WASD.registerCard({
  id: 'abilities',
  title: 'Abilities & Saves',

  summary(ch) {
    const top = ch.abilities.reduce((best, a) => (a.score > best.score ? a : best));
    const saves = ch.abilities.filter((a) => a.saveProficient).map((a) => a.key.toUpperCase());
    return `${top.key.toUpperCase()} ${top.score} highest · Proficient saves: ${saves.join(', ')}`;
  },

  render(ch) {
    const { esc, signed } = WASD;

    // TODO(Person B): decide the final layout (table vs. tiles); add tap-to-roll later.
    const rows = ch.abilities.map((a) => `
      <tr>
        <th scope="row">${esc(a.name)}</th>
        <td>${a.score}</td>
        <td>${signed(a.mod)}</td>
        <td>${signed(a.save)}${a.saveProficient ? ' <span class="tag">proficient</span>' : ''}</td>
      </tr>`).join('');

    return `
      <table class="data-table">
        <caption class="visually-hidden">Ability scores and saving throws</caption>
        <thead>
          <tr><th scope="col">Ability</th><th scope="col">Score</th><th scope="col">Modifier</th><th scope="col">Save</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },
});
