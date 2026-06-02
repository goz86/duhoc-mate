export function syncLocalTracksToPeer(pc: RTCPeerConnection, stream: MediaStream): boolean {
  let changed = false;

  stream.getTracks().forEach(track => {
    const isAlreadySending = pc.getSenders().some(sender => sender.track === track);
    if (isAlreadySending) return;
    pc.addTrack(track, stream);
    changed = true;
  });

  return changed;
}
