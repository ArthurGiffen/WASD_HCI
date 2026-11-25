/*
 * COMBAT CARD: AC, HP (damage / heal / temp / undo), death saves, rests,
 * initiative, speed, proficiency, attacks, conditions.
 * OWNER: Person B
 *
 * This is the most-used card at the table (test task 1: "What's your AC?").
 * Armor Class is the FIRST value in both the summary and the body, so it is
 * seen first AND announced first by screen readers.
 *
 * When the card has room (a wide hub card or the Combat page) it shows two
 * columns: HP and rests on the left, attacks and conditions on the right.
 * On narrow screens it is one column in the same order.
 *
 * Every control has a stable id so keyboard focus survives the redraw that
 * follows each change (see WASD.refresh in app.js). Every change is announced
 * with WASD.announce (a polite live region).
 *
 * Rules (SRD 5.1, 2014): death saving throws, instant death from massive
 * damage, short rests (spend hit dice), long rests, conditions, exhaustion.
 */
(function (WASD) {
  'use strict';

  // Things typed into the card that must survive a redraw.
  // crit: the "Critical hit" toggle. When on, Roll damage rolls the damage dice twice.
  const ui = { amount: '1', temp: '0', error: '', tempError: '', crit: false };
  WASD.lastRoll = null; // { title, lines: [...], total, note } shown under "Last roll"

  // Undo for HP changes: snapshots of HP, death saves and hit dice, newest last.
  const undo = [];
  const UNDO_LIMIT = 20;

  // A new or reset character starts with a clean card: no old errors, rolls, typed amounts or undo history.
  document.addEventListener('wasd:character-replaced', () => {
    Object.assign(ui, { amount: '1', temp: '0', error: '', tempError: '', crit: false });
    WASD.lastRoll = null;
    undo.length = 0;
  });

  const signed = (n) => WASD.signed(n);
  const whole = (text) => (/^\d+$/.test(String(text).trim()) ? Number(String(text).trim()) : null);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const hitDice = (n) => `${n} hit ${n === 1 ? 'die' : 'dice'}`;

  /** Saved death saves, with defaults for characters saved before death saves existed. */
  const saves = (raw) => {
    raw.combat.deathSaves = raw.combat.deathSaves || { successes: 0, failures: 0 };
    return raw.combat.deathSaves;
  };
  const resetSaves = (raw) => { raw.combat.deathSaves = { successes: 0, failures: 0 }; };

  /** Remember the HP state before a change, so "Undo" can put it back. */
  function remember(label) {
    const c = WASD.raw.combat;
    undo.push({
      label,
      hp: { ...c.hp },
      deathSaves: { ...(c.deathSaves || { successes: 0, failures: 0 }) },
      hitDiceUsed: c.hitDiceUsed || 0,
    });
    if (undo.length > UNDO_LIMIT) undo.shift();
  }

  // ---------- HP ----------

  /** kind: 'damage' | 'heal'. amountText comes from the input (or '1' for the quick buttons). */
  function changeHp(kind, amountText) {
    const n = whole(amountText);
    if (n === null || n < 1 || n > 999) {
      ui.error = 'Enter a whole number from 1 to 999.';
      WASD.refresh();
      const input = document.getElementById('hp-amount');
      if (input) input.focus();
      WASD.announce(ui.error);
      return;
    }
    ui.error = '';

    const name = WASD.raw.identity.name;
    const before = { ...WASD.raw.combat.hp };
    let absorbed = 0;
    let deathNote = '';

    if (kind === 'heal' && before.current >= before.max) {
      WASD.refresh();
      WASD.announce(`${name} is already at full HP, ${before.max} of ${before.max}.`);
      return;
    }

    remember(kind === 'damage' ? `${n} damage` : `heal ${n}`);
    WASD.updateCharacter((raw) => {
      const hp = raw.combat.hp;
      if (kind === 'damage') {
        // Temporary HP soaks up damage first.
        absorbed = Math.min(hp.temp, n);
        hp.temp -= absorbed;
        const rest = n - absorbed;
        if (rest > 0 && before.current === 0) {
          // Damage at 0 HP: a failed death save, or instant death if it is at least the HP maximum.
          const ds = saves(raw);
          ds.successes = 0; // a stable creature that takes damage is no longer stable
          if (rest >= hp.max) { ds.failures = 3; deathNote = ' The damage is at least the hit point maximum: instant death.'; }
          else { ds.failures = Math.min(3, ds.failures + 1); deathNote = ` Damage at 0 HP counts as a failed death save (${ds.failures} of 3). A critical hit counts as two: mark one more.`; }
        } else if (rest > 0 && rest - hp.current >= hp.max) {
          // Massive damage: the damage left over after reaching 0 is at least the HP maximum.
          saves(raw).failures = 3;
          deathNote = ' The damage left over after 0 HP is at least the hit point maximum: instant death.';
        }
        hp.current = Math.max(0, hp.current - rest);
      } else {
        hp.current = Math.min(hp.max, hp.current + n);
        if (before.current === 0) resetSaves(raw); // regaining any HP resets death saves
      }
    });

    const hp = WASD.raw.combat.hp;
    let msg;
    if (kind === 'damage') {
      msg = `${name} took ${n} damage.`;
      if (absorbed) msg += ` ${absorbed} absorbed by temporary HP.`;
      msg += hp.current === 0 ? ` ${name} is down at 0 HP.` : ` HP ${hp.current} of ${hp.max}.`;
      msg += deathNote;
    } else {
      msg = before.current === 0
        ? `${name} healed ${hp.current - before.current} and is back up. HP ${hp.current} of ${hp.max}.`
        : `${name} healed ${hp.current - before.current}. HP ${hp.current} of ${hp.max}.`;
    }
    WASD.announce(msg);
  }

  WASD.actions['hp-damage'] = () => {
    const el = document.getElementById('hp-amount');
    ui.amount = el ? el.value : ui.amount;
    changeHp('damage', ui.amount);
  };
  WASD.actions['hp-heal'] = () => {
    const el = document.getElementById('hp-amount');
    ui.amount = el ? el.value : ui.amount;
    changeHp('heal', ui.amount);
  };
  WASD.actions['hp-minus'] = () => changeHp('damage', '1');
  WASD.actions['hp-plus'] = () => changeHp('heal', '1');
  WASD.inputs['hp-amount'] = (el) => { ui.amount = el.value; };

  WASD.inputs['temp-hp'] = (el) => { ui.temp = el.value; };
  WASD.actions['temp-set'] = () => {
    const el = document.getElementById('temp-hp');
    ui.temp = el ? el.value : ui.temp;
    const n = whole(ui.temp);
    if (n === null || n > 999) {
      ui.tempError = 'Enter a whole number from 0 to 999.';
      WASD.refresh();
      const input = document.getElementById('temp-hp');
      if (input) input.focus();
      WASD.announce(ui.tempError);
      return;
    }
    ui.tempError = '';
    remember(`temporary HP ${n}`);
    WASD.updateCharacter((raw) => { raw.combat.hp.temp = n; });
    WASD.announce(`Temporary HP set to ${n}.`);
  };

  WASD.actions['hp-undo'] = () => {
    const last = undo.pop();
    if (!last) { WASD.announce('Nothing to undo.'); return; }
    WASD.updateCharacter((raw) => {
      raw.combat.hp = { ...last.hp };
      raw.combat.deathSaves = { ...last.deathSaves };
      raw.combat.hitDiceUsed = last.hitDiceUsed;
    });
    const hp = WASD.raw.combat.hp;
    WASD.announce(`Undid ${last.label}. HP ${hp.current} of ${hp.max}${hp.temp ? `, ${hp.temp} temporary` : ''}.`);
  };

  // ---------- Death saving throws (only at 0 HP) ----------

  const deathState = (ds) => (ds.failures >= 3 ? 'dead' : ds.successes >= 3 ? 'stable' : 'dying');

  /** Add successes or failures, then say where things stand. */
  function markSave(successes, failures, rolled) {
    const name = WASD.raw.identity.name;
    remember(rolled ? `death save roll ${rolled}` : (successes ? 'a death save success' : 'a death save failure'));
    WASD.updateCharacter((raw) => {
      const ds = saves(raw);
      ds.successes = Math.min(3, ds.successes + successes);
      ds.failures = Math.min(3, ds.failures + failures);
    });
    const ds = WASD.raw.combat.deathSaves;
    const state = deathState(ds);
    let msg = rolled ? `Death save: rolled ${rolled}. ` : '';
    if (rolled === 1) msg += 'A natural 1 counts as two failures. ';
    msg += state === 'dead' ? `Third failure: ${name} dies.`
      : state === 'stable' ? `Third success: ${name} is stable, unconscious at 0 HP.`
      : `${ds.successes} ${ds.successes === 1 ? 'success' : 'successes'}, ${plural(ds.failures, 'failure')}.`;
    WASD.announce(msg);
  }

  WASD.actions['death-roll'] = () => {
    const r = WASD.dice.roll(1, 20)[0];
    if (r === 20) {
      // A natural 20 on a death save: regain 1 hit point (and the saves reset).
      remember('death save roll 20');
      WASD.updateCharacter((raw) => { raw.combat.hp.current = 1; resetSaves(raw); });
      WASD.announce(`Death save: rolled 20. ${WASD.raw.identity.name} regains 1 hit point and is back up. HP 1 of ${WASD.raw.combat.hp.max}.`);
      return;
    }
    if (r === 1) markSave(0, 2, r);
    else if (r >= 10) markSave(1, 0, r);
    else markSave(0, 1, r);
  };
  WASD.actions['death-success'] = () => markSave(1, 0);
  WASD.actions['death-failure'] = () => markSave(0, 1);

  // ---------- Rests ----------

  WASD.actions['spend-hit-die'] = () => {
    const ch = WASD.character;
    const c = ch.combat;
    if (c.hitDiceLeft <= 0) { WASD.announce('No hit dice left. A long rest gives some back.'); return; }
    if (c.hp.current >= c.hp.max) { WASD.announce(`${ch.identity.name} is already at full HP. No hit die spent.`); return; }
    const con = ch.abilities.find((a) => a.key === 'con').mod;
    const r = WASD.dice.roll(1, c.hitDie)[0];
    const gain = Math.max(0, r + con); // a negative total heals nothing
    remember('spending a hit die');
    WASD.updateCharacter((raw) => {
      raw.combat.hitDiceUsed = (raw.combat.hitDiceUsed || 0) + 1;
      if (raw.combat.hp.current === 0 && gain > 0) resetSaves(raw);
      raw.combat.hp.current = Math.min(raw.combat.hp.max, raw.combat.hp.current + gain);
    });
    const after = WASD.character.combat;
    WASD.announce(`Hit die: rolled ${r}, ${signed(con)} Constitution, regain ${gain} HP. HP ${after.hp.current} of ${after.hp.max}. ${hitDice(after.hitDiceLeft)} left.`);
  };

  WASD.actions['long-rest'] = async (el) => {
    const ch = WASD.character;
    const name = ch.identity.name;
    if (ch.combat.hp.current === 0) {
      WASD.announce(`${name} has 0 HP. A character needs at least 1 hit point to benefit from a long rest.`);
      return;
    }
    const level = ch.identity.level;
    const regain = Math.max(1, Math.floor(level / 2));
    const ok = await WASD.confirm({
      opener: el,
      title: 'Take a long rest?',
      message: `At least 8 hours of rest. ${name} regains all hit points and up to ${regain} spent ${regain === 1 ? 'hit die' : 'hit dice'}, all spell slots come back, temporary HP and death saves are cleared, and exhaustion drops by 1 (with food and drink). HP undo history is cleared.`,
      confirmLabel: 'Long rest',
    });
    if (!ok) return;
    undo.length = 0; // cleared before the redraw, so Undo shows as unavailable
    WASD.updateCharacter((raw) => {
      const c = raw.combat;
      c.hp.current = c.hp.max;
      c.hp.temp = 0;
      c.hitDiceUsed = Math.max(0, (c.hitDiceUsed || 0) - regain);
      resetSaves(raw);
      c.exhaustion = Math.max(0, (c.exhaustion || 0) - 1);
      if (raw.spellcasting) (raw.spellcasting.slots || []).forEach((s) => { s.used = 0; });
    });
    const c = WASD.character.combat;
    WASD.announce(`Long rest finished. HP ${c.hp.current} of ${c.hp.max}. ${c.hitDiceLeft} of ${level} hit dice left.${WASD.raw.spellcasting ? ' Spell slots restored.' : ''}`);
  };

  // ---------- Conditions ----------

  WASD.actions['condition-toggle'] = (el) => {
    const id = el.dataset.condition;
    const cond = WASD.rules.CONDITIONS.find((x) => x.id === id);
    const on = el.checked;
    WASD.updateCharacter((raw) => {
      const list = (raw.combat.conditions || []).filter((x) => x !== id);
      if (on) list.push(id);
      raw.combat.conditions = list;
    });
    const c = WASD.character.combat;
    WASD.announce(`${cond.name} ${on ? 'on' : 'off'}.${on ? ` ${cond.summary}` : ''}${c.speedNote ? ` Speed ${c.speed} feet.` : ''}`);
  };
  WASD.inputs.exhaustion = (el) => {
    const level = Number(el.value);
    WASD.updateCharacter((raw) => { raw.combat.exhaustion = level; });
    WASD.announce(level ? `Exhaustion level ${level}: ${WASD.rules.EXHAUSTION.slice(1, level + 1).join('; ')}.` : 'Exhaustion cleared.');
  };

  // ---------- Attack rolls: to-hit and damage are SEPARATE rolls ----------

  function findAttack(id) {
    return WASD.character.combat.attacks.find((a) => a.id === id);
  }

  WASD.actions['roll-hit'] = (el) => {
    const a = findAttack(el.dataset.attack);
    if (!a || a.toHit === null) return;
    const r = WASD.dice.roll(1, 20)[0];
    const total = r + a.toHit;
    let note = '';
    // Each roll to hit sets the Critical hit toggle: on for a natural 20, off otherwise.
    ui.crit = r === 20;
    if (r === 20) note = 'Natural 20: critical hit. Critical hit is now on, so Roll damage rolls the damage dice twice.';
    else if (r === 1) note = 'Natural 1: automatic miss.';
    WASD.lastRoll = {
      title: `${a.name}: roll to hit`,
      lines: [`d20 rolled ${r}`, `Modifier ${signed(a.toHit)}`],
      total: `${total} to hit`,
      note,
    };
    WASD.refresh();
    WASD.announce(`${a.name} to hit: rolled ${r}, ${signed(a.toHit)}, total ${total}.${note ? ' ' + note : ''}`);
  };

  WASD.actions['roll-damage'] = (el) => {
    const a = findAttack(el.dataset.attack);
    if (!a) return;
    // 2014 critical hit: roll all of the attack's damage dice twice (Sneak Attack too),
    // then add modifiers once. rollParts does the doubling. A breath weapon is a saving
    // throw, not an attack roll, so it can't crit.
    const crit = ui.crit && !a.noCrit;
    const parts = WASD.dice.rollParts(a.damage, { crit }).map((p) => ({ ...p, total: Math.max(0, p.total) }));
    const notes = [];
    if (crit) notes.push('Critical hit: damage dice rolled twice, bonus added once.');
    if (ui.crit && a.noCrit) notes.push('Not an attack roll, so it can’t be a critical hit.');
    if (parts.length > 1) notes.push('Apply resistance per damage type.');
    // One line and one total PER DAMAGE TYPE, so resistance/vulnerability can be applied per type.
    WASD.lastRoll = {
      title: `${a.name}: roll damage${crit ? ' (critical hit)' : ''}`,
      lines: parts.map((p) => `${p.dice} ${p.type}: rolled ${p.rolls.join(', ')}${p.bonus ? `, ${signed(p.bonus)}` : ''} = ${p.total}`),
      total: parts.map((p) => `${p.total} ${p.type}`).join(' + '),
      note: notes.join(' '),
    };
    WASD.refresh();
    // Same shape as the to-hit message: the dice first, then the bonus, then the total.
    // e.g. "Shortsword damage: rolled 6, +3, total 9 piercing."
    const diceList = (r) => (r.length === 1 ? `${r[0]}` : `${r.slice(0, -1).join(', ')} and ${r[r.length - 1]}`);
    const said = parts.map((p) => `rolled ${diceList(p.rolls)}${p.bonus ? `, ${signed(p.bonus)}` : ''}, total ${p.total} ${p.type}`);
    WASD.announce(`${a.name} ${crit ? 'critical ' : ''}damage: ${said.join('; ')}.`);
  };

  WASD.actions['crit-toggle'] = () => {
    ui.crit = !ui.crit;
    WASD.refresh();
    WASD.announce(ui.crit
      ? 'Critical hit on. Roll damage rolls the damage dice twice.'
      : 'Critical hit off. Damage dice are rolled normally.');
  };

  // ---------- Card ----------

  WASD.registerCard({
    id: 'combat',
    title: 'Combat',
    icon: 'shield',

    summary(ch) {
      const c = ch.combat;
      const conds = c.conditions.map((id) => WASD.rules.CONDITIONS.find((x) => x.id === id).name);
      if (c.exhaustion) conds.push(`Exhaustion ${c.exhaustion}`);
      return `AC ${c.armorClass} · HP ${c.hp.current}/${c.hp.max} · Initiative ${signed(c.initiative)} · Speed ${c.speed} ft · Proficiency ${signed(ch.proficiencyBonus)}${conds.length ? ` · ${conds.join(', ')}` : ''}`;
    },

    render(ch, ctx) {
      const { esc, icon, rules } = WASD;
      const c = ch.combat;
      const hp = c.hp;
      const h = ctx.sub;
      const ds = c.deathSaves;
      const dState = deathState(ds);

      // State label: text + icon, never color alone.
      let state = '';
      if (hp.current === 0 && dState === 'dead') {
        state = `<p class="hp-state hp-state--down">${icon('warning')}<span><strong>Dead.</strong> ${esc(ch.identity.name)} failed three death saves or took massive damage.</span></p>`;
      } else if (hp.current === 0) {
        state = `<p class="hp-state hp-state--down">${icon('warning')}<span><strong>Down: 0 HP.</strong> ${esc(ch.identity.name)} is unconscious${dState === 'stable' ? ' but stable' : ''}.</span></p>`;
      } else if (hp.current <= Math.floor(hp.max / 2)) {
        // Plain words on purpose: "Bloodied" is a 2024 rules term, and this app follows 2014.
        state = `<p class="hp-state hp-state--low">${icon('warning')}<span><strong>Half HP or less.</strong></span></p>`;
      }

      // Death saves: shown only at 0 HP. Counts are written out, never shown by color alone.
      const pips = (n, mark) => `<span class="pips" aria-hidden="true">${[0, 1, 2].map((i) => (i < n ? mark : '○')).join(' ')}</span>`;
      const done = dState !== 'dying';
      const dis = done ? ' aria-disabled="true"' : '';
      const deathSaves = hp.current === 0 ? `
        <section class="death-saves" aria-labelledby="death-saves-title">
          <${h} id="death-saves-title">Death saves</${h}>
          <p class="death-saves__counts"><span>Successes: <strong>${ds.successes} of 3</strong> ${pips(ds.successes, '✓')}</span>
            <span>Failures: <strong>${ds.failures} of 3</strong> ${pips(ds.failures, '✗')}</span></p>
          <p class="hint" id="death-hint">${dState === 'dead' ? 'Three failures: the character is dead.'
            : dState === 'stable' ? 'Three successes: stable. No more death saves; still unconscious at 0 HP.'
              : 'At the start of each turn at 0 HP, roll a d20: 10 or higher succeeds. A 1 counts as two failures; a 20 brings you back with 1 HP. Healing resets both counts.'}</p>
          <div class="button-row">
            <button type="button" class="btn btn--small" id="death-roll" data-action="death-roll" aria-describedby="death-hint"${dis}>Roll death save</button>
            <button type="button" class="btn btn--small" id="death-success" data-action="death-success"${dis}>Mark success</button>
            <button type="button" class="btn btn--small" id="death-failure" data-action="death-failure"${dis}>Mark failure</button>
          </div>
        </section>` : '';

      const lastUndo = undo[undo.length - 1];
      const undoBtn = `
        <div class="undo-row">
          <button type="button" class="btn btn--small" id="hp-undo" data-action="hp-undo" aria-describedby="hp-undo-hint"${lastUndo ? '' : ' aria-disabled="true"'}>Undo</button>
          <p class="hint" id="hp-undo-hint">${lastUndo ? `Last HP change: ${esc(lastUndo.label)}.` : 'No HP changes to undo yet.'}</p>
        </div>`;

      const attacks = c.attacks.map((a) => {
        const bits = [a.range, a.note].filter(Boolean);
        const detail = bits.length ? ` <span class="muted">(${esc(bits.join(' · '))})</span>` : '';
        const toHit = a.toHit === null
          ? ''
          : `<span class="attack__stat">To hit <strong>${signed(a.toHit)}</strong></span>`;
        const hitBtn = a.toHit === null ? '' : `
          <button type="button" class="btn btn--small" id="roll-hit-${a.id}" data-action="roll-hit" data-attack="${a.id}"
                  aria-label="Roll to hit with ${esc(a.name)}">Roll to hit</button>`;
        return `
          <li class="attack">
            <div class="attack__info">
              <strong>${esc(a.name)}</strong>${detail}
              <div class="attack__stats">${toHit}
                <span class="attack__stat">Damage <strong>${esc(rules.formatDamage(a.damage))}</strong></span></div>
            </div>
            <div class="attack__buttons">${hitBtn}
              <button type="button" class="btn btn--small" id="roll-dmg-${a.id}" data-action="roll-damage" data-attack="${a.id}"
                      aria-label="Roll damage for ${esc(a.name)}">Roll damage</button>
            </div>
          </li>`;
      }).join('');

      const last = WASD.lastRoll;
      const lastRoll = last ? `
        <${h}>Last roll</${h}>
        <div class="roll-result">
          <p class="roll-result__title">${esc(last.title)}</p>
          <ul class="plain-list">${last.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
          <p class="roll-result__total">${esc(last.total)}</p>
          ${last.note ? `<p class="roll-result__note">${esc(last.note)}</p>` : ''}
        </div>` : '';

      // Rests: spend hit dice (short rest) and long rest.
      const level = ch.identity.level;
      const rests = `
        <${h}>Rest</${h}>
        <p>Hit dice: <strong>${c.hitDiceLeft} of ${level}</strong> left (d${c.hitDie})</p>
        <div class="button-row">
          <button type="button" class="btn btn--small" id="spend-hit-die" data-action="spend-hit-die" aria-describedby="rest-hint"${c.hitDiceLeft ? '' : ' aria-disabled="true"'}>Spend a hit die</button>
          <button type="button" class="btn btn--small" id="long-rest" data-action="long-rest" aria-describedby="rest-hint">Long rest</button>
        </div>
        <p class="hint" id="rest-hint">Short rest: spend hit dice one at a time; each heals the die roll + Constitution modifier. Long rest: all HP, half your hit dice and all spell slots come back.</p>`;

      // Conditions: real checkboxes with names; active ones also listed with a reminder.
      const active = c.conditions.map((id) => rules.CONDITIONS.find((x) => x.id === id));
      const activeList = active.length || c.exhaustion ? `
        <ul class="plain-list plain-list--spaced condition-active">
          ${active.map((x) => `<li><strong>${esc(x.name)}:</strong> ${esc(x.summary)}</li>`).join('')}
          ${c.exhaustion ? `<li><strong>Exhaustion ${c.exhaustion}:</strong> ${esc(rules.EXHAUSTION.slice(1, c.exhaustion + 1).join('; '))}.</li>` : ''}
        </ul>` : '<p class="muted">No conditions.</p>';
      const boxes = rules.CONDITIONS.map((x) => `
        <div class="choice choice--inline">
          <input type="checkbox" id="cond-${x.id}" data-action="condition-toggle" data-condition="${x.id}"${c.conditions.includes(x.id) ? ' checked' : ''}>
          <label for="cond-${x.id}">${esc(x.name)}</label>
        </div>`).join('');
      const exOpts = rules.EXHAUSTION.map((effect, i) => `<option value="${i}"${c.exhaustion === i ? ' selected' : ''}>${i === 0 ? 'None' : `Level ${i}: ${esc(effect)}`}</option>`).join('');
      const conditions = `
        <${h}>Conditions</${h}>
        ${activeList}
        ${c.speedNote ? `<p class="hint">${esc(c.speedNote)}. Speed shown as ${c.speed} ft.</p>` : ''}
        <fieldset class="condition-grid">
          <legend>Conditions on ${esc(ch.identity.name)}</legend>
          ${boxes}
        </fieldset>
        <div class="field">
          <label for="exhaustion">Exhaustion</label>
          <select class="input" id="exhaustion" data-input="exhaustion">${exOpts}</select>
        </div>`;

      return `
        <div class="combat-layout"><div class="combat-cols">
        <div class="combat-col">
        <dl class="stat-list stat-list--two">
          <div class="stat stat--big"><dt>${icon('shield')} Armor Class</dt><dd>${c.armorClass}</dd><dd class="stat__note">${esc(c.armorName)}</dd></div>
          <div class="stat stat--big"><dt>${icon('heart')} Hit Points</dt>
            <dd>${hp.current}<span aria-hidden="true"> / </span><span class="visually-hidden"> of </span>${hp.max}</dd>
            ${hp.temp ? `<dd class="stat__note">+${hp.temp} temporary</dd>` : ''}</div>
        </dl>
        ${state}
        ${deathSaves}
        <div class="hp-stepper" role="group" aria-label="Adjust hit points by 1">
          <button type="button" class="btn btn--icon" id="hp-minus" data-action="hp-minus" aria-label="Take 1 damage">${icon('minus')}</button>
          <span class="muted" aria-hidden="true">Adjust 1 HP</span>
          <button type="button" class="btn btn--icon" id="hp-plus" data-action="hp-plus" aria-label="Heal 1 HP">${icon('plus')}</button>
        </div>
        <dl class="stat-list stat-list--three">
          <div class="stat"><dt>Initiative</dt><dd>${signed(c.initiative)}</dd></div>
          <div class="stat"><dt>Speed</dt><dd>${c.speed} ft</dd>${c.speedNote ? `<dd class="stat__note">${esc(c.speedNote)}</dd>` : ''}</div>
          <div class="stat"><dt>Proficiency</dt><dd>${signed(ch.proficiencyBonus)}</dd></div>
        </dl>

        <${h}>Damage / Heal</${h}>
        <div class="hp-form">
          <label for="hp-amount">Amount</label>
          <input id="hp-amount" class="input" type="number" inputmode="numeric" min="1" max="999" step="1"
                 value="${esc(ui.amount)}" data-input="hp-amount"
                 aria-describedby="hp-hint${ui.error ? ' hp-error' : ''}"${ui.error ? ' aria-invalid="true"' : ''}>
          <div class="hp-form__buttons">
            <button type="button" class="btn" id="hp-damage" data-action="hp-damage">Damage</button>
            <button type="button" class="btn btn--primary" id="hp-heal" data-action="hp-heal">Heal</button>
          </div>
        </div>
        <p class="hint" id="hp-hint">Enter a whole number, then choose Damage or Heal. Temporary HP absorbs damage first.</p>
        ${ui.error ? `<p class="field-error" id="hp-error">${icon('warning')} ${esc(ui.error)}</p>` : ''}
        ${undoBtn}

        <div class="hp-form">
          <label for="temp-hp">Temporary HP</label>
          <input id="temp-hp" class="input" type="number" inputmode="numeric" min="0" max="999" step="1"
                 value="${esc(ui.tempError ? ui.temp : String(hp.temp))}" data-input="temp-hp"${ui.tempError ? ' aria-invalid="true" aria-describedby="temp-error"' : ''}>
          <div class="hp-form__buttons">
            <button type="button" class="btn" id="temp-set" data-action="temp-set">Set temp HP</button>
          </div>
        </div>
        ${ui.tempError ? `<p class="field-error" id="temp-error">${icon('warning')} ${esc(ui.tempError)}</p>` : ''}
        ${rests}
        </div>

        <div class="combat-col">
        <${h}>Attacks</${h}>
        <div class="crit-toggle">
          <button type="button" class="btn btn--small btn--toggle" id="crit-toggle" data-action="crit-toggle"
                  aria-pressed="${ui.crit}" aria-describedby="crit-hint">Critical hit</button>
          <p class="hint" id="crit-hint">Doubles the damage dice. A natural 20 turns it on; any other roll to hit turns it off.</p>
        </div>
        <ul class="attack-list">${attacks || '<li>No weapons equipped. Equip a weapon on the Equipment card.</li>'}</ul>
        ${lastRoll}
        ${conditions}
        </div>
        </div></div>`;
    },
  });
})(window.WASD);
