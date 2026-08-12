import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConsultChatPanel from './ConsultChatPanel';
import getSocket from '../../utils/socket';
import { appointmentConsultService } from '../../services/appointmentConsultService';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const acquireLocalMedia = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      stream: new MediaStream(),
      mode: 'chat-only',
      warning: 'Media devices are not supported in this browser.'
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return { stream, mode: 'full', warning: null };
  } catch {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      return {
        stream,
        mode: 'audio',
        warning:
          'Camera unavailable — likely in use by another browser on this PC. Joined with microphone only.'
      };
    } catch {
      return {
        stream: new MediaStream(),
        mode: 'chat-only',
        warning:
          'Camera and microphone unavailable. On one PC, only one browser can use the webcam at a time. You can still chat and see the other person if they have video on.'
      };
    }
  }
};

const VideoConsultation = ({ appointmentId, userId, role, userName, counterpartName, onEnded }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const makingOfferRef = useRef(false);

  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [ending, setEnding] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [socket, setSocket] = useState(null);
  const [mediaMode, setMediaMode] = useState('full');
  const [mediaWarning, setMediaWarning] = useState(null);
  const [retryingMedia, setRetryingMedia] = useState(false);

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          appointmentId,
          candidate: event.candidate,
          senderId: userId
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setConnected(true);
      setConnecting(false);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        toast.error('Connection failed. Try refreshing the page.');
      }
    };

    peerRef.current = pc;
    return pc;
  }, [appointmentId, userId]);

  useEffect(() => {
    let mounted = true;
    let socketInstance = null;

    const setup = async () => {
      try {
        socketInstance = getSocket();
        socketRef.current = socketInstance;
        if (mounted) setSocket(socketInstance);

        setConnecting(true);
        await appointmentConsultService.getVideoSession(appointmentId);

        const { stream, mode, warning } = await acquireLocalMedia();
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setMediaMode(mode);
        setMediaWarning(warning);
        if (warning) {
          toast(warning, { duration: 6000, icon: mode === 'chat-only' ? '💬' : '🎤' });
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && stream.getVideoTracks().length) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        socketInstance.emit('join-appointment-room', { appointmentId, userId, role });

        socketInstance.on('peer-joined', async ({ role: peerRole }) => {
          if (role !== 'doctor' || peerRole !== 'patient') return;
          if (makingOfferRef.current || !peerRef.current) return;

          try {
            makingOfferRef.current = true;
            const offer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(offer);
            socketInstance.emit('offer', { appointmentId, offer, senderId: userId });
          } catch (err) {
            console.error('Offer error', err);
          } finally {
            makingOfferRef.current = false;
          }
        });

        socketInstance.on('offer', async ({ offer }) => {
          if (role !== 'patient' || !peerRef.current) return;
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          socketInstance.emit('answer', { appointmentId, answer, senderId: userId });
        });

        socketInstance.on('answer', async ({ answer }) => {
          if (!peerRef.current) return;
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setConnecting(false);
        });

        socketInstance.on('ice-candidate', async ({ candidate }) => {
          if (!peerRef.current || !candidate) return;
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('ICE candidate error', err);
          }
        });

        socketInstance.on('consultation-ended', () => {
          toast('Consultation ended');
          onEnded?.();
        });

        if (role === 'doctor') {
          setConnecting(false);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to start consultation');
        setConnecting(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      const activeSocket = socketRef.current || socketInstance;
      if (activeSocket) {
        activeSocket.emit('leave-appointment-room', { appointmentId });
        activeSocket.off('peer-joined');
        activeSocket.off('offer');
        activeSocket.off('answer');
        activeSocket.off('ice-candidate');
        activeSocket.off('consultation-ended');
      }
      cleanupMedia();
    };
  }, [appointmentId, userId, role, createPeerConnection, cleanupMedia, onEnded]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (peerRef.current) {
        stream.getTracks().forEach((track) => peerRef.current.addTrack(track, stream));
      }
      setMediaMode('full');
      setMediaWarning(null);
      setAudioEnabled(true);
      setVideoEnabled(true);
      toast.success('Camera and microphone connected');
    } catch {
      toast.error('Camera still unavailable. Close the other browser tab or app using the webcam, then try again.');
    } finally {
      setRetryingMedia(false);
    }
  };

  const hasLocalVideo = mediaMode === 'full';
  const hasLocalAudio = mediaMode !== 'chat-only';

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
                  : 'bg-ink-100 text-ink-600'
            }`}
          >
            {connecting ? 'Connecting…' : connected ? 'Connected' : 'Waiting for peer'}
          </span>
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
            {!connected && !connecting ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <p className="text-sm font-medium text-ink-500">Waiting for {counterpartName} to join…</p>
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
            {!hasLocalVideo && mediaMode === 'chat-only' ? (
              <div className="absolute bottom-4 right-4 flex h-24 w-36 items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-white/90 px-2 text-center text-[10px] font-medium text-ink-500 sm:h-28 sm:w-44">
                No camera — chat only
              </div>
            ) : null}
          </div>

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
            userId={userId}
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
