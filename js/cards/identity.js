/*
 * IDENTITY CARD: name, race, class, level, background.
 * OWNER: Person C
 * Later: the guided first-time character build will probably start here.
 */
WASD.registerCard({
  id: 'identity',
  title: 'Identity',
  icon: 'user',

  summary(ch) {
    const id = ch.identity;
    return `${id.race} ${id.className} ${id.level} · ${id.background}`;
  },

  render(ch) {
    const { esc } = WASD;
    const id = ch.identity;

    return `
      <dl class="pair-list">
        <div><dt>Name</dt><dd>${esc(id.name)}</dd></div>
        <div><dt>Race</dt><dd>${esc(id.race)}</dd></div>
        <div><dt>Class</dt><dd>${esc(id.className)} (${esc(id.subclass)})</dd></div>
        <div><dt>Level</dt><dd>${id.level}</dd></div>
        <div><dt>Background</dt><dd>${esc(id.background)}</dd></div>
        <div><dt>Alignment</dt><dd>${esc(id.alignment)}</dd></div>
        <div><dt>Experience</dt><dd>${id.experience} XP</dd></div>
      </dl>`;
  },
});
