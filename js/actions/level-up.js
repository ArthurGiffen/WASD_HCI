/*
 * LEVEL UP action (bottom action bar): a 4-step wizard (test task 2).
 * OWNER: Person A
 *
 *   1. Hit points      take the average, roll the hit die in the app, or type a real-dice roll
 *   2. Proficiency     proficiency bonus and EVERY number that changes because of the new level
 *   3. New features    from js/data/classes.js. Missing data is shown as missing, never invented.
 *   4. Review          nothing changes until "Confirm level up"
 *
 * Step 2 is calculated, not hand-written: it runs rules.derive() on the
 * character at the current level and at the next level and lists every
 * difference (saves, skills, attacks, Sneak Attack dice, passive Perception...).
 */
(function (WASD) {
  'use strict';

  const btn = document.getElementById('level-up-btn');
  const MAX_LEVEL = 20;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const { signed } = WASD;

  /** Every derived value that differs between two sheets, as { label, from, to }. */
  function differences(a, b) {
    const out = [];
    const add = (label, from, to) => { if (from !== to) out.push({ label, from, to }); };
    add('Proficiency bonus', signed(a.proficiencyBonus), signed(b.proficiencyBonus));
    a.abilities.forEach((x, i) => add(`${x.name} save`, signed(x.save), signed(b.abilities[i].save)));
    a.skills.forEach((x, i) => add(x.name, signed(x.bonus), signed(b.skills[i].bonus)));
    add('Passive Perception', a.passivePerception, b.passivePerception);
    a.combat.attacks.forEach((x, i) => {
      const y = b.combat.attacks[i];
      if (x.toHit !== null) add(`${x.name} to hit`, signed(x.toHit), signed(y.toHit));
      add(`${x.name} damage`, WASD.rules.formatDamage(x.damage), WASD.rules.formatDamage(y.damage));
    });
    add('Hit dice', a.combat.hitDice, b.combat.hitDice);
    if (a.spellcasting && b.spellcasting) {
      add('Spell save DC', a.spellcasting.saveDC, b.spellcasting.saveDC);
      add('Spell attack', signed(a.spellcasting.attackBonus), signed(b.spellcasting.attackBonus));
    }
    return out;
  }

  function open() {
    const raw = WASD.raw;
    const name = raw.identity.name;
    const cls = raw.identity.className;
    const level = raw.identity.level;
    if (level >= MAX_LEVEL) {
      WASD.announce(`${name} is already level ${MAX_LEVEL}, the highest level.`);
      return;
    }
    const newLevel = level + 1;
    const die = raw.combat.hitDie;
    const con = WASD.rules.abilityMod(WASD.character.abilities.find((a) => a.key === 'con').score);
    const average = die / 2 + 1;
    const conText = `${signed(con)} Constitution`;

    const before = WASD.character;
    const nextRaw = clone(raw);
    nextRaw.identity.level = newLevel;
    const after = WASD.rules.derive(nextRaw);
    const changes = differences(before, after);

    const classInfo = WASD.classData[cls];
    const newFeatures = classInfo && classInfo.features[newLevel];

    /** HP gained for the chosen method, or null if not decided yet. Minimum 1 per level. */
    function gain(f) {
      let dieValue = null;
      if (f.hpMethod === 'average') dieValue = average;
      else if (f.hpMethod === 'roll' && f.hpRolled) dieValue = Number(f.hpRolled);
      else if (f.hpMethod === 'manual' && /^\d+$/.test(f.hpManual || '') && Number(f.hpManual) >= 1 && Number(f.hpManual) <= die) dieValue = Number(f.hpManual);
      return dieValue === null ? null : Math.max(1, dieValue + con);
    }

    const radio = (value, label, f) => `
      <div class="choice">
        <input type="radio" name="hpMethod" id="hp-method-${value}" value="${value}"${f.hpMethod === value ? ' checked' : ''}>
        <label for="hp-method-${value}">${label}</label>
      </div>`;

    const steps = [
      {
        title: 'Hit points',
        rerenderOnChange: true,
        render({ fields: f }) {
          let extra = '';
          if (f.hpMethod === 'roll') {
            extra = f.hpRolled
              ? `<p class="callout">You rolled <strong>${f.hpRolled}</strong> on the d${die}.</p>`
              : `<button type="button" class="btn" id="hp-roll" data-wiz-action="roll">Roll d${die}</button>`;
          } else if (f.hpMethod === 'manual') {
            extra = `
              <div class="field field--narrow">
                <label for="hp-manual">Your d${die} roll (1 to ${die})</label>
                <input class="input" type="number" inputmode="numeric" min="1" max="${die}" step="1"
                       id="hp-manual" name="hpManual" value="${WASD.esc(f.hpManual || '')}">
              </div>`;
          }
          const g = gain(f);
          const preview = g === null
            ? ''
            : `<p class="callout"><strong>Max HP ${raw.combat.hp.max} → ${raw.combat.hp.max + g}</strong> (gain ${g}).</p>`;
          return `
            <p>${WASD.esc(cls)}s use a d${die} hit die. You add your Constitution modifier (${signed(con)}) to it.</p>
            <fieldset class="choices">
              <legend>How do you want to increase hit points?</legend>
              ${radio('average', `Take the average: ${average} ${conText} = <strong>${Math.max(1, average + con)} HP</strong>`, f)}
              ${radio('roll', `Roll a d${die} in the app (${conText})`, f)}
              ${radio('manual', `Enter a roll from real dice (${conText})`, f)}
            </fieldset>
            ${extra}
            ${f.hpMethod === 'manual' ? '' : preview}`;
        },
        actions: {
          roll(state) {
            state.fields.hpRolled = String(WASD.dice.roll(1, die)[0]);
            const g = gain(state.fields);
            return `Rolled ${state.fields.hpRolled}. Gain ${g} HP. Max HP ${raw.combat.hp.max + g}.`;
          },
        },
        validate({ fields: f }) {
          if (!f.hpMethod) return { message: 'Choose how to increase hit points.', field: 'hp-method-average' };
          if (f.hpMethod === 'roll' && !f.hpRolled) return { message: `Press "Roll d${die}" first.`, field: 'hp-roll' };
          if (f.hpMethod === 'manual' && gain(f) === null) return { message: `Enter a whole number from 1 to ${die}.`, field: 'hp-manual' };
          return null;
        },
      },
      {
        title: 'Proficiency and bonuses',
        render() {
          const pbLine = before.proficiencyBonus === after.proficiencyBonus
            ? `<p>Your proficiency bonus stays <strong>${signed(after.proficiencyBonus)}</strong>.</p>`
            : `<p class="callout">Proficiency bonus <strong>${signed(before.proficiencyBonus)} → ${signed(after.proficiencyBonus)}</strong>. Everything you are proficient in goes up with it.</p>`;
          if (!changes.length) return `${pbLine}<p>No other numbers change at level ${newLevel}.</p>`;
          const rows = changes.map((c) => `
            <tr><th scope="row">${WASD.esc(c.label)}</th><td>${WASD.esc(c.from)}</td><td><strong>${WASD.esc(c.to)}</strong></td></tr>`).join('');
          return `${pbLine}
            <div class="table-scroll" tabindex="0" role="region" aria-labelledby="changes-caption">
              <table class="data-table">
                <caption id="changes-caption">What changes at level ${newLevel} (${changes.length} values)</caption>
                <thead><tr><th scope="col">Value</th><th scope="col">Level ${level}</th><th scope="col">Level ${newLevel}</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>`;
        },
      },
      {
        title: 'New features',
        render() {
          if (!newFeatures) {
            return `<p class="callout">${WASD.icon('warning')} This app has no ${WASD.esc(cls)} level ${newLevel} feature data yet,
              so no features are added. You can still finish leveling up.</p>`;
          }
          return `<p>At ${WASD.esc(cls)} level ${newLevel}, ${WASD.esc(name)} gains:</p>
            <ul class="plain-list plain-list--spaced">${newFeatures.map((f) =>
              `<li><strong>${WASD.esc(f.name)}</strong><br>${WASD.esc(f.summary)}</li>`).join('')}</ul>`;
        },
      },
      {
        title: 'Review',
        render({ fields: f }) {
          const g = gain(f);
          const hp = raw.combat.hp;
          const how = { average: 'average', roll: `rolled ${f.hpRolled}`, manual: `rolled ${f.hpManual}` }[f.hpMethod];
          return `
            <dl class="pair-list review-list">
              <div><dt>Level</dt><dd>${level} → <strong>${newLevel}</strong></dd></div>
              <div><dt>Max HP</dt><dd>${hp.max} → <strong>${hp.max + g}</strong> (gain ${g}, ${how} ${conText})</dd></div>
              <div><dt>Current HP</dt><dd>${hp.current} → <strong>${Math.min(hp.max + g, hp.current + g)}</strong></dd></div>
              <div><dt>Proficiency bonus</dt><dd>${signed(before.proficiencyBonus)} → <strong>${signed(after.proficiencyBonus)}</strong></dd></div>
              <div><dt>Other values changed</dt><dd>${Math.max(0, changes.length - (before.proficiencyBonus === after.proficiencyBonus ? 0 : 1))}</dd></div>
              <div><dt>New features</dt><dd>${newFeatures ? WASD.esc(newFeatures.map((x) => x.name).join(', ')) : 'none (no data)'}</dd></div>
            </dl>
            <p class="hint">Nothing is saved until you choose “Confirm level up”. Use Back to change your choices.</p>`;
        },
      },
    ];

    WASD.wizard.open({
      title: `Level Up: ${name}, ${cls} ${level} → ${newLevel}`,
      finishLabel: 'Confirm level up',
      opener: btn,
      steps,
      onFinish({ fields: f }) {
        const g = gain(f);
        WASD.updateCharacter((r) => {
          r.identity.level = newLevel;
          r.combat.hp.max += g;
          r.combat.hp.current = Math.min(r.combat.hp.max, r.combat.hp.current + g);
          (newFeatures || []).forEach((feat) => {
            r.features.push({ name: feat.name, source: `${cls} ${newLevel}`, summary: feat.summary });
          });
        });
        const hp = WASD.raw.combat.hp;
        WASD.announce(`${name} is now level ${newLevel}. Max HP ${hp.max}. Proficiency bonus ${signed(WASD.character.proficiencyBonus)}.`);
      },
      onCancel() {
        WASD.announce('Level up cancelled. Nothing changed.');
      },
    });
  }

  btn.addEventListener('click', open);
  WASD.levelUp = { open, differences };
})(window.WASD);
