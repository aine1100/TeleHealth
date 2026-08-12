import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AppointmentCalendarView from '../../components/appointments/AppointmentCalendarView';
import { clinicService } from '../../services/clinicService';
import { getDoctorName, getPatientName } from '../../utils/appointmentCalendar';

const ClinicAppointments = () => {
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const from = new Date();
      from.setMonth(from.getMonth() - 2);
      const to = new Date();
      to.setMonth(to.getMonth() + 4);
      const res = await clinicService.getAppointments({
        from: from.toISOString(),
        to: to.toISOString()
      });
      setAppointments(res?.data || []);
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

  const updateStatus = async (id, status, successMessage, closeDetail) => {
    setActingId(id);
    try {
      await clinicService.updateAppointmentStatus(id, status);
      toast.success(successMessage);
      closeDetail?.();
      await loadAppointments();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update appointment');
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

  return (
    <AppointmentCalendarView
      appointments={appointments}
      loading={loading}
      onRefresh={loadAppointments}
      viewAs="clinic"
      title="Appointments"
      subtitle="Facility calendar for visits across your care team."
      getParticipantName={getPatientName}
      getParticipantSubtitle={(appt) => getDoctorName(appt)}
      getParticipantInitials={getInitials}
      renderListActions={(appt, closeDetail) =>
        appt.status === 'pending' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actingId === appt._id}
              onClick={() => updateStatus(appt._id, 'confirmed', 'Appointment approved', closeDetail)}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={actingId === appt._id}
              onClick={() => updateStatus(appt._id, 'cancelled', 'Appointment declined', closeDetail)}
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : null
      }
    />
  );
};

export default ClinicAppointments;
