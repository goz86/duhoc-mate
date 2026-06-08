import { describe, expect, it } from 'vitest';
import { VOICE_RTC_CONFIG } from './voiceIceServers';

describe('VOICE_RTC_CONFIG', () => {
  it('uses OpenRelay configuration', () => {
    expect(VOICE_RTC_CONFIG.iceServers).toEqual([
      {
        urls: "stun:openrelay.metered.ca:80"
      },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelay",
        credential: "openrelay"
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelay",
        credential: "openrelay"
      }
    ]);
  });
});
