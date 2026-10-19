import React from 'react';
import type { Character, CombatAnimationState } from '../types/game';

interface ShadowFighterSpriteProps {
  character: Character;
  animation: CombatAnimationState;
  isFacingRight: boolean;
}

export const ShadowFighterSprite: React.FC<ShadowFighterSpriteProps> = ({
  character,
  animation,
  isFacingRight
}) => {
  const { id: charId, themeColor, secondaryColor, weaponType, avatarUrl, name } = character;

  // Render character-specific head, hairstyle, headgear, and mask
  const renderCharacterHead = () => {
    switch (charId) {
      case 'byte':
        return (
          <g className="char-head byte-head">
            {/* Cyber Spiky Hair */}
            <path
              d="M -12,-35 L -16,-52 L -6,-42 L 2,-55 L 8,-42 L 16,-50 L 14,-32 Z"
              fill="#0f172a"
              stroke="#00e5ff"
              strokeWidth="1.2"
            />
            {/* Cyber Headband */}
            <rect x="-13" y="-36" width="26" height="5" rx="1.5" fill="#1e293b" stroke="#00e5ff" strokeWidth="1" />
            {/* Base Head */}
            <ellipse cx="0" cy="-28" rx="13" ry="14" fill="#0d1117" />
            {/* Glowing Cybernetic Visor / Optics */}
            <rect
              x="-2"
              y="-31"
              width="15"
              height="6"
              rx="2"
              fill="#00e5ff"
              filter="url(#glow-filter)"
            />
            <line x1="-2" y1="-28" x2="13" y2="-28" stroke="#ffffff" strokeWidth="1.5" />
            {/* Cyber Ear Antenna / Comm Headset */}
            <rect x="-14" y="-32" width="3" height="8" rx="1" fill="#00e5ff" />
            <circle cx="-13" cy="-33" r="2" fill="#fff" filter="url(#glow-filter)" />
            {/* Long Cyber Tech Scarf flowing behind */}
            <path
              d="M -8,-22 Q -25,-26 -42,-18 Q -30,-12 -12,-16 Z"
              fill="#00e5ff"
              opacity="0.85"
              filter="url(#glow-filter)"
            />
          </g>
        );

      case 'glitch':
        return (
          <g className="char-head glitch-head">
            {/* Spiky Crimson Hair */}
            <path
              d="M -14,-34 L -20,-50 L -8,-40 L 0,-54 L 10,-42 L 18,-48 L 13,-30 Z"
              fill="#2a0812"
              stroke="#ff2a5f"
              strokeWidth="1.4"
            />
            {/* Base Head */}
            <ellipse cx="0" cy="-28" rx="13" ry="14" fill="#140509" />
            {/* Crimson Phantom Oni Half-Mask */}
            <path
              d="M -10,-28 L 0,-22 L 12,-26 L 14,-16 L 0,-12 L -12,-16 Z"
              fill="#380715"
              stroke="#ff2a5f"
              strokeWidth="1.5"
            />
            {/* Glowing Piercing Red Eyes */}
            <ellipse cx="6" cy="-29" rx="3.5" ry="1.4" fill="#ffffff" filter="url(#glow-filter)" />
            <ellipse cx="6" cy="-29" rx="2.5" ry="0.9" fill="#ff2a5f" />
            {/* Long Torn Crimson Shinobi Scarf Fluttering */}
            <path
              d="M -6,-22 Q -30,-32 -52,-20 Q -40,-12 -8,-16 Z"
              fill="#ff2a5f"
              opacity="0.9"
              filter="url(#glow-filter)"
            />
            <path
              d="M -52,-20 L -62,-16 L -54,-12 L -65,-7 L -48,-10 Z"
              fill="#ff2a5f"
              opacity="0.85"
            />
          </g>
        );

      case 'zenko':
        return (
          <g className="char-head zenko-head">
            {/* Monk Head with Shaved Silhouette */}
            <ellipse cx="0" cy="-28" rx="13.5" ry="14.5" fill="#1a1508" />
            {/* Golden Spirit Brow / Bindu Forehead Mark */}
            <circle cx="5" cy="-33" r="2.5" fill="#ffb703" filter="url(#glow-filter)" />
            <polygon points="5,-36 3,-33 7,-33" fill="#fb8500" />
            {/* Determined Brow & Glowing Eyes */}
            <ellipse cx="5" cy="-28" rx="3.2" ry="1.6" fill="#ffffff" filter="url(#glow-filter)" />
            <ellipse cx="5" cy="-28" rx="2" ry="1" fill="#ffb703" />
            {/* Colossal Golden Monk Prayer Beads Necklace */}
            <g className="prayer-beads" filter="url(#glow-filter)">
              <circle cx="-10" cy="-18" r="4.2" fill="#ffb703" stroke="#fb8500" strokeWidth="1" />
              <circle cx="-3" cy="-15" r="4.5" fill="#ffb703" stroke="#fb8500" strokeWidth="1" />
              <circle cx="5" cy="-15" r="4.5" fill="#ffb703" stroke="#fb8500" strokeWidth="1" />
              <circle cx="12" cy="-18" r="4.2" fill="#ffb703" stroke="#fb8500" strokeWidth="1" />
            </g>
          </g>
        );

      case 'nova':
        return (
          <g className="char-head nova-head">
            {/* Long Purple Twin-Tails blowing in wind */}
            <path
              d="M -12,-32 Q -35,-45 -48,-28 Q -38,-15 -14,-22 Z"
              fill="#3b0764"
              stroke="#bf5af2"
              strokeWidth="1.2"
            />
            <path
              d="M -8,-32 Q -30,-22 -44,-8 Q -30,-4 -10,-16 Z"
              fill="#581c87"
            />
            {/* Base Head */}
            <ellipse cx="0" cy="-28" rx="12.5" ry="14" fill="#130722" />
            {/* Kitsune Fox Ears */}
            <polygon points="-12,-38 -16,-56 -4,-44" fill="#3b0764" stroke="#bf5af2" strokeWidth="1.5" />
            <polygon points="-11,-40 -14,-51 -6,-43" fill="#bf5af2" opacity="0.75" />
            <polygon points="0,-40 6,-56 12,-40" fill="#3b0764" stroke="#bf5af2" strokeWidth="1.5" />
            <polygon points="2,-42 6,-51 10,-42" fill="#bf5af2" opacity="0.75" />
            {/* Glowing Fox Spirit Mask / Slanted Eyes */}
            <ellipse cx="5" cy="-28" rx="3.5" ry="1.5" fill="#ffffff" filter="url(#glow-filter)" />
            <ellipse cx="5" cy="-28" rx="2.4" ry="0.9" fill="#bf5af2" />
            <path d="M 0,-25 Q 6,-23 12,-27" stroke="#bf5af2" strokeWidth="1.2" fill="none" />
          </g>
        );

      case 'zephyr':
        return (
          <g className="char-head zephyr-head">
            {/* Base Head */}
            <ellipse cx="0" cy="-28" rx="13" ry="14" fill="#041f14" />
            {/* Jade Vanguard Aerodynamic Helmet */}
            <path
              d="M -13,-34 Q 0,-48 15,-34 L 14,-22 L -12,-22 Z"
              fill="#064e3b"
              stroke="#00f59b"
              strokeWidth="1.5"
            />
            {/* Sweeping Emerald Feather Crest */}
            <path
              d="M 2,-46 Q -15,-62 -38,-55 Q -22,-44 0,-42 Z"
              fill="#00f59b"
              filter="url(#glow-filter)"
            />
            {/* Vanguard Emerald Visor */}
            <polygon points="-4,-30 14,-30 10,-24 -1,-24" fill="#00f59b" filter="url(#glow-filter)" />
            <polygon points="-2,-29 12,-29 9,-25 1,-25" fill="#ffffff" />
            {/* Jade Wind Streamers */}
            <path
              d="M -10,-24 Q -28,-28 -40,-16 Q -28,-10 -8,-16 Z"
              fill="#05c46b"
              opacity="0.85"
            />
          </g>
        );

      case 'raven':
        return (
          <g className="char-head raven-head">
            {/* Deep Shadowed Reaper Cowl / Hood */}
            <path
              d="M -16,-36 Q 0,-54 16,-34 Q 18,-18 12,-10 L -14,-10 Q -18,-20 -16,-36 Z"
              fill="#0c071e"
              stroke="#7c5cff"
              strokeWidth="1.4"
            />
            {/* Raven Feather Silhouettes on Cowl */}
            <path d="M -14,-36 L -24,-46 L -16,-40" stroke="#7c5cff" strokeWidth="1.5" fill="none" />
            <path d="M 12,-36 L 22,-46 L 15,-40" stroke="#7c5cff" strokeWidth="1.5" fill="none" />
            {/* Shadow Face with Piercing Violet Eyes */}
            <ellipse cx="0" cy="-26" rx="10" ry="11" fill="#05020c" />
            <ellipse cx="5" cy="-26" rx="3.5" ry="1.6" fill="#ffffff" filter="url(#glow-filter)" />
            <ellipse cx="5" cy="-26" rx="2.5" ry="1" fill="#7c5cff" />
            {/* Raven Feathers Spreading Back */}
            <path
              d="M -12,-22 Q -35,-32 -55,-16 Q -40,-6 -14,-12 Z"
              fill="#3d34a5"
              opacity="0.9"
              filter="url(#glow-filter)"
            />
          </g>
        );

      default:
        return (
          <g className="char-head default-head">
            <ellipse cx="0" cy="-28" rx="13" ry="15" fill="#12131a" />
            <ellipse cx="5" cy="-28" rx="3" ry="1.5" fill="#fff" filter="url(#glow-filter)" />
          </g>
        );
    }
  };

  // Render character-specific torso, armor, clothing, and insignia
  const renderCharacterTorso = () => {
    switch (charId) {
      case 'byte':
        return (
          <g className="char-torso byte-torso">
            {/* Base Armor Silhouette */}
            <path d="M -15,-4 C -18,10 -12,25 -5,25 C 5,25 12,10 15,-4 C 13,-16 -13,-16 -15,-4 Z" fill="#0f172a" />
            {/* Cyber Armor Plating & Reactor Core */}
            <polygon points="-10,0 0,-10 10,0 6,18 -6,18" fill="#1e293b" stroke="#00e5ff" strokeWidth="1.5" />
            {/* Glowing Core Reactor */}
            <circle cx="0" cy="5" r="4.5" fill="#00e5ff" filter="url(#glow-filter)" />
            <circle cx="0" cy="5" r="2.2" fill="#ffffff" />
            {/* Circuit Traces */}
            <path d="M -8,5 L -4,5 M 4,5 L 8,5 M 0,9 L 0,16" stroke="#00e5ff" strokeWidth="1.5" />
            {/* High-Tech Belt */}
            <rect x="-14" y="22" width="28" height="5" rx="2" fill="#0284c7" />
          </g>
        );

      case 'glitch':
        return (
          <g className="char-torso glitch-torso">
            {/* Dark Crimson Layered Cuirass */}
            <path d="M -15,-4 C -18,10 -12,25 -5,25 C 5,25 12,10 15,-4 C 13,-16 -13,-16 -15,-4 Z" fill="#18040b" />
            <path d="M -12,-2 L 0,10 L 12,-2" fill="none" stroke="#ff2a5f" strokeWidth="2.2" filter="url(#glow-filter)" />
            <path d="M -10,8 L 0,18 L 10,8" fill="none" stroke="#ff6b4a" strokeWidth="1.8" />
            {/* Crimson Phantom Sash */}
            <rect x="-14" y="22" width="28" height="5" rx="2" fill="#ff2a5f" />
            <path d="M -4,26 Q -12,38 -10,48 L -4,48 Q -8,36 -2,26 Z" fill="#ff2a5f" />
          </g>
        );

      case 'zenko':
        return (
          <g className="char-torso zenko-torso">
            {/* Muscular Monk Torso & Vest */}
            <path d="M -17,-4 C -20,10 -14,25 -6,25 C 6,25 14,10 17,-4 C 15,-16 -15,-16 -17,-4 Z" fill="#241a06" />
            {/* Golden Spirit Runes on Chest */}
            <path d="M -10,-2 Q 0,8 10,-2" stroke="#ffb703" strokeWidth="2.2" fill="none" filter="url(#glow-filter)" />
            <circle cx="0" cy="6" r="3.5" fill="#ffb703" filter="url(#glow-filter)" />
            {/* Martial Artist Wide Golden Belt & Sash */}
            <rect x="-15" y="20" width="30" height="7" rx="2" fill="#fb8500" stroke="#ffb703" strokeWidth="1.2" />
            <path d="M -3,25 Q -8,42 -6,54 L 0,54 Q -3,38 1,25 Z" fill="#ffb703" />
          </g>
        );

      case 'nova':
        return (
          <g className="char-torso nova-torso">
            {/* Sleek Violet Shinobi Bodysuit */}
            <path d="M -14,-4 C -16,10 -11,25 -5,25 C 5,25 11,10 14,-4 C 12,-16 -12,-16 -14,-4 Z" fill="#1b082e" />
            <polygon points="-8,-4 0,-12 8,-4 0,12" fill="#3b0764" stroke="#bf5af2" strokeWidth="1.5" />
            <circle cx="0" cy="2" r="3" fill="#bf5af2" filter="url(#glow-filter)" />
            {/* Golden Kitsune Knot Belt with Long Violet Ribbon Tails */}
            <rect x="-13" y="21" width="26" height="5" rx="2" fill="#bf5af2" />
            <path d="M -5,24 Q -16,36 -14,52 L -8,52 Q -12,36 -2,24 Z" fill="#9d4edd" />
          </g>
        );

      case 'zephyr':
        return (
          <g className="char-torso zephyr-torso">
            {/* Aerodynamic Jade Vanguard Cuirass */}
            <path d="M -15,-4 C -18,10 -12,25 -5,25 C 5,25 12,10 15,-4 C 13,-16 -13,-16 -15,-4 Z" fill="#042718" />
            <path d="M -12,-4 L 0,6 L 12,-4 L 6,18 L -6,18 Z" fill="#064e3b" stroke="#00f59b" strokeWidth="1.5" />
            <polygon points="0,-2 6,6 -6,6" fill="#00f59b" filter="url(#glow-filter)" />
            {/* Jade Vanguard Belt */}
            <rect x="-14" y="22" width="28" height="5" rx="2" fill="#05c46b" stroke="#00f59b" strokeWidth="1" />
          </g>
        );

      case 'raven':
        return (
          <g className="char-torso raven-torso">
            {/* Midnight Reaper Robe with Skeletal Clasps */}
            <path d="M -16,-4 C -19,10 -13,25 -6,25 C 6,25 13,10 16,-4 C 14,-16 -14,-16 -16,-4 Z" fill="#0f0724" />
            <path d="M -10,-2 L 0,8 L 10,-2" stroke="#7c5cff" strokeWidth="2.5" fill="none" filter="url(#glow-filter)" />
            {/* Dark Feathered Wing Cloak extending from shoulders */}
            <path d="M -16,-4 Q -36,8 -32,32 Q -22,18 -12,14 Z" fill="#241459" opacity="0.9" />
            <rect x="-14" y="22" width="28" height="5" rx="2" fill="#3d34a5" stroke="#7c5cff" strokeWidth="1" />
          </g>
        );

      default:
        return (
          <g className="char-torso default-torso">
            <path d="M -15,-4 C -18,10 -12,25 -5,25 C 5,25 12,10 15,-4 C 13,-16 -13,-16 -15,-4 Z" fill="#12131a" />
            <rect x="-13" y="22" width="26" height="5" rx="2" fill={secondaryColor} />
          </g>
        );
    }
  };

  // Render character weapons
  const renderWeapon = () => {
    switch (weaponType) {
      case 'staff':
        return (
          <g className="weapon-glow staff-weapon">
            <line x1="-36" y1="42" x2="46" y2="-42" stroke="#0f172a" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="-36" y1="42" x2="46" y2="-42" stroke={themeColor} strokeWidth="2.6" strokeLinecap="round" filter="url(#glow-filter)" />
            <circle cx="46" cy="-42" r="6" fill={themeColor} filter="url(#glow-filter)" />
            <circle cx="-36" cy="42" r="6" fill={themeColor} filter="url(#glow-filter)" />
            <circle cx="46" cy="-42" r="2.5" fill="#fff" />
          </g>
        );

      case 'dual_blades':
        return (
          <g className="weapon-glow dual-blades">
            <path d="M 5,5 Q 38,-28 48,-6 Q 26,4 5,5" fill={themeColor} stroke="#fff" strokeWidth="1" filter="url(#glow-filter)" />
            <path d="M -6,12 Q -38,-14 -26,-36 Q -10,-10 -6,12" fill={themeColor} stroke="#fff" strokeWidth="1" filter="url(#glow-filter)" />
          </g>
        );

      case 'hammer':
        return (
          <g className="weapon-glow spirit-hammer">
            <line x1="-4" y1="28" x2="32" y2="-28" stroke="#1f1807" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="-4" y1="28" x2="32" y2="-28" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="20" y="-45" width="28" height="22" rx="3.5" fill="#2d1c02" stroke={themeColor} strokeWidth="2.8" filter="url(#glow-filter)" />
            <line x1="34" y1="-43" x2="34" y2="-25" stroke="#ffffff" strokeWidth="2" filter="url(#glow-filter)" />
          </g>
        );

      case 'chain_sickle':
        return (
          <g className="weapon-glow chain-sickle">
            <path d="M 10,0 Q 34,-22 44,-4 Q 30,-1 10,0" fill={themeColor} stroke="#fff" strokeWidth="1.2" filter="url(#glow-filter)" />
            <path d="M 10,0 Q -18,28 -28,12 Q -38,6 -32,-16" fill="none" stroke={themeColor} strokeWidth="2.5" strokeDasharray="3 3" filter="url(#glow-filter)" />
            <circle cx="-32" cy="-16" r="5" fill={themeColor} filter="url(#glow-filter)" />
          </g>
        );

      case 'spear':
        return (
          <g className="weapon-glow wind-spear">
            <line x1="-32" y1="38" x2="48" y2="-42" stroke="#042315" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="-32" y1="38" x2="48" y2="-42" stroke={themeColor} strokeWidth="2" />
            <polygon points="48,-42 64,-55 38,-48" fill={themeColor} stroke="#fff" strokeWidth="1" filter="url(#glow-filter)" />
            <circle cx="28" cy="-24" r="8" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.85" />
          </g>
        );

      case 'scythe':
        return (
          <g className="weapon-glow soul-scythe">
            <line x1="-26" y1="42" x2="28" y2="-32" stroke="#0e0622" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 28,-32 Q 62,-60 40,-10 Q 34,-26 28,-32" fill={themeColor} stroke="#fff" strokeWidth="1.5" filter="url(#glow-filter)" />
          </g>
        );

      default:
        return null;
    }
  };

  // Render dynamic action combat limbs & visual effects based on animation state
  const renderActionLimbsAndFX = () => {
    switch (animation) {
      case 'punch':
        return (
          <g className="action-punch-fx">
            {/* Powerful Extended Punching Arm */}
            <path d="M 8,-4 L 38,-2 L 52,-2" fill="none" stroke="#12131a" strokeWidth="7" strokeLinecap="round" />
            {/* Clenched Glowing Fist */}
            <circle cx="52" cy="-2" r="7" fill={themeColor} filter="url(#glow-filter)" />
            <circle cx="52" cy="-2" r="3.5" fill="#ffffff" />
            {/* Punch Impact Star Burst */}
            <polygon
              points="52,-18 56,-6 68,-2 56,2 52,14 48,2 36,-2 48,-6"
              fill={themeColor}
              filter="url(#glow-filter)"
              className="punch-star-burst"
            />
            {/* Fist Speed Lines */}
            <line x1="20" y1="-8" x2="45" y2="-8" stroke={themeColor} strokeWidth="2" strokeDasharray="4 2" />
            <line x1="16" y1="5" x2="42" y2="5" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="4 2" />
          </g>
        );

      case 'kick':
        return (
          <g className="action-kick-fx">
            {/* Dynamic Extended High Flying Kick Leg */}
            <path d="M 5,20 L 32,5 L 56,-12" fill="none" stroke="#12131a" strokeWidth="7.5" strokeLinecap="round" />
            {/* Kicking Foot with Kinetic Aura */}
            <polygon points="54,-15 65,-20 62,-9 52,-7" fill={themeColor} filter="url(#glow-filter)" />
            {/* Crescent Kick Motion Trail */}
            <path
              d="M 15,35 Q 45,20 62,-15"
              fill="none"
              stroke={themeColor}
              strokeWidth="4"
              strokeLinecap="round"
              className="kick-arc-trail"
              filter="url(#glow-filter)"
            />
            {/* Kick impact blast star */}
            <circle cx="62" cy="-15" r="8" fill="#ffffff" filter="url(#glow-filter)" />
          </g>
        );

      case 'unique':
        return (
          <g className="action-unique-fx">
            {/* Unique signature martial arts energy ring */}
            <circle cx="15" cy="0" r="48" fill="none" stroke={themeColor} strokeWidth="3" strokeDasharray="6 4" className="unique-ring-anim" filter="url(#glow-filter)" />
            {/* Extended Multi-Hit Strike Fist */}
            <path d="M 8,-6 L 36,-10 L 50,-10" fill="none" stroke="#12131a" strokeWidth="7" strokeLinecap="round" />
            <circle cx="50" cy="-10" r="8" fill={themeColor} filter="url(#glow-filter)" />
            <polygon points="50,-24 54,-14 65,-10 54,-6 50,4 46,-6 35,-10 46,-14" fill="#ffffff" filter="url(#glow-filter)" />
          </g>
        );

      case 'attack':
        return (
          <g className="action-attack-fx">
            {/* Sweeping Weapon Slash Arc */}
            <path
              d="M 5,-48 A 52 52 0 0 1 58,22"
              fill="none"
              stroke={themeColor}
              strokeWidth="5.5"
              strokeLinecap="round"
              className="slash-arc-trail"
              filter="url(#glow-filter)"
            />
            {/* Front Arm Gripping Weapon */}
            <path d="M 10,-6 L 24,8 L 18,16" fill="none" stroke="#12131a" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="18" cy="16" r="4" fill={themeColor} />
          </g>
        );

      default:
        // Idle / Default Arms
        return (
          <g className="action-default-limbs">
            {/* Back Arm */}
            <path d="M -14,-6 L -24,8 L -18,18" fill="none" stroke="#090a0f" strokeWidth="5" strokeLinecap="round" />
            {/* Front Arm in Guard Ready Stance */}
            <path d="M 12,-6 L 22,6 L 16,16" fill="none" stroke="#12131a" strokeWidth="5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="3.5" fill="#181820" />
          </g>
        );
    }
  };

  return (
    <div
      className={`shadow-fighter-wrapper anim-${animation} ${isFacingRight ? 'facing-right' : 'facing-left'}`}
      style={{
        transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)'
      }}
    >
      {/* Floating Portrait Identification Medallion above sprite */}
      <div
        className="fighter-portrait-crest"
        style={{
          borderColor: themeColor,
          boxShadow: `0 0 12px ${character.accentGlow}`
        }}
        title={`${name} - ${character.title}`}
      >
        <img src={avatarUrl} alt={name} className="fighter-crest-avatar" />
      </div>

      <svg
        viewBox="-75 -85 150 170"
        className="shadow-fighter-svg"
        style={{
          filter: animation === 'hit' ? 'brightness(2.4) drop-shadow(0 0 16px #ff2a5f)' : undefined
        }}
      >
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground shadow puddle */}
        <ellipse cx="0" cy="62" rx="36" ry="8" fill="rgba(0,0,0,0.65)" filter="blur(3.5px)" />

        {/* Shadow Warrior Base Skeleton */}
        <g className="shadow-body">
          {/* Back Leg */}
          <path d="M -5,25 L -20,45 L -28,62 L -18,63 L -10,48 Z" fill="#090a0f" />

          {/* Front Leg */}
          {animation !== 'kick' && (
            <path d="M 5,25 L 18,45 L 24,62 L 14,63 L 8,48 Z" fill="#12131a" />
          )}

          {/* Weapon (Back Layer) */}
          {renderWeapon()}

          {/* Character Torso & Styled Armor */}
          {renderCharacterTorso()}

          {/* Character Head, Hairstyle, Face & Headgear */}
          {renderCharacterHead()}

          {/* Dynamic Action Limbs & Strike Effects */}
          {renderActionLimbsAndFX()}
        </g>
      </svg>
    </div>
  );
};
