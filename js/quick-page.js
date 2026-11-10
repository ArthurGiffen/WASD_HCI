/*
 * quick-page.js: the Quick Page overlay (numbered list of every card).
 * OWNER: Person A
 *
 * Reaches any card in two actions: open Quick Page, pick a card (or press 1-7).
 * Uses native <dialog>.showModal(), which makes the rest of the page inert
 * (focus can't leave the dialog). We handle: focusing the first item on open,
 * Escape / Close / backdrop click all returning focus to the Quick Page
 * button, and number-key shortcuts.
 *
 * NOTE: the list follows the player's current hub order, so numbers match what
 * they see on the hub. (Team decision to revisit: fixed numbers would build
 * muscle memory, e.g. "1 is always Combat".)
 */
(function (WASD) {
  'use strict';

  const dialog = document.getElementById('quick-page');
  const list = document.getElementById('quick-page-list');
  const openBtn = document.getElementById('open-quick-page');
  const closeBtn = document.getElementById('close-quick-page');

  let navigating = false;

  function renderList() {
    const current = location.hash;
    list.innerHTML = WASD.hub.getOrder().map((id) => {
      const card = WASD.getCard(id);
      if (!card) return '';
      const href = `#/card/${id}`;
      const currentAttr = href === current ? ' aria-current="page"' : '';
      return `<li><a href="${href}"${currentAttr}>${WASD.esc(card.title)}</a></li>`;
    }).join('');
  }

  function open() {
    renderList();
    navigating = false;
    dialog.showModal();
    const first = list.querySelector('a');
    if (first) first.focus();
  }

  /** Close without navigating: focus goes back to the Quick Page button. */
  function close() {
    navigating = false;
    dialog.close();
    // Done synchronously (not only in the "close" event) because browsers'
    // built-in focus restore can send focus elsewhere, e.g. Safari doesn't
    // focus buttons on click, and Chrome restores to the previous <h1>.
    openBtn.focus();
  }

  function goTo(link) {
    navigating = true;
    dialog.close();
    WASD.router.go(link.getAttribute('href')); // router moves focus to the card's <h1>
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // Escape fires "cancel". Route it through close() so focus returns reliably.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  list.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    goTo(link);
  });

  // Number keys 1-9 jump straight to that card (laptop shortcut).
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!/^[1-9]$/.test(event.key)) return;
    const link = list.querySelectorAll('a')[Number(event.key) - 1];
    if (link) {
      event.preventDefault();
      goTo(link);
    }
  });

  // The <dialog> has no padding, so a click whose target IS the dialog = backdrop click.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  // Fallback for any other way the dialog gets closed.
  dialog.addEventListener('close', () => {
    if (!navigating && document.activeElement !== openBtn) openBtn.focus();
  });

  WASD.quickPage = { open };
})(window.WASD);
