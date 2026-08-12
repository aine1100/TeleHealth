import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Clock3, X } from 'lucide-react';
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

const AppointmentDetailModal = ({
  open,
  onClose,
  appointment,
  viewAs = 'patient',
  renderActions
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !appointment) return null;

  const date = getAppointmentDate(appointment);
  const layout = getEventLayout(appointment);
  const typeStyle = getTypeStyle(appointment.type);
  const statusClass = statusStyles[appointment.status] || statusStyles.pending;
  const payment = appointment.payment || {};
  const isPatientView = viewAs === 'patient';
  const isClinicView = viewAs === 'clinic';

  const counterpartName = isPatientView ? getDoctorName(appointment) : getPatientName(appointment);
  const clinicDoctorName = isClinicView ? getDoctorName(appointment) : null;
  const specialty = appointment.doctor?.doctorProfile?.specialty;
  const phone = (isPatientView ? appointment.doctor : appointment.patient)?.phone;

  const paymentLabel =
    payment.status === 'paid'
      ? 'Paid'
      : payment.status === 'failed'
        ? 'Payment failed'
        : 'Payment pending';

  const dateLabel = date
    ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close appointment details"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-detail-title"
        className="relative z-10 flex max-h-[min(560px,92vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card animate-fade-up"
      >
        <div className={`shrink-0 px-4 py-3 sm:px-5 ${typeStyle.block}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Appointment</p>
              <h2 id="appointment-detail-title" className="truncate text-base font-bold">
                {counterpartName}
              </h2>
              {isClinicView && clinicDoctorName ? (
                <p className="mt-0.5 truncate text-xs font-medium opacity-90">{clinicDoctorName}</p>
              ) : null}
              <p className="mt-0.5 text-xs font-medium opacity-90">
                {formatTimeLabel(appointment.scheduledTime)} · {typeStyle.label}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/70 p-1.5 text-ink-700 transition hover:bg-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass}`}>
              {(appointment.status || 'pending').replace(/_/g, ' ')}
            </span>
            {payment.totalAmount ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {paymentLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-start gap-2 text-ink-700">
              <CalendarDays size={14} className="mt-0.5 shrink-0 text-brand-500" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-start gap-2 text-ink-700">
              <Clock3 size={14} className="mt-0.5 shrink-0 text-brand-500" />
              <span>
                {formatTimeLabel(appointment.scheduledTime)} – {layout.endTimeLabel} ({appointment.duration || 30} min)
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm">
            {specialty && isPatientView ? <p className="text-ink-500">{specialty}</p> : null}
            {isClinicView && clinicDoctorName ? (
              <p className="font-medium text-ink-800">Doctor: {clinicDoctorName}</p>
            ) : null}
            {phone ? <p className="font-medium text-ink-800">{phone}</p> : null}
            {payment.totalAmount ? (
              <p className="mt-1 text-ink-700">
                <span className="font-bold text-ink-900">UGX {Number(payment.totalAmount).toLocaleString()}</span>
                {payment.method ? ` · ${paymentMethodLabels[payment.method] || payment.method}` : ''}
              </p>
            ) : null}
            {appointment.status === 'pending' && payment.status === 'paid' && isPatientView ? (
              <p className="mt-1 text-xs font-medium text-brand-700">Awaiting doctor approval</p>
            ) : null}
          </div>

          {appointment.symptoms ? (
            <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Notes</p>
              <p className="mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap text-sm text-ink-700">
                {appointment.symptoms}
              </p>
            </div>
          ) : null}

          {renderActions ? (
            <div className="mt-3 border-t border-ink-100 pt-3">{renderActions(appointment)}</div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppointmentDetailModal;
