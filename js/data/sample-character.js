/*
 * sample-character.js: the example character "Kira" (Human Rogue 4, Thief).
 *
 * RAW INPUTS ONLY. Modifiers, saves, skill bonuses, AC, to-hit, proficiency
 * bonus, passive Perception and spell DC are calculated by js/rules.js.
 * This is the starting character (and what "Reset demo" restores); the
 * player's edited copy is saved to localStorage by js/character-store.js.
 */
WASD.sampleCharacter = {
  schema: 2, // saved-data version, see js/character-store.js

  identity: {
    name: 'Kira',
    race: 'Human',
    className: 'Rogue',
    subclass: 'Thief',
    level: 4,
    background: 'Criminal',
    alignment: 'Chaotic Good',
    experience: 2700,
  },

  abilityScores: { str: 10, dex: 16, con: 14, int: 12, wis: 12, cha: 14 },

  proficiencies: {
    saves: ['dex', 'int'],
    // 'proficient' or 'expertise'. Skills not listed are untrained.
    skills: {
      Acrobatics: 'proficient',
      Deception: 'proficient',
      Investigation: 'proficient',
      Perception: 'proficient',
      'Sleight of Hand': 'expertise',
      Stealth: 'expertise',
    },
  },

  combat: {
    hp: { current: 27, max: 31, temp: 0 },
    hitDie: 8,
    speed: 30,
    // ability: 'str' | 'dex' | 'finesse' (better of Str/Dex)
    // damage is a LIST of parts so each damage type is rolled and shown separately.
    // itemId: the attack only shows while that equipment item is equipped.
    attacks: [
      { id: 'shortsword', itemId: 'shortsword', name: 'Shortsword', ability: 'finesse', damage: [{ dice: '1d6', type: 'piercing' }] },
      { id: 'shortbow', itemId: 'shortbow', name: 'Shortbow', ability: 'dex', damage: [{ dice: '1d6', type: 'piercing' }], range: '80/320 ft' },
      { id: 'sneak', name: 'Sneak Attack', special: 'sneakAttack', note: 'once per turn' },
    ],
  },

  // Rogue (Thief) has no spells. A caster would look like:
  // { ability: 'int', slots: [{ level: 1, total: 3, used: 0 }],
  //   spells: [{ name: 'Magic Missile', level: 1, prepared: true }] }
  spellcasting: null,

  equipment: {
    // kind: 'armor' | 'weapon' | 'gear' | 'accessory'. Only armor, weapons and accessories can be equipped.
    // modifiers apply ONLY while the item is equipped.
    // stat: toHit, damage, ac, speed, str, dex, con, int, wis, cha
    items: [
      { id: 'studded', name: 'Studded leather', kind: 'armor', qty: 1, equipped: true, armor: { base: 12, maxDex: null }, modifiers: [] },
      { id: 'shortsword', name: 'Shortsword', kind: 'weapon', qty: 1, equipped: true, modifiers: [] },
      { id: 'shortbow', name: 'Shortbow', kind: 'weapon', qty: 1, equipped: true, modifiers: [] },
      // DEMO ITEM (not in Kira's original gear): gives the Modifiers tab something to show. Delete if not wanted.
      { id: 'ring', name: 'Ring of Protection', kind: 'accessory', qty: 1, equipped: false, modifiers: [{ stat: 'ac', value: 1 }] },
      { id: 'arrows', name: 'Arrows', kind: 'gear', qty: 20, consumable: true },
      { id: 'thieves-tools', name: "Thieves' tools", kind: 'gear', qty: 1 },
      { id: 'burglars-pack', name: "Burglar's pack", kind: 'gear', qty: 1 },
      { id: 'crowbar', name: 'Crowbar', kind: 'gear', qty: 1 },
      { id: 'clothes', name: 'Dark common clothes with hood', kind: 'gear', qty: 1 },
    ],
    coins: { cp: 0, sp: 8, gp: 15, pp: 0 },
  },

  features: [
    { name: 'Expertise',         source: 'Rogue 1', summary: 'Double proficiency bonus on Stealth and Sleight of Hand.' },
    { name: 'Sneak Attack',      source: 'Rogue 1', summary: 'Extra damage once per turn with advantage or an ally next to the target.' },
    { name: "Thieves' Cant",     source: 'Rogue 1', summary: 'Secret slang and signs shared by rogues.' },
    { name: 'Cunning Action',    source: 'Rogue 2', summary: 'Dash, Disengage, or Hide as a bonus action.' },
    { name: 'Fast Hands',        source: 'Thief 3', summary: 'Use an object or thieves’ tools as a bonus action.' },
    { name: 'Second-Story Work', source: 'Thief 3', summary: 'Climb at full speed; longer running jumps.' },
  ],

  // Feats taken at level 4 or from race. None are recorded for Kira.
  feats: [],

  traits: {
    personality: 'Always has an exit plan.',
    ideal: 'Freedom: chains are meant to be broken.',
    bond: 'Owes her life to the harbor crew that raised her.',
    flaw: 'Can’t resist a locked box.',
  },

  backstory: 'Grew up running messages for a harbor smuggling ring and left after a job went wrong.',
};
