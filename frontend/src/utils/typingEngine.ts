import { calculateAccuracy, calculateWpm, applyMistakePenalty } from './combatMath';

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
  const sentenceLen = currentSentence.length;

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

  // 2. Character addition / typing forward
  const clampedValue = value.slice(0, sentenceLen);
  if (clampedValue.length === prevLength) {
    return {
      nextState: currentState,
      isMistake: false,
      isCompletedWord: false,
      isSentenceCompleted: prevLength >= sentenceLen
    };
  }

  let nextCorrect = currentState.correctKeystrokes;
  let nextTotal = currentState.totalKeystrokes;
  let nextMistakes = currentState.mistakes;
  let nextCombo = currentState.combo;
  let nextMaxCorrect = currentState.maxCorrectIndex;
  let lastCharWasMistake = false;

  for (let i = prevLength; i < clampedValue.length; i++) {
    const typedChar = clampedValue[i];
    const expectedChar = currentSentence[i];
    nextTotal += 1;

    if (typedChar === expectedChar) {
      if (i >= nextMaxCorrect) {
        nextCorrect += 1;
        nextMaxCorrect = i + 1;
      }
      nextCombo += 1;
      lastCharWasMistake = false;
    } else {
      nextMistakes += 1;
      nextCombo = applyMistakePenalty(nextCombo);
      lastCharWasMistake = true;
    }
  }

  const nextAccuracy = calculateAccuracy(nextCorrect, nextTotal);
  const nextWpm = calculateWpm(nextCorrect, elapsedSecs);

  // 3. Word completion evaluation
  let isCompletedWord = false;
  let completedWord: string | undefined;

  const isWordBoundary = clampedValue.endsWith(' ') || clampedValue.length >= sentenceLen;
  if (isWordBoundary && clampedValue.length > 0) {
    const words = currentSentence.slice(0, clampedValue.length).trim().split(/\s+/);
    const currentWordIdx = words.length - 1;
    if (currentWordIdx >= lastTypedWordIndex) {
      completedWord = words[currentWordIdx];
      isCompletedWord = !!completedWord;
    }
  }

  const isSentenceCompleted = clampedValue.length >= sentenceLen;

  return {
    nextState: {
      userInput: clampedValue,
      maxCorrectIndex: nextMaxCorrect,
      correctKeystrokes: nextCorrect,
      totalKeystrokes: nextTotal,
      mistakes: nextMistakes,
      combo: nextCombo,
      accuracy: nextAccuracy,
      wpm: nextWpm,
      hasInputError: lastCharWasMistake
    },
    isMistake: lastCharWasMistake,
    isCompletedWord,
    completedWord,
    isSentenceCompleted
  };
}
