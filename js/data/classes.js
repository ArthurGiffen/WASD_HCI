/*
 * classes.js: class and race data for Level Up and the guided first-time build.
 * D&D 5e, 2014 rules. Summaries are short paraphrases written for this
 * prototype, not rulebook text. REVIEW BEFORE THE DEMO.
 *
 * Only what the demo needs is here:
 *   - Rogue: level 1 and level 5 features (Kira levels 4 -> 5).
 *   - Fighter, Rogue, Wizard, Cleric: level 1 starting setup for the guided build.
 *   - Human, Elf, Dwarf, Halfling: base race only (no subraces).
 * A level with no entry in `features` shows "no feature data" in Level Up,
 * so the app never invents rules.
 */
WASD.classData = {
  Fighter: {
    hitDie: 10,
    saves: ['str', 'con'],
    blurb: 'A trained warrior. Heavy armor, strong weapons, hard to take down.',
    suggested: { str: 15, con: 14, dex: 13, wis: 12, cha: 10, int: 8 },
    start: {
      armor: { id: 'chain-mail', name: 'Chain mail', armor: { base: 16, addDex: false } },
      weapon: { id: 'longsword', name: 'Longsword', ability: 'str', dice: '1d8', type: 'slashing' },
      skills: { Athletics: 'proficient', Perception: 'proficient' },
    },
    features: {
      1: [
        { name: 'Fighting Style', summary: 'Pick a combat specialty, such as Defense (+1 AC in armor) or Dueling.' },
        { name: 'Second Wind', summary: 'Once per short rest, use a bonus action to regain 1d10 + fighter level HP.' },
      ],
    },
  },

  Rogue: {
    hitDie: 8,
    saves: ['dex', 'int'],
    blurb: 'A sneaky expert. Skills, stealth and big hits with Sneak Attack.',
    suggested: { dex: 15, con: 14, wis: 13, int: 12, cha: 10, str: 8 },
    start: {
      armor: { id: 'leather', name: 'Leather armor', armor: { base: 11, maxDex: null } },
      weapon: { id: 'shortsword', name: 'Shortsword', ability: 'finesse', dice: '1d6', type: 'piercing' },
      skills: { Stealth: 'expertise', 'Sleight of Hand': 'expertise', Acrobatics: 'proficient', Perception: 'proficient' },
      sneakAttack: true,
    },
    features: {
      1: [
        { name: 'Expertise', summary: 'Double proficiency bonus on two chosen skills.' },
        { name: 'Sneak Attack', summary: 'Extra damage once per turn with advantage or an ally next to the target.' },
        { name: "Thieves' Cant", summary: 'Secret slang and signs shared by rogues.' },
      ],
      5: [
        { name: 'Uncanny Dodge', summary: 'When an attacker you can see hits you, use your reaction to halve that attack’s damage.' },
      ],
    },
  },

  Wizard: {
    hitDie: 6,
    saves: ['int', 'wis'],
    blurb: 'A scholar of magic. Fragile, but casts powerful spells from a spellbook.',
    suggested: { int: 15, con: 14, dex: 13, wis: 12, cha: 10, str: 8 },
    start: {
      armor: null,
      weapon: { id: 'quarterstaff', name: 'Quarterstaff', ability: 'str', dice: '1d6', type: 'bludgeoning' },
      skills: { Arcana: 'proficient', Investigation: 'proficient' },
      spellcasting: {
        ability: 'int',
        slots: [{ level: 1, total: 2, used: 0 }],
        spells: [
          { name: 'Fire Bolt', level: 0 }, { name: 'Mage Hand', level: 0 },
          { name: 'Magic Missile', level: 1 }, { name: 'Shield', level: 1 },
        ],
      },
    },
    features: {
      1: [
        { name: 'Spellcasting', summary: 'Cast wizard spells from your spellbook, using Intelligence.' },
        { name: 'Arcane Recovery', summary: 'Once a day, after a short rest, get back some spent spell slots.' },
      ],
    },
  },

  Cleric: {
    hitDie: 8,
    saves: ['wis', 'cha'],
    blurb: 'A divine spellcaster. Heals allies and wears medium armor.',
    suggested: { wis: 15, con: 14, str: 13, dex: 12, cha: 10, int: 8 },
    start: {
      armor: { id: 'scale-mail', name: 'Scale mail', armor: { base: 14, maxDex: 2 } },
      weapon: { id: 'mace', name: 'Mace', ability: 'str', dice: '1d6', type: 'bludgeoning' },
      skills: { Insight: 'proficient', Religion: 'proficient' },
      spellcasting: {
        ability: 'wis',
        slots: [{ level: 1, total: 2, used: 0 }],
        spells: [
          { name: 'Sacred Flame', level: 0 }, { name: 'Guidance', level: 0 },
          { name: 'Cure Wounds', level: 1 }, { name: 'Bless', level: 1 },
        ],
      },
    },
    features: {
      1: [
        { name: 'Spellcasting', summary: 'Cast cleric spells using Wisdom. Prepare your spells each day.' },
        { name: 'Divine Domain', summary: 'Choose a domain that grants extra spells and features.' },
      ],
    },
  },
};

WASD.raceData = {
  Human: {
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    blurb: '+1 to every ability score.',
    features: [],
  },
  Elf: {
    bonuses: { dex: 2 },
    speed: 30,
    blurb: '+2 Dexterity. Darkvision, keen senses, hard to charm.',
    skills: { Perception: 'proficient' },
    features: [
      { name: 'Darkvision', summary: 'See in dim light within 60 feet as if it were bright light.' },
      { name: 'Keen Senses', summary: 'Proficient in Perception.' },
      { name: 'Fey Ancestry', summary: 'Advantage on saves against being charmed; magic can’t put you to sleep.' },
      { name: 'Trance', summary: 'Meditate for 4 hours instead of sleeping 8.' },
    ],
  },
  Dwarf: {
    bonuses: { con: 2 },
    speed: 25,
    blurb: '+2 Constitution. Darkvision, tough against poison.',
    features: [
      { name: 'Darkvision', summary: 'See in dim light within 60 feet as if it were bright light.' },
      { name: 'Dwarven Resilience', summary: 'Advantage on saves against poison, and resistance to poison damage.' },
    ],
  },
  Halfling: {
    bonuses: { dex: 2 },
    speed: 25,
    blurb: '+2 Dexterity. Lucky and brave.',
    features: [
      { name: 'Lucky', summary: 'When you roll a 1 on an attack, check or save, reroll it and use the new roll.' },
      { name: 'Brave', summary: 'Advantage on saves against being frightened.' },
      { name: 'Halfling Nimbleness', summary: 'Move through the space of any creature larger than you.' },
    ],
  },
};

/** Standard array for the guided build. Each number is used once. */
WASD.STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
