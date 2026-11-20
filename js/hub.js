/*
 * hub.js: the Hub screen. Renders every card in the player's chosen order,
 * handles collapse/expand, and "Edit layout" (move up / move down).
 * OWNER: Person A
 *
 * Card order is DOM order, so what sighted players see is exactly what screen
 * readers read. Never reorder cards with CSS `order` or grid placement.
 */
(function (WASD) {
  'use strict';

  // Default order = how often players use each card during live play.
  const DEFAULT_ORDER = ['combat', 'abilities', 'skills', 'spellcasting', 'equipment', 'features', 'identity'];
  const STORAGE_KEY = 'wasd.cardOrder.v1';

  const listEl = document.getElementById('card-list');
  const editBtn = document.getElementById('edit-layout');
  const resetBtn = document.getElementById('reset-layout');

  let order = loadOrder();
  let editing = false;
  const DEFAULT_OPEN = ['combat']; // Combat starts open: the stats players look up most are visible at once
  const expanded = new Set(DEFAULT_OPEN); // ids of cards that are currently open

  function loadOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const valid = Array.isArray(saved) &&
        saved.length === DEFAULT_ORDER.length &&
        DEFAULT_ORDER.every((id) => saved.includes(id));
      if (valid) return saved;
    } catch (e) { /* storage blocked or bad JSON: use the default */ }
    return DEFAULT_ORDER.slice();
  }

  function saveOrder() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch (e) { /* ignore */ }
  }

  /** Markup for one card "shell". The body comes from the card module's render(). */
  function cardHTML(id, index) {
    const card = WASD.getCard(id);
    if (!card) return ''; // card file not loaded yet: skip it
    const { esc } = WASD;
    const ch = WASD.character;
    const isOpen = expanded.has(id);
    const isFirst = index === 0;
    const isLast = index === order.length - 1;
    const title = esc(card.title);

    return `
      <li class="card" data-card-id="${id}">
        <section aria-labelledby="card-${id}-title">
          <h2 class="card__heading">
            <button type="button" class="card__toggle" id="card-${id}-toggle"
                    aria-expanded="${isOpen}" aria-controls="card-${id}-body">
              <span class="card__icon" aria-hidden="true">${WASD.icon(card.icon || 'star')}</span>
              <span class="card__text">
                <span class="card__title" id="card-${id}-title">${title}</span>
                <span class="card__summary">${esc(card.summary(ch))}</span>
              </span>
            </button>
          </h2>
          <div class="card__tools"${editing ? '' : ' hidden'}>
            <button type="button" class="btn btn--small" id="move-up-${id}" data-move="up" data-card-id="${id}"
                    aria-label="Move ${title} up" aria-disabled="${isFirst}"><span aria-hidden="true">↑</span> Up</button>
            <button type="button" class="btn btn--small" id="move-down-${id}" data-move="down" data-card-id="${id}"
                    aria-label="Move ${title} down" aria-disabled="${isLast}"><span aria-hidden="true">↓</span> Down</button>
          </div>
          <div class="card__body" id="card-${id}-body"${isOpen ? '' : ' hidden'}>
            ${card.render(ch, { view: 'hub', sub: 'h3' })}
            <p class="card__open"><a href="#/card/${id}">Open ${title} page</a></p>
          </div>
        </section>
      </li>`;
  }

  function render() {
    listEl.innerHTML = order.map(cardHTML).join('');
  }

  function toggle(id) {
    const btn = document.getElementById(`card-${id}-toggle`);
    const body = document.getElementById(`card-${id}-body`);
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    if (open) expanded.add(id); else expanded.delete(id);
  }

  function move(id, direction) {
    const from = order.indexOf(id);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= order.length) return;

    [order[from], order[to]] = [order[to], order[from]];
    saveOrder();
    render();
    // Keep focus on the same button so keyboard users can keep pressing it.
    document.getElementById(`move-${direction}-${id}`).focus();
    WASD.announce(`${WASD.getCard(id).title} moved to position ${to + 1} of ${order.length}.`);
  }

  function setEditing(on) {
    editing = on;
    editBtn.setAttribute('aria-pressed', String(on));
    resetBtn.hidden = !on;
    listEl.querySelectorAll('.card__tools').forEach((el) => { el.hidden = !on; });
  }

  // One listener for the whole list (event delegation), since cards are re-rendered.
  listEl.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest('.card__toggle');
    if (toggleBtn) {
      toggle(toggleBtn.closest('.card').dataset.cardId);
      return;
    }
    const moveBtn = event.target.closest('[data-move]');
    if (moveBtn && moveBtn.getAttribute('aria-disabled') !== 'true') {
      move(moveBtn.dataset.cardId, moveBtn.dataset.move);
    }
  });

  editBtn.addEventListener('click', () => {
    setEditing(!editing);
    WASD.announce(editing
      ? 'Edit layout on. Each card now has Up and Down buttons.'
      : 'Edit layout off.');
  });

  /** Back to the default order with only Combat open (used by Reset layout and Reset demo). */
  function resetOrder() {
    order = DEFAULT_ORDER.slice();
    expanded.clear();
    DEFAULT_OPEN.forEach((id) => expanded.add(id));
    saveOrder();
    render();
  }

  resetBtn.addEventListener('click', () => {
    resetOrder();
    WASD.announce('Card order reset to default.');
  });

  // TODO(Person A): drag-and-drop reordering as an EXTRA (buttons must stay).

  WASD.hub = {
    render,
    resetOrder,
    getOrder: () => order.slice(),
    focusCard(id) {
      const el = document.getElementById(`card-${id}-toggle`);
      if (el) el.focus();
    },
  };
})(window.WASD);
