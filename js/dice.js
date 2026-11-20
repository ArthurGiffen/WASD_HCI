/*
 * dice.js: dice rolling. No DOM.
 *
 *   WASD.dice.roll(2, 6)        -> [3, 5]      (two d6)
 *   WASD.dice.parse('1d6')      -> { count: 1, sides: 6 }
 *   WASD.dice.rollParts(parts)  -> rolls each damage part SEPARATELY (by type)
 */
(function (WASD) {
  'use strict';

  /** Random whole number 1..sides, using the browser's secure random source. */
  function die(sides) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / sides) * sides; // avoid modulo bias
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return (buf[0] % sides) + 1;
  }

  function roll(count, sides) {
    return Array.from({ length: count }, () => die(sides));
  }

  function parse(expr) {
    const m = /^(\d+)d(\d+)$/.exec(expr);
    return m ? { count: Number(m[1]), sides: Number(m[2]) } : null;
  }

  const sum = (arr) => arr.reduce((a, b) => a + b, 0);

  /**
   * parts: [{ dice:'1d6', bonus:3, type:'piercing' }, ...]
   * returns: [{ type, dice, bonus, rolls:[4], total:7 }, ...]  (one entry per damage type)
   */
  function rollParts(parts) {
    return parts.map((p) => {
      const { count, sides } = parse(p.dice);
      const rolls = roll(count, sides);
      return { type: p.type, dice: p.dice, bonus: p.bonus, rolls, total: sum(rolls) + p.bonus };
    });
  }

  WASD.dice = { roll, parse, sum, rollParts };
})(window.WASD);
