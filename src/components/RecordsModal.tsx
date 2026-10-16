import React, { useState } from 'react';
import { getSavedMatchRecords, computeProfileStats, clearMatchRecords } from '../utils/recordManager';
import { getCharacterById } from '../data/characters';
import { Trophy, Zap, Target, Flame, Trash2, X, Swords } from 'lucide-react';

interface RecordsModalProps {
  onClose: () => void;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({ onClose }) => {
  const [records, setRecords] = useState(getSavedMatchRecords());
  const stats = computeProfileStats(records);
  const favoriteChar = getCharacterById(stats.favoriteCharacter);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local battle history?')) {
      clearMatchRecords();
      setRecords([]);
    }
  };

  const winRate = stats.totalMatches > 0
    ? Math.round((stats.wins / stats.totalMatches) * 100)
    : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="records-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="records-modal-header">
          <div className="records-title-group">
            <Trophy className="records-trophy-icon" size={26} />
            <div>
              <h3 className="records-modal-title">SHADOW COMBAT DOSSIER</h3>
              <span className="records-modal-subtitle">LOCAL BATTLE HISTORY & COMBAT METRICS</span>
            </div>
          </div>
          <button className="records-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Aggregate Stats Dashboard */}
        <div className="records-stats-grid">
          <div className="record-stat-box">
            <div className="stat-box-label">
              <Swords size={15} /> MATCH RECORD
            </div>
            <div className="stat-box-value">
              {stats.wins}<span className="stat-sub-val">W</span> - {stats.losses}<span className="stat-sub-val">L</span>
            </div>
            <span className="stat-box-hint">{winRate}% WIN RATE ({stats.totalMatches} MATCHES)</span>
          </div>

          <div className="record-stat-box">
            <div className="stat-box-label">
              <Zap size={15} /> PEAK SPEED
            </div>
            <div className="stat-box-value highlight-cyan">
              {stats.peakWpm} <span className="stat-sub-val">WPM</span>
            </div>
            <span className="stat-box-hint">AVG: {stats.averageWpm} WPM</span>
          </div>

          <div className="record-stat-box">
            <div className="stat-box-label">
              <Target size={15} /> AVG ACCURACY
            </div>
            <div className="stat-box-value highlight-green">
              {stats.averageAccuracy}<span className="stat-sub-val">%</span>
            </div>
            <span className="stat-box-hint">ALL-TIME KEYSTROKES</span>
          </div>

          <div className="record-stat-box">
            <div className="stat-box-label">
              <Flame size={15} /> MAX STREAK
            </div>
            <div className="stat-box-value highlight-gold">
              {stats.highestCombo}<span className="stat-sub-val">x</span>
            </div>
            <span className="stat-box-hint">FAVORITE: {favoriteChar.name}</span>
          </div>
        </div>

        {/* Match History List */}
        <div className="records-history-section">
          <div className="history-section-header">
            <h4>RECENT ENGAGEMENTS</h4>
            {records.length > 0 && (
              <button className="clear-history-btn" onClick={handleClear} title="Clear all local match history">
                <Trash2 size={13} />
                <span>RESET HISTORY</span>
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="history-empty-state">
              <p>No battles recorded yet. Step into the arena and fight!</p>
            </div>
          ) : (
            <div className="history-list-scroll">
              {records.map((rec) => {
                const p1 = getCharacterById(rec.playerCharacterId);
                const p2 = getCharacterById(rec.opponentCharacterId);
                const isWin = rec.winner === 'player1';
                const isDraw = rec.winner === 'draw';
                const dateStr = new Date(rec.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={rec.id} className="history-item-row">
                    <div className="history-time-col">
                      <span className="history-date">{dateStr}</span>
                      <span className="history-difficulty-badge">{rec.difficulty.toUpperCase()}</span>
                    </div>

                    <div className="history-clash-col">
                      <div className="history-fighter-tag">
                        <img src={p1.avatarUrl} alt={p1.name} className="history-mini-avatar" />
                        <span style={{ color: p1.themeColor }}>{p1.name}</span>
                      </div>
                      <span className="history-vs">VS</span>
                      <div className="history-fighter-tag">
                        <img src={p2.avatarUrl} alt={p2.name} className="history-mini-avatar" />
                        <span style={{ color: p2.themeColor }}>{p2.name}</span>
                      </div>
                    </div>

                    <div className="history-stats-col">
                      <span><strong>{rec.playerWpm}</strong> WPM</span>
                      <span><strong>{rec.playerAccuracy}%</strong> ACC</span>
                      <span><strong>{rec.playerMaxCombo}x</strong> COMBO</span>
                    </div>

                    <div className="history-result-col">
                      <span className={`result-tag ${isWin ? 'res-win' : isDraw ? 'res-draw' : 'res-loss'}`}>
                        {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
