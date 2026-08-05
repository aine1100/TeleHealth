import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';

const DAYS = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' }
];

const DoctorSchedule = () => {
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableDays, setAvailableDays] = useState([]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getAccount();
        const dp = res.data?.doctorProfile || {};
        if (!mounted) return;
        setAvailableDays(dp.availableDays || []);
        setStart(dp.availableHours?.start || '09:00');
        setEnd(dp.availableHours?.end || '17:00');
        setIsAvailable(dp.isAvailable !== false);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load schedule');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleDay = (id) => {
    setAvailableDays((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (start >= end) {
      toast.error('End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      await doctorService.updateSchedule({
        availableDays,
        availableHours: { start, end },
        isAvailable
      });
      await fetchUser();
      toast.success('Schedule updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] rounded-2xl border border-ink-200/70 bg-white p-8 text-sm text-ink-500 shadow-card">
        Loading schedule…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Schedule</h1>
        <p className="mt-1 text-sm text-ink-500">
          Set when you accept consultations. Clinics and patients use this for booking.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Availability</h2>
              <p className="mt-1 text-xs text-ink-500">Turn off to stop new bookings while you remain active on the platform.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              onClick={() => setIsAvailable((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                isAvailable ? 'bg-brand-500' : 'bg-ink-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  isAvailable ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink-700">
            {isAvailable ? 'Accepting consultations' : 'Not accepting new consultations'}
          </p>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Working days</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DAYS.map((day) => {
              const active = availableDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-ink-100 bg-white text-ink-600 hover:border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-ink-900">Daily hours</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="auth-label">Start</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="auth-input"
                required
              />
            </div>
            <div>
              <label className="auth-label">End</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorSchedule;
