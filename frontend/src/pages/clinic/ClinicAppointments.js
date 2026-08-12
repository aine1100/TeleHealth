import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AppointmentCalendarView from '../../components/appointments/AppointmentCalendarView';
import { clinicService } from '../../services/clinicService';
import { getDoctorName, getPatientName } from '../../utils/appointmentCalendar';

const ClinicAppointments = () => {
  const [loading, setLoading] = useState(true);
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
      title="Appointments"
      subtitle="Facility calendar for visits across your care team."
      detailPathPrefix="/clinic/appointments"
      getParticipantName={getPatientName}
      getParticipantSubtitle={(appt) => getDoctorName(appt)}
      getParticipantInitials={getInitials}
    />
  );
};

export default ClinicAppointments;
