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
