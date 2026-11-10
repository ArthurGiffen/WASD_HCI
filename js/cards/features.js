/*
 * FEATURES, TRAITS & BACKSTORY CARD
 * OWNER: Person C
 */
WASD.registerCard({
  id: 'features',
  title: 'Features & Backstory',

  summary(ch) {
    return `${ch.features.length} features · ${ch.features.slice(0, 2).map((f) => f.name).join(', ')}…`;
  },

  render(ch, ctx) {
    const { esc } = WASD;
    const h = ctx.sub;
    const t = ch.traits;

    // TODO(Person C): expandable feature details, filter by source (class/race/background).
    const features = ch.features.map((f) =>
      `<li><strong>${esc(f.name)}</strong> <span class="tag">${esc(f.source)}</span><br>${esc(f.summary)}</li>`
    ).join('');

    return `
      <${h}>Features</${h}>
      <ul class="plain-list">${features}</ul>
      <${h}>Traits</${h}>
      <dl class="pair-list">
        <div><dt>Personality</dt><dd>${esc(t.personality)}</dd></div>
        <div><dt>Ideal</dt><dd>${esc(t.ideal)}</dd></div>
        <div><dt>Bond</dt><dd>${esc(t.bond)}</dd></div>
        <div><dt>Flaw</dt><dd>${esc(t.flaw)}</dd></div>
      </dl>
      <${h}>Backstory</${h}>
      <p>${esc(ch.backstory)}</p>`;
  },
});
