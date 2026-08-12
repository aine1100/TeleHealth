import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AppointmentCalendarView from '../../components/appointments/AppointmentCalendarView';
import { useAuth } from '../../context/AuthContext';
import { appointmentConsultService } from '../../services/appointmentConsultService';
import { doctorService } from '../../services/doctorService';
import getSocket from '../../utils/socket';
import { getPatientName } from '../../utils/appointmentCalendar';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes, queueRes] = await Promise.all([
        doctorService.getMyAppointments(),
        appointmentConsultService.getDoctorWaitingQueue().catch(() => ({ data: [] }))
      ]);
      setAppointments(apptRes?.data || []);
      setWaitingCount(queueRes?.data?.length || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (!user?._id) return undefined;
    const socket = getSocket();
    socket.emit('join-user-room', { userId: user._id, role: 'doctor' });
    socket.on('waiting-room-update', () => {
      loadAppointments();
    });
    return () => {
      socket.off('waiting-room-update');
    };
  }, [user?._id, loadAppointments]);

  const updateStatus = async (id, status, successMessage, closeDetail) => {
    setActingId(id);
    try {
      await doctorService.updateAppointmentStatus(id, status);
      toast.success(successMessage);
      closeDetail?.();
      await loadAppointments();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update appointment');
    } finally {
      setActingId(null);
    }
  };

  const startConsultation = async (appt, closeDetail) => {
    setActingId(appt._id);
    try {
      await appointmentConsultService.startVideoCall(appt._id);
      toast.success('Consultation started');
      closeDetail?.();
      navigate(`/doctor/consult/${appt._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to start consultation');
    } finally {
      setActingId(null);
    }
  };

  const getInitials = (appt) =>
    getPatientName(appt)
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const renderActions = (appt, closeDetail) => {
    if (appt.status === 'pending') {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actingId === appt._id}
            onClick={() => updateStatus(appt._id, 'confirmed', 'Appointment approved', closeDetail)}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={actingId === appt._id}
            onClick={() => updateStatus(appt._id, 'cancelled', 'Appointment declined', closeDetail)}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      );
    }

    if (appt.type === 'video' && appt.status === 'in_waiting_room') {
      return (
        <button
          type="button"
          disabled={actingId === appt._id}
          onClick={() => startConsultation(appt, closeDetail)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Start consultation
        </button>
      );
    }

    if (appt.type === 'video' && appt.status === 'in_progress') {
      return (
        <Link
          to={`/doctor/consult/${appt._id}`}
          onClick={() => closeDetail?.()}
          className="inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Rejoin call
        </Link>
      );
    }

    if (appt.type === 'video' && appt.status === 'confirmed') {
      return (
        <button
          type="button"
          disabled={actingId === appt._id}
          onClick={() => startConsultation(appt, closeDetail)}
          className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
        >
          Start video call
        </button>
      );
    }

    return null;
  };

  return (
    <div>
      {waitingCount > 0 ? (
        <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          <span className="font-semibold">{waitingCount} patient(s)</span> waiting for video consultation.
        </div>
      ) : null}
      <AppointmentCalendarView
        appointments={appointments}
        loading={loading}
        onRefresh={loadAppointments}
        viewAs="doctor"
        title="Appointments"
        subtitle="Review requests, approve visits, and manage your consult calendar."
        getParticipantName={getPatientName}
        getParticipantInitials={getInitials}
        renderListActions={renderActions}
      />
    </div>
  );
};

export default DoctorAppointments;
