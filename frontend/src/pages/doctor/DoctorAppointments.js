import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AppointmentCalendarView from '../../components/appointments/AppointmentCalendarView';
import { useAuth } from '../../context/AuthContext';
import { appointmentConsultService } from '../../services/appointmentConsultService';
import { doctorService } from '../../services/doctorService';
import getSocket from '../../utils/socket';
import { getPatientName } from '../../utils/appointmentCalendar';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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

  const getInitials = (appt) =>
    getPatientName(appt)
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

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
        title="Appointments"
        subtitle="Review requests, approve visits, and manage your consult calendar."
        detailPathPrefix="/doctor/appointments"
        getParticipantName={getPatientName}
        getParticipantInitials={getInitials}
      />
    </div>
  );
};

export default DoctorAppointments;
