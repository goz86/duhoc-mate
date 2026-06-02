import { describe, expect, it } from 'vitest';
import {
  canApplyRemoteAnswer,
  getOfferCollisionAction,
  isPolitePeer,
  shouldOpenPeerForJoinedVoiceUser,
  shouldOpenPeerForRemoteCameraChange,
  shouldFlushQueuedRenegotiation,
  shouldQueueRenegotiation,
} from './voiceSignaling';

describe('voice WebRTC negotiation helpers', () => {
  it('assigns one polite peer deterministically for a socket pair', () => {
    expect(isPolitePeer('socket-a', 'socket-b')).toBe(false);
    expect(isPolitePeer('socket-b', 'socket-a')).toBe(true);
  });

  it('accepts a colliding offer only on the polite peer', () => {
    expect(getOfferCollisionAction({
      localId: 'socket-a',
      remoteId: 'socket-b',
      makingOffer: true,
      signalingState: 'have-local-offer',
    })).toBe('ignore');

    expect(getOfferCollisionAction({
      localId: 'socket-b',
      remoteId: 'socket-a',
      makingOffer: true,
      signalingState: 'have-local-offer',
    })).toBe('rollback-and-accept');
  });

  it('ignores stale answers after a local offer has already been rolled back', () => {
    expect(canApplyRemoteAnswer('have-local-offer')).toBe(true);
    expect(canApplyRemoteAnswer('stable')).toBe(false);
  });

  it('lets receive-only subscribers open to new voice users but avoids voice-user glare', () => {
    expect(shouldOpenPeerForJoinedVoiceUser({ isInVoice: false })).toBe(true);
    expect(shouldOpenPeerForJoinedVoiceUser({ isInVoice: true })).toBe(false);
  });

  it('uses the same glare-safe rule when a remote user turns on camera', () => {
    expect(shouldOpenPeerForRemoteCameraChange({ isInVoice: false })).toBe(true);
    expect(shouldOpenPeerForRemoteCameraChange({ isInVoice: true })).toBe(false);
  });

  it('queues renegotiation while an offer is still in flight', () => {
    expect(shouldQueueRenegotiation({ makingOffer: false, signalingState: 'stable' })).toBe(false);
    expect(shouldQueueRenegotiation({ makingOffer: true, signalingState: 'stable' })).toBe(true);
    expect(shouldQueueRenegotiation({ makingOffer: false, signalingState: 'have-local-offer' })).toBe(true);
  });

  it('flushes queued renegotiation once the answerer is stable', () => {
    expect(shouldFlushQueuedRenegotiation({ needsNegotiation: true, signalingState: 'stable' })).toBe(true);
    expect(shouldFlushQueuedRenegotiation({ needsNegotiation: true, signalingState: 'have-remote-offer' })).toBe(false);
    expect(shouldFlushQueuedRenegotiation({ needsNegotiation: false, signalingState: 'stable' })).toBe(false);
  });
});
