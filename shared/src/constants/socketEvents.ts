export const SOCKET_EVENTS = {
  CLIENT: {
    MATCH_JOIN: 'match:join',
    PLAYER_CHARACTER: 'player:character',
    MATCH_READY: 'match:ready',
    TYPING_INPUT: 'typing:input',
    MATCH_RESUME: 'match:resume',
    MATCH_LEAVE: 'match:leave',
    DISCONNECT: 'disconnect'
  },
  SERVER: {
    MATCH_STATE: 'match:state',
    PLAYER_JOINED: 'player:joined',
    PLAYER_CHARACTER: 'player:character',
    PLAYER_READY: 'player:ready',
    MATCH_COUNTDOWN: 'match:countdown',
    MATCH_STARTED: 'match:started',
    TYPING_PROGRESS: 'typing:progress',
    COMBAT_ATTACK: 'combat:attack',
    PLAYER_HEALTH: 'player:health',
    MATCH_FINISHED: 'match:finished',
    MATCH_ERROR: 'match:error',
    CONNECTION_STATUS: 'connection:status'
  }
} as const;
