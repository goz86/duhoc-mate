import { describe, expect, it } from 'vitest';
import { getRemoteAudioVolume } from './voiceAudioPlayback';

describe('getRemoteAudioVolume', () => {
  it('combines per-user and master volume', () => {
    expect(getRemoteAudioVolume(0.5, 0.8, false)).toBe(0.4);
  });

  it('returns silence while deafened', () => {
    expect(getRemoteAudioVolume(1, 1, true)).toBe(0);
  });

  it('clamps the computed volume to the browser range', () => {
    expect(getRemoteAudioVolume(2, 2, false)).toBe(1);
  });
});
