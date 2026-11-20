/*
 * FEATURES CARD: three scrolling tabs.
 *   Features   class, subclass and race features
 *   Feats      feats taken
 *   Backstory  background, personality traits and backstory
 * OWNER: Person C
 */
WASD.registerCard({
  id: 'features',
  title: 'Features & Backstory',
  icon: 'book',

  summary(ch) {
    const feats = ch.feats.length ? ` · ${ch.feats.length} feats` : '';
    return `${ch.features.length} features${feats} · ${ch.features.slice(0, 2).map((f) => f.name).join(', ')}…`;
  },

  render(ch, ctx) {
    const { esc } = WASD;
    const h = ctx.sub;
    const t = ch.traits;

    const li = (f) =>
      `<li><strong>${esc(f.name)}</strong> <span class="tag">${esc(f.source)}</span><br>${esc(f.summary)}</li>`;

    const features = `<ul class="plain-list plain-list--spaced">${ch.features.map(li).join('')}</ul>`;

    const feats = ch.feats.length
      ? `<ul class="plain-list plain-list--spaced">${ch.feats.map(li).join('')}</ul>`
      : `<p>${esc(ch.identity.name)} has no feats yet.</p>`;

    const backstory = `
      <dl class="pair-list">
        <div><dt>Background</dt><dd>${esc(ch.identity.background)}</dd></div>
        <div><dt>Alignment</dt><dd>${esc(ch.identity.alignment)}</dd></div>
      </dl>
      <${h}>Traits</${h}>
      <dl class="pair-list">
        <div><dt>Personality</dt><dd>${esc(t.personality)}</dd></div>
        <div><dt>Ideal</dt><dd>${esc(t.ideal)}</dd></div>
        <div><dt>Bond</dt><dd>${esc(t.bond)}</dd></div>
        <div><dt>Flaw</dt><dd>${esc(t.flaw)}</dd></div>
      </dl>
      <${h}>Backstory</${h}>
      <p>${esc(ch.backstory)}</p>`;

    return WASD.tabs.render('feat', 'Features sections', [
      { id: 'features', label: 'Features', html: features },
      { id: 'feats', label: 'Feats', html: feats },
      { id: 'backstory', label: 'Backstory', html: backstory },
    ]);
  },
});
