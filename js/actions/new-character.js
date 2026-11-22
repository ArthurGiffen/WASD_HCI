/*
 * NEW CHARACTER (Hub, "New character" button): the guided first-time build (test task 3).
 * OWNER: Person C
 *
 * A short 5-step wizard: Name, Class, Race, Ability scores (standard array), Review.
 * It builds a level 1 character from js/data/classes.js and loads it into the
 * same cards. It is a demo of the flow, not a full rules engine: background,
 * alignment, skill choices and spells use simple defaults. "Reset demo"
 * brings Kira back.
 *
 * Subraces: the SRD has exactly one per race (High Elf, Hill Dwarf, Lightfoot
 * Halfling), so picking the race picks the subrace too (WASD.raceInfo).
 * The Cleric's Divine Domain is likewise the SRD's only one, Life.
 */
(function (WASD) {
  'use strict';

  const btn = document.getElementById('new-character');
  const { esc, signed } = WASD;
  const ABILITIES = WASD.rules.ABILITIES;
  const shortName = (key) => key.charAt(0).toUpperCase() + key.slice(1);

  /** Base scores the player picked, e.g. { str: 15, ... }; missing ones are null. */
  function baseScores(f) {
    const out = {};
    ABILITIES.forEach((a) => { out[a.key] = f[`score-${a.key}`] ? Number(f[`score-${a.key}`]) : null; });
    return out;
  }

  /** Turn the wizard's answers into a raw character (same shape as sample-character.js). */
  function build(f) {
    const cls = WASD.classData[f.className];
    const race = WASD.raceInfo(f.race);
    const base = baseScores(f);
    const abilityScores = {};
    ABILITIES.forEach((a) => { abilityScores[a.key] = base[a.key] + (race.bonuses[a.key] || 0); });
    const conMod = WASD.rules.abilityMod(abilityScores.con);
    // Level 1: the full hit die + Con modifier. The floor of 1 is a common table
    // ruling, not SRD text (it only matters with a negative Con modifier).
    // Hill Dwarves add 1 more (Dwarven Toughness).
    const hpMax = Math.max(1, cls.hitDie + conMod) + race.hpPerLevel;
    const s = cls.start;

    const items = [];
    if (s.armor) items.push({ id: s.armor.id, name: s.armor.name, kind: 'armor', qty: 1, equipped: true, armor: s.armor.armor, modifiers: [] });
    items.push({ id: s.weapon.id, name: s.weapon.name, kind: 'weapon', qty: 1, equipped: true, modifiers: [] });
    items.push({ id: 'pack', name: "Explorer's pack", kind: 'gear', qty: 1 });

    const attacks = [{
      id: s.weapon.id, itemId: s.weapon.id, name: s.weapon.name, ability: s.weapon.ability,
      damage: [{ dice: s.weapon.dice, type: s.weapon.type }],
    }];
    if (s.sneakAttack) attacks.push({ id: 'sneak', name: 'Sneak Attack', special: 'sneakAttack', note: 'once per turn' });

    const notYet = 'Not written yet.';
    return {
      schema: WASD.SCHEMA,
      identity: {
        name: f.charName.trim(), race: race.name, className: f.className, subclass: cls.subclass || '',
        level: 1, background: 'Not chosen yet', alignment: 'Not chosen yet', experience: 0,
      },
      abilityScores,
      proficiencies: { saves: cls.saves.slice(), skills: { ...s.skills, ...race.skills } },
      combat: { hp: { current: hpMax, max: hpMax, temp: 0 }, hitDie: cls.hitDie, speed: race.speed, attacks },
      spellcasting: s.spellcasting ? JSON.parse(JSON.stringify(s.spellcasting)) : null,
      equipment: { items, coins: { cp: 0, sp: 0, gp: 10, pp: 0 } },
      features: [
        ...cls.features[1].map((x) => ({ ...x, source: `${f.className} 1` })),
        ...race.features,
      ],
      feats: [],
      traits: { personality: notYet, ideal: notYet, bond: notYet, flaw: notYet },
      backstory: notYet,
    };
  }

  /** Radio "cards" for class and race. */
  function choices(name, legend, options, current) {
    const items = options.map((o) => `
      <div class="choice choice--card">
        <input type="radio" name="${name}" id="${name}-${o.value}" value="${o.value}"${current === o.value ? ' checked' : ''}
               aria-describedby="${name}-${o.value}-desc">
        <label for="${name}-${o.value}"><strong>${esc(o.label || o.value)}</strong>
          <span class="choice__desc" id="${name}-${o.value}-desc">${esc(o.desc)}</span></label>
      </div>`).join('');
    return `<fieldset class="choices"><legend>${legend}</legend>${items}</fieldset>`;
  }

  const steps = [
    {
      title: 'Name',
      render: ({ fields: f }) => `
        <div class="field">
          <label for="char-name-input">Character name</label>
          <input class="input" type="text" id="char-name-input" name="charName" maxlength="40" autocomplete="off"
                 value="${esc(f.charName || '')}" aria-describedby="char-name-hint">
          <p class="hint" id="char-name-hint">Up to 40 characters. You can change everything else later.</p>
        </div>`,
      validate: ({ fields: f }) => ((f.charName || '').trim()
        ? null
        : { message: 'Enter a name for your character.', field: 'char-name-input' }),
    },
    {
      title: 'Class',
      render: ({ fields: f }) => choices('className', 'Choose a class', Object.keys(WASD.classData).map((k) => {
        const c = WASD.classData[k];
        return { value: k, desc: `${c.blurb} d${c.hitDie} hit die. Saves: ${c.saves.map(shortName).join(', ')}.` };
      }), f.className),
      validate: ({ fields: f }) => (f.className ? null : { message: 'Choose a class.', field: 'className-Fighter' }),
    },
    {
      title: 'Race',
      render: ({ fields: f }) => `
        <p class="hint">Our rules data (SRD 5.1) has one subrace for each race, so it is chosen with the race. Humans have no subrace.</p>
        ${choices('race', 'Choose a race', Object.keys(WASD.raceData).map((k) => {
          const r = WASD.raceInfo(k);
          return { value: k, label: r.name === k ? k : `${k} (${r.name})`, desc: `${r.blurb} Speed ${r.speed} ft.` };
        }), f.race)}`,
      validate: ({ fields: f }) => (f.race ? null : { message: 'Choose a race.', field: 'race-Human' }),
    },
    {
      title: 'Ability scores',
      rerenderOnChange: true,
      render({ fields: f }) {
        const base = baseScores(f);
        const race = WASD.raceInfo(f.race);
        const usedBy = {};
        ABILITIES.forEach((a) => { if (base[a.key]) usedBy[base[a.key]] = a.name; });
        const left = WASD.STANDARD_ARRAY.filter((n) => !usedBy[n]);

        const rows = ABILITIES.map((a) => {
          const opts = WASD.STANDARD_ARRAY.map((n) => {
            const other = usedBy[n] && usedBy[n] !== a.name ? ` (used by ${usedBy[n]})` : '';
            return `<option value="${n}"${base[a.key] === n ? ' selected' : ''}>${n}${other}</option>`;
          }).join('');
          const bonus = race.bonuses[a.key] || 0;
          // Name where each bonus comes from, e.g. "+2 Elf +1 High Elf".
          const from = (race.bonusParts[a.key] || []).map((p) => `${signed(p.value)} ${esc(p.from)}`).join(' ');
          let result = from;
          if (base[a.key]) {
            const final = base[a.key] + bonus;
            result = `${bonus ? `${base[a.key]} ${from} = ` : ''}<strong>${final}</strong> (modifier ${signed(WASD.rules.abilityMod(final))})`;
          }
          return `
            <div class="score-row">
              <label for="score-${a.key}">${a.name}</label>
              <select class="input" id="score-${a.key}" name="score-${a.key}" aria-describedby="score-${a.key}-result">
                <option value="">Choose</option>${opts}
              </select>
              <span class="score-row__result" id="score-${a.key}-result">${result}</span>
            </div>`;
        }).join('');

        return `
          <p>Give each ability one number from the standard array: ${WASD.STANDARD_ARRAY.join(', ')}. Use each number once.</p>
          <button type="button" class="btn" id="suggest-scores" data-wiz-action="suggest">Use suggested scores for ${esc(f.className)}</button>
          <p class="hint">Numbers left: <strong>${left.length ? left.join(', ') : 'none'}</strong></p>
          <div class="score-list">${rows}</div>`;
      },
      actions: {
        suggest(state) {
          const s = WASD.classData[state.fields.className].suggested;
          ABILITIES.forEach((a) => { state.fields[`score-${a.key}`] = String(s[a.key]); });
          return `Suggested scores filled in for ${state.fields.className}.`;
        },
      },
      validate({ fields: f }) {
        const base = baseScores(f);
        const empty = ABILITIES.find((a) => !base[a.key]);
        if (empty) return { message: `Choose a score for ${empty.name}.`, field: `score-${empty.key}` };
        const seen = {};
        for (const a of ABILITIES) {
          const n = base[a.key];
          if (seen[n]) return { message: `${n} is used for both ${seen[n]} and ${a.name}. Use each number once.`, field: `score-${a.key}` };
          seen[n] = a.name;
        }
        return null;
      },
    },
    {
      title: 'Review',
      render({ fields: f }) {
        const raw = build(f);
        const ch = WASD.rules.derive(raw);
        const scores = ch.abilities.map((a) => `${a.key.toUpperCase()} ${a.score} (${signed(a.mod)})`).join(', ');
        const skills = ch.skills.filter((s) => s.proficiency !== 'none').map((s) => `${s.name} ${signed(s.bonus)}`).join(', ');
        const spells = ch.spellcasting ? `<div><dt>Spells</dt><dd>${esc(ch.spellcasting.spells.map((s) => s.name).join(', '))}</dd></div>` : '';
        return `
          <dl class="pair-list review-list">
            <div><dt>Name</dt><dd>${esc(raw.identity.name)}</dd></div>
            <div><dt>Race and class</dt><dd>${esc(raw.identity.race)} ${esc(f.className)}${raw.identity.subclass ? ` (${esc(raw.identity.subclass)})` : ''}, level 1</dd></div>
            <div><dt>Hit points</dt><dd>${ch.combat.hp.max}</dd></div>
            <div><dt>Armor Class</dt><dd>${ch.combat.armorClass} (${esc(ch.combat.armorName)})</dd></div>
            <div><dt>Speed</dt><dd>${ch.combat.speed} ft</dd></div>
            <div><dt>Ability scores</dt><dd>${esc(scores)}</dd></div>
            <div><dt>Proficient skills</dt><dd>${esc(skills)}</dd></div>
            <div><dt>Features</dt><dd>${esc(ch.features.map((x) => x.name).join(', '))}</dd></div>
            ${spells}
          </dl>
          <p class="callout">${WASD.icon('warning')} Creating this character replaces ${esc(WASD.raw.identity.name)} on this device. “Reset demo” brings Kira back.</p>`;
      },
    },
  ];

  btn.addEventListener('click', () => {
    WASD.wizard.open({
      title: 'New character',
      finishLabel: 'Create character',
      opener: btn,
      steps,
      onFinish({ fields: f }) {
        WASD.lastRoll = null;
        WASD.setCharacter(build(f));
        WASD.announce(`Created ${f.charName.trim()}, a level 1 ${WASD.raw.identity.race} ${f.className}. HP ${WASD.raw.combat.hp.max}, AC ${WASD.character.combat.armorClass}.`);
      },
      onCancel() {
        WASD.announce('New character cancelled. Nothing changed.');
      },
    });
  });

  WASD.newCharacter = { build };
})(window.WASD);
