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
 * Race and subrace are separate choices on the Race step. The SRD has one
 * subrace for Elf, Dwarf, Gnome and Halfling, so it is pre-selected. Dragonborn
 * pick a dragon ancestry; Half-Elves pick two +1 abilities and two skills.
 * The Cleric's Divine Domain is the SRD's only one, Life.
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

  /** The race choices from the wizard, in the shape WASD.raceInfo() takes. */
  const raceOpts = (f) => ({
    subrace: f.subrace, ancestry: f.ancestry,
    abilityPicks: [f.racePick1, f.racePick2], skillPicks: [f.raceSkill1, f.raceSkill2],
  });
  /** Safe id from a value with spaces ("High Elf" -> "High-Elf"). */
  const slug = (v) => String(v).replace(/[^A-Za-z0-9]+/g, '-');

  /** Turn the wizard's answers into a raw character (same shape as sample-character.js). */
  function build(f) {
    const cls = WASD.classData[f.className];
    const race = WASD.raceInfo(f.race, raceOpts(f));
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
    if (race.breath) attacks.push({ id: 'breath', name: 'Breath Weapon', special: 'breath', ...race.breath });

    const notYet = 'Not written yet.';
    return {
      schema: WASD.SCHEMA,
      identity: {
        name: f.charName.trim(), race: race.race, subrace: race.subrace, className: f.className, subclass: cls.subclass || '',
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

  /** Radio "cards" for class, race and subrace. */
  function choices(name, legend, options, current) {
    const items = options.map((o) => {
      const id = `${name}-${slug(o.value)}`;
      return `
      <div class="choice choice--card">
        <input type="radio" name="${name}" id="${id}" value="${esc(o.value)}"${current === o.value ? ' checked' : ''}
               aria-describedby="${id}-desc">
        <label for="${id}"><strong>${esc(o.label || o.value)}</strong>
          <span class="choice__desc" id="${id}-desc">${esc(o.desc)}</span></label>
      </div>`;
    }).join('');
    return `<fieldset class="choices"><legend>${esc(legend)}</legend>${items}</fieldset>`;
  }

  /** A labelled dropdown that saves into state.fields[name]. */
  function picker(name, label, options, current) {
    const opts = options.map((o) => `<option value="${esc(o.value)}"${current === o.value ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
    return `
      <div class="field">
        <label for="${name}">${esc(label)}</label>
        <select class="input" id="${name}" name="${name}"><option value="">Choose</option>${opts}</select>
      </div>`;
  }

  /** The extra choices under the race list: subrace, dragon ancestry, Half-Elf picks. */
  function raceOptions(f) {
    const r = WASD.raceData[f.race];
    if (!r) return '';
    let html = '';
    // Subrace: keep the player's pick if it belongs to this race, otherwise pre-select the first.
    if (r.subraces.length) {
      if (!r.subraces.some((s) => s.name === f.subrace)) f.subrace = r.subraces[0].name;
      html += choices('subrace', `${f.race} subrace`, r.subraces.map((s) => ({ value: s.name, desc: s.blurb })), f.subrace);
      if (r.subraces.length === 1) html += '<p class="hint">The SRD has one subrace for this race, so it is chosen for you.</p>';
    } else {
      f.subrace = '';
      html += `<p class="hint">${esc(f.race)} has no subraces.</p>`;
    }
    if (r.ancestry) {
      html += picker('ancestry', 'Draconic ancestry (sets your breath weapon and resistance)', r.ancestry.map((a) => ({
        value: a.id, label: `${a.name}: ${a.type}, ${a.area}, ${a.save === 'dex' ? 'Dexterity' : 'Constitution'} save`,
      })), f.ancestry);
    }
    if (r.abilityPicks) {
      const abil = ABILITIES.filter((a) => !r.abilityPicks.exclude.includes(a.key)).map((a) => ({ value: a.key, label: a.name }));
      html += picker('racePick1', `First ability +${r.abilityPicks.value}`, abil, f.racePick1);
      html += picker('racePick2', `Second ability +${r.abilityPicks.value}`, abil, f.racePick2);
    }
    if (r.skillPicks) {
      // Skills the class already gives are left out, so both picks add something new.
      const have = Object.keys((WASD.classData[f.className] || { start: { skills: {} } }).start.skills);
      const skills = WASD.rules.SKILLS.filter((s) => !have.includes(s.name)).map((s) => ({ value: s.name, label: s.name }));
      html += picker('raceSkill1', 'First skill (Skill Versatility)', skills, f.raceSkill1);
      html += picker('raceSkill2', 'Second skill (Skill Versatility)', skills, f.raceSkill2);
    }
    return `<div class="race-options">${html}</div>`;
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
      rerenderOnChange: true,
      render: ({ fields: f }) => `
        ${choices('race', 'Choose a race', Object.keys(WASD.raceData).map((k) => {
          const r = WASD.raceData[k];
          const subs = r.subraces.length ? ` Subrace: ${r.subraces.map((s) => s.name).join(', ')}.` : '';
          return { value: k, desc: `${r.blurb} Speed ${r.speed} ft.${subs}` };
        }), f.race)}
        ${raceOptions(f)}`,
      validate({ fields: f }) {
        const r = WASD.raceData[f.race];
        if (!r) return { message: 'Choose a race.', field: 'race-Human' };
        if (r.ancestry && !f.ancestry) return { message: 'Choose a draconic ancestry.', field: 'ancestry' };
        if (r.abilityPicks) {
          if (!f.racePick1) return { message: 'Choose the first ability to raise.', field: 'racePick1' };
          if (!f.racePick2) return { message: 'Choose the second ability to raise.', field: 'racePick2' };
          if (f.racePick1 === f.racePick2) return { message: 'Choose two different abilities.', field: 'racePick2' };
        }
        if (r.skillPicks) {
          if (!f.raceSkill1) return { message: 'Choose the first skill.', field: 'raceSkill1' };
          if (!f.raceSkill2) return { message: 'Choose the second skill.', field: 'raceSkill2' };
          if (f.raceSkill1 === f.raceSkill2) return { message: 'Choose two different skills.', field: 'raceSkill2' };
        }
        return null;
      },
    },
    {
      title: 'Ability scores',
      rerenderOnChange: true,
      render({ fields: f }) {
        const base = baseScores(f);
        const race = WASD.raceInfo(f.race, raceOpts(f));
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
            <div><dt>Race</dt><dd>${esc(raw.identity.race)}${raw.identity.subrace ? `, subrace ${esc(raw.identity.subrace)}` : ''}</dd></div>
            <div><dt>Class</dt><dd>${esc(f.className)}${raw.identity.subclass ? ` (${esc(raw.identity.subclass)})` : ''}, level 1</dd></div>
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
        WASD.announce(`Created ${f.charName.trim()}, a level 1 ${WASD.character.identity.raceLabel} ${f.className}. HP ${WASD.raw.combat.hp.max}, AC ${WASD.character.combat.armorClass}.`);
      },
      onCancel() {
        WASD.announce('New character cancelled. Nothing changed.');
      },
    });
  });

  WASD.newCharacter = { build };
})(window.WASD);
