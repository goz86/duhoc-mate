export const VOICE_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:80?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
  iceTransportPolicy: "relay"
};
