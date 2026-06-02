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
import { getRemoteAudioVolume } from './voiceAudioPlayback';
import { VOICE_RTC_CONFIG } from './voiceIceServers';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoiceUserState {
  muted: boolean;
  speaking: boolean;
  cameraOn: boolean;
  volume: number; // 0-1, per-user local volume
}

interface PeerData {
  pc: RTCPeerConnection;
  gainNode: GainNode | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  remoteStream: MediaStream | null;
  audioElement: HTMLAudioElement | null;
}

interface UseVoiceChatReturn {
  isInVoice: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isDeafened: boolean;     // Tắt hết tiếng người khác (tai nghe bị tắt)
  isCameraOn: boolean;
  voiceUsers: Map<string, VoiceUserState>;
  localVideoStream: MediaStream | null;
  remoteVideoStreams: Map<string, MediaStream>;
  masterVolume: number;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
  toggleCamera: () => Promise<void>;
  toggleDeafen: () => void;   // Bật/tắt deafen (tắt hết tai nghe)
  setMasterVolume: (v: number) => void;
  setUserVolume: (userId: string, v: number) => void;
  hostMuteUser: (targetId: string, muted: boolean) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<Map<string, VoiceUserState>>(new Map());
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Map<string, MediaStream>>(new Map());
  const [masterVolume, setMasterVolumeState] = useState(1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const peersRef = useRef<Map<string, PeerData>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMutedRef = useRef(false);
  const isInVoiceRef = useRef(false);
  const isDeafenedRef = useRef(false);
  const isCameraOnRef = useRef(false);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef(roomId);
  const isSpeakingRef = useRef(false);
  const masterVolumeBeforeDeafenRef = useRef(1); // Lưu volume trước khi deafen

  const updateRemoteAudioElements = useCallback(() => {
    peersRef.current.forEach((peer, userId) => {
      if (!peer.audioElement) return;
      const userVolume = voiceUsers.get(userId)?.volume ?? 1;
      peer.audioElement.volume = getRemoteAudioVolume(userVolume, masterVolume, isDeafenedRef.current);
    });
  }, [masterVolume, voiceUsers]);

  // Sync refs
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isInVoiceRef.current = isInVoice; }, [isInVoice]);
  useEffect(() => { isDeafenedRef.current = isDeafened; }, [isDeafened]);
  useEffect(() => { isCameraOnRef.current = isCameraOn; }, [isCameraOn]);

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

  const flushPendingIceCandidates = useCallback(async (targetId: string, pc: RTCPeerConnection) => {
    const pending = pendingIceCandidatesRef.current.get(targetId);
    if (!pending?.length || !pc.remoteDescription) return;

    pendingIceCandidatesRef.current.delete(targetId);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[VoiceChat] Failed to apply queued ICE candidate:', targetId, err);
      }
    }
  }, []);

  const renegotiatePeer = useCallback(async (targetId: string, pc: RTCPeerConnection) => {
    if (!socket || pc.signalingState === 'closed') return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('voice-offer', { targetId, offer });
    } catch (err) {
      console.warn('[VoiceChat] Renegotiation failed:', targetId, err);
    }
  }, [socket]);

  const updateRemoteVideoStream = useCallback((targetId: string, stream: MediaStream) => {
    const hasLiveVideo = stream.getVideoTracks().some(track => track.readyState === 'live');
    setRemoteVideoStreams(prev => {
      const next = new Map(prev);
      if (hasLiveVideo) {
        next.set(targetId, stream);
      } else {
        next.delete(targetId);
      }
      return next;
    });
  }, []);

  // ── Helper: tạo RTCPeerConnection ─────────────────────────────────────────
  const createPeerConnection = useCallback((targetId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(VOICE_RTC_CONFIG);

    // ICE candidate → gửi qua signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice-ice-candidate', { targetId, candidate: event.candidate });
      }
    };

    // Nhận audio/video track từ remote peer
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] ?? new MediaStream([event.track]);

      if (event.track.kind === 'video') {
        updateRemoteVideoStream(targetId, remoteStream);
        event.track.onended = () => {
          setRemoteVideoStreams(prev => {
            const next = new Map(prev);
            next.delete(targetId);
            return next;
          });
        };
        remoteStream.onremovetrack = () => updateRemoteVideoStream(targetId, remoteStream);

        const existingPeer = peersRef.current.get(targetId);
        if (existingPeer) existingPeer.remoteStream = remoteStream;
        return;
      }

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(err => console.warn('[VoiceChat] Failed to resume AudioContext in ontrack:', err));
      }

      const source = ctx.createMediaStreamSource(remoteStream);
      const gainNode = ctx.createGain();
      const userVolume = voiceUsers.get(targetId)?.volume ?? 1;
      const audioElement = document.createElement('audio');

      // Per-user volume (default 1)
      gainNode.gain.value = userVolume;
      source.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      audioElement.autoplay = true;
      audioElement.muted = true; // Mute để vượt qua chính sách chặn autoplay của trình duyệt (âm thanh thực tế phát qua Web Audio API)
      audioElement.setAttribute('playsinline', 'true');
      audioElement.srcObject = remoteStream;
      audioElement.volume = getRemoteAudioVolume(userVolume, masterVolume, isDeafenedRef.current);
      audioElement.dataset.voicePeerId = targetId;
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
      audioElement.play().catch(err => {
        console.warn('[VoiceChat] Remote audio playback needs user interaction:', targetId, err);
      });

      // Cập nhật gainNode reference
      const existingPeer = peersRef.current.get(targetId);
      if (existingPeer) {
        existingPeer.sourceNode?.disconnect();
        existingPeer.gainNode?.disconnect();
        existingPeer.audioElement?.remove();
        existingPeer.sourceNode = source;
        existingPeer.gainNode = gainNode;
        existingPeer.remoteStream = remoteStream;
        existingPeer.audioElement = audioElement;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.info('[VoiceChat] ICE state:', targetId, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.info('[VoiceChat] Peer state:', targetId, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(targetId);
      }
    };

    return pc;
  }, [socket, getAudioContext, updateRemoteVideoStream, voiceUsers]);

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

  const addReceiveOnlyTransceivers = useCallback((pc: RTCPeerConnection) => {
    const hasReceiver = (kind: 'audio' | 'video') => (
      pc.getTransceivers().some(transceiver => transceiver.receiver.track.kind === kind)
    );
    if (!hasReceiver('audio')) pc.addTransceiver('audio', { direction: 'recvonly' });
    if (!hasReceiver('video')) pc.addTransceiver('video', { direction: 'recvonly' });
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

  const stopCamera = useCallback(async (renegotiate = true) => {
    const videoStream = localVideoStreamRef.current;
    const tracks = videoStream?.getVideoTracks() ?? [];
    if (tracks.length === 0 && !isCameraOnRef.current) return;

    peersRef.current.forEach(({ pc }, userId) => {
      tracks.forEach(track => {
        const sender = pc.getSenders().find(item => item.track === track);
        if (sender) pc.removeTrack(sender);
      });
      if (renegotiate) void renegotiatePeer(userId, pc);
    });

    tracks.forEach(track => {
      localStreamRef.current?.removeTrack(track);
      track.stop();
    });

    localVideoStreamRef.current = null;
    setLocalVideoStream(null);
    setIsCameraOn(false);
    isCameraOnRef.current = false;
    socket?.emit('voice-camera-changed', { roomId: roomIdRef.current, cameraOn: false });
  }, [renegotiatePeer, socket]);

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

  const startCamera = useCallback(async () => {
    if (!socket) return;
    if (!isInVoiceRef.current) await joinVoice();
    if (!isInVoiceRef.current) return;
    if (isCameraOnRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          facingMode: 'user',
        },
      });
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) throw new Error('No video track returned');

      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      localStreamRef.current.addTrack(videoTrack);
      localVideoStreamRef.current = stream;
      setLocalVideoStream(stream);
      setIsCameraOn(true);
      isCameraOnRef.current = true;

      videoTrack.onended = () => {
        void stopCamera();
      };

      peersRef.current.forEach(({ pc }, userId) => {
        if (!pc.getSenders().some(sender => sender.track === videoTrack)) {
          pc.addTrack(videoTrack, localStreamRef.current!);
        }
        void renegotiatePeer(userId, pc);
      });

      socket.emit('voice-camera-changed', { roomId: roomIdRef.current, cameraOn: true });
    } catch (err) {
      console.error('[VoiceChat] camera getUserMedia failed:', err);
      alert('Không thể truy cập camera. Vui lòng kiểm tra quyền trình duyệt.');
    }
  }, [joinVoice, renegotiatePeer, socket, stopCamera]);

  const toggleCamera = useCallback(async () => {
    if (isCameraOnRef.current) {
      await stopCamera();
    } else {
      await startCamera();
    }
  }, [startCamera, stopCamera]);

  // ── leaveVoice ────────────────────────────────────────────────────────────
  const leaveVoice = useCallback(() => {
    if (!socket) return;

    void stopCamera(false);

    // Dừng VAD
    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }

    // Đóng tất cả peer connections
    peersRef.current.forEach(({ pc, sourceNode, gainNode, audioElement }) => {
      sourceNode?.disconnect();
      gainNode?.disconnect();
      audioElement?.remove();
      pc.close();
    });
    peersRef.current.clear();
    pendingIceCandidatesRef.current.clear();

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
    setIsCameraOn(false);
    setLocalVideoStream(null);
    setRemoteVideoStreams(new Map());
    isSpeakingRef.current = false;
    isCameraOnRef.current = false;

    // Thông báo server
    socket.emit('voice-leave', { roomId: roomIdRef.current });
  }, [socket, stopCamera]);

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
    updateRemoteAudioElements();

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
    peersRef.current.forEach((peer, userId) => {
      if (!peer.audioElement) return;
      const userVolume = voiceUsers.get(userId)?.volume ?? 1;
      peer.audioElement.volume = getRemoteAudioVolume(userVolume, clamped, isDeafenedRef.current);
    });
  }, [voiceUsers]);

  // ── setUserVolume (per-user local volume) ─────────────────────────────────
  const setUserVolume = useCallback((userId: string, v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    const peerData = peersRef.current.get(userId);
    if (peerData?.gainNode) {
      peerData.gainNode.gain.value = clamped;
    }
    if (peerData?.audioElement) {
      peerData.audioElement.volume = getRemoteAudioVolume(clamped, masterVolume, isDeafenedRef.current);
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

  const registerPeer = useCallback((targetId: string, pc: RTCPeerConnection) => {
    peersRef.current.set(targetId, {
      pc,
      gainNode: null,
      sourceNode: null,
      remoteStream: null,
      audioElement: null,
    });
  }, []);

  // ── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Nhận danh sách voice users hiện tại khi vừa join
    const openPeerToUser = async (userId: string) => {
      if (userId === socket.id) return;
      const existingPeer = peersRef.current.get(userId);
      if (existingPeer && existingPeer.pc.signalingState !== 'closed') return;

      const pc = createPeerConnection(userId);
      if (isInVoiceRef.current) {
        addLocalTracks(pc);
      } else {
        addReceiveOnlyTransceivers(pc);
      }
      registerPeer(userId, pc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('voice-offer', { targetId: userId, offer });
    };

    const onVoiceUsers = ({ users }: { users: Record<string, VoiceUserState> }) => {
      const map = new Map<string, VoiceUserState>();
      Object.entries(users).forEach(([id, state]) => {
        map.set(id, {
          muted: !!state.muted,
          speaking: !!state.speaking,
          cameraOn: !!state.cameraOn,
          volume: 1,
        });
      });
      setVoiceUsers(map);
      Object.keys(users).forEach(userId => {
        void openPeerToUser(userId);
      });
    };

    // User joins voice/call: create a peer even when this client only receives video.
    const onVoiceUserJoined = async ({ userId }: { userId: string; username: string }) => {
      setVoiceUsers(prev => {
        const next = new Map(prev);
        next.set(userId, { muted: false, speaking: false, cameraOn: false, volume: 1 });
        return next;
      });

      void openPeerToUser(userId);
    };

    // Nhận offer từ user đã có mặt
    const onVoiceOffer = async ({ fromId, offer }: { fromId: string; offer: RTCSessionDescriptionInit }) => {
      const existingPeer = peersRef.current.get(fromId);
      let pc = existingPeer?.pc;
      if (!pc || pc.signalingState === 'closed') {
        pc = createPeerConnection(fromId);
        registerPeer(fromId, pc);
      } else if (pc.signalingState !== 'stable') {
        try {
          await pc.setLocalDescription({ type: 'rollback' });
        } catch (err) {
          console.warn('[VoiceChat] Failed to rollback before remote offer:', fromId, err);
        }
      }
      if (isInVoiceRef.current) {
        addLocalTracks(pc);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIceCandidates(fromId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice-answer', { targetId: fromId, answer });
    };

    // Nhận answer
    const onVoiceAnswer = async ({ fromId, answer }: { fromId: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(fromId);
      if (!peer) return;
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingIceCandidates(fromId, peer.pc);
    };

    // Nhận ICE candidate
    const onVoiceIce = async ({ fromId, candidate }: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(fromId);
      if (!peer || !peer.pc.remoteDescription) {
        const pending = pendingIceCandidatesRef.current.get(fromId) ?? [];
        pending.push(candidate);
        pendingIceCandidatesRef.current.set(fromId, pending);
        return;
      }
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
        peer.sourceNode?.disconnect();
        peer.gainNode?.disconnect();
        peer.audioElement?.remove();
        peer.pc.close();
        peersRef.current.delete(userId);
      }
      pendingIceCandidatesRef.current.delete(userId);
      setRemoteVideoStreams(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
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

    const onVoiceCameraChanged = ({ userId, cameraOn }: { userId: string; cameraOn: boolean }) => {
      setVoiceUsers(prev => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) {
          next.set(userId, { ...user, cameraOn });
        } else if (cameraOn) {
          next.set(userId, { muted: false, speaking: false, cameraOn, volume: 1 });
        }
        return next;
      });
      if (cameraOn) {
        void openPeerToUser(userId);
      }
      if (!cameraOn) {
        setRemoteVideoStreams(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }
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
    socket.on('voice-camera-changed', onVoiceCameraChanged);
    socket.emit('voice-subscribe', { roomId: roomIdRef.current });

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
      socket.off('voice-camera-changed', onVoiceCameraChanged);
    };
  }, [socket, createPeerConnection, addLocalTracks, addReceiveOnlyTransceivers, flushPendingIceCandidates, registerPeer]);

  // ── Cleanup khi unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (isInVoiceRef.current) {
        leaveVoice();
        return;
      }
      peersRef.current.forEach(({ pc, sourceNode, gainNode, audioElement }) => {
        sourceNode?.disconnect();
        gainNode?.disconnect();
        audioElement?.remove();
        pc.close();
      });
      peersRef.current.clear();
      pendingIceCandidatesRef.current.clear();
    };
  }, [leaveVoice]);

  return {
    isInVoice,
    isMuted,
    isSpeaking,
    isDeafened,
    isCameraOn,
    voiceUsers,
    localVideoStream,
    remoteVideoStreams,
    masterVolume,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleCamera,
    toggleDeafen,
    setMasterVolume,
    setUserVolume,
    hostMuteUser,
  };
}
