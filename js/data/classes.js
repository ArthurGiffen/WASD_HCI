/*
 * classes.js: class and race data for Level Up and the guided first-time build.
 * D&D 5e, 2014 rules, checked against the System Reference Document 5.1
 * (SRD 5.1). Summaries are short paraphrases written for this prototype,
 * not rulebook text.
 *
 * Only what the demo needs is here:
 *   - Rogue: level 1 and level 5 features (Kira levels 4 -> 5).
 *   - Fighter, Rogue, Wizard, Cleric: level 1 starting setup for the guided build.
 *   - Every SRD race: Human, Elf, Dwarf, Halfling, Dragonborn, Gnome,
 *     Half-Elf, Half-Orc, Tiefling. Race and subrace are separate; the SRD
 *     has one subrace for Elf, Dwarf, Gnome and Halfling (see RACES below).
 *   - Cleric: the Life Domain, the only Divine Domain in the SRD.
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
        { name: 'Second Wind', summary: 'Use a bonus action to regain 1d10 + fighter level HP. Then you need a short or long rest to use it again.' },
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
        { name: 'Sneak Attack', summary: 'Once per turn, extra damage when you hit with a finesse or ranged weapon and have advantage, or an ally is next to the target and you don’t have disadvantage.' },
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
          { name: 'Fire Bolt', level: 0 }, { name: 'Mage Hand', level: 0 }, { name: 'Minor Illusion', level: 0 },
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
    blurb: 'A divine spellcaster. Heals allies and wears armor. Life Domain.',
    subclass: 'Life Domain', // chosen at 1st level in 2014 rules; the only domain in the SRD
    suggested: { wis: 15, con: 14, str: 13, dex: 12, cha: 10, int: 8 },
    start: {
      armor: { id: 'scale-mail', name: 'Scale mail', armor: { base: 14, maxDex: 2 } },
      weapon: { id: 'mace', name: 'Mace', ability: 'str', dice: '1d6', type: 'bludgeoning' },
      skills: { Insight: 'proficient', Religion: 'proficient' },
      spellcasting: {
        ability: 'wis',
        slots: [{ level: 1, total: 2, used: 0 }],
        spells: [
          { name: 'Sacred Flame', level: 0 }, { name: 'Guidance', level: 0 }, { name: 'Spare the Dying', level: 0 },
          { name: 'Cure Wounds', level: 1 }, { name: 'Bless', level: 1 },
        ],
      },
    },
    features: {
      1: [
        { name: 'Spellcasting', summary: 'Cast cleric spells using Wisdom. Prepare your spells each day.' },
        { name: 'Divine Domain: Life', summary: 'Your domain. Bless and Cure Wounds are always prepared and don’t count against your prepared spells.' },
        { name: 'Bonus Proficiency', summary: 'Life Domain: proficiency with heavy armor.' },
        { name: 'Disciple of Life', summary: 'Life Domain: when a spell of 1st level or higher restores hit points, the creature regains an extra 2 + the spell’s level.' },
      ],
    },
  },
};

/*
 * RACES: every race in the SRD 5.1, 2014 rules. Race and subrace are kept
 * apart: `subraces` lists the subraces a race has (the SRD has one each for
 * Dwarf, Elf, Gnome and Halfling; the others have none).
 * Some races ask for a choice in the guided build:
 *   ancestry      Dragonborn: the dragon type sets the breath weapon and resistance
 *   abilityPicks  Half-Elf: +1 to two abilities other than Charisma
 *   skillPicks    Half-Elf: proficiency in two skills
 */
const DARKVISION = { name: 'Darkvision', summary: 'See in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light (no colors).' };

