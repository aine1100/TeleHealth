import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConsultChatPanel from './ConsultChatPanel';
import getSocket from '../../utils/socket';
import { isSecureAppContext } from '../../utils/apiUrl';
import { appointmentConsultService } from '../../services/appointmentConsultService';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const idOf = (value) => (value == null ? '' : String(value));

const describeMediaError = (error) => {
  if (!isSecureAppContext()) {
    return 'Camera blocked: open https://SERVER-IP:3000 (not http), accept the certificate, then allow camera.';
  }
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Camera permission denied. Allow camera in the address bar, then refresh.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'No camera or microphone found on this device.';
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'Camera is in use by another app. Close it and try again.';
  }
  return error?.message || 'Unable to access camera or microphone.';
};

const AUDIO_CONSTRAINTS = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  // Chrome / Edge advanced AEC flags
  googEchoCancellation: true,
  googExperimentalEchoCancellation: true,
  googNoiseSuppression: true,
  googHighpassFilter: true,
  googAutoGainControl: true
};

const applyAudioProcessing = async (stream) => {
  const audioTracks = stream?.getAudioTracks?.() || [];
  await Promise.all(
    audioTracks.map(async (track) => {
      try {
        await track.applyConstraints({ advanced: [AUDIO_CONSTRAINTS] });
      } catch {
        try {
          await track.applyConstraints({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          });
        } catch {
          /* browser may ignore unsupported constraints */
        }
      }
    })
  );
  return stream;
};

const acquireLocalMedia = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { stream: new MediaStream(), mode: 'chat-only', warning: 'Media devices are not supported.' };
  }
  if (!isSecureAppContext()) {
    return { stream: new MediaStream(), mode: 'chat-only', warning: describeMediaError({ name: 'SecurityError' }) };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: AUDIO_CONSTRAINTS
    });
    await applyAudioProcessing(stream);
    return { stream, mode: 'full', warning: null };
  } catch (videoAudioError) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: AUDIO_CONSTRAINTS
      });
      await applyAudioProcessing(stream);
      return {
        stream,
        mode: 'audio',
        warning: `Camera unavailable. Joined with microphone only. (${describeMediaError(videoAudioError)})`
      };
    } catch (audioError) {
      return { stream: new MediaStream(), mode: 'chat-only', warning: describeMediaError(audioError) };
    }
  }
};

const attachLocalTracks = (pc, stream) => {
  if (stream?.getTracks?.().length) {
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }
  if (!stream?.getAudioTracks?.().length) {
    pc.addTransceiver('audio', { direction: 'recvonly' });
  }
  if (!stream?.getVideoTracks?.().length) {
    pc.addTransceiver('video', { direction: 'recvonly' });
  }
};

