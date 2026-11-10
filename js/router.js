/*
 * router.js: hash-based navigation between the Hub and a single Card view.
 * OWNER: Person A
 *
 *   #/              -> Hub (all cards)
 *   #/card/combat   -> Card view for one card
 *
 * Hash routing works without a server and gives the browser Back button for free.
 * Focus rule: after every navigation, focus moves to the new screen's <h1>,
 * so screen-reader users hear where they landed. Returning to the hub puts
 * focus back on the card they came from.
 */
(function (WASD) {
  'use strict';

  const hubView = document.getElementById('view-hub');
  const cardView = document.getElementById('view-card');
  const hubTitle = document.getElementById('hub-title');
  const cardTitle = document.getElementById('card-view-title');
  const cardBody = document.getElementById('card-view-body');

  let lastCardId = null;
  let isFirstRender = true; // don't steal focus on initial page load

  function currentCardId() {
    const match = /^#\/card\/([a-z-]+)$/.exec(location.hash);
    return match ? match[1] : null;
  }

  function show() {
    const id = currentCardId();
    const card = id && WASD.getCard(id);
    const name = WASD.character.identity.name;

    if (card) {
      cardTitle.textContent = card.title;
      cardBody.innerHTML = card.render(WASD.character, { view: 'page', sub: 'h2' });
      hubView.hidden = true;
      cardView.hidden = false;
      document.title = `${card.title} · ${name} · WASD Character Sheet`;
      if (!isFirstRender) cardTitle.focus();
      lastCardId = card.id;
    } else {
      WASD.hub.render();
      cardView.hidden = true;
      hubView.hidden = false;
      document.title = `${name} · WASD Character Sheet`;
      if (!isFirstRender) {
        if (lastCardId) WASD.hub.focusCard(lastCardId);
        else hubTitle.focus();
      }
    }
    window.scrollTo(0, 0);
    isFirstRender = false;
  }

  function onHashChange() {
    // Ignore in-page anchors like the skip link (#main); only "#/..." are routes.
    if (location.hash && !location.hash.startsWith('#/')) return;
    show();
  }

  WASD.router = {
    start() {
      window.addEventListener('hashchange', onHashChange);
      show();
    },
    /** Navigate to a route. Re-renders even if we're already on it. */
    go(hash) {
      if (location.hash === hash) show();
      else location.hash = hash;
    },
  };
})(window.WASD);
