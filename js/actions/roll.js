/*
 * ROLL action (bottom action bar). STUB.
 * OWNER: Person B
 *
 * TODO(Person B): open a dice roller (d20 + modifier, damage dice). Results
 * must be announced to screen readers (WASD.announce or a live region in the
 * roller) and not shown only as an animation.
 */
(function (WASD) {
  'use strict';

  document.getElementById('roll-btn').addEventListener('click', () => {
    WASD.announce('Roll is not built yet.');
  });
})(window.WASD);
