import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CreditCard, Shield, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';
import { insuranceService } from '../../services/insuranceService';
import { formatTimeLabel } from '../../utils/appointmentCalendar';

const TYPE_OPTIONS = [
  { value: 'video', label: 'Video' },
  { value: 'chat', label: 'Chat' },
  { value: 'in_person', label: 'In person' }
];

const PAYMENT_METHODS = [
  { value: 'mtn_momo', label: 'MTN Mobile Money' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'insurance', label: 'Insurance (co-pay)' }
];

const DEFAULT_FEE = 25000;
const PLATFORM_FEE = 2000;

const PatientBook = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [insuranceQuote, setInsuranceQuote] = useState(null);
  const [form, setForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    type: 'video',
    symptoms: '',
    paymentMethod: 'mtn_momo',
    phoneNumber: user?.phone || ''
  });

  useEffect(() => {
    if (user?.phone) {
      setForm((prev) => ({ ...prev, phoneNumber: prev.phoneNumber || user.phone }));
    }
  }, [user?.phone]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await patientService.getDoctor(doctorId);
        if (mounted) setDoctor(res.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Doctor not found');
        navigate('/patient/doctors');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [doctorId, navigate]);

  useEffect(() => {
    let mounted = true;
    const loadSlots = async () => {
      try {
        setSlotsLoading(true);
        const res = await patientService.getDoctorAvailability(doctorId, { days: 21 });
        const days = res?.data?.days || [];
        if (!mounted) return;
        setAvailabilityDays(days);
        if (days.length) {
          setForm((prev) => ({
            ...prev,
            scheduledDate: prev.scheduledDate || days[0].date,
            scheduledTime: prev.scheduledTime || days[0].slots[0] || ''
          }));
        }
      } catch {
        if (mounted) setAvailabilityDays([]);
      } finally {
        if (mounted) setSlotsLoading(false);
      }
    };
    if (doctorId) loadSlots();
    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const selectedDay = useMemo(
    () => availabilityDays.find((day) => day.date === form.scheduledDate),
    [availabilityDays, form.scheduledDate]
  );

  const formatDayLabel = (dateStr) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const profile = doctor?.doctorProfile || {};
  const consultationFee = useMemo(() => {
    const fee = Number(profile.consultationFee);
    return fee > 0 ? fee : DEFAULT_FEE;
  }, [profile.consultationFee]);

  const totalAmount = consultationFee + PLATFORM_FEE;

  const amountDue =
    form.paymentMethod === 'insurance' && insuranceQuote?.eligible
      ? insuranceQuote.patientShare
      : totalAmount;

  useEffect(() => {
    let mounted = true;
    if (form.paymentMethod !== 'insurance') {
      setInsuranceQuote(null);
      return undefined;
    }
    const loadQuote = async () => {
      try {
        const res = await insuranceService.quote({
          amount: totalAmount,
          benefitType: 'consult'
        });
        if (mounted) setInsuranceQuote(res?.data || null);
      } catch {
        if (mounted) setInsuranceQuote({ eligible: false, message: 'Unable to check insurance' });
      }
    };
    loadQuote();
    return () => {
      mounted = false;
    };
  }, [form.paymentMethod, totalAmount]);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.scheduledDate || !form.scheduledTime) {
      toast.error('Pick a date and time');
      return;
    }
    if (form.paymentMethod !== 'insurance' && !form.phoneNumber.trim()) {
      toast.error('Enter a mobile money number');
      return;
    }
    if (form.paymentMethod === 'insurance' && !insuranceQuote?.eligible) {
      toast.error(insuranceQuote?.message || 'Link and verify insurance first');
      return;
    }

    setSaving(true);
    try {
      const booking = await patientService.createAppointment({
        doctor: doctorId,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        type: form.type,
        symptoms: form.symptoms.trim()
      });

      const appointmentId = booking?.data?._id;
      if (!appointmentId) {
        throw new Error('Booking failed');
      }

      const payRes = await patientService.mockPay(appointmentId, {
        method: form.paymentMethod,
        phoneNumber: form.phoneNumber.trim() || undefined
      });

      if (form.paymentMethod === 'insurance') {
        toast.success(
          payRes?.message ||
            `Booked with insurance. You pay UGX ${Number(amountDue).toLocaleString()}`
        );
      } else {
        toast.success('Booked and paid — waiting for doctor approval');
      }
      navigate('/patient/appointments');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to complete booking');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] rounded-2xl border border-ink-200/70 bg-white p-8 text-sm text-ink-500 shadow-card">
        Loading doctor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] animate-fade-up">
      <Link
        to="/patient/doctors"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to doctors
      </Link>

      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Book a visit</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">
          Dr. {doctor?.firstName} {doctor?.lastName}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{profile.specialty || 'General Practice'}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="rounded-2xl border border-ink-200/70 bg-ink-50/40 p-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-brand-600" />
              <h2 className="text-sm font-bold text-brand-700">Available times</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Slots come from the doctor&apos;s weekly schedule minus already booked visits.
            </p>

            {slotsLoading ? (
              <p className="mt-4 text-sm text-ink-500">Loading open slots…</p>
            ) : availabilityDays.length ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Day</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availabilityDays.map((day) => (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            scheduledDate: day.date,
                            scheduledTime: day.slots[0] || ''
                          }))
                        }
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          form.scheduledDate === day.date
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'border border-ink-200 bg-white text-ink-700 hover:border-brand-200'
                        }`}
                      >
                        {formatDayLabel(day.date)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Time</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedDay?.slots || []).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, scheduledTime: slot }))}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          form.scheduledTime === slot
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'border border-ink-200 bg-white text-ink-700 hover:border-brand-200'
                        }`}
                      >
                        {formatTimeLabel(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-500">
                No open slots in the next few weeks. Try another doctor or check back later.
              </p>
            )}
          </div>

          <Dropdown
            label="Visit type"
            value={form.type}
            onChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
            options={TYPE_OPTIONS}
            placeholder="Select type"
          />
          <TextTextarea
            label="Symptoms (optional)"
            name="symptoms"
            value={form.symptoms}
            onChange={onChange}
            rows={4}
            placeholder="What would you like to discuss?"
          />

          <div className="rounded-2xl border border-brand-200/70 bg-brand-50/40 p-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-brand-600" />
              <h2 className="text-sm font-bold text-brand-700">Payment (demo mode)</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              No real charge — this simulates mobile money for testing.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Consultation fee</span>
                <span className="font-semibold text-ink-900">UGX {consultationFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Platform fee</span>
                <span className="font-semibold text-ink-900">UGX {PLATFORM_FEE.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-brand-200/70 pt-2 text-base font-bold text-brand-700">
                <span>Total</span>
                <span>UGX {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-sm font-bold text-ink-900">Pay with</legend>
                <div className="mt-2 space-y-2">
                  {PAYMENT_METHODS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white bg-white px-3 py-2.5 text-sm text-ink-700"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={form.paymentMethod === option.value}
                        onChange={() => setForm((prev) => ({ ...prev, paymentMethod: option.value }))}
                        className="h-4 w-4 border-ink-300 text-brand-500 focus:ring-brand-500"
                      />
                      {option.value === 'insurance' ? (
                        <Shield size={15} className="text-brand-500" />
                      ) : (
                        <Smartphone size={15} className="text-brand-500" />
                      )}
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.paymentMethod === 'insurance' ? (
                <div className="rounded-xl border border-brand-200 bg-white px-3 py-3 text-sm text-ink-600">
                  {insuranceQuote?.eligible ? (
                    <>
                      <p className="font-semibold text-ink-900">
                        {insuranceQuote.planName || 'Your plan'} · {insuranceQuote.policyNumber}
                      </p>
                      <p className="mt-1">
                        You pay <span className="font-bold text-brand-700">UGX {Number(insuranceQuote.patientShare || 0).toLocaleString()}</span>
                        {' · '}
                        Insurer covers UGX {Number(insuranceQuote.insurerShare || 0).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p>
                      {insuranceQuote?.message || 'Checking coverage…'}{' '}
                      <Link to="/patient/insurance" className="font-semibold text-brand-600">
                        Set up insurance →
                      </Link>
                    </p>
                  )}
                </div>
              ) : (
                <TextInput
                  label="Mobile money number"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={onChange}
                  placeholder="+256700000000"
                  required
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.scheduledDate || !form.scheduledTime || !availabilityDays.length}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-60"
          >
            <CreditCard size={16} />
            {saving
              ? 'Processing…'
              : form.paymentMethod === 'insurance'
                ? `Book · pay co-pay UGX ${Number(amountDue).toLocaleString()}`
                : `Book & pay UGX ${totalAmount.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientBook;
