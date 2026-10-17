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

  // Character-specific signature finisher FX
  const renderFinisherFX = () => {
    if (animation !== 'finisher') return null;

    switch (character.id) {
      case 'byte':
        // Byte: Precision and rapid strikes - Electric overdrive matrix & lightning bolts
        return (
          <g className="finisher-fx byte-finisher">
            <circle cx="0" cy="0" r="55" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="6 4" className="electric-orbit-ring" filter="url(#glow-filter)" />
            <path d="M -40,-40 L -20,-10 L 0,-30 L 25,-5 L 45,-45" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow-filter)" className="lightning-bolt-strike" />
            <path d="M -30,30 L -10,10 L 15,35 L 35,5 L 50,40" fill="none" stroke="#00e5ff" strokeWidth="2" filter="url(#glow-filter)" className="lightning-bolt-strike-2" />
            <circle cx="45" cy="-20" r="8" fill="#00e5ff" filter="url(#glow-filter)" opacity="0.8" />
            <circle cx="-35" cy="20" r="6" fill="#ffffff" filter="url(#glow-filter)" opacity="0.8" />
          </g>
        );

      case 'glitch':
        // Glitch: Digital distortion and burst effects - Chromatic split & glitch blocks
        return (
          <g className="finisher-fx glitch-finisher">
            <path d="M -25,-40 L 45,25" stroke="#ff2a5f" strokeWidth="6" strokeDasharray="12 6" opacity="0.85" filter="url(#glow-filter)" />
            <path d="M -15,-45 L 55,20" stroke="#00ffff" strokeWidth="2" opacity="0.75" />
            <path d="M 35,-35 L -35,35" stroke="#ff2a5f" strokeWidth="6" strokeDasharray="12 6" opacity="0.85" filter="url(#glow-filter)" />
            <rect x="-48" y="-30" width="22" height="6" fill="#ff2a5f" opacity="0.7" className="glitch-data-block-1" />
            <rect x="25" y="-10" width="28" height="8" fill="#00ffff" opacity="0.7" className="glitch-data-block-2" />
            <rect x="-35" y="22" width="30" height="5" fill="#ff2a5f" opacity="0.8" className="glitch-data-block-3" />
          </g>
        );

      case 'zenko':
        // Zenko: Powerful impact and stagger - Seismic spirit hammer shockwaves & ground fissure
        return (
          <g className="finisher-fx zenko-finisher">
            <ellipse cx="20" cy="55" rx="45" ry="14" fill="none" stroke="#ffb703" strokeWidth="4" filter="url(#glow-filter)" className="seismic-shockwave-ring" />
            <ellipse cx="20" cy="55" rx="60" ry="18" fill="none" stroke="#fb8500" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.8" />
            <path d="M 20,55 L -15,65 M 20,55 L 50,68 M 20,55 L 10,75 M 20,55 L 35,45" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" filter="url(#glow-filter)" />
            <circle cx="20" cy="-20" r="35" fill="none" stroke="#ffb703" strokeWidth="3" strokeDasharray="5 5" opacity="0.6" className="zenko-spirit-aura" />
          </g>
        );

      case 'nova':
        // Nova: Energy-based finishing effect - Pulsing phantom chain vortex & celestial bind
        return (
          <g className="finisher-fx nova-finisher">
            <circle cx="0" cy="0" r="50" fill="none" stroke="#bf5af2" strokeWidth="3" strokeDasharray="8 4" className="chain-vortex-ring" filter="url(#glow-filter)" />
            <circle cx="0" cy="0" r="32" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 6" opacity="0.8" />
            <path d="M -45,0 Q 0,-50 45,0 Q 0,50 -45,0" fill="none" stroke="#bf5af2" strokeWidth="3.5" filter="url(#glow-filter)" className="phantom-spiral-arc" />
            <circle cx="45" cy="0" r="5" fill="#ffffff" filter="url(#glow-filter)" />
            <circle cx="-45" cy="0" r="5" fill="#ffffff" filter="url(#glow-filter)" />
          </g>
        );

      case 'zephyr':
        // Zephyr: Rapid movement and evasive motion - Cyclone wind spear vortices & supersonic rings
        return (
          <g className="finisher-fx zephyr-finisher">
            <ellipse cx="0" cy="0" rx="55" ry="25" fill="none" stroke="#00f59b" strokeWidth="3.5" strokeDasharray="14 6" transform="rotate(-25)" className="cyclone-wind-ring" filter="url(#glow-filter)" />
            <ellipse cx="0" cy="0" rx="42" ry="18" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 4" transform="rotate(35)" opacity="0.75" />
            <path d="M -50,-20 Q -10,-40 30,-15" fill="none" stroke="#00f59b" strokeWidth="4" opacity="0.8" filter="url(#glow-filter)" />
            <path d="M -40,15 Q 0,40 45,10" fill="none" stroke="#05c46b" strokeWidth="4" opacity="0.8" filter="url(#glow-filter)" />
          </g>
        );

      case 'raven':
        // Raven: Dark, dramatic finishing effect - Obsidian soul scythe wings & dark reap eclipse
        return (
          <g className="finisher-fx raven-finisher">
            <path d="M -8,-25 Q -45,-55 -60,-15 Q -45,-5 -15,-10 Z" fill="#7c5cff" opacity="0.75" filter="url(#glow-filter)" className="raven-soul-wing-left" />
            <path d="M 8,-25 Q 45,-55 60,-15 Q 45,-5 15,-10 Z" fill="#7c5cff" opacity="0.75" filter="url(#glow-filter)" className="raven-soul-wing-right" />
            <path d="M -30,-45 A 55 55 0 0 1 50,35" fill="none" stroke="#7c5cff" strokeWidth="5" strokeLinecap="round" filter="url(#glow-filter)" className="soul-reap-arc" />
            <circle cx="0" cy="0" r="48" fill="none" stroke="#3d34a5" strokeWidth="2" strokeDasharray="10 5" opacity="0.6" />
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

        {/* Character-Specific Signature Finisher VFX */}
        {renderFinisherFX()}

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
