/*
 * dialog.js: shared helpers for native <dialog> modals.
 *
 *   const modal = WASD.modal(dialogEl);
 *   modal.open(openerButton, firstFocusEl);   // focus moves in
 *   modal.close();                            // focus returns to the opener
 *
 * Escape and a click on the backdrop both close it and return focus to the
 * opener. The <dialog> itself must have no padding (put padding on an inner
 * wrapper), so a click whose target IS the dialog means a backdrop click.
 *
 *   WASD.confirm({ title, message, confirmLabel, opener }) -> Promise<boolean>
 * Pass the button that opened it as `opener`, so focus returns there on every browser.
 * A yes/no dialog. "Cancel" is focused first, so Enter never confirms by accident.
 */
(function (WASD) {
  'use strict';

  /**
   * options.backdropClose (default true): false for multi-step wizards, so a
   *   stray click outside doesn't throw away the player's choices.
   * options.onClose(): called after every close (Escape, Cancel, finish).
   */
  WASD.modal = function (dialog, options) {
    const opts = { backdropClose: true, ...options };
    let opener = null;

    function close() {
      if (dialog.open) dialog.close();
      if (opener && document.contains(opener)) opener.focus();
      if (opts.onClose) opts.onClose();
    }

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('click', (event) => {
      if (opts.backdropClose && event.target === dialog) close();
    });

    return {
      open(from, firstFocus) {
        opener = from || document.activeElement;
        dialog.showModal();
        const target = firstFocus || dialog.querySelector('button, input, [href]');
        if (target) target.focus();
      },
      close,
      isOpen: () => dialog.open,
    };
  };

  const dlg = document.getElementById('confirm-dialog');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');
  const modal = WASD.modal(dlg);
  let resolver = null;

  function finish(answer) {
    const done = resolver;
    resolver = null;
    modal.close();
    if (done) done(answer);
  }

  yesBtn.addEventListener('click', () => finish(true));
  noBtn.addEventListener('click', () => finish(false));
  // Escape / backdrop close the dialog directly: count that as "No".
  dlg.addEventListener('close', () => { if (resolver) finish(false); });

  WASD.confirm = function ({ title, message, confirmLabel, opener }) {
    titleEl.textContent = title;
    msgEl.textContent = message;
    yesBtn.textContent = confirmLabel || 'Yes';
    return new Promise((resolve) => {
      resolver = resolve;
      modal.open(opener || document.activeElement, noBtn);
    });
  };
})(window.WASD);
