import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock3, Stethoscope, Users, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { appointmentConsultService } from '../../services/appointmentConsultService';
import getSocket from '../../utils/socket';
import { getDoctorName } from '../../utils/appointmentCalendar';

const PatientWaitingRoom = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState(null);
  const autoJoinTried = useRef(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await appointmentConsultService.getWaitingRoomStatus(appointmentId);
      setStatus(res?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load waiting room');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const joinRoom = useCallback(async ({ silent = false } = {}) => {
    setJoining(true);
    try {
      await appointmentConsultService.joinWaitingRoom(appointmentId);
      if (!silent) toast.success('You are in the waiting room');
      await loadStatus();
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.message || 'Unable to join waiting room');
      }
    } finally {
      setJoining(false);
    }
  }, [appointmentId, loadStatus]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Auto-enter waiting room when appointment is confirmed
  useEffect(() => {
    if (loading || !status || autoJoinTried.current) return;
    if (status.status === 'confirmed') {
      autoJoinTried.current = true;
      joinRoom({ silent: true });
    }
  }, [loading, status, joinRoom]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = getSocket();
    socket.emit('join-user-room', { userId: user._id, role: 'patient' });

    const onReady = ({ appointmentId: readyId }) => {
      if (String(readyId) === String(appointmentId)) {
        toast.success('Doctor is ready — joining consultation');
        navigate(`/patient/consult/${appointmentId}`);
      }
    };

    socket.on('consultation-ready', onReady);
    return () => {
      socket.off('consultation-ready', onReady);
    };
  }, [user?._id, appointmentId, navigate]);

  useEffect(() => {
    if (status?.status !== 'in_waiting_room') return undefined;
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [status?.status, loadStatus]);

  useEffect(() => {
    if (status?.status !== 'in_progress') return;
    navigate(`/patient/consult/${appointmentId}`, { replace: true });
  }, [status?.status, appointmentId, navigate]);

  const doctorName = status?.doctor ? getDoctorName({ doctor: status.doctor }) : 'Your doctor';
  const queue = status?.waitingRoom || {};
  const inQueue = status?.status === 'in_waiting_room';
  const canJoin = status?.status === 'confirmed';
  const inCall = status?.status === 'in_progress';

  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <Link to="/patient/appointments" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Back to appointments
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
        <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50 via-white to-sky-50 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
              <Video size={24} />
              {inQueue ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
                </span>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Waiting room</p>
              <h1 className="text-xl font-bold text-ink-900">{doctorName}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
                <Stethoscope size={13} />
                Video consultation
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-ink-500">Loading waiting room…</p>
          ) : (
            <>
              <div className="rounded-2xl border border-ink-100 bg-ink-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Scheduled time</p>
                <p className="mt-1 text-lg font-bold text-ink-900">{status?.scheduledTime || '—'}</p>
              </div>

              {inCall ? (
                <p className="mt-6 text-sm font-medium text-brand-700">
                  Consultation started — opening video room…
                </p>
              ) : null}

              {inQueue ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-4 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                      <Clock3 className="h-5 w-5 animate-pulse text-brand-600" />
                    </div>
                    <p className="text-base font-bold text-ink-900">Waiting for your doctor</p>
                    <p className="mt-1 text-sm text-ink-600">
                      Stay on this page. You will join the video call automatically when{' '}
                      {doctorName} starts the consultation.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3">
                    <Users size={18} className="shrink-0 text-brand-600" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        Queue position {queue.position || 1}
                      </p>
                      <p className="text-xs text-ink-500">
                        {queue.patientsAhead || 0} patient(s) ahead · ~{queue.estimatedWaitMinutes || 5}{' '}
                        min estimated wait
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {canJoin && !inQueue ? (
                <div className="mt-5 space-y-3">
                  <p className="text-sm text-ink-600">
                    Enter the waiting room so your doctor knows you are ready.
                  </p>
                  <button
                    type="button"
                    disabled={joining}
                    onClick={() => joinRoom()}
                    className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {joining ? 'Joining…' : 'Join waiting room'}
                  </button>
                </div>
              ) : null}

              {!loading && !inCall && !inQueue && !canJoin ? (
                <p className="mt-6 text-sm text-ink-500">
                  This appointment is not ready for the waiting room yet. It must be confirmed and
                  paid.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientWaitingRoom;
