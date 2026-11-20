/*
 * EQUIPMENT CARD: three tabs.
 *   Items                  what you carry, with an Equipped button on armor, weapons and accessories
 *   Modifiers              what equipped items add (+1 AC, +5 Speed, +3 Strength ...)
 *   Currency & consumables coins, and things you use up (arrows, potions)
 * OWNER: Person C
 *
 * Equipping changes the character through WASD.updateCharacter(), and rules.js
 * recalculates AC, attacks, speed and ability scores from the EQUIPPED items.
 */
(function (WASD) {
  'use strict';

  const EQUIPPABLE = ['armor', 'weapon', 'accessory'];
  const COINS = [
    { key: 'pp', name: 'Platinum' },
    { key: 'gp', name: 'Gold' },
    { key: 'sp', name: 'Silver' },
    { key: 'cp', name: 'Copper' },
  ];

  const findItem = (raw, id) => raw.equipment.items.find((i) => i.id === id);

  WASD.actions['equip-toggle'] = (el) => {
    const id = el.dataset.item;
    let nowEquipped;
    let swapped = '';
    let itemName = '';
    WASD.updateCharacter((raw) => {
      const item = findItem(raw, id);
      itemName = item.name;
      item.equipped = !item.equipped;
      nowEquipped = item.equipped;
      // You can only wear one suit of armor at a time.
      if (item.equipped && item.armor) {
        raw.equipment.items.forEach((o) => {
          if (o !== item && o.armor && o.equipped) { o.equipped = false; swapped = ` ${o.name} unequipped.`; }
        });
      }
    });
    const c = WASD.character.combat;
    WASD.announce(`${itemName} ${nowEquipped ? 'equipped' : 'unequipped'}.${swapped} Armor Class ${c.armorClass}, Speed ${c.speed} feet.`);
  };

  WASD.actions['coin-minus'] = (el) => changeCoin(el.dataset.coin, -1);
  WASD.actions['coin-plus'] = (el) => changeCoin(el.dataset.coin, 1);
  function changeCoin(key, delta) {
    const coin = COINS.find((c) => c.key === key);
    if (WASD.raw.equipment.coins[key] + delta < 0) {
      WASD.announce(`No ${coin.name.toLowerCase()} left to remove.`);
      return;
    }
    WASD.updateCharacter((raw) => { raw.equipment.coins[key] += delta; });
    WASD.announce(`${coin.name} ${WASD.raw.equipment.coins[key]}.`);
  }

  WASD.actions['item-use'] = (el) => {
    const item = findItem(WASD.raw, el.dataset.item);
    if (item.qty <= 0) { WASD.announce(`No ${item.name} left.`); return; }
    WASD.updateCharacter((raw) => { findItem(raw, el.dataset.item).qty -= 1; });
    WASD.announce(`Used one ${item.name}. ${item.qty - 1} left.`);
  };
  WASD.actions['item-add'] = (el) => {
    const item = findItem(WASD.raw, el.dataset.item);
    WASD.updateCharacter((raw) => { findItem(raw, el.dataset.item).qty += 1; });
    WASD.announce(`Added one ${item.name}. ${item.qty + 1} now.`);
  };

  function itemRow(item) {
    const { esc } = WASD;
    const mods = (item.modifiers || []).map(WASD.rules.formatModifier).join(', ');
    const note = mods ? ` <span class="muted">${esc(mods)}</span>` : '';
    const btn = EQUIPPABLE.includes(item.kind) ? `
      <button type="button" class="btn btn--small btn--toggle" id="equip-${item.id}" data-action="equip-toggle"
              data-item="${item.id}" aria-pressed="${!!item.equipped}" aria-label="Equipped: ${esc(item.name)}">
        Equipped</button>` : '';
    const qty = item.qty > 1 ? ` <span class="tag">×${item.qty}</span>` : '';
    return `<li class="item-row"><span>${esc(item.name)}${qty}${note}</span>${btn}</li>`;
  }

  WASD.registerCard({
    id: 'equipment',
    title: 'Equipment',
    icon: 'package',

    summary(ch) {
      const e = ch.equipment;
      const weapons = e.weaponNames.length ? e.weaponNames.join(', ') : 'No weapons equipped';
      return `${ch.combat.armorName} · ${weapons} · ${ch.equipment.coins.gp} gp`;
    },

    render(ch, ctx) {
      const { esc, rules } = WASD;
      const h = ctx.sub;
      const e = ch.equipment;

      // ----- Items tab -----
      const group = (title, list) => (list.length
        ? `<${h}>${title}</${h}><ul class="item-list">${list.map(itemRow).join('')}</ul>` : '');
      const gear = e.items.filter((i) => !EQUIPPABLE.includes(i.kind) && !i.consumable);
      const items = `
        <p class="hint">Only equipped items count toward your stats.</p>
        ${group('Armor', e.items.filter((i) => i.kind === 'armor'))}
        ${group('Weapons', e.items.filter((i) => i.kind === 'weapon'))}
        ${group('Accessories', e.items.filter((i) => i.kind === 'accessory'))}
        ${group('Gear', gear)}`;

      // ----- Modifiers tab -----
      const withMods = e.items.filter((i) => (i.modifiers || []).length);
      const totals = Object.keys(e.bonus).filter((k) => e.bonus[k] !== 0)
        .map((k) => rules.formatModifier({ stat: k, value: e.bonus[k] }));
      const modRows = withMods.map((i) => `
        <tr>
          <th scope="row">${esc(i.name)}</th>
          <td>${i.modifiers.map((m) => esc(rules.formatModifier(m))).join(', ')}</td>
          <td>${i.equipped ? '<span class="tag tag--on">Equipped</span>' : '<span class="tag">Not equipped</span>'}</td>
        </tr>`).join('');
      const modifiers = withMods.length ? `
        <table class="data-table">
          <caption class="visually-hidden">Item modifiers</caption>
          <thead><tr><th scope="col">Item</th><th scope="col">Modifier</th><th scope="col">Status</th></tr></thead>
          <tbody>${modRows}</tbody>
        </table>
        <p><strong>Active now:</strong> ${totals.length ? esc(totals.join(', ')) : 'none (nothing with modifiers is equipped)'}</p>`
        : '<p>No items have modifiers yet.</p>';

      // ----- Currency & consumables tab -----
      const coins = COINS.map((c) => `
        <li class="coin">
          <span class="coin__name">${c.name}</span>
          <span class="coin__count">${e.coins[c.key]}</span>
          <span class="coin__buttons">
            <button type="button" class="btn btn--icon btn--small" id="coin-minus-${c.key}" data-action="coin-minus" data-coin="${c.key}" aria-label="Remove 1 ${c.name.toLowerCase()}">${WASD.icon('minus')}</button>
            <button type="button" class="btn btn--icon btn--small" id="coin-plus-${c.key}" data-action="coin-plus" data-coin="${c.key}" aria-label="Add 1 ${c.name.toLowerCase()}">${WASD.icon('plus')}</button>
          </span>
        </li>`).join('');
      const consumables = e.items.filter((i) => i.consumable).map((i) => `
        <li class="item-row">
          <span>${esc(i.name)} <span class="tag">×${i.qty}</span></span>
          <span class="item-row__buttons">
            <button type="button" class="btn btn--small" id="use-${i.id}" data-action="item-use" data-item="${i.id}" aria-label="Use one ${esc(i.name)}">Use one</button>
            <button type="button" class="btn btn--small" id="add-${i.id}" data-action="item-add" data-item="${i.id}" aria-label="Add one ${esc(i.name)}">Add one</button>
          </span>
        </li>`).join('');
      const money = `
        <${h}>Currency</${h}>
        <ul class="coin-list">${coins}</ul>
        <${h}>Consumables</${h}>
        ${consumables ? `<ul class="item-list">${consumables}</ul>` : '<p>No consumables.</p>'}`;

      return WASD.tabs.render('equip', 'Equipment sections', [
        { id: 'items', label: 'Items', html: items },
        { id: 'modifiers', label: 'Modifiers', html: modifiers },
        { id: 'money', label: 'Currency & consumables', html: money },
      ]);
    },
  });
})(window.WASD);
