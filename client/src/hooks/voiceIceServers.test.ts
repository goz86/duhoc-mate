import { describe, expect, it } from 'vitest';
import { VOICE_RTC_CONFIG } from './voiceIceServers';

describe('VOICE_RTC_CONFIG', () => {
  it('uses OpenRelay configuration with TCP and relay policy', () => {
    expect(VOICE_RTC_CONFIG).toEqual({
      iceServers: [
        {
          urls: "stun:openrelay.metered.ca:80"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:80?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ],
      iceTransportPolicy: "relay"
    });
  });
});
