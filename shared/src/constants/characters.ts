import type { Character } from '../types/game.js';

export const CHARACTERS: Character[] = [
  {
    id: 'byte',
    name: 'BYTE',
    title: 'Cyber Shinobi',
    weapon: 'Energy Staff',
    weaponType: 'staff',
    tagline: 'Speed is my strength.',
    themeColor: '#00e5ff',
    accentGlow: 'rgba(0, 229, 255, 0.6)',
    secondaryColor: '#0084ff',
    avatarUrl: '/assets/char_byte.jpg',
    stats: {
      speed: 95,
      power: 70,
      agility: 90
    },
    attackDescription: 'Spins a rapid energy staff releasing pulsing cyan shockwaves.',
    finisherName: 'CYBER OVERDRIVE: ZERO PURGE',
    finisherQuote: 'System neutralized. 0.001 seconds was all the opening I needed.',
    defeatQuote: 'System overload... core temperature critical...',
    uniqueMoveName: 'Cyber Shock Palm',
    uniqueMoveDesc: 'Lightning-infused palm thrust and high-speed energy staff vault strike.'
  },
  {
    id: 'glitch',
    name: 'GLITCH',
    title: 'Crimson Phantom',
    weapon: 'Dual Blades',
    weaponType: 'dual_blades',
    tagline: 'No one types faster than me.',
    themeColor: '#ff2a5f',
    accentGlow: 'rgba(255, 42, 95, 0.6)',
    secondaryColor: '#ff6b4a',
    avatarUrl: '/assets/char_glitch.jpg',
    stats: {
      speed: 92,
      power: 88,
      agility: 96
    },
    attackDescription: 'Executes lightning-fast dual blade cross-slashes leaving fiery red trails.',
    finisherName: 'PHANTOM DELIRIUM: DUAL CROSS',
    finisherQuote: "Too slow. You couldn't even read my shadow, let alone my keystrokes.",
    defeatQuote: 'Corrupted frame... cannot sync inputs...',
    uniqueMoveName: 'Phantom Cross-Blink',
    uniqueMoveDesc: 'Instant shadow dash followed by a lethal dual-blade cross slash.'
  },
  {
    id: 'zenko',
    name: 'ZENKO',
    title: 'Spirit Monk',
    weapon: 'Spirit Hammer',
    weaponType: 'hammer',
    tagline: 'Slow hands. Fast mind.',
    themeColor: '#ffb703',
    accentGlow: 'rgba(255, 183, 3, 0.6)',
    secondaryColor: '#fb8500',
    avatarUrl: '/assets/char_zenko.jpg',
    stats: {
      speed: 68,
      power: 100,
      agility: 70
    },
    attackDescription: 'Brings down a thunderous spirit war hammer creating golden shock tremors.',
    finisherName: 'SEISMIC JUDGMENT: TITAN HEAVEN-BREAK',
    finisherQuote: 'Patience and discipline crush haste every time. Meditate on your defeat.',
    defeatQuote: 'The mountain trembles... but my spirit stands firm.',
    uniqueMoveName: 'Titan Earth-Breaker',
    uniqueMoveDesc: 'Leaps high and brings down a colossal hammer strike creating a shockwave fissure.'
  },
  {
    id: 'nova',
    name: 'NOVA',
    title: 'Shadow Kitsune',
    weapon: 'Chain Sickle',
    weaponType: 'chain_sickle',
    tagline: 'Every keystroke counts.',
    themeColor: '#bf5af2',
    accentGlow: 'rgba(191, 90, 242, 0.6)',
    secondaryColor: '#9d4edd',
    avatarUrl: '/assets/char_nova.jpg',
    stats: {
      speed: 90,
      power: 80,
      agility: 94
    },
    attackDescription: 'Hurls a spiraling purple chain sickle that rips through shadow barriers.',
    finisherName: 'KITSUNE CURSE: CELESTIAL BIND',
    finisherQuote: 'Dance in the purple mist. Every thread of fate was tied to your loss.',
    defeatQuote: 'The illusions fade... well played, warrior.',
    uniqueMoveName: 'Kitsune Phantom Spiral',
    uniqueMoveDesc: 'Acrobatic backflip roundhouse kick followed by an ethereal chain sickle sweep.'
  },
  {
    id: 'zephyr',
    name: 'ZEPHYR',
    title: 'Jade Vanguard',
    weapon: 'Wind Spear',
    weaponType: 'spear',
    tagline: 'Flow. Type. Strike.',
    themeColor: '#00f59b',
    accentGlow: 'rgba(0, 245, 155, 0.6)',
    secondaryColor: '#05c46b',
    avatarUrl: '/assets/char_zephyr.jpg',
    stats: {
      speed: 88,
      power: 82,
      agility: 92
    },
    attackDescription: 'Thrusts a jade energy spear wrapped in turbulent wind vortices.',
    finisherName: 'TEMPEST DRAGON: PIERCING GALE',
    finisherQuote: 'The jade wind sweeps away all resistance. Smooth like a breeze, sharp like a spear.',
    defeatQuote: 'The wind scatters... you caught the current.',
    uniqueMoveName: 'Gale Piercer Rush',
    uniqueMoveDesc: 'Supersonic forward spear lunge and spinning hurricane dropkick.'
  },
  {
    id: 'raven',
    name: 'RAVEN',
    title: 'Soul Reaper',
    weapon: 'Soul Scythe',
    weaponType: 'scythe',
    tagline: 'One word. One hit.',
    themeColor: '#7c5cff',
    accentGlow: 'rgba(124, 92, 255, 0.6)',
    secondaryColor: '#3d34a5',
    avatarUrl: '/assets/char_raven.jpg',
    stats: {
      speed: 84,
      power: 96,
      agility: 80
    },
    attackDescription: 'Swings an enormous obsidian scythe reaping opponent life-force in indigo flame.',
    finisherName: 'ECLIPSE HARVEST: SOUL CONDEMNATION',
    finisherQuote: 'The scythe falls without mercy. Your spirit belongs to the shadows now.',
    defeatQuote: 'The darkness recedes... for now.',
    uniqueMoveName: 'Soul Cleave Execution',
    uniqueMoveDesc: 'Feathered shadow wing swoop with a sweeping crescent scythe uppercut.'
  }
];

export const getCharacterById = (id: string): Character => {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
};
