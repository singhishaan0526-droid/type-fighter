export interface SentenceItem {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'classic' | 'combat' | 'cyber';
}

export const BATTLE_SENTENCES: SentenceItem[] = [
  {
    id: 's1',
    text: 'The quick brown fox jumps over the lazy dog.',
    difficulty: 'easy',
    category: 'classic'
  },
  {
    id: 's2',
    text: 'Shadows dance beneath the neon moon as sharp steel slices the silence.',
    difficulty: 'medium',
    category: 'combat'
  },
  {
    id: 's3',
    text: 'A swift keystroke strikes true before the rival blade can even draw breath.',
    difficulty: 'medium',
    category: 'combat'
  },
  {
    id: 's4',
    text: 'Master your rhythm, breathe through the storm, and unleash the fatal combination.',
    difficulty: 'medium',
    category: 'combat'
  },
  {
    id: 's5',
    text: 'Speed is mere illusion without flawless precision and unyielding focus.',
    difficulty: 'easy',
    category: 'combat'
  },
  {
    id: 's6',
    text: 'The cybernetic staff spins at sonic velocity, shattering digital barriers into dust.',
    difficulty: 'hard',
    category: 'cyber'
  },
  {
    id: 's7',
    text: 'Twin blades ignite in crimson embers, cutting through the darkness with ruthless intent.',
    difficulty: 'medium',
    category: 'combat'
  },
  {
    id: 's8',
    text: 'Heavy spirit hammers shatter mountain stone, reverberating ancient thunder through the realm.',
    difficulty: 'hard',
    category: 'combat'
  },
  {
    id: 's9',
    text: 'The chain sickle wraps silently around the wind, striking before the phantom bell tolls.',
    difficulty: 'hard',
    category: 'combat'
  },
  {
    id: 's10',
    text: 'One single whisper in the dark can break a legion when typed without hesitation.',
    difficulty: 'easy',
    category: 'combat'
  },
  {
    id: 's11',
    text: 'Soul scythes harvest every faltering breath from warriors who stumble on their words.',
    difficulty: 'medium',
    category: 'combat'
  },
  {
    id: 's12',
    text: 'Lightning courses through the fingertips of the ultimate typing shinobi.',
    difficulty: 'easy',
    category: 'cyber'
  }
];

export const getRandomSentence = (excludeText?: string): string => {
  const pool = excludeText ? BATTLE_SENTENCES.filter((s) => s.text !== excludeText) : BATTLE_SENTENCES;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked ? picked.text : BATTLE_SENTENCES[0].text;
};