const VideoConsultation = ({ appointmentId, userId, role, userName, counterpartName, onEnded }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(role !== 'doctor');
  const pendingCandidatesRef = useRef([]);
  const peerPresentRef = useRef(false);
  const myIdRef = useRef(idOf(userId));
  const onEndedRef = useRef(onEnded);
  const speakerVolumeRef = useRef(0.7);

  const [status, setStatus] = useState('connecting');
  const [peerPresent, setPeerPresent] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [ending, setEnding] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [socket, setSocket] = useState(null);
  const [mediaMode, setMediaMode] = useState('full');
  const [mediaWarning, setMediaWarning] = useState(null);
  const [retryingMedia, setRetryingMedia] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [speakerVolume, setSpeakerVolume] = useState(0.7);

  useEffect(() => {
    myIdRef.current = idOf(userId);
  }, [userId]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    speakerVolumeRef.current = speakerVolume;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = speakerVolume;
    }
  }, [speakerVolume]);

  const flushPendingCandidates = async () => {
    const pc = peerRef.current;
    if (!pc?.remoteDescription) return;
    const pending = pendingCandidatesRef.current.splice(0);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('ICE add failed', err);
      }
    }
  };

  const createOffer = useCallback(async () => {
    const pc = peerRef.current;
    const sock = socketRef.current;
    if (!pc || !sock || makingOfferRef.current) return;
    if (pc.signalingState !== 'stable') return;

    try {
      makingOfferRef.current = true;
      setStatus((prev) => (prev === 'connected' ? prev : 'connecting'));
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      sock.emit('offer', {
        appointmentId,
        offer: pc.localDescription,
        senderId: myIdRef.current
      });
    } catch (err) {
      console.error('Offer error', err);
      setStatus('failed');
    } finally {
      makingOfferRef.current = false;
    }
  }, [appointmentId]);

  const createPeerConnection = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    pendingCandidatesRef.current = [];
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Helps ICE reach "connected" even when one side has no camera tracks
    try {
      pc.createDataChannel('consult');
    } catch {
      /* ignore */
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          appointmentId,
          candidate: event.candidate,
          senderId: myIdRef.current
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams?.[0] || new MediaStream([event.track]);
      if (remoteVideoRef.current) {
        // Never mix local tracks into the remote element (causes feedback/echo)
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = speakerVolumeRef.current;
        remoteVideoRef.current.play?.().catch(() => {});
      }
      setStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setStatus('connected');
      if (pc.connectionState === 'failed') {
        setStatus('failed');
        toast.error('Video connection failed. Tap Retry.');
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setStatus('connected');
      }
      if (pc.iceConnectionState === 'failed') setStatus('failed');
    };

    attachLocalTracks(pc, localStreamRef.current);
    peerRef.current = pc;
    return pc;
  }, [appointmentId]);

  useEffect(() => {
    if (!appointmentId || !idOf(userId)) return undefined;

    let mounted = true;
    let connectTimeout = null;
    let stuckTimer = null;
    const socketInstance = getSocket();
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const cleanupSocketHandlers = () => {
      socketInstance.off('connect', onSocketConnect);
      socketInstance.off('disconnect', onSocketDisconnect);
      socketInstance.off('room-peers', onRoomPeers);
      socketInstance.off('peer-joined', onPeerJoined);
      socketInstance.off('request-offer', onRequestOffer);
      socketInstance.off('offer', onOffer);
      socketInstance.off('answer', onAnswer);
      socketInstance.off('ice-candidate', onIceCandidate);
      socketInstance.off('consultation-ended', onConsultationEnded);
    };

    const joinRoom = () => {
      socketInstance.emit('join-appointment-room', {
        appointmentId,
        userId: idOf(userId),
        role
      });
    };

    const markPeerAndNegotiate = async () => {
      peerPresentRef.current = true;
      if (mounted) {
        setPeerPresent(true);
        setStatus((prev) => (prev === 'connected' ? prev : 'connecting'));
      }
      // Doctor (impolite) creates offers; patient asks doctor to offer if needed
      if (!politeRef.current) {
        await createOffer();
      } else {
        socketInstance.emit('request-offer', {
          appointmentId,
          senderId: idOf(userId),
          role
        });
      }
    };

    const onSocketConnect = () => {
      if (!mounted) return;
      setSocketReady(true);
      joinRoom();
    };

    const onSocketDisconnect = () => {
      if (!mounted) return;
      setSocketReady(false);
    };

    const onRoomPeers = async ({ peers }) => {
      if (!mounted) return;
      if (!Array.isArray(peers) || peers.length === 0) {
        setStatus((prev) => (prev === 'connected' ? prev : 'waiting'));
        return;
      }
      await markPeerAndNegotiate();
    };

    const onPeerJoined = async () => {
      if (!mounted) return;
      await markPeerAndNegotiate();
    };

    const onRequestOffer = async ({ senderId }) => {
      if (idOf(senderId) === myIdRef.current) return;
      if (politeRef.current) return;
      peerPresentRef.current = true;
      setPeerPresent(true);
      await createOffer();
    };

    const onOffer = async ({ offer, senderId }) => {
      if (!peerRef.current || idOf(senderId) === myIdRef.current) return;
      const pc = peerRef.current;
      const collision = makingOfferRef.current || pc.signalingState !== 'stable';
      if (!politeRef.current && collision) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketInstance.emit('answer', {
          appointmentId,
          answer: pc.localDescription,
          senderId: myIdRef.current
        });
        setStatus((prev) => (prev === 'connected' ? prev : 'connecting'));
      } catch (err) {
        console.error('Answer error', err);
      }
    };

    const onAnswer = async ({ answer, senderId }) => {
      if (!peerRef.current || idOf(senderId) === myIdRef.current) return;
      try {
        if (peerRef.current.signalingState === 'have-local-offer') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates();
        }
      } catch (err) {
        console.error('Set answer error', err);
      }
    };

    const onIceCandidate = async ({ candidate, senderId }) => {
      if (!peerRef.current || !candidate || idOf(senderId) === myIdRef.current) return;
      try {
        if (!peerRef.current.remoteDescription) {
          pendingCandidatesRef.current.push(candidate);
          return;
        }
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('ICE candidate error', err);
      }
    };

    const onConsultationEnded = () => {
      toast('Consultation ended');
      onEndedRef.current?.();
    };

    const start = async () => {
      try {
        setStatus('connecting');
        await appointmentConsultService.getVideoSession(appointmentId);
        if (!mounted) return;

        const { stream, mode, warning } = await acquireLocalMedia();
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setMediaMode(mode);
        setMediaWarning(warning);
        if (warning) toast(warning, { duration: 7000 });

        localStreamRef.current = stream;
        if (localVideoRef.current && stream.getVideoTracks().length) {
          localVideoRef.current.srcObject = stream;
        }

        createPeerConnection();

        socketInstance.on('connect', onSocketConnect);
        socketInstance.on('disconnect', onSocketDisconnect);
        socketInstance.on('room-peers', onRoomPeers);
        socketInstance.on('peer-joined', onPeerJoined);
        socketInstance.on('request-offer', onRequestOffer);
        socketInstance.on('offer', onOffer);
        socketInstance.on('answer', onAnswer);
        socketInstance.on('ice-candidate', onIceCandidate);
        socketInstance.on('consultation-ended', onConsultationEnded);

        if (socketInstance.connected) {
          setSocketReady(true);
          joinRoom();
        } else {
          connectTimeout = setTimeout(() => {
            if (mounted && !socketInstance.connected) {
              toast.error('Realtime connection failed. Check that the backend is running.');
              setStatus('failed');
            }
          }, 10000);
          socketInstance.connect();
        }

        stuckTimer = setTimeout(() => {
          if (mounted && peerPresentRef.current) {
            setStatus((prev) => {
              if (prev === 'connecting') {
                toast.error('Still connecting. Tap Retry.');
                return 'failed';
              }
              return prev;
            });
          }
        }, 20000);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to start consultation');
        setStatus('failed');
      }
    };

    start();

    return () => {
      mounted = false;
      if (connectTimeout) clearTimeout(connectTimeout);
      if (stuckTimer) clearTimeout(stuckTimer);
      cleanupSocketHandlers();
      socketInstance.emit('leave-appointment-room', { appointmentId });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, [appointmentId, userId, role, createPeerConnection, createOffer, retryKey]);

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setAudioEnabled((prev) => !prev);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current?.getVideoTracks().length) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setVideoEnabled((prev) => !prev);
  };

  const retryCamera = async () => {
    setRetryingMedia(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: AUDIO_CONSTRAINTS
      });
      await applyAudioProcessing(stream);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setMediaMode('full');
      setMediaWarning(null);
      setAudioEnabled(true);
      setVideoEnabled(true);
      setRetryKey((k) => k + 1);
      toast.success('Camera connected — reconnecting call');
    } catch {
      toast.error('Camera still unavailable.');
    } finally {
      setRetryingMedia(false);
    }
  };

  const retryConnection = () => {
    setStatus('connecting');
    setRetryKey((k) => k + 1);
  };

  const endCall = async () => {
    setEnding(true);
    try {
      await appointmentConsultService.endVideoCall(appointmentId);
      toast.success('Consultation ended');
      onEnded?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to end call');
    } finally {
      setEnding(false);
    }
  };

  const hasLocalVideo = mediaMode === 'full';
  const hasLocalAudio = mediaMode !== 'chat-only';
  const connecting = status === 'connecting';
  const connected = status === 'connected';
  const waiting = status === 'waiting';
  const failed = status === 'failed';

  const statusLabel = connected
    ? 'Connected'
    : connecting
      ? socketReady
        ? 'Connecting…'
        : 'Connecting socket…'
      : failed
        ? 'Connection failed'
        : 'Waiting for peer';

  if (!idOf(userId)) {
    return <p className="py-16 text-center text-sm text-ink-500">Loading your session…</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
      <div className="flex flex-col gap-4 border-b border-ink-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Video consultation</p>
          <p className="text-lg font-bold text-ink-900">{counterpartName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              connected
                ? 'bg-emerald-50 text-emerald-700'
                : connecting
                  ? 'bg-amber-50 text-amber-700'
                  : failed
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-ink-100 text-ink-600'
            }`}
          >
            {statusLabel}
          </span>
          {(failed || (connecting && peerPresent)) && (
            <button
              type="button"
              onClick={retryConnection}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => setChatOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 lg:hidden"
          >
            <MessageSquare size={14} />
            {chatOpen ? 'Hide chat' : 'Show chat'}
          </button>
        </div>
      </div>

      {mediaWarning ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 sm:px-5">
          <p className="text-sm text-amber-900">{mediaWarning}</p>
          {mediaMode !== 'full' ? (
            <button
              type="button"
              disabled={retryingMedia}
              onClick={retryCamera}
              className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {retryingMedia ? 'Trying camera…' : 'Try camera again'}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={`grid gap-4 p-4 sm:p-5 ${chatOpen ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'lg:grid-cols-1'}`}>
        <div className="flex min-h-[420px] flex-col">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full min-h-[320px] w-full bg-ink-100 object-cover"
            />
            {!connected ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 px-4 text-center">
                <p className="text-sm font-medium text-ink-500">
                  {connecting
                    ? `Connecting to ${counterpartName}…`
                    : waiting
                      ? `Waiting for ${counterpartName} to join…`
                      : failed
                        ? 'Connection failed. Tap Retry.'
                        : `Waiting for ${counterpartName}…`}
                </p>
                {peerPresent && connecting ? (
                  <p className="text-xs text-ink-400">Peer joined — negotiating media…</p>
                ) : null}
              </div>
            ) : null}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`absolute bottom-4 right-4 h-24 w-36 rounded-xl border-2 border-white bg-ink-200 object-cover shadow-lg sm:h-28 sm:w-44 ${
                hasLocalVideo ? '' : 'hidden'
              }`}
            />
            {!hasLocalVideo ? (
              <div className="absolute bottom-4 right-4 flex h-24 w-36 items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-white/90 px-2 text-center text-[10px] font-medium text-ink-500 sm:h-28 sm:w-44">
                {mediaMode === 'audio' ? 'Mic only' : 'No camera'}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-3 px-1">
            <label htmlFor="speaker-volume" className="shrink-0 text-xs font-medium text-ink-500">
              Speaker
            </label>
            <input
              id="speaker-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={speakerVolume}
              onChange={(e) => setSpeakerVolume(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-brand-500"
            />
            <span className="w-8 text-right text-xs text-ink-400">{Math.round(speakerVolume * 100)}%</span>
          </div>
          <p className="mt-1 text-center text-[11px] text-ink-400">
            Echo tip: use headphones, or lower speaker volume if you hear your own voice.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleAudio}
              disabled={!hasLocalAudio}
              className={`rounded-full p-3 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                audioEnabled
                  ? 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
              aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              disabled={!hasLocalVideo}
              className={`rounded-full p-3 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                videoEnabled
                  ? 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
              aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button
              type="button"
              disabled={ending}
              onClick={endCall}
              className="rounded-full bg-rose-500 p-3 text-white shadow-sm hover:bg-rose-600 disabled:opacity-50"
              aria-label="End call"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>

        {chatOpen ? (
          <ConsultChatPanel
            appointmentId={appointmentId}
            userId={idOf(userId)}
            role={role}
            userName={userName}
            socket={socket}
          />
        ) : null}
      </div>
    </div>
  );
};

export default VideoConsultation;
