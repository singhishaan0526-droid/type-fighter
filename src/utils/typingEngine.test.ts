import { describe, it, expect } from 'vitest';
import { processTypingInput, type TypingState } from './typingEngine';

describe('Typing Progression and Recovery Engine', () => {
  const initialSentence = 'The quick brown';

  const createInitialState = (): TypingState => ({
    userInput: '',
    maxCorrectIndex: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    mistakes: 0,
    combo: 0,
    accuracy: 100,
    wpm: 0,
    hasInputError: false
  });

  it('handles correct character typing and updates statistics accurately', () => {
    let state = createInitialState();

    // Type 'T'
    const res1 = processTypingInput('T', initialSentence, state, 1, 0);
    expect(res1.isMistake).toBe(false);
    expect(res1.nextState.userInput).toBe('T');
    expect(res1.nextState.correctKeystrokes).toBe(1);
    expect(res1.nextState.totalKeystrokes).toBe(1);
    expect(res1.nextState.mistakes).toBe(0);
    expect(res1.nextState.accuracy).toBe(100);
    expect(res1.nextState.maxCorrectIndex).toBe(1);

    // Type 'h'
    state = res1.nextState;
    const res2 = processTypingInput('Th', initialSentence, state, 1, 0);
    expect(res2.isMistake).toBe(false);
    expect(res2.nextState.userInput).toBe('Th');
    expect(res2.nextState.correctKeystrokes).toBe(2);
    expect(res2.nextState.totalKeystrokes).toBe(2);
    expect(res2.nextState.accuracy).toBe(100);
    expect(res2.nextState.maxCorrectIndex).toBe(2);
  });

  it('rejects wrong character, flags mistake, penalizes combo, and enables immediate recovery without backspace', () => {
    let state = createInitialState();

    // Type 'T' (correct)
    const res1 = processTypingInput('T', initialSentence, state, 1, 0);
    state = res1.nextState;
    state.combo = 5;

    // Type 'x' instead of 'h' (wrong)
    const res2 = processTypingInput('Tx', initialSentence, state, 1, 0);
    expect(res2.isMistake).toBe(true);
    expect(res2.nextState.hasInputError).toBe(true);
    // userInput must NOT contain the invalid 'x'
    expect(res2.nextState.userInput).toBe('T');
    expect(res2.nextState.correctKeystrokes).toBe(1);
    expect(res2.nextState.totalKeystrokes).toBe(2);
    expect(res2.nextState.mistakes).toBe(1);
    // Combo penalized (5 -> 2)
    expect(res2.nextState.combo).toBe(2);
    // Accuracy updated (1/2 = 50%)
    expect(res2.nextState.accuracy).toBe(50);

    // Immediate error recovery: player next presses 'h' (correct character)
    state = res2.nextState;
    const res3 = processTypingInput('Th', initialSentence, state, 1, 0);
    expect(res3.isMistake).toBe(false);
    expect(res3.nextState.hasInputError).toBe(false);
    expect(res3.nextState.userInput).toBe('Th');
    expect(res3.nextState.correctKeystrokes).toBe(2);
    expect(res3.nextState.totalKeystrokes).toBe(3);
    expect(res3.nextState.mistakes).toBe(1);
    // Accuracy: 2/3 = 67%
    expect(res3.nextState.accuracy).toBe(67);
  });

  it('handles backspace and retyping without duplicate counting of correct keystrokes', () => {
    let state = createInitialState();

    // Type 'The '
    const text = 'The ';
    for (let i = 0; i < text.length; i++) {
      const slice = text.slice(0, i + 1);
      const res = processTypingInput(slice, initialSentence, state, 1, 0);
      state = res.nextState;
    }

    expect(state.userInput).toBe('The ');
    expect(state.correctKeystrokes).toBe(4);
    expect(state.totalKeystrokes).toBe(4);
    expect(state.maxCorrectIndex).toBe(4);

    // User backspaces twice to 'Th'
    const bs1 = processTypingInput('The', initialSentence, state, 1, 1);
    state = bs1.nextState;
    const bs2 = processTypingInput('Th', initialSentence, state, 1, 1);
    state = bs2.nextState;

    expect(state.userInput).toBe('Th');
    expect(state.correctKeystrokes).toBe(4);
    expect(state.maxCorrectIndex).toBe(4);

    // User re-types 'e'
    const retypeE = processTypingInput('The', initialSentence, state, 1, 1);
    state = retypeE.nextState;

    // correctKeystrokes must NOT increase because index 2 was already processed!
    expect(state.userInput).toBe('The');
    expect(state.correctKeystrokes).toBe(4);
    expect(state.totalKeystrokes).toBe(5);
    expect(state.accuracy).toBe(80); // 4 / 5 = 80%

    // User re-types ' '
    const retypeSpace = processTypingInput('The ', initialSentence, state, 1, 1);
    state = retypeSpace.nextState;
    expect(state.userInput).toBe('The ');
    expect(state.correctKeystrokes).toBe(4);
    expect(state.totalKeystrokes).toBe(6);
    // Word was already completed previously, so no duplicate word attack event
    expect(retypeSpace.isCompletedWord).toBe(false);

    // User types new character 'q'
    const typeQ = processTypingInput('The q', initialSentence, state, 1, 1);
    state = typeQ.nextState;
    // New character advances correctKeystrokes
    expect(state.userInput).toBe('The q');
    expect(state.correctKeystrokes).toBe(5);
    expect(state.totalKeystrokes).toBe(7);
    expect(state.maxCorrectIndex).toBe(5);
  });

  it('triggers word completion at word boundary and full sentence completion at the end', () => {
    const target = 'Cat dog';
    let state = createInitialState();

    // Type 'Cat '
    let res;
    for (let i = 0; i < 4; i++) {
      res = processTypingInput(target.slice(0, i + 1), target, state, 1, 0);
      state = res.nextState;
    }

    expect(res?.isCompletedWord).toBe(true);
    expect(res?.completedWord).toBe('Cat');
    expect(res?.isSentenceCompleted).toBe(false);

    // Type 'dog'
    for (let i = 4; i < target.length; i++) {
      res = processTypingInput(target.slice(0, i + 1), target, state, 1, 1);
      state = res.nextState;
    }

    expect(res?.isCompletedWord).toBe(true);
    expect(res?.completedWord).toBe('dog');
    expect(res?.isSentenceCompleted).toBe(true);
    expect(state.userInput).toBe(target);
  });
});
