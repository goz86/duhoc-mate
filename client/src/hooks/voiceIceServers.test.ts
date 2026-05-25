import { describe, expect, it } from 'vitest';
import { buildVoiceIceServers } from './voiceIceServers';

describe('buildVoiceIceServers', () => {
  it('uses Google STUN servers when TURN is not configured', () => {
    expect(buildVoiceIceServers({})).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });

  it('adds a TURN server before STUN when all TURN fields are configured', () => {
    expect(buildVoiceIceServers({
      VITE_TURN_URL: 'turn:turn.example.com:3478',
      VITE_TURN_USERNAME: 'duhoc',
      VITE_TURN_CREDENTIAL: 'secret',
    })).toEqual([
      {
        urls: 'turn:turn.example.com:3478',
        username: 'duhoc',
        credential: 'secret',
      },
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });

  it('ignores partial TURN config instead of creating a broken ICE server', () => {
    expect(buildVoiceIceServers({
      VITE_TURN_URL: 'turn:turn.example.com:3478',
      VITE_TURN_USERNAME: 'duhoc',
    })).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });
});
