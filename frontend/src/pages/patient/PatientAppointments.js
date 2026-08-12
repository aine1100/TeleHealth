import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AppointmentCalendarView from '../../components/appointments/AppointmentCalendarView';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';
import { getDoctorName } from '../../utils/appointmentCalendar';

const PatientAppointments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
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

  const cancel = async (id, closeDetail) => {
    setActingId(id);
    try {
      await patientService.cancelAppointment(id);
      toast.success('Appointment cancelled');
      closeDetail?.();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to cancel');
    } finally {
      setActingId(null);
    }
  };

  const payNow = async (appt, closeDetail) => {
    setActingId(appt._id);
    try {
      await patientService.mockPay(appt._id, {
        method: 'mtn_momo',
        phoneNumber: appt.patient?.phone || user?.phone
      });
      toast.success('Payment received — awaiting doctor approval');
      closeDetail?.();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to complete payment');
    } finally {
      setActingId(null);
    }
  };

  const getInitials = (appt) =>
    getDoctorName(appt)
      .replace(/^Dr\.\s*/, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const renderActions = (appt, closeDetail) => {
    const canCancel = !['cancelled', 'completed', 'no_show'].includes(appt.status);
    const paymentStatus = appt.payment?.status || 'pending';
    const needsPayment = paymentStatus !== 'paid' && canCancel;
    const isVideo = appt.type === 'video';
    const canJoinWaiting =
      isVideo && appt.status === 'confirmed' && paymentStatus === 'paid';
    const inWaiting = isVideo && appt.status === 'in_waiting_room';
    const inCall = isVideo && appt.status === 'in_progress';

    if (!canCancel && !needsPayment && !canJoinWaiting && !inWaiting && !inCall) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {canJoinWaiting ? (
          <Link
            to={`/patient/waiting/${appt._id}`}
            onClick={() => closeDetail?.()}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Join waiting room
          </Link>
        ) : null}
        {inWaiting ? (
          <Link
            to={`/patient/waiting/${appt._id}`}
            onClick={() => closeDetail?.()}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            View waiting room
          </Link>
        ) : null}
        {inCall ? (
          <Link
            to={`/patient/consult/${appt._id}`}
            onClick={() => closeDetail?.()}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Join video call
          </Link>
        ) : null}
        {needsPayment ? (
          <button
            type="button"
            disabled={actingId === appt._id}
            onClick={() => payNow(appt, closeDetail)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            Pay now (demo)
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            disabled={actingId === appt._id}
            onClick={() => cancel(appt._id, closeDetail)}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            Cancel visit
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <AppointmentCalendarView
      appointments={appointments}
      loading={loading}
      onRefresh={load}
      viewAs="patient"
      title="Appointments"
      subtitle="Track your visits, payments, and doctor approval status."
      bookLink={{ to: '/patient/doctors', label: 'Book a visit' }}
      getParticipantName={getDoctorName}
      getParticipantInitials={getInitials}
      renderListActions={renderActions}
    />
  );
};

export default PatientAppointments;