WASD.raceData = {
  Human: {
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    blurb: '+1 to every ability score.',
    features: [],
    subraces: [],
  },
  Elf: {
    bonuses: { dex: 2 },
    speed: 30,
    blurb: '+2 Dexterity. Darkvision, keen senses, hard to charm.',
    skills: { Perception: 'proficient' },
    features: [
      DARKVISION,
      { name: 'Keen Senses', summary: 'Proficient in Perception.' },
      { name: 'Fey Ancestry', summary: 'Advantage on saves against being charmed; magic can’t put you to sleep.' },
      { name: 'Trance', summary: 'Meditate for 4 hours instead of sleeping 8.' },
    ],
    subraces: [{
      name: 'High Elf',
      bonuses: { int: 1 },
      blurb: '+1 Intelligence, elf weapon training, one wizard cantrip.',
      features: [
        { name: 'Elf Weapon Training', summary: 'Proficient with the longsword, shortsword, shortbow and longbow.' },
        { name: 'Cantrip', summary: 'You know one wizard cantrip of your choice, cast with Intelligence. This prototype doesn’t pick it for you.' },
      ],
    }],
  },
  Dwarf: {
    bonuses: { con: 2 },
    speed: 25,
    blurb: '+2 Constitution. Darkvision, tough against poison. Heavy armor doesn’t slow you.',
    features: [
      DARKVISION,
      { name: 'Dwarven Resilience', summary: 'Advantage on saves against poison, and resistance to poison damage.' },
      { name: 'Dwarven Combat Training', summary: 'Proficient with the battleaxe, handaxe, light hammer and warhammer.' },
      { name: 'Tool Proficiency', summary: 'Proficient with one set of artisan’s tools of your choice: smith’s tools, brewer’s supplies or mason’s tools.' },
      { name: 'Stonecunning', summary: 'On History checks about where stonework came from, you count as proficient and add double your proficiency bonus.' },
    ],
    subraces: [{
      name: 'Hill Dwarf',
      bonuses: { wis: 1 },
      hpPerLevel: 1, // Dwarven Toughness
      blurb: '+1 Wisdom, +1 hit point per level.',
      features: [
        { name: 'Dwarven Toughness', summary: 'Your hit point maximum goes up by 1, and by 1 more every time you gain a level.' },
      ],
    }],
  },
  Halfling: {
    bonuses: { dex: 2 },
    speed: 25,
    blurb: '+2 Dexterity. Small, lucky and brave.',
    features: [
      { name: 'Lucky', summary: 'When you roll a 1 on an attack, check or save, reroll it and use the new roll.' },
      { name: 'Brave', summary: 'Advantage on saves against being frightened.' },
      { name: 'Halfling Nimbleness', summary: 'Move through the space of any creature larger than you.' },
    ],
    subraces: [{
      name: 'Lightfoot Halfling',
      bonuses: { cha: 1 },
      blurb: '+1 Charisma, can hide behind larger creatures.',
      features: [
        { name: 'Naturally Stealthy', summary: 'You can try to hide even when only a creature at least one size larger than you is in the way.' },
      ],
    }],
  },
  Dragonborn: {
    bonuses: { str: 2, cha: 1 },
    speed: 30,
    blurb: '+2 Strength, +1 Charisma. Breath weapon and a damage resistance from your dragon ancestry.',
    features: [], // Draconic Ancestry, Breath Weapon and Damage Resistance depend on the ancestry (see raceInfo)
    subraces: [],
    ancestry: [
      { id: 'black', name: 'Black', type: 'acid', area: '5 by 30 ft. line', save: 'dex' },
      { id: 'blue', name: 'Blue', type: 'lightning', area: '5 by 30 ft. line', save: 'dex' },
      { id: 'brass', name: 'Brass', type: 'fire', area: '5 by 30 ft. line', save: 'dex' },
      { id: 'bronze', name: 'Bronze', type: 'lightning', area: '5 by 30 ft. line', save: 'dex' },
      { id: 'copper', name: 'Copper', type: 'acid', area: '5 by 30 ft. line', save: 'dex' },
      { id: 'gold', name: 'Gold', type: 'fire', area: '15 ft. cone', save: 'dex' },
      { id: 'green', name: 'Green', type: 'poison', area: '15 ft. cone', save: 'con' },
      { id: 'red', name: 'Red', type: 'fire', area: '15 ft. cone', save: 'dex' },
      { id: 'silver', name: 'Silver', type: 'cold', area: '15 ft. cone', save: 'con' },
      { id: 'white', name: 'White', type: 'cold', area: '15 ft. cone', save: 'con' },
    ],
  },
  Gnome: {
    bonuses: { int: 2 },
    speed: 25,
    blurb: '+2 Intelligence. Small, darkvision, hard to affect with magic.',
    features: [
      DARKVISION,
      { name: 'Gnome Cunning', summary: 'Advantage on Intelligence, Wisdom and Charisma saves against magic.' },
    ],
    subraces: [{
      name: 'Rock Gnome',
      bonuses: { con: 1 },
      blurb: '+1 Constitution, knows magic items and builds tiny clockwork devices.',
      features: [
        { name: 'Artificer’s Lore', summary: 'On History checks about magic items, alchemical objects or technological devices, add twice your proficiency bonus.' },
        { name: 'Tinker', summary: 'Proficient with tinker’s tools. With 1 hour and 10 gp of materials, build a Tiny clockwork device (toy, fire starter or music box) that lasts 24 hours; up to three at a time.' },
      ],
    }],
  },
  'Half-Elf': {
    bonuses: { cha: 2 },
    speed: 30,
    blurb: '+2 Charisma and +1 to two other abilities you choose. Darkvision, hard to charm, two extra skills.',
    features: [
      DARKVISION,
      { name: 'Fey Ancestry', summary: 'Advantage on saves against being charmed; magic can’t put you to sleep.' },
      { name: 'Skill Versatility', summary: 'Proficiency in two skills of your choice.' },
    ],
    subraces: [],
    abilityPicks: { count: 2, value: 1, exclude: ['cha'] },
    skillPicks: 2,
  },
  'Half-Orc': {
    bonuses: { str: 2, con: 1 },
    speed: 30,
    blurb: '+2 Strength, +1 Constitution. Darkvision, menacing, hard to bring down.',
    skills: { Intimidation: 'proficient' },
    features: [
      DARKVISION,
      { name: 'Menacing', summary: 'Proficient in Intimidation.' },
      { name: 'Relentless Endurance', summary: 'When you drop to 0 hit points but aren’t killed outright, you can drop to 1 instead. Once per long rest.' },
      { name: 'Savage Attacks', summary: 'On a critical hit with a melee weapon, roll one of the weapon’s damage dice one more time and add it.' },
    ],
    subraces: [],
  },
  Tiefling: {
    bonuses: { int: 1, cha: 2 },
    speed: 30,
    blurb: '+2 Charisma, +1 Intelligence. Darkvision, fire resistance, infernal magic.',
    features: [
      DARKVISION,
      { name: 'Hellish Resistance', summary: 'Resistance to fire damage.' },
      { name: 'Infernal Legacy', summary: 'You know the thaumaturgy cantrip. At 3rd level, cast hellish rebuke as a 2nd-level spell once per long rest; at 5th level, darkness once per long rest. Charisma is the spellcasting ability.' },
    ],
    subraces: [],
  },
};

