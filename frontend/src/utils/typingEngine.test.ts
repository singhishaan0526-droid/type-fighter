import { describe, it, expect } from 'vitest';
import { processTypingInput, type TypingState } from './typingEngine';

describe('Typing Progression and Recovery Engine (Never Block Typing)', () => {
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

  it('1. Correct characters advance normally', () => {
    let state = createInitialState();

    // Type 'T'
    const res1 = processTypingInput('T', initialSentence, state, 1, 0);
    expect(res1.isMistake).toBe(false);
    expect(res1.nextState.userInput).toBe('T');
    expect(res1.nextState.correctKeystrokes).toBe(1);
    expect(res1.nextState.totalKeystrokes).toBe(1);
    expect(res1.nextState.mistakes).toBe(0);
    expect(res1.nextState.accuracy).toBe(100);
    expect(res1.nextState.combo).toBe(1);
    expect(res1.nextState.maxCorrectIndex).toBe(1);

    // Type 'h'
    state = res1.nextState;
    const res2 = processTypingInput('Th', initialSentence, state, 1, 0);
    expect(res2.isMistake).toBe(false);
    expect(res2.nextState.userInput).toBe('Th');
    expect(res2.nextState.correctKeystrokes).toBe(2);
    expect(res2.nextState.totalKeystrokes).toBe(2);
    expect(res2.nextState.accuracy).toBe(100);
    expect(res2.nextState.combo).toBe(2);
    expect(res2.nextState.maxCorrectIndex).toBe(2);
  });

  it('2. Wrong characters are accepted and counted as mistakes without blocking', () => {
    let state = createInitialState();

    // Type 'T' (correct)
    const res1 = processTypingInput('T', initialSentence, state, 1, 0);
    state = res1.nextState;
    state.combo = 5;

    // Type 'x' instead of 'h' (wrong)
    const res2 = processTypingInput('Tx', initialSentence, state, 1, 0);
    expect(res2.isMistake).toBe(true);
    expect(res2.nextState.hasInputError).toBe(true);
    // userInput MUST accept 'x' and advance progress!
    expect(res2.nextState.userInput).toBe('Tx');
    expect(res2.nextState.correctKeystrokes).toBe(1);
    expect(res2.nextState.totalKeystrokes).toBe(2);
    expect(res2.nextState.mistakes).toBe(1);
    // Combo penalized (5 -> 2)
    expect(res2.nextState.combo).toBe(2);
    // Accuracy updated (1/2 = 50%)
    expect(res2.nextState.accuracy).toBe(50);
  });

  it('3. Typing continues immediately after a wrong character without backspacing', () => {
    let state = createInitialState();

    // Type 'T' (correct) -> 'Tx' (wrong) -> 'Txe' (types next character 'e')
    const res1 = processTypingInput('T', initialSentence, state, 1, 0);
    const res2 = processTypingInput('Tx', initialSentence, res1.nextState, 1, 0);

    // Player presses 'e' immediately without backspacing
    const res3 = processTypingInput('Txe', initialSentence, res2.nextState, 1, 0);
    expect(res3.isMistake).toBe(false);
    expect(res3.nextState.hasInputError).toBe(false);
    expect(res3.nextState.userInput).toBe('Txe');
    // 'T' and 'e' are correct (2 correct), 'x' is mistake (1 mistake)
    expect(res3.nextState.correctKeystrokes).toBe(2);
    expect(res3.nextState.totalKeystrokes).toBe(3);
    expect(res3.nextState.mistakes).toBe(1);
    expect(res3.nextState.accuracy).toBe(67); // 2/3 = 67%
    expect(res3.nextState.combo).toBe(1); // combo restarted/incremented from penalty
  });

  it('4. PRD example: Target "SHADOW", Player types "SHXDOZ" completes at 100% progress with mistakes', () => {
    const target = 'SHADOW';
    let state = createInitialState();

    const typedSequence = ['S', 'SH', 'SHX', 'SHXD', 'SHXDO', 'SHXDOZ'];
    let lastRes;

    for (const text of typedSequence) {
      lastRes = processTypingInput(text, target, state, 1, 0);
      state = lastRes.nextState;
    }

    expect(state.userInput).toBe('SHXDOZ');
    expect(state.userInput.length).toBe(target.length);
    // Accepted all 6 characters
    expect(state.totalKeystrokes).toBe(6);
    // S, H, D, O are correct (4)
    expect(state.correctKeystrokes).toBe(4);
    // X, Z are mistakes (2)
    expect(state.mistakes).toBe(2);
    // Accuracy: 4 / 6 = 67%
    expect(state.accuracy).toBe(67);
    // Sentence is completed!
    expect(lastRes?.isSentenceCompleted).toBe(true);
    expect(lastRes?.isCompletedWord).toBe(true);
    expect(lastRes?.completedWord).toBe('SHADOW');
  });

  it('5. Clamps input length to target sentence length and triggers completion', () => {
    const target = 'Fast';
    let state = createInitialState();

    // Type 4 chars
    const res = processTypingInput('Fxyz', target, state, 1, 0);
    expect(res.isSentenceCompleted).toBe(true);
    expect(res.nextState.userInput).toBe('Fxyz');
    expect(res.nextState.mistakes).toBe(3);
    expect(res.nextState.correctKeystrokes).toBe(1);

    // Any extra character beyond length does not overflow
    const extra = processTypingInput('Fxyz!', target, res.nextState, 1, 0);
    expect(extra.nextState.userInput).toBe('Fxyz');
    expect(extra.isSentenceCompleted).toBe(true);
  });

  it('6. Word completion triggers at word boundary and full sentence completion at the end', () => {
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

    // Type 'dog' with a typo in the middle 'd9g'
    const dogTypo = ['Cat d', 'Cat d9', 'Cat d9g'];
    for (let i = 0; i < dogTypo.length; i++) {
      res = processTypingInput(dogTypo[i], target, state, 1, 1);
      state = res.nextState;
    }

    expect(res?.isCompletedWord).toBe(true);
    expect(res?.completedWord).toBe('dog');
    expect(res?.isSentenceCompleted).toBe(true);
    expect(state.userInput).toBe('Cat d9g');
    expect(state.mistakes).toBe(1);
  });

  it('7. Handles optional backspacing without duplicating correct keystroke counts', () => {
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

    // correctKeystrokes must NOT increase because index 2 was already counted!
    expect(state.userInput).toBe('The');
    expect(state.correctKeystrokes).toBe(4);
    expect(state.totalKeystrokes).toBe(5);
    expect(state.accuracy).toBe(80); // 4 / 5 = 80%
  });

  it('8. Multiple consecutive wrong characters do not freeze progression', () => {
    let state = createInitialState();

    // Type 5 consecutive wrong characters for target 'The quick'
    const wrongSeq = ['X', 'XY', 'XYZ', 'XYZ1', 'XYZ12'];
    let res;
    for (const val of wrongSeq) {
      res = processTypingInput(val, 'The quick', state, 1, 0);
      state = res.nextState;
    }

    expect(state.userInput).toBe('XYZ12');
    expect(state.userInput.length).toBe(5);
    expect(state.mistakes).toBe(5);
    expect(state.correctKeystrokes).toBe(0);
    expect(state.totalKeystrokes).toBe(5);
    expect(state.accuracy).toBe(0);
    expect(res?.isMistake).toBe(true);

    // Can immediately type next character (even if correct or wrong)
    const nextRes = processTypingInput('XYZ12u', 'The quick', state, 1, 0);
    expect(nextRes.nextState.userInput).toBe('XYZ12u');
    expect(nextRes.nextState.userInput.length).toBe(6);
    expect(nextRes.nextState.totalKeystrokes).toBe(6);
  });

  it('9. Completing a sentence triggers exactly one completion transition and subsequent input is bounded', () => {
    let state = createInitialState();
    const target = 'Done';

    // Type 'Done'
    const res = processTypingInput('Done', target, state, 1, 0);
    expect(res.isSentenceCompleted).toBe(true);
    expect(res.nextState.userInput).toBe('Done');

    // Attempting extra characters does not grow beyond target length
    const extra = processTypingInput('Done!', target, res.nextState, 1, 0);
    expect(extra.nextState.userInput).toBe('Done');
    expect(extra.isSentenceCompleted).toBe(true);
  });

  it('10. Repeated React updates and backspace do not corrupt position or mistake accounting', () => {
    let state = createInitialState();
    const target = 'Byte';

    // Type 'B' (correct) -> 'By' (correct) -> 'Byx' (wrong 'x')
    let res = processTypingInput('B', target, state, 1, 0);
    res = processTypingInput('By', target, res.nextState, 1, 0);
    res = processTypingInput('Byx', target, res.nextState, 1, 0);

    expect(res.nextState.userInput).toBe('Byx');
    expect(res.nextState.mistakes).toBe(1);
    expect(res.nextState.correctKeystrokes).toBe(2);
    expect(res.nextState.totalKeystrokes).toBe(3);

    // Player backspaces 'x' -> 'By'
    const bs = processTypingInput('By', target, res.nextState, 1, 0);
    expect(bs.nextState.userInput).toBe('By');
    // Mistake from typing 'x' remains accounted for in total and mistakes
    expect(bs.nextState.mistakes).toBe(1);
    expect(bs.nextState.correctKeystrokes).toBe(2);
    expect(bs.nextState.totalKeystrokes).toBe(3);

    // Player types correct 't' -> 'Byt'
    const cont = processTypingInput('Byt', target, bs.nextState, 1, 0);
    expect(cont.nextState.userInput).toBe('Byt');
    expect(cont.nextState.mistakes).toBe(1);
    expect(cont.nextState.correctKeystrokes).toBe(3);
    expect(cont.nextState.totalKeystrokes).toBe(4);
    expect(cont.nextState.accuracy).toBe(75); // 3 / 4 = 75%
  });
});
