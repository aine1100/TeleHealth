import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AppointmentCalendarView from '../../components/appointments/AppointmentCalendarView';
import { patientService } from '../../services/patientService';
import { getDoctorName } from '../../utils/appointmentCalendar';

const PatientAppointments = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientService.getAppointments();
      setAppointments(res?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getInitials = (appt) =>
    getDoctorName(appt)
      .replace(/^Dr\.\s*/, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <AppointmentCalendarView
      appointments={appointments}
      loading={loading}
      onRefresh={load}
      title="Appointments"
      subtitle="Track your visits, payments, and doctor approval status."
      bookLink={{ to: '/patient/doctors', label: 'Book a visit' }}
      detailPathPrefix="/patient/appointments"
      getParticipantName={getDoctorName}
      getParticipantInitials={getInitials}
    />
  );
};

export default PatientAppointments;
