import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock3, Users, Video } from 'lucide-react';
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

  const joinRoom = async () => {
    setJoining(true);
    try {
      await appointmentConsultService.joinWaitingRoom(appointmentId);
      toast.success('You are in the waiting room');
      await loadStatus();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to join waiting room');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = getSocket();
    socket.emit('join-user-room', { userId: user._id, role: 'patient' });

    const onReady = ({ appointmentId: readyId }) => {
      if (readyId === appointmentId) {
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
    const interval = setInterval(loadStatus, 15000);
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

      <div className="mt-4 rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Video size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900">Waiting room</h1>
            <p className="text-sm text-ink-500">{doctorName}</p>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-ink-500">Loading…</p>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Scheduled time</p>
              <p className="mt-1 text-lg font-bold text-ink-900">{status?.scheduledTime || '—'}</p>
            </div>

            {inCall ? (
              <p className="mt-6 text-sm font-medium text-brand-700">Consultation started — opening video room…</p>
            ) : inQueue ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
                  <Users size={18} className="text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Queue position {queue.position || 1}</p>
                    <p className="text-xs text-ink-500">
                      {queue.patientsAhead || 0} patient(s) ahead · ~{queue.estimatedWaitMinutes || 5} min wait
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3">
                  <Clock3 size={18} className="text-ink-400" />
                  <p className="text-sm text-ink-600">
                    Please stay on this page. You will be redirected when {doctorName} starts the call.
                  </p>
                </div>
              </div>
            ) : canJoin ? (
              <button
                type="button"
                disabled={joining}
                onClick={joinRoom}
                className="mt-6 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {joining ? 'Joining…' : 'Join waiting room'}
              </button>
            ) : (
              <p className="mt-6 text-sm text-ink-500">
                This appointment is not ready for the waiting room yet. It must be confirmed and paid.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientWaitingRoom;
