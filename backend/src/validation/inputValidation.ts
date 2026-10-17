import type { CharacterId, JoinPayload, TypingInputPayload, ResumePayload } from '@type-fighter/shared';

const VALID_CHARACTERS: CharacterId[] = ['byte', 'glitch', 'zenko', 'nova', 'zephyr', 'raven'];

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
}

export function validateSessionId(sessionId: unknown): ValidationResult<string> {
  if (typeof sessionId !== 'string') {
    return { isValid: false, errorCode: 'INVALID_SESSION_ID', errorMessage: 'Session ID must be a string.' };
  }
  const trimmed = sessionId.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    return { isValid: false, errorCode: 'INVALID_SESSION_ID', errorMessage: 'Session ID must be between 1 and 50 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, errorCode: 'INVALID_SESSION_ID', errorMessage: 'Session ID contains invalid characters.' };
  }
  return { isValid: true, data: trimmed };
}

export function validateCharacterId(characterId: unknown): ValidationResult<CharacterId> {
  if (typeof characterId !== 'string' || !VALID_CHARACTERS.includes(characterId as CharacterId)) {
    return { isValid: false, errorCode: 'INVALID_CHARACTER', errorMessage: 'Invalid or unsupported character ID.' };
  }
  return { isValid: true, data: characterId as CharacterId };
}

export function validateJoinPayload(payload: unknown): ValidationResult<JoinPayload> {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errorCode: 'BAD_PAYLOAD', errorMessage: 'Payload must be an object.' };
  }
  const data = payload as Record<string, unknown>;
  const sessionValidation = validateSessionId(data.sessionId);
  if (!sessionValidation.isValid) {
    return { isValid: false, errorCode: sessionValidation.errorCode, errorMessage: sessionValidation.errorMessage };
  }
  const characterValidation = validateCharacterId(data.characterId);
  if (!characterValidation.isValid) {
    return { isValid: false, errorCode: characterValidation.errorCode, errorMessage: characterValidation.errorMessage };
  }

  const reconnectToken = typeof data.reconnectToken === 'string' && data.reconnectToken.length <= 100
    ? data.reconnectToken.trim()
    : undefined;

  const playerName = typeof data.playerName === 'string' && data.playerName.length <= 30
    ? data.playerName.trim()
    : undefined;

  return {
    isValid: true,
    data: {
      sessionId: sessionValidation.data!,
      characterId: characterValidation.data!,
      reconnectToken,
      playerName
    }
  };
}

export function validateTypingInputPayload(payload: unknown): ValidationResult<TypingInputPayload> {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errorCode: 'MALFORMED_INPUT', errorMessage: 'Payload must be an object.' };
  }

  const data = payload as Record<string, unknown>;

  // seq must be a positive safe integer
  if (!Number.isSafeInteger(data.seq) || (data.seq as number) <= 0) {
    return { isValid: false, errorCode: 'INVALID_SEQUENCE', errorMessage: 'Sequence number must be a positive safe integer.' };
  }

  // challengeId must be a non-empty string with bounded length
  if (typeof data.challengeId !== 'string' || data.challengeId.trim().length === 0 || data.challengeId.length > 100) {
    return { isValid: false, errorCode: 'INVALID_CHALLENGE_ID', errorMessage: 'Challenge ID must be a non-empty valid string.' };
  }

  // index must be a non-negative safe integer
  if (!Number.isSafeInteger(data.index) || (data.index as number) < 0) {
    return { isValid: false, errorCode: 'INVALID_INDEX', errorMessage: 'Progression index must be a non-negative safe integer.' };
  }

  // char must be exactly one UTF-16 code unit / character
  if (typeof data.char !== 'string' || data.char.length !== 1) {
    return { isValid: false, errorCode: 'MALFORMED_CHAR', errorMessage: 'Input char must be a single character.' };
  }

  // timestamp check
  let timestamp = Date.now();
  if (data.timestamp !== undefined) {
    if (!Number.isSafeInteger(data.timestamp) || (data.timestamp as number) <= 0) {
      return { isValid: false, errorCode: 'INVALID_TIMESTAMP', errorMessage: 'Timestamp must be a valid safe integer.' };
    }
    timestamp = data.timestamp as number;
  }

  return {
    isValid: true,
    data: {
      seq: data.seq as number,
      challengeId: (data.challengeId as string).trim(),
      index: data.index as number,
      char: data.char as string,
      timestamp
    }
  };
}

export function validateResumePayload(payload: unknown): ValidationResult<ResumePayload> {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errorCode: 'BAD_RESUME_PAYLOAD', errorMessage: 'Payload must be an object.' };
  }
  const data = payload as Record<string, unknown>;
  const sessionValidation = validateSessionId(data.sessionId);
  if (!sessionValidation.isValid) {
    return { isValid: false, errorCode: sessionValidation.errorCode, errorMessage: sessionValidation.errorMessage };
  }
  if (typeof data.reconnectToken !== 'string' || data.reconnectToken.trim().length === 0 || data.reconnectToken.length > 100) {
    return { isValid: false, errorCode: 'INVALID_RECONNECT_TOKEN', errorMessage: 'Reconnect token is missing or invalid.' };
  }
  return {
    isValid: true,
    data: {
      sessionId: sessionValidation.data!,
      reconnectToken: data.reconnectToken.trim()
    }
  };
}
