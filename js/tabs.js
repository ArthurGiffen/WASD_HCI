/*
 * tabs.js: one reusable tab component (used by Equipment and Features).
 *
 *   WASD.tabs.render('equip', 'Equipment sections', [{ id: 'items', label: 'Items', html: '...' }, ...])
 *
 * Follows the ARIA tabs pattern: Left/Right arrows move between tabs, Home/End
 * jump to the first/last, only the active tab is in the Tab order. The tab
 * strip scrolls sideways on narrow screens. The chosen tab is remembered per
 * group, so a redraw (e.g. after toggling Equipped) keeps you on the same tab.
 */
(function (WASD) {
  'use strict';

  const active = {}; // group id -> active tab id

  function render(group, label, tabs) {
    const current = tabs.some((t) => t.id === active[group]) ? active[group] : tabs[0].id;
    const { esc } = WASD;

    const buttons = tabs.map((t) => {
      const on = t.id === current;
      return `<button type="button" role="tab" class="tab" id="${group}-tab-${t.id}"
        aria-selected="${on}" aria-controls="${group}-panel-${t.id}" tabindex="${on ? 0 : -1}"
        data-tab-group="${group}" data-tab-id="${t.id}">${esc(t.label)}</button>`;
    }).join('');

    const panels = tabs.map((t) => `
      <div role="tabpanel" class="tabpanel" id="${group}-panel-${t.id}"
           aria-labelledby="${group}-tab-${t.id}" tabindex="0"${t.id === current ? '' : ' hidden'}>${t.html}</div>`).join('');

    return `<div class="tabs" data-tabs="${group}">
      <div role="tablist" class="tablist" aria-label="${esc(label)}" data-tablist="${group}">${buttons}</div>${panels}</div>`;
  }

  function select(tab, focus) {
    const group = tab.dataset.tabGroup;
    const root = tab.closest('[data-tabs]');
    active[group] = tab.dataset.tabId;
    root.querySelectorAll('[role="tab"]').forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    root.querySelectorAll('[role="tabpanel"]').forEach((p) => {
      p.hidden = p.id !== tab.getAttribute('aria-controls');
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"][data-tab-group]');
    if (tab) select(tab, false);
  });

  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[role="tab"][data-tab-group]');
    if (!tab || event.altKey || event.ctrlKey || event.metaKey) return;
    const all = Array.from(tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
    let i = all.indexOf(tab);
    if (event.key === 'ArrowRight') i = (i + 1) % all.length;
    else if (event.key === 'ArrowLeft') i = (i - 1 + all.length) % all.length;
    else if (event.key === 'Home') i = 0;
    else if (event.key === 'End') i = all.length - 1;
    else return;
    event.preventDefault();
    select(all[i], true);
  });

  WASD.tabs = { render };
})(window.WASD);
