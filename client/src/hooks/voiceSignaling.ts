export type OfferCollisionAction = 'accept' | 'rollback-and-accept' | 'ignore';

export function isPolitePeer(localId: string, remoteId: string): boolean {
  return localId > remoteId;
}

export function getOfferCollisionAction({
  localId,
  remoteId,
  makingOffer,
  signalingState,
}: {
  localId: string;
  remoteId: string;
  makingOffer: boolean;
  signalingState: RTCSignalingState;
}): OfferCollisionAction {
  const hasCollision = makingOffer || signalingState !== 'stable';
  if (!hasCollision) return 'accept';
  return isPolitePeer(localId, remoteId) ? 'rollback-and-accept' : 'ignore';
}

export function canApplyRemoteAnswer(signalingState: RTCSignalingState): boolean {
  return signalingState === 'have-local-offer';
}

export function shouldOpenPeerForJoinedVoiceUser({ isInVoice }: { isInVoice: boolean }): boolean {
  return !isInVoice;
}

export function shouldOpenPeerForRemoteCameraChange({ isInVoice }: { isInVoice: boolean }): boolean {
  return !isInVoice;
}

export function shouldQueueRenegotiation({
  makingOffer,
  signalingState,
}: {
  makingOffer: boolean;
  signalingState: RTCSignalingState;
}): boolean {
  return makingOffer || signalingState !== 'stable';
}

export function shouldFlushQueuedRenegotiation({
  needsNegotiation,
  signalingState,
}: {
  needsNegotiation: boolean;
  signalingState: RTCSignalingState;
}): boolean {
  return needsNegotiation && signalingState === 'stable';
}
