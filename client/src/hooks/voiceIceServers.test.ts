import { describe, expect, it } from 'vitest';
import { buildVoiceRtcConfig } from './voiceIceServers';

describe('buildVoiceRtcConfig', () => {
  it('uses Google STUN servers when TURN is not configured', () => {
    expect(buildVoiceRtcConfig({})).toEqual({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
  });

  it('forces relay transport when all TURN fields are configured', () => {
    expect(buildVoiceRtcConfig({
      VITE_TURN_URL: 'turn:turn.example.com:3478',
      VITE_TURN_USERNAME: 'duhoc',
      VITE_TURN_CREDENTIAL: 'secret',
    })).toEqual({
      iceServers: [
        {
          urls: 'turn:turn.example.com:3478',
          username: 'duhoc',
          credential: 'secret',
        },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      iceTransportPolicy: 'relay',
    });
  });

  it('supports multiple TURN URLs with the same Metered credential', () => {
    const config = buildVoiceRtcConfig({
      VITE_TURN_URLS: 'turn:global.relay.metered.ca:80, turns:global.relay.metered.ca:443?transport=tcp',
      VITE_TURN_USERNAME: 'duhoc',
      VITE_TURN_CREDENTIAL: 'secret',
    });

    expect(config.iceServers?.[0]).toEqual({
      urls: [
        'turn:global.relay.metered.ca:80',
        'turns:global.relay.metered.ca:443?transport=tcp',
      ],
      username: 'duhoc',
      credential: 'secret',
    });
  });

  it('ignores partial TURN config instead of creating a broken ICE server', () => {
    expect(buildVoiceRtcConfig({
      VITE_TURN_URL: 'turn:turn.example.com:3478',
      VITE_TURN_USERNAME: 'duhoc',
    })).toEqual({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
  });
});
