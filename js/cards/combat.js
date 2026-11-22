/*
 * COMBAT CARD: AC, HP (damage / heal / temp), initiative, speed, proficiency, attacks.
 * OWNER: Person B
 *
 * This is the most-used card at the table (test task 1: "What's your AC?").
 * Armor Class is the FIRST value in both the summary and the body, so it is
 * seen first AND announced first by screen readers.
 *
 * Every control has a stable id so keyboard focus survives the redraw that
 * follows each change (see WASD.refresh in app.js). Every change is announced
 * with WASD.announce (a polite live region).
 */
(function (WASD) {
  'use strict';

  // Things typed into the card that must survive a redraw.
  // crit: the "Critical hit" toggle. When on, Roll damage rolls the damage dice twice.
  const ui = { amount: '1', temp: '0', error: '', tempError: '', crit: false };
  WASD.lastRoll = null; // { title, lines: [...], total, note } shown under "Last roll"

  // A new or reset character starts with a clean card: no old errors, rolls or typed amounts.
  document.addEventListener('wasd:character-replaced', () => {
    Object.assign(ui, { amount: '1', temp: '0', error: '', tempError: '', crit: false });
    WASD.lastRoll = null;
  });

  const signed = (n) => WASD.signed(n);
  const whole = (text) => (/^\d+$/.test(String(text).trim()) ? Number(String(text).trim()) : null);

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

    if (kind === 'heal' && before.current >= before.max) {
      WASD.refresh();
      WASD.announce(`${name} is already at full HP, ${before.max} of ${before.max}.`);
      return;
    }

    WASD.updateCharacter((raw) => {
      const hp = raw.combat.hp;
      if (kind === 'damage') {
        // Temporary HP soaks up damage first.
        absorbed = Math.min(hp.temp, n);
        hp.temp -= absorbed;
        hp.current = Math.max(0, hp.current - (n - absorbed));
      } else {
        hp.current = Math.min(hp.max, hp.current + n);
      }
    });

    const hp = WASD.raw.combat.hp;
    let msg;
    if (kind === 'damage') {
      msg = `${name} took ${n} damage.`;
      if (absorbed) msg += ` ${absorbed} absorbed by temporary HP.`;
      msg += hp.current === 0 ? ` ${name} is down at 0 HP.` : ` HP ${hp.current} of ${hp.max}.`;
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
    WASD.updateCharacter((raw) => { raw.combat.hp.temp = n; });
    WASD.announce(`Temporary HP set to ${n}.`);
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
    // then add modifiers once. rollParts does the doubling.
    const crit = ui.crit;
    const parts = WASD.dice.rollParts(a.damage, { crit }).map((p) => ({ ...p, total: Math.max(0, p.total) }));
    const notes = [];
    if (crit) notes.push('Critical hit: damage dice rolled twice, bonus added once.');
    if (parts.length > 1) notes.push('Apply resistance per damage type.');
    // One line and one total PER DAMAGE TYPE, so resistance/vulnerability can be applied per type.
    WASD.lastRoll = {
      title: `${a.name}: roll damage${crit ? ' (critical hit)' : ''}`,
      lines: parts.map((p) => `${p.dice} ${p.type}: rolled ${p.rolls.join(', ')}${p.bonus ? `, ${signed(p.bonus)}` : ''} = ${p.total}`),
      total: parts.map((p) => `${p.total} ${p.type}`).join(' + '),
      note: notes.join(' '),
    };
    WASD.refresh();
    WASD.announce(`${a.name} ${crit ? 'critical ' : ''}damage: ${parts.map((p) => `${p.total} ${p.type}`).join(', ')}.`);
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
      return `AC ${c.armorClass} · HP ${c.hp.current}/${c.hp.max} · Initiative ${signed(c.initiative)} · Speed ${c.speed} ft · Proficiency ${signed(ch.proficiencyBonus)}`;
    },

    render(ch, ctx) {
      const { esc, icon, rules } = WASD;
      const c = ch.combat;
      const hp = c.hp;
      const h = ctx.sub;

      // State label: text + icon, never color alone.
      let state = '';
      if (hp.current === 0) {
        state = `<p class="hp-state hp-state--down">${icon('warning')}<span><strong>Down: 0 HP.</strong> ${esc(ch.identity.name)} is unconscious.</span></p>`;
      } else if (hp.current <= Math.floor(hp.max / 2)) {
        // Plain words on purpose: "Bloodied" is a 2024 rules term, and this app follows 2014.
        state = `<p class="hp-state hp-state--low">${icon('warning')}<span><strong>Half HP or less.</strong></span></p>`;
      }

      const attacks = c.attacks.map((a) => {
        const detail = a.range || a.note ? ` <span class="muted">(${esc(a.range || a.note)})</span>` : '';
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

      return `
        <dl class="stat-list stat-list--two">
          <div class="stat stat--big"><dt>${icon('shield')} Armor Class</dt><dd>${c.armorClass}</dd><dd class="stat__note">${esc(c.armorName)}</dd></div>
          <div class="stat stat--big"><dt>${icon('heart')} Hit Points</dt>
            <dd>${hp.current}<span aria-hidden="true"> / </span><span class="visually-hidden"> of </span>${hp.max}</dd>
            ${hp.temp ? `<dd class="stat__note">+${hp.temp} temporary</dd>` : ''}</div>
        </dl>
        ${state}
        <div class="hp-stepper" role="group" aria-label="Adjust hit points by 1">
          <button type="button" class="btn btn--icon" id="hp-minus" data-action="hp-minus" aria-label="Take 1 damage">${icon('minus')}</button>
          <span class="muted" aria-hidden="true">Adjust 1 HP</span>
          <button type="button" class="btn btn--icon" id="hp-plus" data-action="hp-plus" aria-label="Heal 1 HP">${icon('plus')}</button>
        </div>
        <dl class="stat-list stat-list--three">
          <div class="stat"><dt>Initiative</dt><dd>${signed(c.initiative)}</dd></div>
          <div class="stat"><dt>Speed</dt><dd>${c.speed} ft</dd></div>
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

        <div class="hp-form">
          <label for="temp-hp">Temporary HP</label>
          <input id="temp-hp" class="input" type="number" inputmode="numeric" min="0" max="999" step="1"
                 value="${esc(ui.tempError ? ui.temp : String(hp.temp))}" data-input="temp-hp"${ui.tempError ? ' aria-invalid="true" aria-describedby="temp-error"' : ''}>
          <div class="hp-form__buttons">
            <button type="button" class="btn" id="temp-set" data-action="temp-set">Set temp HP</button>
          </div>
        </div>
        ${ui.tempError ? `<p class="field-error" id="temp-error">${icon('warning')} ${esc(ui.tempError)}</p>` : ''}

        <${h}>Attacks</${h}>
        <div class="crit-toggle">
          <button type="button" class="btn btn--small btn--toggle" id="crit-toggle" data-action="crit-toggle"
                  aria-pressed="${ui.crit}" aria-describedby="crit-hint">Critical hit</button>
          <p class="hint" id="crit-hint">Doubles the damage dice. A natural 20 turns it on; any other roll to hit turns it off.</p>
        </div>
        <ul class="attack-list">${attacks || '<li>No weapons equipped. Equip a weapon on the Equipment card.</li>'}</ul>
        <p class="muted">Hit dice: ${esc(c.hitDice)}</p>
        ${lastRoll}`;
    },
  });
})(window.WASD);
