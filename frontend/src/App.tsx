import { useState } from 'react';
import type { GameMode, Character, BotDifficulty } from './types/game';
import { CHARACTERS } from './data/characters';
import { Navbar } from './components/Navbar';
import { CharacterSelect } from './components/CharacterSelect';
import { LocalBattle } from './components/LocalBattle';
import { PracticeMode } from './components/PracticeMode';
import { OnlineBattle } from './components/OnlineBattle';
import { RecordsModal } from './components/RecordsModal';
import './index.css';

export const App: React.FC = () => {
  const [phase, setPhase] = useState<'select' | 'battle'>('select');
  const [mode, setMode] = useState<GameMode>('vs-bot');
  const [p1Char, setP1Char] = useState<Character>(CHARACTERS[0]); // Byte
  const [p2Char, setP2Char] = useState<Character>(CHARACTERS[1]); // Glitch
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [onlineSessionId, setOnlineSessionId] = useState('arena-1');
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);

  const handleStartBattle = (
    p1: Character,
    p2: Character,
    diff: BotDifficulty,
    sessionId?: string
  ) => {
    setP1Char(p1);
    setP2Char(p2);
    setDifficulty(diff);
    if (sessionId) {
      setOnlineSessionId(sessionId);
    }
    setPhase('battle');
  };

  const handleReturnToSelect = () => {
    setPhase('select');
  };

  return (
    <div className="game-app-container">
      {/* Global Background Glow FX */}
      <div className="app-bg-glow" />

      {/* Main Navbar */}
      <Navbar
        mode={mode}
        onSelectMode={(newMode) => setMode(newMode)}
        onReset={handleReturnToSelect}
        onOpenRecords={() => setIsRecordsOpen(true)}
        inBattle={phase === 'battle'}
      />

      {/* Main Game Surface */}
      <main className="game-main-content">
        {phase === 'select' ? (
          <CharacterSelect
            mode={mode}
            onStartBattle={handleStartBattle}
          />
        ) : mode === 'practice' ? (
          <PracticeMode
            character={p1Char}
            onExit={handleReturnToSelect}
          />
        ) : mode === 'online-duel' ? (
          <OnlineBattle
            initialCharacter={p1Char}
            sessionId={onlineSessionId}
            onExit={handleReturnToSelect}
          />
        ) : (
          <LocalBattle
            p1Character={p1Char}
            p2Character={p2Char}
            mode={mode}
            difficulty={difficulty}
            onReturnToSelect={handleReturnToSelect}
          />
        )}
      </main>

      {/* Records Dossier Modal */}
      {isRecordsOpen && (
        <RecordsModal onClose={() => setIsRecordsOpen(false)} />
      )}

      {/* Subtle Footer */}
      <footer className="game-footer">
        <span>TYPING BATTLE &bull; PHASE 3 ONLINE BATTLE CORE &bull; TYPE FASTER. FIGHT HARDER.</span>
      </footer>
    </div>
  );
};

export default App;
