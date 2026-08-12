import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FlaskConical,
  Phone,
  Pill,
  Stethoscope,
  UserRound
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { appointmentConsultService } from '../../services/appointmentConsultService';
import { clinicService } from '../../services/clinicService';
import { doctorService } from '../../services/doctorService';
import { patientService } from '../../services/patientService';
import {
  formatTimeLabel,
  getAppointmentDate,
  getDoctorName,
  getEventLayout,
  getPatientName,
  getTypeStyle,
  statusStyles
} from '../../utils/appointmentCalendar';

const paymentMethodLabels = {
  mtn_momo: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
  insurance: 'Insurance',
  cash: 'Cash'
};

const listPathByRole = {
  patient: '/patient/appointments',
  doctor: '/doctor/appointments',
  clinic: '/clinic/appointments'
};

const AppointmentDetailPage = ({ role = 'patient' }) => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const backPath = listPathByRole[role] || '/patient/appointments';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      if (role === 'doctor') res = await doctorService.getAppointment(appointmentId);
      else if (role === 'clinic') res = await clinicService.getAppointment(appointmentId);
      else res = await patientService.getAppointment(appointmentId);
      setAppointment(res?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load appointment');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, role]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status, successMessage) => {
    setActing(true);
    try {
      if (role === 'clinic') await clinicService.updateAppointmentStatus(appointmentId, status);
      else await doctorService.updateAppointmentStatus(appointmentId, status);
      toast.success(successMessage);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update appointment');
    } finally {
      setActing(false);
    }
  };

  const cancelVisit = async () => {
    setActing(true);
    try {
      await patientService.cancelAppointment(appointmentId);
      toast.success('Appointment cancelled');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to cancel');
    } finally {
      setActing(false);
    }
  };

  const payNow = async () => {
    setActing(true);
    try {
      await patientService.mockPay(appointmentId, {
        method: 'mtn_momo',
        phoneNumber: appointment?.patient?.phone || user?.phone
      });
      toast.success('Payment received — awaiting doctor approval');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to complete payment');
    } finally {
      setActing(false);
    }
  };

  const startConsultation = async () => {
    setActing(true);
    try {
      await appointmentConsultService.startVideoCall(appointmentId);
      toast.success('Consultation started');
      navigate(`/doctor/consult/${appointmentId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to start consultation');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-ink-500">Loading appointment…</p>;
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up py-10 text-center">
        <p className="text-base font-semibold text-ink-900">Appointment not found</p>
        <Link to={backPath} className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Back to appointments
        </Link>
      </div>
    );
  }

  const date = getAppointmentDate(appointment);
  const layout = getEventLayout(appointment);
  const typeStyle = getTypeStyle(appointment.type);
  const statusClass = statusStyles[appointment.status] || statusStyles.pending;
  const payment = appointment.payment || {};
  const doctorName = getDoctorName(appointment);
  const patientName = getPatientName(appointment);
  const specialty = appointment.doctor?.doctorProfile?.specialty;
  const counterpartName = role === 'patient' ? doctorName : patientName;
  const phone =
    role === 'patient' ? appointment.doctor?.phone : appointment.patient?.phone;

  const dateLabel = date
    ? date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : '—';

  const paymentLabel =
    payment.status === 'paid'
      ? 'Paid'
      : payment.status === 'failed'
        ? 'Payment failed'
        : 'Payment pending';

  const canCancel = !['cancelled', 'completed', 'no_show'].includes(appointment.status);
  const needsPayment = (payment.status || 'pending') !== 'paid' && canCancel;
  const isVideo = appointment.type === 'video';
  const canJoinWaiting =
    role === 'patient' && isVideo && appointment.status === 'confirmed' && payment.status === 'paid';
  const inWaiting = isVideo && appointment.status === 'in_waiting_room';
  const inCall = isVideo && appointment.status === 'in_progress';
  const hasCare =
    Boolean(appointment.diagnosis) ||
    appointment.prescription?.length > 0 ||
    appointment.labOrders?.length > 0;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Link to={backPath} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to appointments
      </Link>

      <div className={`mt-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm`}>
        <div className={`px-5 py-5 sm:px-6 ${typeStyle.block}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Appointment details</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{counterpartName}</h1>
          {role === 'clinic' ? (
            <p className="mt-1 text-sm font-medium opacity-90">Doctor: {doctorName}</p>
          ) : null}
          {role === 'patient' && specialty ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm opacity-90">
              <Stethoscope size={14} /> {specialty}
            </p>
          ) : null}
          <p className="mt-2 text-sm font-medium opacity-90">
            {formatTimeLabel(appointment.scheduledTime)} · {typeStyle.label}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}>
              {(appointment.status || 'pending').replace(/_/g, ' ')}
            </span>
            {payment.totalAmount ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {paymentLabel}
              </span>
            ) : null}
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold capitalize text-ink-700">
              {typeStyle.label}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-100 bg-ink-50/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Date</p>
              <p className="mt-1 inline-flex items-start gap-2 text-sm font-medium text-ink-800">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-brand-500" />
                {dateLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-ink-50/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Time</p>
              <p className="mt-1 inline-flex items-start gap-2 text-sm font-medium text-ink-800">
                <Clock3 size={15} className="mt-0.5 shrink-0 text-brand-500" />
                {formatTimeLabel(appointment.scheduledTime)} – {layout.endTimeLabel} ({appointment.duration || 30} min)
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-ink-50/50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">People</p>
            <div className="mt-2 space-y-2 text-sm text-ink-800">
              <p className="inline-flex items-center gap-2">
                <UserRound size={14} className="text-brand-500" />
                Patient: <span className="font-semibold">{patientName}</span>
              </p>
              <p className="inline-flex items-center gap-2">
                <Stethoscope size={14} className="text-brand-500" />
                Doctor: <span className="font-semibold">{doctorName}</span>
                {specialty ? <span className="text-ink-500">· {specialty}</span> : null}
              </p>
              {phone ? (
                <p className="inline-flex items-center gap-2">
                  <Phone size={14} className="text-brand-500" />
                  {phone}
                </p>
              ) : null}
            </div>
          </div>

          {payment.totalAmount ? (
            <div className="rounded-2xl border border-ink-100 bg-ink-50/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Payment</p>
              <p className="mt-1 text-sm text-ink-800">
                <span className="text-lg font-bold text-ink-900">
                  UGX {Number(payment.totalAmount).toLocaleString()}
                </span>
                {payment.method ? ` · ${paymentMethodLabels[payment.method] || payment.method}` : ''}
              </p>
              {appointment.status === 'pending' && payment.status === 'paid' && role === 'patient' ? (
                <p className="mt-1 text-xs font-medium text-brand-700">Awaiting doctor approval</p>
              ) : null}
            </div>
          ) : null}

          {appointment.symptoms ? (
            <div className="rounded-2xl border border-ink-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Visit notes / symptoms</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{appointment.symptoms}</p>
            </div>
          ) : null}

          {appointment.diagnosis ? (
            <div className="rounded-2xl border border-ink-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Diagnosis</p>
              <p className="mt-2 text-sm font-medium text-ink-800">{appointment.diagnosis}</p>
            </div>
          ) : null}

          {appointment.notes ? (
            <div className="rounded-2xl border border-ink-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Doctor notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{appointment.notes}</p>
            </div>
          ) : null}

          {appointment.prescription?.length ? (
            <div className="rounded-2xl border border-brand-100 bg-brand-50/30 px-4 py-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                <Pill size={12} /> Prescription
              </p>
              <ul className="mt-2 space-y-2">
                {appointment.prescription.map((rx, index) => (
                  <li key={`rx-${index}`} className="rounded-xl border border-brand-100 bg-white px-3 py-2.5">
                    <p className="font-semibold text-ink-900">{rx.medicineName}</p>
                    <p className="text-sm text-ink-600">
                      {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                    </p>
                    {rx.instructions ? <p className="mt-1 text-xs text-ink-500">{rx.instructions}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {appointment.labOrders?.length ? (
            <div className="rounded-2xl border border-ink-100 px-4 py-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                <FlaskConical size={12} /> Lab tests
              </p>
              <ul className="mt-2 space-y-2">
                {appointment.labOrders.map((lab, index) => (
                  <li key={`lab-${index}`} className="rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2.5">
                    <p className="font-semibold text-ink-900">
                      {lab.testName}
                      {lab.testCode ? (
                        <span className="ml-1.5 text-xs font-medium text-ink-400">({lab.testCode})</span>
                      ) : null}
                    </p>
                    <p className="text-xs capitalize text-ink-500">
                      {(lab.status || 'ordered').replace(/_/g, ' ')}
                    </p>
                    {lab.instructions ? <p className="mt-1 text-xs text-ink-500">{lab.instructions}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {appointment.videoCall?.roomId ? (
            <div className="rounded-2xl border border-ink-100 px-4 py-3 text-sm text-ink-600">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Video session</p>
              <p className="mt-1">
                {appointment.videoCall.startedAt
                  ? `Started ${new Date(appointment.videoCall.startedAt).toLocaleString()}`
                  : 'Room ready'}
                {appointment.videoCall.endedAt
                  ? ` · Ended ${new Date(appointment.videoCall.endedAt).toLocaleString()}`
                  : ''}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            {role === 'patient' ? (
              <>
                {hasCare ? (
                  <Link
                    to="/patient/care"
                    className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    View care records
                  </Link>
                ) : null}
                {hasCare && appointment.prescription?.length ? (
                  <Link
                    to="/patient/pharmacies"
                    className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    Send to pharmacy
                  </Link>
                ) : null}
                {canJoinWaiting || inWaiting ? (
                  <Link
                    to={`/patient/waiting/${appointment._id}`}
                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    {inWaiting ? 'View waiting room' : 'Join waiting room'}
                  </Link>
                ) : null}
                {inCall ? (
                  <Link
                    to={`/patient/consult/${appointment._id}`}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Join video call
                  </Link>
                ) : null}
                {needsPayment ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={payNow}
                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    Pay now (demo)
                  </button>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={cancelVisit}
                    className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Cancel visit
                  </button>
                ) : null}
              </>
            ) : null}

            {role === 'doctor' ? (
              <>
                {appointment.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => updateStatus('confirmed', 'Appointment approved')}
                      className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => updateStatus('cancelled', 'Appointment declined')}
                      className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </>
                ) : null}
                {isVideo && (appointment.status === 'confirmed' || appointment.status === 'in_waiting_room') ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={startConsultation}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {appointment.status === 'in_waiting_room' ? 'Start consultation' : 'Start video call'}
                  </button>
                ) : null}
                {isVideo && appointment.status === 'in_progress' ? (
                  <Link
                    to={`/doctor/consult/${appointment._id}`}
                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Rejoin call
                  </Link>
                ) : null}
                {['completed', 'in_progress', 'confirmed'].includes(appointment.status) || hasCare ? (
                  <Link
                    to={`/doctor/appointments/${appointment._id}/care-plan`}
                    className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    {hasCare ? 'Edit care plan' : 'Write prescription'}
                  </Link>
                ) : null}
                {hasCare && appointment.prescription?.length ? (
                  <Link
                    to="/doctor/pharmacies"
                    className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    Send to pharmacy
                  </Link>
                ) : null}
              </>
            ) : null}

            {role === 'clinic' && appointment.status === 'pending' ? (
              <>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => updateStatus('confirmed', 'Appointment approved')}
                  className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => updateStatus('cancelled', 'Appointment declined')}
                  className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailPage;
