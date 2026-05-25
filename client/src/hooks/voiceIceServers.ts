type VoiceIceEnv = Record<string, string | undefined>;

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function buildVoiceIceServers(env: VoiceIceEnv): RTCIceServer[] {
  const turnUrl = env.VITE_TURN_URL?.trim();
  const turnUsername = env.VITE_TURN_USERNAME?.trim();
  const turnCredential = env.VITE_TURN_CREDENTIAL?.trim();

  if (!turnUrl || !turnUsername || !turnCredential) {
    return STUN_SERVERS;
  }

  return [
    {
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    },
    ...STUN_SERVERS,
  ];
}

export const VOICE_ICE_SERVERS = buildVoiceIceServers(import.meta.env);
