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
  const { themeColor, weaponType } = character;

  // Render unique glowing weapon based on weaponType
  const renderWeapon = () => {
    switch (weaponType) {
      case 'staff':
        return (
          <g className="weapon-glow staff-weapon">
            {/* Long energy staff with glowing tip crystals */}
            <line
              x1="-35"
              y1="40"
              x2="45"
              y2="-40"
              stroke="#111"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1="-35"
              y1="40"
              x2="45"
              y2="-40"
              stroke={themeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#glow-filter)"
            />
            <circle cx="45" cy="-40" r="5" fill={themeColor} filter="url(#glow-filter)" />
            <circle cx="-35" cy="40" r="5" fill={themeColor} filter="url(#glow-filter)" />
          </g>
        );

      case 'dual_blades':
        return (
          <g className="weapon-glow dual-blades">
            {/* Blade 1 */}
            <path
              d="M 5,5 Q 35,-25 45,-5 Q 25,5 5,5"
              fill={themeColor}
              stroke="#fff"
              strokeWidth="0.8"
              filter="url(#glow-filter)"
            />
            {/* Blade 2 */}
            <path
              d="M -5,10 Q -35,-15 -25,-35 Q -10,-10 -5,10"
              fill={themeColor}
              stroke="#fff"
              strokeWidth="0.8"
              filter="url(#glow-filter)"
            />
          </g>
        );

      case 'hammer':
        return (
          <g className="weapon-glow spirit-hammer">
            {/* Hammer shaft */}
            <line
              x1="0"
              y1="25"
              x2="28"
              y2="-25"
              stroke="#222"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1="25"
              x2="28"
              y2="-25"
              stroke={themeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Massive heavy war hammer head */}
            <rect
              x="16"
              y="-42"
              width="26"
              height="20"
              rx="3"
              fill="#18181b"
              stroke={themeColor}
              strokeWidth="2.5"
              filter="url(#glow-filter)"
            />
            <line
              x1="29"
              y1="-40"
              x2="29"
              y2="-24"
              stroke={themeColor}
              strokeWidth="2"
              filter="url(#glow-filter)"
            />
          </g>
        );

      case 'chain_sickle':
        return (
          <g className="weapon-glow chain-sickle">
            {/* Curved sickle blade */}
            <path
              d="M 10,0 Q 30,-20 40,-5 Q 28,-2 10,0"
              fill={themeColor}
              stroke="#fff"
              strokeWidth="1"
              filter="url(#glow-filter)"
            />
            {/* Flowing energy chain arc */}
            <path
              d="M 10,0 Q -15,25 -25,10 Q -35,5 -30,-15"
              fill="none"
              stroke={themeColor}
              strokeWidth="2.2"
              strokeDasharray="3 3"
              filter="url(#glow-filter)"
            />
            <circle cx="-30" cy="-15" r="4.5" fill={themeColor} filter="url(#glow-filter)" />
          </g>
        );

      case 'spear':
        return (
          <g className="weapon-glow wind-spear">
            {/* Long shaft */}
            <line
              x1="-30"
              y1="35"
              x2="45"
              y2="-40"
              stroke="#1a1a1a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="-30"
              y1="35"
              x2="45"
              y2="-40"
              stroke={themeColor}
              strokeWidth="1.8"
            />
            {/* Spear tip */}
            <polygon
              points="45,-40 60,-52 35,-46"
              fill={themeColor}
              stroke="#fff"
              strokeWidth="0.8"
              filter="url(#glow-filter)"
            />
            {/* Swirling wind rings */}
            <circle
              cx="25"
              cy="-22"
              r="7"
              fill="none"
              stroke={themeColor}
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity="0.8"
            />
          </g>
        );

      case 'scythe':
        return (
          <g className="weapon-glow soul-scythe">
            {/* Heavy shaft */}
            <line
              x1="-25"
              y1="40"
              x2="25"
              y2="-30"
              stroke="#111"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Massive Crescent Scythe Blade */}
            <path
              d="M 25,-30 Q 55,-55 35,-10 Q 30,-25 25,-30"
              fill={themeColor}
              stroke="#fff"
              strokeWidth="1.2"
              filter="url(#glow-filter)"
            />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`shadow-fighter-wrapper anim-${animation} ${isFacingRight ? 'facing-right' : 'facing-left'}`}
      style={{
        transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)'
      }}
    >
      <svg
        viewBox="-70 -80 140 160"
        className="shadow-fighter-svg"
        style={{
          filter: animation === 'hit' ? 'brightness(2.2) drop-shadow(0 0 12px #ff2a5f)' : undefined
        }}
      >
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dynamic Weapon Slash Arc (visible during attack) */}
        {animation === 'attack' && (
          <path
            d="M 5,-45 A 50 50 0 0 1 55,20"
            fill="none"
            stroke={themeColor}
            strokeWidth="5"
            strokeLinecap="round"
            className="slash-arc-trail"
            filter="url(#glow-filter)"
          />
        )}

        {/* Ground shadow puddle */}
        <ellipse cx="0" cy="62" rx="35" ry="8" fill="rgba(0,0,0,0.6)" filter="blur(3px)" />

        {/* Shadow Warrior Body (Dark Silhouette with Shinobi contours) */}
        <g className="shadow-body">
          {/* Back Leg */}
          <path
            d="M -5,25 L -20,45 L -28,62 L -18,63 L -10,48 Z"
            fill="#090a0f"
          />

          {/* Front Leg */}
          <path
            d="M 5,25 L 18,45 L 24,62 L 14,63 L 8,48 Z"
            fill="#12131a"
          />

          {/* Torso & Armor Vest */}
          <path
            d="M -16,0 C -18,12 -12,28 -5,28 C 5,28 12,12 16,0 C 14,-15 -14,-15 -16,0 Z"
            fill="#0d0e14"
          />

          {/* Armor glowing accent seams */}
          <path
            d="M -8,5 L 0,18 L 8,5"
            fill="none"
            stroke={themeColor}
            strokeWidth="1.8"
            opacity="0.85"
            filter="url(#glow-filter)"
          />

          {/* Shinobi Sash / Belt */}
          <rect x="-14" y="24" width="28" height="4" rx="2" fill={character.secondaryColor} />
          <path
            d="M -4,28 Q -10,40 -8,46 L -3,46 Q -5,38 -2,28 Z"
            fill={character.secondaryColor}
          />

          {/* Head & Hood Silhouette */}
          <ellipse cx="0" cy="-28" rx="14" ry="16" fill="#0d0e14" />
          <path
            d="M -14,-32 Q 0,-48 14,-32 Q 16,-20 12,-14 L -12,-14 Z"
            fill="#090a0f"
          />

          {/* Glowing Eyes */}
          <ellipse
            cx="5"
            cy="-28"
            rx="3"
            ry="1.5"
            fill="#ffffff"
            filter="url(#glow-filter)"
          />
          <ellipse
            cx="5"
            cy="-28"
            rx="2.2"
            ry="1"
            fill={themeColor}
          />

          {/* Back Arm & Hand */}
          <path
            d="M -14,-8 L -24,8 L -18,18"
            fill="none"
            stroke="#090a0f"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Weapon */}
          {renderWeapon()}

          {/* Front Arm & Hand Grip */}
          <path
            d="M 12,-8 L 22,6 L 14,14"
            fill="none"
            stroke="#12131a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="14" cy="14" r="3.5" fill="#181820" />
        </g>
      </svg>
    </div>
  );
};
