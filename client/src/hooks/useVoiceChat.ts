/**
 * useVoiceChat - WebRTC Mesh Voice Chat Hook
 *
 * Architecture: Full-mesh P2P, mỗi cặp user có 1 RTCPeerConnection riêng.
 * Signaling: Socket.IO (đã có sẵn trong app).
 * Audio: Web Audio API (AudioContext, GainNode, AnalyserNode) cho volume control & VAD.
 * STUN: Google miễn phí (không cần TURN cho local/same-network).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoiceUserState {
  muted: boolean;
  speaking: boolean;
  volume: number; // 0-1, per-user local volume
}

interface PeerData {
  pc: RTCPeerConnection;
  gainNode: GainNode | null;
}

interface UseVoiceChatReturn {
  isInVoice: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isDeafened: boolean;     // Tắt hết tiếng người khác (tai nghe bị tắt)
  voiceUsers: Map<string, VoiceUserState>;
  masterVolume: number;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;   // Bật/tắt deafen (tắt hết tai nghe)
  setMasterVolume: (v: number) => void;
  setUserVolume: (userId: string, v: number) => void;
  hostMuteUser: (targetId: string, muted: boolean) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const VAD_THRESHOLD = 20;       // Ngưỡng âm lượng tính là "đang nói"
const VAD_INTERVAL_MS = 150;    // Kiểm tra mỗi 150ms

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceChat(
  socket: Socket | null,
  roomId: string,
  isHost: boolean
): UseVoiceChatReturn {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isInVoice, setIsInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);  // Tắt hết tai nghe (deafen)
  const [voiceUsers, setVoiceUsers] = useState<Map<string, VoiceUserState>>(new Map());
  const [masterVolume, setMasterVolumeState] = useState(1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const peersRef = useRef<Map<string, PeerData>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMutedRef = useRef(false);
  const isInVoiceRef = useRef(false);
  const isDeafenedRef = useRef(false);
  const roomIdRef = useRef(roomId);
  const isSpeakingRef = useRef(false);
  const masterVolumeBeforeDeafenRef = useRef(1); // Lưu volume trước khi deafen

  // Sync refs
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isInVoiceRef.current = isInVoice; }, [isInVoice]);
  useEffect(() => { isDeafenedRef.current = isDeafened; }, [isDeafened]);

  // ── Helper: tạo AudioContext nếu chưa có ──────────────────────────────────
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = masterVolume;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    return audioCtxRef.current;
  }, [masterVolume]);

  // ── Helper: tạo RTCPeerConnection ─────────────────────────────────────────
  const createPeerConnection = useCallback((targetId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // ICE candidate → gửi qua signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice-ice-candidate', { targetId, candidate: event.candidate });
      }
    };

    // Nhận audio track từ remote peer
    pc.ontrack = (event) => {
      const ctx = getAudioContext();
      const remoteStream = event.streams[0];
      const source = ctx.createMediaStreamSource(remoteStream);
      const gainNode = ctx.createGain();

      // Per-user volume (default 1)
      gainNode.gain.value = voiceUsers.get(targetId)?.volume ?? 1;
      source.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      // Cập nhật gainNode reference
      const existingPeer = peersRef.current.get(targetId);
      if (existingPeer) {
        existingPeer.gainNode = gainNode;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(targetId);
      }
    };

    return pc;
  }, [socket, getAudioContext, voiceUsers]);

  // ── Helper: thêm local tracks vào peer connection ─────────────────────────
  const addLocalTracks = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach(track => {
      if (!pc.getSenders().find(s => s.track === track)) {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  // ── VAD: Voice Activity Detection ─────────────────────────────────────────
  const startVAD = useCallback(() => {
    if (vadTimerRef.current) clearInterval(vadTimerRef.current);
    const analyser = analyserRef.current;
    if (!analyser || !socket) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    vadTimerRef.current = setInterval(() => {
      if (!isInVoiceRef.current || isMutedRef.current) {
        if (isSpeakingRef.current) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          socket.emit('voice-speaking', { roomId: roomIdRef.current, speaking: false });
        }
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const nowSpeaking = average > VAD_THRESHOLD;

      if (nowSpeaking !== isSpeakingRef.current) {
        isSpeakingRef.current = nowSpeaking;
        setIsSpeaking(nowSpeaking);
        socket.emit('voice-speaking', { roomId: roomIdRef.current, speaking: nowSpeaking });
      }
    }, VAD_INTERVAL_MS);
  }, [socket]);

  // ── joinVoice ─────────────────────────────────────────────────────────────
  const joinVoice = useCallback(async () => {
    if (!socket || isInVoiceRef.current) return;

    try {
      // 1. Xin quyền mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      // 2. Thiết lập AudioContext + AnalyserNode cho VAD
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 3. Update state
      setIsInVoice(true);
      isInVoiceRef.current = true;
      setIsMuted(false);
      isMutedRef.current = false;

      // 4. Thông báo server
      socket.emit('voice-join', { roomId: roomIdRef.current });

      // 5. Bắt đầu VAD
      startVAD();
    } catch (err) {
      console.error('[VoiceChat] getUserMedia failed:', err);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền trình duyệt.');
    }
  }, [socket, getAudioContext, startVAD]);

  // ── leaveVoice ────────────────────────────────────────────────────────────
  const leaveVoice = useCallback(() => {
    if (!socket) return;

    // Dừng VAD
    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }

    // Đóng tất cả peer connections
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();

    // Dừng local stream
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    // Đóng AudioContext
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    masterGainRef.current = null;
    analyserRef.current = null;

    // Update state
    setIsInVoice(false);
    isInVoiceRef.current = false;
    setIsMuted(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    // Thông báo server
    socket.emit('voice-leave', { roomId: roomIdRef.current });
  }, [socket]);

  // ── toggleMute ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream || !socket) return;

    const newMuted = !isMutedRef.current;
    stream.getAudioTracks().forEach(track => { track.enabled = !newMuted; });
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;

    if (newMuted && isSpeakingRef.current) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }

    socket.emit('voice-mute-changed', { roomId: roomIdRef.current, muted: newMuted });
  }, [socket]);

  // ── toggleDeafen: tắt/bật hết âm thanh từ người khác (như Discord deafen) ──
  const toggleDeafen = useCallback(() => {
    const newDeafened = !isDeafenedRef.current;
    setIsDeafened(newDeafened);
    isDeafenedRef.current = newDeafened;

    if (masterGainRef.current) {
      if (newDeafened) {
        // Lưu volume hiện tại trước khi deafen
        masterVolumeBeforeDeafenRef.current = masterGainRef.current.gain.value;
        masterGainRef.current.gain.value = 0;
      } else {
        // Khôi phục volume trước khi deafen
        masterGainRef.current.gain.value = masterVolumeBeforeDeafenRef.current;
      }
    }

    // Khi deafen, tự động mute mic luôn (như Discord)
    if (newDeafened) {
      const stream = localStreamRef.current;
      if (stream && !isMutedRef.current) {
        stream.getAudioTracks().forEach(track => { track.enabled = false; });
        setIsMuted(true);
        isMutedRef.current = true;
        if (isSpeakingRef.current) { isSpeakingRef.current = false; setIsSpeaking(false); }
      }
    }
    // Khi bỏ deafen, không tự unmute mic (giống Discord – user tự unmute)
  }, []);

  // ── setMasterVolume ───────────────────────────────────────────────────────
  const setMasterVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    // Chỉ update gain nếu không đang deafen
    if (!isDeafenedRef.current && masterGainRef.current) {
      masterGainRef.current.gain.value = clamped;
    }
    // Luôn lưu giá trị (để khôi phục khi bỏ deafen)
    setMasterVolumeState(clamped);
    masterVolumeBeforeDeafenRef.current = clamped;
  }, []);

  // ── setUserVolume (per-user local volume) ─────────────────────────────────
  const setUserVolume = useCallback((userId: string, v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    const peerData = peersRef.current.get(userId);
    if (peerData?.gainNode) {
      peerData.gainNode.gain.value = clamped;
    }
    setVoiceUsers(prev => {
      const next = new Map(prev);
      const user = next.get(userId);
      if (user) next.set(userId, { ...user, volume: clamped });
      return next;
    });
  }, []);

  // ── hostMuteUser ──────────────────────────────────────────────────────────
  const hostMuteUser = useCallback((targetId: string, muted: boolean) => {
    if (!socket || !isHost) return;
    socket.emit('voice-host-mute', { roomId: roomIdRef.current, targetId, muted });
  }, [socket, isHost]);

  // ── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Nhận danh sách voice users hiện tại khi vừa join
    const onVoiceUsers = ({ users }: { users: Record<string, VoiceUserState> }) => {
      const map = new Map<string, VoiceUserState>();
      Object.entries(users).forEach(([id, state]) => {
        map.set(id, { ...state, volume: 1 });
      });
      setVoiceUsers(map);
    };

    // User mới vào voice → ta là người đã có mặt → initiate offer
    const onVoiceUserJoined = async ({ userId }: { userId: string; username: string }) => {
      setVoiceUsers(prev => {
        const next = new Map(prev);
        next.set(userId, { muted: false, speaking: false, volume: 1 });
        return next;
      });

      if (!isInVoiceRef.current) return; // Ta chưa vào voice, không cần kết nối

      const pc = createPeerConnection(userId);
      addLocalTracks(pc);
      peersRef.current.set(userId, { pc, gainNode: null });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('voice-offer', { targetId: userId, offer });
    };

    // Nhận offer từ user đã có mặt
    const onVoiceOffer = async ({ fromId, offer }: { fromId: string; offer: RTCSessionDescriptionInit }) => {
      if (!isInVoiceRef.current) return;

      const pc = createPeerConnection(fromId);
      addLocalTracks(pc);
      peersRef.current.set(fromId, { pc, gainNode: null });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice-answer', { targetId: fromId, answer });
    };

    // Nhận answer
    const onVoiceAnswer = async ({ fromId, answer }: { fromId: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(fromId);
      if (!peer) return;
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    // Nhận ICE candidate
    const onVoiceIce = async ({ fromId, candidate }: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(fromId);
      if (!peer) return;
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Bỏ qua ICE candidate errors (có thể là race condition)
      }
    };

    // User rời voice
    const onVoiceUserLeft = ({ userId }: { userId: string }) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        peer.pc.close();
        peersRef.current.delete(userId);
      }
      setVoiceUsers(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    // Mute state thay đổi
    const onVoiceMuteChanged = ({ userId, muted }: { userId: string; muted: boolean }) => {
      setVoiceUsers(prev => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) next.set(userId, { ...user, muted });
        return next;
      });
    };

    // Host mute ta
    const onVoiceHostMuted = ({ muted }: { muted: boolean }) => {
      const stream = localStreamRef.current;
      if (stream) stream.getAudioTracks().forEach(t => { t.enabled = !muted; });
      setIsMuted(muted);
      isMutedRef.current = muted;
    };

    // Speaking state thay đổi
    const onVoiceSpeaking = ({ userId, speaking }: { userId: string; speaking: boolean }) => {
      setVoiceUsers(prev => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) next.set(userId, { ...user, speaking });
        return next;
      });
    };

    socket.on('voice-users', onVoiceUsers);
    socket.on('voice-user-joined', onVoiceUserJoined);
    socket.on('voice-offer', onVoiceOffer);
    socket.on('voice-answer', onVoiceAnswer);
    socket.on('voice-ice-candidate', onVoiceIce);
    socket.on('voice-user-left', onVoiceUserLeft);
    socket.on('voice-mute-changed', onVoiceMuteChanged);
    socket.on('voice-host-muted', onVoiceHostMuted);
    socket.on('voice-speaking', onVoiceSpeaking);

    return () => {
      socket.off('voice-users', onVoiceUsers);
      socket.off('voice-user-joined', onVoiceUserJoined);
      socket.off('voice-offer', onVoiceOffer);
      socket.off('voice-answer', onVoiceAnswer);
      socket.off('voice-ice-candidate', onVoiceIce);
      socket.off('voice-user-left', onVoiceUserLeft);
      socket.off('voice-mute-changed', onVoiceMuteChanged);
      socket.off('voice-host-muted', onVoiceHostMuted);
      socket.off('voice-speaking', onVoiceSpeaking);
    };
  }, [socket, createPeerConnection, addLocalTracks]);

  // ── Cleanup khi unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (isInVoiceRef.current) leaveVoice();
    };
  }, [leaveVoice]);

  return {
    isInVoice,
    isMuted,
    isSpeaking,
    isDeafened,
    voiceUsers,
    masterVolume,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
    setMasterVolume,
    setUserVolume,
    hostMuteUser,
  };
}
