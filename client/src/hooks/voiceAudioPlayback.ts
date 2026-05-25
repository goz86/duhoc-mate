export function getRemoteAudioVolume(userVolume: number, masterVolume: number, isDeafened: boolean): number {
  if (isDeafened) return 0;
  return Math.max(0, Math.min(1, userVolume * masterVolume));
}
