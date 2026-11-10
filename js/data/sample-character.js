/*
 * sample-character.js: ONE hardcoded example character for building and testing.
 * OWNER: Person C
 *
 * All data lives here, never inside the card files.
 *
 * Values like modifiers and skill bonuses are stored ALREADY CALCULATED because
 * there is no game-logic code yet.
 * TODO(Person C): once we add rules code, keep only the raw inputs here
 * (scores, proficiencies, level) and calculate the rest.
 */
WASD.sampleCharacter = {
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

  proficiencyBonus: 2,

  combat: {
    armorClass: 15,
    hp: { current: 27, max: 31, temp: 0 },
    initiative: 3,
    speed: 30,
    hitDice: '4d8',
    attacks: [
      { name: 'Shortsword', toHit: 5, damage: '1d6+3 piercing' },
      { name: 'Shortbow', toHit: 5, damage: '1d6+3 piercing', range: '80/320 ft' },
      { name: 'Sneak Attack', toHit: null, damage: '+2d6', note: 'once per turn' },
    ],
  },

  abilities: [
    { key: 'str', name: 'Strength',     score: 10, mod: 0, save: 0, saveProficient: false },
    { key: 'dex', name: 'Dexterity',    score: 16, mod: 3, save: 5, saveProficient: true },
    { key: 'con', name: 'Constitution', score: 14, mod: 2, save: 2, saveProficient: false },
    { key: 'int', name: 'Intelligence', score: 12, mod: 1, save: 3, saveProficient: true },
    { key: 'wis', name: 'Wisdom',       score: 12, mod: 1, save: 1, saveProficient: false },
    { key: 'cha', name: 'Charisma',     score: 14, mod: 2, save: 2, saveProficient: false },
  ],

  // proficiency: 'none' | 'proficient' | 'expertise'
  skills: [
    { name: 'Acrobatics',      ability: 'dex', bonus: 5, proficiency: 'proficient' },
    { name: 'Animal Handling', ability: 'wis', bonus: 1, proficiency: 'none' },
    { name: 'Arcana',          ability: 'int', bonus: 1, proficiency: 'none' },
    { name: 'Athletics',       ability: 'str', bonus: 0, proficiency: 'none' },
    { name: 'Deception',       ability: 'cha', bonus: 4, proficiency: 'proficient' },
    { name: 'History',         ability: 'int', bonus: 1, proficiency: 'none' },
    { name: 'Insight',         ability: 'wis', bonus: 1, proficiency: 'none' },
    { name: 'Intimidation',    ability: 'cha', bonus: 2, proficiency: 'none' },
    { name: 'Investigation',   ability: 'int', bonus: 3, proficiency: 'proficient' },
    { name: 'Medicine',        ability: 'wis', bonus: 1, proficiency: 'none' },
    { name: 'Nature',          ability: 'int', bonus: 1, proficiency: 'none' },
    { name: 'Perception',      ability: 'wis', bonus: 3, proficiency: 'proficient' },
    { name: 'Performance',     ability: 'cha', bonus: 2, proficiency: 'none' },
    { name: 'Persuasion',      ability: 'cha', bonus: 2, proficiency: 'none' },
    { name: 'Religion',        ability: 'int', bonus: 1, proficiency: 'none' },
    { name: 'Sleight of Hand', ability: 'dex', bonus: 7, proficiency: 'expertise' },
    { name: 'Stealth',         ability: 'dex', bonus: 7, proficiency: 'expertise' },
    { name: 'Survival',        ability: 'wis', bonus: 1, proficiency: 'none' },
  ],
  passivePerception: 13,

  // Rogue (Thief) has no spells. A caster would look something like:
  // { ability: 'Intelligence', saveDC: 13, attackBonus: 5,
  //   slots: [{ level: 1, total: 3, used: 0 }], spells: [{ name, level, prepared }] }
  spellcasting: null,

  equipment: {
    armor: 'Studded leather',
    weapons: ['Shortsword', 'Shortbow'],
    items: ['20 arrows', "Thieves' tools", "Burglar's pack", 'Crowbar', 'Dark common clothes with hood'],
    coins: { cp: 0, sp: 8, gp: 15, pp: 0 },
  },

  features: [
    { name: 'Expertise',         source: 'Rogue 1', summary: 'Double proficiency bonus on Stealth and Sleight of Hand.' },
    { name: 'Sneak Attack',      source: 'Rogue 1', summary: 'Extra 2d6 damage once per turn with advantage or an ally next to the target.' },
    { name: "Thieves' Cant",     source: 'Rogue 1', summary: 'Secret slang and signs shared by rogues.' },
    { name: 'Cunning Action',    source: 'Rogue 2', summary: 'Dash, Disengage, or Hide as a bonus action.' },
    { name: 'Fast Hands',        source: 'Thief 3', summary: 'Use an object or thieves’ tools as a bonus action.' },
    { name: 'Second-Story Work', source: 'Thief 3', summary: 'Climb at full speed; longer running jumps.' },
  ],

  traits: {
    personality: 'Always has an exit plan.',
    ideal: 'Freedom: chains are meant to be broken.',
    bond: 'Owes her life to the harbor crew that raised her.',
    flaw: 'Can’t resist a locked box.',
  },

  backstory: 'Grew up running messages for a harbor smuggling ring and left after a job went wrong.',
};
