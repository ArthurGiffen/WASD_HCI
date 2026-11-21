// Runs before the app (see tests/run.sh). Plants saved data for the saved-data suite.
// Runs BEFORE the app scripts. ?old=1 plants a character saved by an older version of the app
// (the first data-model draft: armor under combat, equipment as plain strings, damageDice strings).
if (location.search.includes('old=1')) {
  localStorage.setItem('wasd.character.v1', JSON.stringify({
    identity: { name: 'Kira', race: 'Human', className: 'Rogue', subclass: 'Thief', level: 4, background: 'Criminal', alignment: 'Chaotic Good', experience: 2700 },
    abilityScores: { str: 10, dex: 16, con: 14, int: 12, wis: 12, cha: 14 },
    proficiencies: { saves: ['dex', 'int'], skills: { Stealth: 'expertise' } },
    combat: {
      armor: { name: 'Studded leather', base: 12, maxDex: null }, shield: false,
      hp: { current: 20, max: 31, temp: 0 }, hitDie: 8, speed: 30,
      attacks: [{ name: 'Shortsword', ability: 'finesse', damageDice: '1d6', damageType: 'piercing' }],
    },
    spellcasting: null,
    equipment: { armor: 'Studded leather', weapons: ['Shortsword'], items: ['Crowbar'], coins: { cp: 0, sp: 0, gp: 5, pp: 0 } },
    features: [], traits: { personality: '', ideal: '', bond: '', flaw: '' }, backstory: '',
  }));
} else if (location.search.includes('badjson=1')) {
  localStorage.setItem('wasd.character.v1', '{not json');
  localStorage.setItem('wasd.settings.v1', '{"theme":"neon"}');
  localStorage.setItem('wasd.cardOrder.v1', '["combat","combat"]');
} else {
  localStorage.clear();
}
