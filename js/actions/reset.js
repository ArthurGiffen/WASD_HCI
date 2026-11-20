/*
 * RESET DEMO (Hub, next to Edit layout): puts Kira back to her original level 4
 * state after the player confirms. Clears HP changes, equipment changes, any
 * Level Up, the last roll and the card order.
 * OWNER: Person A
 */
(function (WASD) {
  'use strict';

  const button = document.getElementById('reset-demo');
  button.addEventListener('click', async () => {
    const ok = await WASD.confirm({
      opener: button,
      title: 'Reset demo?',
      message: 'This restores Kira to her original level 4 character: full starting HP, original gear, and the default card order. Any changes you made will be lost.',
      confirmLabel: 'Reset demo',
    });
    if (!ok) return; // focus already returned to the Reset demo button

    WASD.lastRoll = null;
    WASD.resetCharacter();   // back to the sample character + redraw
    WASD.hub.resetOrder();
    const ch = WASD.character;
    WASD.announce(`Demo reset. ${ch.identity.name} is level ${ch.identity.level} with ${ch.combat.hp.current} of ${ch.combat.hp.max} HP.`);
  });
})(window.WASD);
