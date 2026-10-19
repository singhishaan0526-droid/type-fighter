import React from 'react';
import { Zap, Target, Swords, Clock, RotateCcw, Home, Award } from 'lucide-react';
import type { Character } from '../types/game';

export interface PracticeStats {
  wpm: number;
  accuracy: number;
  wordsTyped: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  mistakes: number;
  maxCombo: number;
  elapsedSeconds: number;
}

interface PracticeSummaryModalProps {
  stats: PracticeStats;
  character: Character;
  onPracticeAgain: () => void;
  onExit: () => void;
}

export const PracticeSummaryModal: React.FC<PracticeSummaryModalProps> = ({
  stats,
  character,
  onPracticeAgain,
  onExit
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
  };

  const getPerformanceGrade = (wpm: number, accuracy: number) => {
    if (wpm >= 85 && accuracy >= 97) return { tier: 'S-TIER', label: 'CYBER GRANDMASTER', color: '#ffb703' };
    if (wpm >= 65 && accuracy >= 95) return { tier: 'A-TIER', label: 'SHADOW STRIKER', color: '#00e5ff' };
    if (wpm >= 45 && accuracy >= 90) return { tier: 'B-TIER', label: 'DOJO COMBATANT', color: '#00f59b' };
    if (wpm >= 30 && accuracy >= 85) return { tier: 'C-TIER', label: 'APPRENTICE TYPIST', color: '#bf5af2' };
    return { tier: 'D-TIER', label: 'INITIATE', color: '#94a3b8' };
  };

  const grade = getPerformanceGrade(stats.wpm, stats.accuracy);

  return (
    <div className="modal-backdrop-overlay">
      <div className="practice-summary-card">
        {/* Glow Header */}
        <div className="practice-summary-header" style={{ borderColor: character.themeColor }}>
          <div className="summary-badge-icon" style={{ backgroundColor: `${character.themeColor}20` }}>
            <Award size={32} style={{ color: character.themeColor }} />
          </div>
          <div className="summary-title-block">
            <span className="summary-pretitle">PRACTICE SESSION COMPLETED</span>
            <h2 className="summary-title">TYPING DIAGNOSTIC REPORT</h2>
            <span className="summary-subtitle">
              Training data captured with {character.name} &bull; {formatTime(stats.elapsedSeconds)}
            </span>
          </div>

          <div className="summary-grade-badge" style={{ borderColor: grade.color }}>
            <span className="grade-tier" style={{ color: grade.color }}>{grade.tier}</span>
            <span className="grade-label">{grade.label}</span>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="summary-metrics-grid">
          {/* WPM (WAP) */}
          <div className="summary-stat-box highlight-stat">
            <div className="stat-box-icon" style={{ color: '#00e5ff' }}>
              <Zap size={22} />
            </div>
            <div className="stat-box-content">
              <span className="stat-box-label">TYPING SPEED (WPM)</span>
              <span className="stat-box-value highlight-value" style={{ color: '#00e5ff' }}>
                {stats.wpm}
              </span>
              <span className="stat-box-hint">Net Words Per Minute</span>
            </div>
          </div>

          {/* Accuracy (Accuses) */}
          <div className="summary-stat-box highlight-stat">
            <div className="stat-box-icon" style={{ color: '#00f59b' }}>
              <Target size={22} />
            </div>
            <div className="stat-box-content">
              <span className="stat-box-label">ACCURACY</span>
              <span className="stat-box-value highlight-value" style={{ color: '#00f59b' }}>
                {stats.accuracy}%
              </span>
              <span className="stat-box-hint">Typing Precision</span>
            </div>
          </div>

          {/* Words Typed */}
          <div className="summary-stat-box">
            <div className="stat-box-icon" style={{ color: '#ffb703' }}>
              <Swords size={20} />
            </div>
            <div className="stat-box-content">
              <span className="stat-box-label">WORDS COMPLETED</span>
              <span className="stat-box-value">{stats.wordsTyped}</span>
              <span className="stat-box-hint">Full words verified</span>
            </div>
          </div>

          {/* Time Elapsed */}
          <div className="summary-stat-box">
            <div className="stat-box-icon" style={{ color: '#bf5af2' }}>
              <Clock size={20} />
            </div>
            <div className="stat-box-content">
              <span className="stat-box-label">SESSION TIME</span>
              <span className="stat-box-value">{formatTime(stats.elapsedSeconds)}</span>
              <span className="stat-box-hint">Total free practice duration</span>
            </div>
          </div>
        </div>

        {/* Detailed Keystroke Breakdown */}
        <div className="summary-breakdown-panel">
          <h4 className="breakdown-title">KEYSTROKE ACCURACY BREAKDOWN</h4>
          <div className="breakdown-row">
            <div className="breakdown-item">
              <span className="item-label">Total Keystrokes</span>
              <span className="item-value">{stats.totalKeystrokes}</span>
            </div>
            <div className="breakdown-item success">
              <span className="item-label">Correct Hits</span>
              <span className="item-value">{stats.correctKeystrokes}</span>
            </div>
            <div className="breakdown-item danger">
              <span className="item-label">Misses / Mistakes</span>
              <span className="item-value">{stats.mistakes}</span>
            </div>
            <div className="breakdown-item warning">
              <span className="item-label">Max Streak Combo</span>
              <span className="item-value">{stats.maxCombo}x</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="summary-actions-bar">
          <button className="summary-btn secondary-btn" onClick={onExit}>
            <Home size={16} />
            <span>RETURN TO MENU</span>
          </button>
          <button className="summary-btn primary-btn" onClick={onPracticeAgain}>
            <RotateCcw size={16} />
            <span>PRACTICE AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
