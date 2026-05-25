type VoiceIceEnv = Record<string, string | undefined>;

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const splitTurnUrls = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/[\n,]+/)
    .map(url => url.trim())
    .filter(Boolean);
};

export function buildVoiceRtcConfig(env: VoiceIceEnv): RTCConfiguration {
  const turnUrls = splitTurnUrls(env.VITE_TURN_URLS);
  const legacyTurnUrl = env.VITE_TURN_URL?.trim();
  if (!turnUrls.length && legacyTurnUrl) turnUrls.push(legacyTurnUrl);

  const turnUsername = env.VITE_TURN_USERNAME?.trim();
  const turnCredential = env.VITE_TURN_CREDENTIAL?.trim();

  if (!turnUrls.length || !turnUsername || !turnCredential) {
    return { iceServers: STUN_SERVERS };
  }

  return {
    iceServers: [
      {
        urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
        username: turnUsername,
        credential: turnCredential,
      },
      ...STUN_SERVERS,
    ],
    iceTransportPolicy: 'relay',
  };
}

export const VOICE_RTC_CONFIG = buildVoiceRtcConfig(import.meta.env);
