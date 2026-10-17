import { useRef, useEffect } from 'react';
import type { FighterState } from '../types/game';
import { CHARACTER_ULTIMATES } from '../types/abilities';
import { Zap, Target, Flame, Sparkles } from 'lucide-react';

interface TypingConsoleProps {
  sentence: string;
  userInput: string;
  onInputChange: (val: string) => void;
  onTriggerUltimate?: () => void;
  p1State: FighterState;
  p2State: FighterState;
  hasError: boolean;
  disabled?: boolean;
}

export const TypingConsole: React.FC<TypingConsoleProps> = ({
  sentence,
  userInput,
  onInputChange,
  onTriggerUltimate,
  p1State,
  p2State,
  hasError,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount or whenever disabled changes
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [disabled]);

  // Ensure controlled input stays synchronized when invalid input is rejected
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== userInput) {
      inputRef.current.value = userInput;
    }
  }, [userInput, hasError]);

  // Keep input focused when clicking anywhere in console
  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  };

  // Render character by character with colored highlights matching PRD mockup
  const renderSentenceChars = () => {
    return sentence.split('').map((char, index) => {
      let statusClass = 'char-pending';
      if (index < userInput.length) {
        statusClass = userInput[index] === char ? 'char-correct' : 'char-incorrect';
      } else if (index === userInput.length) {
        statusClass = `char-current ${hasError ? 'char-error-active' : ''}`;
      }

      return (
        <span
          key={`char-${index}`}
          className={`sentence-char ${statusClass}`}
          style={{
            color:
              index < userInput.length && userInput[index] === char
                ? p1State.character.themeColor
                : undefined
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  const ultimateData = CHARACTER_ULTIMATES[p1State.character.id];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      if (p1State.superMeter >= 100 && onTriggerUltimate) {
        e.preventDefault();
        onTriggerUltimate();
      }
    }
  };

  return (
    <div
      className={`typing-console-card ${hasError ? 'console-shake' : ''}`}
      onClick={handleContainerClick}
    >
      <div className="console-header">
        <span className="console-prompt-label">Type this sentence:</span>
        {p1State.combo >= 5 && (
          <div className="active-streak-pill" style={{ color: p1State.character.themeColor }}>
            <Flame size={14} />
            <span>{p1State.combo}x STREAK ACTIVE (+{(p1State.combo * 5)}% DMG)</span>
          </div>
        )}
      </div>

      {/* Target Sentence Display */}
      <div className="target-sentence-box">
        <div className="sentence-text-stream">
          {renderSentenceChars()}
        </div>
      </div>

      {/* Live Input Field */}
      <div className="typing-input-wrapper">
        <input
          ref={inputRef}
          id="typing-input-field"
          type="text"
          value={userInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type the sentence above to execute attacks... (Tab to unleash Ultimate)"
          className={`typing-input ${hasError ? 'input-error' : ''}`}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Ultimate Strike Trigger Banner */}
      {p1State.superMeter >= 100 && onTriggerUltimate && (
        <div
          id="ultimate-trigger-cta"
          className="ultimate-ready-banner"
          onClick={onTriggerUltimate}
          style={{ borderColor: p1State.character.themeColor }}
        >
          <div className="ultimate-banner-content">
            <Sparkles className="ultimate-banner-icon" size={18} style={{ color: p1State.character.themeColor }} />
            <div className="ultimate-banner-text">
              <span className="ultimate-name" style={{ color: p1State.character.themeColor }}>
                {ultimateData.name} READY!
              </span>
              <span className="ultimate-desc">{ultimateData.description}</span>
            </div>
          </div>
          <button
            type="button"
            className="ultimate-action-btn"
            style={{ backgroundColor: p1State.character.themeColor }}
          >
            UNLEASH [TAB]
          </button>
        </div>
      )}

      {/* Metrics Footer matching PRD mockup */}
      <div className="console-stats-footer">
        {/* Left: Player 1 Live Stats */}
        <div className="player-stats-cluster p1-stats">
          <div className="metric-pill">
            <Zap size={14} className="metric-icon" style={{ color: p1State.character.themeColor }} />
            <span className="metric-label">WPM</span>
            <span className="metric-value" style={{ color: p1State.character.themeColor }}>
              {p1State.wpm}
            </span>
          </div>

          <div className="metric-pill">
            <Target size={14} className="metric-icon" />
            <span className="metric-label">Accuracy</span>
            <span className="metric-value">
              {p1State.accuracy}%
            </span>
          </div>

          <div className="metric-pill">
            <Flame size={14} className="metric-icon" />
            <span className="metric-label">Combo</span>
            <span className="metric-value">
              {p1State.combo}
            </span>
          </div>
        </div>

        {/* Right: Opponent Live Stats */}
        <div className="player-stats-cluster p2-stats">
          <div className="metric-pill">
            <Zap size={14} className="metric-icon" style={{ color: p2State.character.themeColor }} />
            <span className="metric-label">{p2State.character.name} WPM</span>
            <span className="metric-value" style={{ color: p2State.character.themeColor }}>
              {p2State.wpm}
            </span>
          </div>

          <div className="metric-pill">
            <Target size={14} className="metric-icon" />
            <span className="metric-label">Accuracy</span>
            <span className="metric-value">
              {p2State.accuracy}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
