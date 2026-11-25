/*
 * IDENTITY CARD: name, race, subrace, class, level, background, plus
 * exporting and importing the character as a file.
 * OWNER: Person C
 *
 * Export downloads the saved character as a .json file. Import reads a file
 * the player picks, checks it (WASD.checkImport in character-store.js), asks
 * before replacing the current character, then loads it. Nothing is uploaded:
 * the file is read in the browser.
 */
(function (WASD) {
  'use strict';

  let importError = '';
  document.addEventListener('wasd:character-replaced', () => { importError = ''; });

  /** "Kira" -> "Kira.json"; anything unusual becomes "-". */
  const fileName = (name) => `${(name || 'character').replace(/[^A-Za-z0-9 _-]+/g, '-').trim() || 'character'}.json`;

  WASD.actions['export-character'] = () => {
    const raw = WASD.raw;
    const data = { app: "Hero's Ledger", exported: new Date().toISOString().slice(0, 10), character: raw };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName(raw.identity.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    WASD.announce(`Exported ${raw.identity.name} as ${a.download}. Check your downloads.`);
  };

  function showImportError(message) {
    importError = message;
    WASD.refresh();
    const input = document.getElementById('import-character');
    if (input) input.focus();
    WASD.announce(message);
  }

  WASD.inputs['import-character'] = (el) => {
    const file = el.files && el.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { showImportError('That file is too big to be a character file (over 1 MB).'); return; }
    const reader = new FileReader();
    reader.onerror = () => showImportError('That file could not be read.');
    reader.onload = async () => {
      const result = WASD.checkImport(String(reader.result));
      if (result.error) { showImportError(result.error); return; }
      const ok = await WASD.confirm({
        opener: document.getElementById('import-character'),
        title: `Import ${result.raw.identity.name}?`,
        message: `This replaces ${WASD.raw.identity.name} on this device with ${result.raw.identity.name}, level ${result.raw.identity.level}. Export first if you want to keep the current character. "Reset demo" brings Kira back.`,
        confirmLabel: 'Import',
      });
      if (!ok) { WASD.announce('Import cancelled. Nothing changed.'); return; }
      importError = '';
      WASD.setCharacter(result.raw);
      const ch = WASD.character;
      WASD.announce(`Imported ${ch.identity.name}, a level ${ch.identity.level} ${ch.identity.raceLabel} ${ch.identity.className}. HP ${ch.combat.hp.current} of ${ch.combat.hp.max}.`);
    };
    reader.readAsText(file);
  };

  WASD.registerCard({
    id: 'identity',
    title: 'Identity',
    icon: 'user',

    summary(ch) {
      const id = ch.identity;
      return `${id.raceLabel} ${id.className} ${id.level} · ${id.background}`;
    },

    render(ch, ctx) {
      const { esc, icon } = WASD;
      const id = ch.identity;
      const h = ctx.sub;

      return `
        <dl class="pair-list">
          <div><dt>Name</dt><dd>${esc(id.name)}</dd></div>
          <div><dt>Race</dt><dd>${esc(id.race)}</dd></div>
          <div><dt>Subrace</dt><dd>${id.subrace ? esc(id.subrace) : 'None'}</dd></div>
          <div><dt>Class</dt><dd>${esc(id.className)}${id.subclass ? ` (${esc(id.subclass)})` : ''}</dd></div>
          <div><dt>Level</dt><dd>${id.level}</dd></div>
          <div><dt>Background</dt><dd>${esc(id.background)}</dd></div>
          <div><dt>Alignment</dt><dd>${esc(id.alignment)}</dd></div>
          <div><dt>Experience</dt><dd>${id.experience} XP</dd></div>
        </dl>
        <${h}>Character file</${h}>
        <p class="hint" id="file-hint">Save this character as a file, or load one you saved before. The file stays on your device; nothing is uploaded.</p>
        <div class="button-row">
          <button type="button" class="btn btn--small" id="export-character" data-action="export-character" aria-describedby="file-hint">Export character</button>
        </div>
        <div class="field">
          <label for="import-character">Import a character file (.json)</label>
          <input type="file" class="input" id="import-character" data-input="import-character" accept=".json,application/json"
                 aria-describedby="file-hint${importError ? ' import-error' : ''}"${importError ? ' aria-invalid="true"' : ''}>
        </div>
        ${importError ? `<p class="field-error" id="import-error">${icon('warning')} ${esc(importError)}</p>` : ''}`;
    },
  });
})(window.WASD);
