import { calculateAccuracy, calculateWpm, applyMistakePenalty } from './combatMath.js';

export interface TypingState {
  userInput: string;
  maxCorrectIndex: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  mistakes: number;
  combo: number;
  accuracy: number;
  wpm: number;
  hasInputError: boolean;
}

export interface ProcessInputResult {
  nextState: TypingState;
  isMistake: boolean;
  isCompletedWord: boolean;
  completedWord?: string;
  isSentenceCompleted: boolean;
}

export function processTypingInput(
  value: string,
  currentSentence: string,
  currentState: TypingState,
  elapsedSecs: number,
  lastTypedWordIndex: number
): ProcessInputResult {
  const prevLength = currentState.userInput.length;

  // 1. Backspace / deletion
  if (value.length < prevLength) {
    return {
      nextState: {
        ...currentState,
        userInput: value,
        hasInputError: false
      },
      isMistake: false,
      isCompletedWord: false,
      isSentenceCompleted: false
    };
  }

  // 2. Character addition
  const typedChar = value[prevLength];
  const expectedChar = currentSentence[prevLength];

  if (typedChar !== expectedChar) {
    const nextMistakes = currentState.mistakes + 1;
    const nextTotal = currentState.totalKeystrokes + 1;
    const reducedCombo = applyMistakePenalty(currentState.combo);
    const nextAccuracy = calculateAccuracy(currentState.correctKeystrokes, nextTotal);

    return {
      nextState: {
        ...currentState,
        mistakes: nextMistakes,
        totalKeystrokes: nextTotal,
        combo: reducedCombo,
        accuracy: nextAccuracy,
        hasInputError: true
      },
      isMistake: true,
      isCompletedWord: false,
      isSentenceCompleted: false
    };
  }

  // 3. Correct character
  const nextInput = currentSentence.slice(0, prevLength + 1);
  const isNewChar = prevLength >= currentState.maxCorrectIndex;
  const nextMaxCorrectIndex = isNewChar ? prevLength + 1 : currentState.maxCorrectIndex;
  const nextCorrect = currentState.correctKeystrokes + (isNewChar ? 1 : 0);
  const nextTotal = currentState.totalKeystrokes + 1;
  const nextAccuracy = calculateAccuracy(nextCorrect, nextTotal);
  const nextWpm = calculateWpm(nextCorrect, elapsedSecs);

  let isCompletedWord = false;
  let completedWord: string | undefined;

  const isWordBoundary = nextInput.endsWith(' ') || nextInput === currentSentence;
  if (isWordBoundary) {
    const words = nextInput.trim().split(/\s+/);
    const currentWordIdx = words.length - 1;
    if (currentWordIdx >= lastTypedWordIndex) {
      completedWord = words[currentWordIdx];
      isCompletedWord = !!completedWord;
    }
  }

  const isSentenceCompleted = nextInput === currentSentence;

  return {
    nextState: {
      userInput: nextInput,
      maxCorrectIndex: nextMaxCorrectIndex,
      correctKeystrokes: nextCorrect,
      totalKeystrokes: nextTotal,
      mistakes: currentState.mistakes,
      combo: currentState.combo,
      accuracy: nextAccuracy,
      wpm: nextWpm,
      hasInputError: false
    },
    isMistake: false,
    isCompletedWord,
    completedWord,
    isSentenceCompleted
  };
}
