import { describe, expect, it, vi } from 'vitest';
import { syncLocalTracksToPeer } from './voicePeerTracks';

describe('syncLocalTracksToPeer', () => {
  it('adds missing local tracks to an existing peer connection', () => {
    const audioTrack = { kind: 'audio' } as MediaStreamTrack;
    const videoTrack = { kind: 'video' } as MediaStreamTrack;
    const stream = {
      getTracks: () => [audioTrack, videoTrack],
    } as MediaStream;
    const addTrack = vi.fn();
    const pc = {
      getSenders: () => [],
      addTrack,
    } as unknown as RTCPeerConnection;

    expect(syncLocalTracksToPeer(pc, stream)).toBe(true);
    expect(addTrack).toHaveBeenCalledWith(audioTrack, stream);
    expect(addTrack).toHaveBeenCalledWith(videoTrack, stream);
  });

  it('does not add a track that is already being sent', () => {
    const audioTrack = { kind: 'audio' } as MediaStreamTrack;
    const stream = {
      getTracks: () => [audioTrack],
    } as MediaStream;
    const addTrack = vi.fn();
    const pc = {
      getSenders: () => [{ track: audioTrack }],
      addTrack,
    } as unknown as RTCPeerConnection;

    expect(syncLocalTracksToPeer(pc, stream)).toBe(false);
    expect(addTrack).not.toHaveBeenCalled();
  });
});