/**
 * Old saves stored the subrace as the race ("High Elf"). Split it back into
 * { race: 'Elf', subrace: 'High Elf' }. A plain race comes back unchanged.
 */
WASD.splitRace = function (race, subrace) {
  if (WASD.raceData[race]) return { race, subrace: subrace || '' };
  const key = Object.keys(WASD.raceData).find((k) => WASD.raceData[k].subraces.some((s) => s.name === race));
  return key ? { race: key, subrace: race } : { race, subrace: subrace || '' };
};

/**
 * A race as the sheet uses it, with the chosen subrace and choices folded in.
 *   WASD.raceInfo('Elf', { subrace: 'High Elf' })
 *   WASD.raceInfo('Dragonborn', { ancestry: 'red' })
 *   WASD.raceInfo('Half-Elf', { abilityPicks: ['dex', 'con'], skillPicks: ['Stealth', 'Insight'] })
 * -> { race, subrace, label, bonuses, bonusParts, speed, skills, hpPerLevel, blurb,
 *      features: [{ name, summary, source }], breath: null | { type, area, save } }
 * Accepts an old-style subrace name too ('High Elf'). Returns null for an unknown race.
 * A race with subraces gets its first (in the SRD, only) subrace when none is given.
 */
WASD.raceInfo = function (name, opts) {
  const o = opts || {};
  const split = WASD.splitRace(name, o.subrace);
  const r = WASD.raceData[split.race];
  if (!r) return null;
  const sub = r.subraces.find((s) => s.name === split.subrace) || r.subraces[0] || null;

  const bonuses = {};
  const bonusParts = {};
  const addBonus = (from, key, value) => {
    bonuses[key] = (bonuses[key] || 0) + value;
    (bonusParts[key] = bonusParts[key] || []).push({ from, value });
  };
  Object.keys(r.bonuses).forEach((k) => addBonus(split.race, k, r.bonuses[k]));
  if (sub) Object.keys(sub.bonuses).forEach((k) => addBonus(sub.name, k, sub.bonuses[k]));
  if (r.abilityPicks) (o.abilityPicks || []).filter(Boolean).forEach((k) => addBonus(split.race, k, r.abilityPicks.value));

  const skills = { ...(r.skills || {}) };
  if (r.skillPicks) (o.skillPicks || []).filter(Boolean).forEach((s) => { skills[s] = 'proficient'; });

  const features = r.features.map((x) => ({ ...x, source: split.race }));
  let breath = null;
  if (r.ancestry) {
    const a = r.ancestry.find((x) => x.id === o.ancestry);
    if (a) {
      breath = { type: a.type, area: a.area, save: a.save };
      const saveName = a.save === 'dex' ? 'Dexterity' : 'Constitution';
      features.push(
        { name: 'Draconic Ancestry', summary: `${a.name} dragon: ${a.type} damage.`, source: split.race },
        { name: 'Breath Weapon', summary: `Action: exhale ${a.type} in a ${a.area}. Each creature in it makes a ${saveName} save (DC 8 + Constitution modifier + proficiency bonus): 2d6 damage, half on a success. 3d6 at 6th level, 4d6 at 11th, 5d6 at 16th. Once per short or long rest.`, source: split.race },
        { name: 'Damage Resistance', summary: `Resistance to ${a.type} damage.`, source: split.race },
      );
    }
  }
  if (sub) features.push(...sub.features.map((x) => ({ ...x, source: sub.name })));

  return {
    race: split.race,
    subrace: sub ? sub.name : '',
    label: sub ? sub.name : split.race,
    bonuses,
    bonusParts,
    speed: r.speed,
    skills,
    hpPerLevel: (sub && sub.hpPerLevel) || 0,
    blurb: r.blurb,
    features,
    breath,
  };
};

/** Standard array for the guided build. Each number is used once. */
WASD.STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
