/*
 * rules.js: D&D 5e calculations. Pure functions, no DOM.
 *
 * The saved character (js/data/sample-character.js, or the player's own in
 * localStorage) holds only RAW INPUTS: scores, proficiencies, level, gear.
 * WASD.rules.derive(raw) turns that into the full "sheet" object the cards
 * read (modifiers, saves, skill bonuses, AC, to-hit...). Cards never do math.
 *
 * Change a raw value (e.g. level 4 -> 5, or unequip an item) and every
 * derived number follows.
 */
(function (WASD) {
  'use strict';

  const ABILITIES = [
    { key: 'str', name: 'Strength' },
    { key: 'dex', name: 'Dexterity' },
    { key: 'con', name: 'Constitution' },
    { key: 'int', name: 'Intelligence' },
    { key: 'wis', name: 'Wisdom' },
    { key: 'cha', name: 'Charisma' },
  ];

  const SKILLS = [
    ['Acrobatics', 'dex'], ['Animal Handling', 'wis'], ['Arcana', 'int'],
    ['Athletics', 'str'], ['Deception', 'cha'], ['History', 'int'],
    ['Insight', 'wis'], ['Intimidation', 'cha'], ['Investigation', 'int'],
    ['Medicine', 'wis'], ['Nature', 'int'], ['Perception', 'wis'],
    ['Performance', 'cha'], ['Persuasion', 'cha'], ['Religion', 'int'],
    ['Sleight of Hand', 'dex'], ['Stealth', 'dex'], ['Survival', 'wis'],
  ].map(([name, ability]) => ({ name, ability }));

  /** Proficiency multiplier per level of skill training. */
  const PROF_MULT = { none: 0, proficient: 1, expertise: 2 };

  /** Display names for item modifier stats. */
  const STAT_LABELS = {
    toHit: 'to hit', damage: 'damage', ac: 'AC', speed: 'Speed', save: 'saving throws',
    str: 'Strength', dex: 'Dexterity', con: 'Constitution',
    int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
  };

  const abilityMod = (score) => Math.floor((score - 10) / 2);
  const proficiencyBonus = (level) => Math.ceil(level / 4) + 1;
  const abilityName = (key) => (ABILITIES.find((a) => a.key === key) || {}).name || key;

  /** "1d6" + 3 -> "1d6+3"; "1d6" + 0 -> "1d6"; "1d6" + -1 -> "1d6-1" */
  const withMod = (dice, mod) => (mod === 0 ? dice : `${dice}${WASD.signed(mod)}`);

  /** "+1 to hit", "+5 Speed", "+3 Strength" */
  const formatModifier = (m) => `${WASD.signed(m.value)} ${STAT_LABELS[m.stat] || m.stat}`;

  /** One damage part { dice:'1d6', bonus:3, type:'piercing' } -> "1d6+3 piercing" */
  const formatPart = (p) => `${withMod(p.dice, p.bonus)} ${p.type}`;
  /** All parts: "1d6+3 piercing + 1d6 fire". Damage types stay separate on purpose. */
  const formatDamage = (parts) => parts.map(formatPart).join(' + ');

  /*
   * Conditions (SRD 5.1 appendix PH-A), with short reminders of what they do.
   * Only speed is applied to the numbers automatically (see speedRule below);
   * everything else is a reminder, because it depends on the situation.
   */
  const CONDITIONS = [
    { id: 'blinded', name: 'Blinded', summary: 'Can’t see; fails checks that need sight. Attacks against you have advantage; your attacks have disadvantage.' },
    { id: 'charmed', name: 'Charmed', summary: 'Can’t attack or harm the charmer. The charmer has advantage on social checks with you.' },
    { id: 'deafened', name: 'Deafened', summary: 'Can’t hear; fails checks that need hearing.' },
    { id: 'frightened', name: 'Frightened', summary: 'Disadvantage on checks and attacks while the source is in sight. Can’t willingly move closer to it.' },
    { id: 'grappled', name: 'Grappled', summary: 'Speed 0. Ends if the grappler is incapacitated or you are moved out of reach.' },
    { id: 'incapacitated', name: 'Incapacitated', summary: 'Can’t take actions or reactions.' },
    { id: 'invisible', name: 'Invisible', summary: 'Can’t be seen without magic. Attacks against you have disadvantage; your attacks have advantage.' },
    { id: 'paralyzed', name: 'Paralyzed', summary: 'Incapacitated; can’t move or speak. Fails Str and Dex saves. Attacks against you have advantage; hits from within 5 feet are critical.' },
    { id: 'petrified', name: 'Petrified', summary: 'Turned to stone: incapacitated, can’t move or speak. Fails Str and Dex saves; resistance to all damage.' },
    { id: 'poisoned', name: 'Poisoned', summary: 'Disadvantage on attack rolls and ability checks.' },
    { id: 'prone', name: 'Prone', summary: 'Crawl or stand up. Disadvantage on your attacks. Attacks from within 5 feet have advantage, from farther away disadvantage.' },
    { id: 'restrained', name: 'Restrained', summary: 'Speed 0. Attacks against you have advantage; your attacks have disadvantage. Disadvantage on Dex saves.' },
    { id: 'stunned', name: 'Stunned', summary: 'Incapacitated; can’t move; speaks only falteringly. Fails Str and Dex saves. Attacks against you have advantage.' },
    { id: 'unconscious', name: 'Unconscious', summary: 'Incapacitated, can’t move or speak, drops what it holds and falls prone. Fails Str and Dex saves. Attacks have advantage; hits from within 5 feet are critical.' },
  ];
  /** Exhaustion levels 1 to 6; each level also has the effects of the levels below it. */
  const EXHAUSTION = [
    '',
    'Disadvantage on ability checks',
    'Speed halved',
    'Disadvantage on attack rolls and saving throws',
    'Hit point maximum halved',
    'Speed reduced to 0',
    'Death',
  ];

  /** Speed after conditions and exhaustion: { speed, note }. */
  function speedRule(base, conditions, exhaustion) {
    const zero = conditions.find((c) => c === 'grappled' || c === 'restrained');
    if (zero) return { speed: 0, note: `${CONDITIONS.find((c) => c.id === zero).name}: speed 0` };
    if (exhaustion >= 5) return { speed: 0, note: 'Exhaustion 5: speed 0' };
    if (exhaustion >= 2) return { speed: Math.floor(base / 2), note: `Exhaustion ${exhaustion}: speed halved` };
    return { speed: base, note: '' };
  }

  /** Dragonborn breath weapon dice by level (2d6, 3d6 at 6th, 4d6 at 11th, 5d6 at 16th). */
  const breathDice = (level) => `${level >= 16 ? 5 : level >= 11 ? 4 : level >= 6 ? 3 : 2}d6`;

  function derive(raw) {
    const level = raw.identity.level;
    const pb = proficiencyBonus(level);
    const items = raw.equipment.items;
    const equipped = items.filter((i) => i.equipped);

    // Sum the modifiers of EQUIPPED items only, by stat.
    const bonus = {};
    equipped.forEach((i) => (i.modifiers || []).forEach((m) => {
      bonus[m.stat] = (bonus[m.stat] || 0) + m.value;
    }));
    const b = (stat) => bonus[stat] || 0;

    const scores = {};
    const mods = {};
    ABILITIES.forEach((a) => {
      scores[a.key] = raw.abilityScores[a.key] + b(a.key);
      mods[a.key] = abilityMod(scores[a.key]);
    });

    const saveProfs = raw.proficiencies.saves || [];
    const abilities = ABILITIES.map((a) => {
      const saveProficient = saveProfs.includes(a.key);
      return {
        key: a.key,
        name: a.name,
        score: scores[a.key],
        mod: mods[a.key],
        // 'save' item bonuses (e.g. Ring of Protection) apply to every saving throw.
        save: mods[a.key] + (saveProficient ? pb : 0) + b('save'),
        saveProficient,
      };
    });

    const skillProfs = raw.proficiencies.skills || {};
    const skills = SKILLS.map((s) => {
      const proficiency = skillProfs[s.name] || 'none';
      return { name: s.name, ability: s.ability, proficiency, bonus: mods[s.ability] + pb * PROF_MULT[proficiency] };
    });
    const perception = skills.find((s) => s.name === 'Perception');

    // Armor Class: the equipped armor's base + Dex (capped for medium armor), or 10 + Dex unarmored.
    const armorItem = equipped.find((i) => i.armor);
    let armorClass;
    if (armorItem) {
      const a = armorItem.armor;
      const dex = a.maxDex == null ? mods.dex : Math.min(mods.dex, a.maxDex);
      armorClass = a.base + (a.addDex === false ? 0 : dex);
    } else {
      armorClass = 10 + mods.dex;
    }
    armorClass += b('ac');

    // An attack tied to a weapon item only shows while that item is equipped.
    const attacks = raw.combat.attacks
      .filter((a) => !a.itemId || equipped.some((i) => i.id === a.itemId))
      .map((a) => {
        if (a.special === 'breath') {
          const saveName = a.save === 'con' ? 'Constitution' : 'Dexterity';
          return {
            id: a.id, name: a.name, toHit: null, noCrit: true, range: a.area,
            note: `DC ${8 + mods.con + pb} ${saveName} save, half damage on a success. Once per short or long rest`,
            damage: [{ dice: breathDice(level), bonus: 0, type: a.type }],
          };
        }
        if (a.special === 'sneakAttack') {
          return {
            id: a.id, name: a.name, toHit: null, range: a.range, note: a.note,
            damage: [{ dice: `${Math.ceil(level / 2)}d6`, bonus: 0, type: 'same type as the weapon' }],
          };
        }
        // Finesse weapons use the better of Str and Dex.
        const mod = a.ability === 'finesse' ? Math.max(mods.str, mods.dex) : mods[a.ability];
        return {
          id: a.id,
          name: a.name,
          toHit: mod + (a.proficient === false ? 0 : pb) + b('toHit'),
          // The ability modifier and item damage bonus go on the FIRST part only.
          damage: a.damage.map((p, i) => ({ dice: p.dice, bonus: i === 0 ? mod + b('damage') : 0, type: p.type })),
          range: a.range,
          note: a.note,
        };
      });

    let spellcasting = null;
    if (raw.spellcasting) {
      const sc = raw.spellcasting;
      spellcasting = {
        ability: abilityName(sc.ability),
        saveDC: 8 + pb + mods[sc.ability],
        attackBonus: pb + mods[sc.ability],
        slots: sc.slots || [],
        spells: sc.spells || [],
      };
    }

    // Race and subrace are separate; old saves had the subrace in `race` ("High Elf").
    const split = WASD.splitRace ? WASD.splitRace(raw.identity.race, raw.identity.subrace) : { race: raw.identity.race, subrace: raw.identity.subrace || '' };
    const conditions = (raw.combat.conditions || []).filter((id) => CONDITIONS.some((c) => c.id === id));
    const exhaustion = Math.max(0, Math.min(6, raw.combat.exhaustion || 0));
    const speed = speedRule(raw.combat.speed + b('speed'), conditions, exhaustion);
    const hitDiceUsed = Math.max(0, Math.min(level, raw.combat.hitDiceUsed || 0));
    const ds = raw.combat.deathSaves || {};

    return {
      identity: { ...raw.identity, race: split.race, subrace: split.subrace, raceLabel: split.subrace || split.race },
      proficiencyBonus: pb,
      combat: {
        armorClass,
        armorName: armorItem ? armorItem.name : 'No armor',
        hp: { ...raw.combat.hp },
        initiative: mods.dex,
        speed: speed.speed,
        speedNote: speed.note,
        hitDice: `${level}d${raw.combat.hitDie}`,
        hitDie: raw.combat.hitDie,
        hitDiceLeft: level - hitDiceUsed,
        deathSaves: { successes: ds.successes || 0, failures: ds.failures || 0 },
        conditions,
        exhaustion,
        attacks,
      },
      abilities,
      skills,
      passivePerception: 10 + perception.bonus,
      spellcasting,
      equipment: {
        items,
        coins: raw.equipment.coins,
        bonus, // totals from equipped items, e.g. { ac: 1, speed: 5 }
        weaponNames: equipped.filter((i) => i.kind === 'weapon').map((i) => i.name),
      },
      features: raw.features,
      feats: raw.feats || [],
      traits: raw.traits,
      backstory: raw.backstory,
    };
  }

  WASD.rules = {
    ABILITIES,
    CONDITIONS,
    EXHAUSTION,
    SKILLS,
    STAT_LABELS,
    abilityMod,
    proficiencyBonus,
    abilityName,
    formatModifier,
    formatPart,
    formatDamage,
    derive,
  };
})(window.WASD);
