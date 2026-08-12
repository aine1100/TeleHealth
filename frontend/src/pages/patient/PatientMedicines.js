import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Clock, Pause, Pill, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { patientService } from '../../services/patientService';

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'thrice_daily', label: 'Three times daily' },
  { value: 'as_needed', label: 'As needed' }
];

const emptyForm = {
  medicineName: '',
  dosage: '',
  frequency: 'once_daily',
  times: '08:00',
  duration: '',
  instructions: '',
  startDate: new Date().toISOString().slice(0, 10)
};

const formatFrequency = (value) => (value || '').replace(/_/g, ' ');

const isDueToday = (times = []) => {
  if (!times.length) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return times.some((slot) => {
    const [h, m] = slot.split(':').map(Number);
    const slotMinutes = h * 60 + (m || 0);
    return slotMinutes >= currentMinutes - 60;
  });
};

const PatientMedicines = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loggingId, setLoggingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await patientService.getReminders();
      setReminders(res?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load reminders');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const todayReminders = useMemo(
    () => reminders.filter((item) => item.status === 'active' && isDueToday(item.times)),
    [reminders]
  );

  const activeCount = useMemo(
    () => reminders.filter((item) => item.status === 'active').length,
    [reminders]
  );

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicineName.trim() || !form.dosage.trim()) {
      toast.error('Medicine name and dosage are required');
      return;
    }
    setSaving(true);
    try {
      await patientService.createReminder({
        medicineName: form.medicineName.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        times: form.times.split(',').map((t) => t.trim()).filter(Boolean),
        duration: form.duration.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        startDate: form.startDate
      });
      toast.success('Reminder added');
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to add reminder');
    } finally {
      setSaving(false);
    }
  };

  const logDose = async (id, status) => {
    setLoggingId(id);
    try {
      await patientService.logDose(id, { status });
      toast.success(status === 'taken' ? 'Marked as taken' : 'Dose skipped');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update dose');
    } finally {
      setLoggingId(null);
    }
  };

  const togglePause = async (item) => {
    const nextStatus = item.status === 'paused' ? 'active' : 'paused';
    try {
      await patientService.updateReminderStatus(item._id, nextStatus);
      toast.success(nextStatus === 'paused' ? 'Reminder paused' : 'Reminder resumed');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update reminder');
    }
  };

  const removeReminder = async (id) => {
    try {
      await patientService.deleteReminder(id);
      toast.success('Reminder removed');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to remove reminder');
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Medicine reminders</h1>
          <p className="mt-1 text-sm text-ink-500">
            Track doses, get on-time reminders, and stay on your prescribed schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
        >
          <Plus size={16} />
          Add reminder
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active reminders', value: activeCount, icon: Pill, tone: 'bg-brand-50 text-brand-700' },
          { label: 'Due today', value: todayReminders.length, icon: Bell, tone: 'bg-amber-50 text-amber-700' },
          {
            label: 'Avg adherence',
            value: reminders.length
              ? `${Math.round(
                  reminders.reduce((sum, item) => sum + (item.adherenceRate || 100), 0) / reminders.length
                )}%`
              : '—',
            icon: Check,
            tone: 'bg-emerald-50 text-emerald-700'
          }
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                <stat.icon size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{stat.label}</p>
                <p className="text-xl font-bold text-ink-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {todayReminders.length ? (
        <section className="mt-5 rounded-2xl border border-brand-200/70 bg-brand-50/40 p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-brand-700">Today&apos;s reminders</h2>
          </div>
          <div className="mt-4 space-y-3">
            {todayReminders.map((item) => (
              <div
                key={`today-${item._id}`}
                className="flex flex-col gap-3 rounded-xl border border-white bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-ink-900">{item.medicineName}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {item.dosage} · {formatFrequency(item.frequency)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                    <Clock size={13} />
                    {item.times?.join(', ') || 'Any time today'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loggingId === item._id}
                    onClick={() => logDose(item._id, 'taken')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    <Check size={15} />
                    Taken
                  </button>
                  <button
                    type="button"
                    disabled={loggingId === item._id}
                    onClick={() => logDose(item._id, 'skipped')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
                  >
                    <X size={15} />
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {open ? (
        <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-sm font-bold text-brand-600">New reminder</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextInput label="Medicine name" name="medicineName" value={form.medicineName} onChange={onChange} required />
            <TextInput label="Dosage" name="dosage" value={form.dosage} onChange={onChange} placeholder="1 tablet" required />
            <Dropdown
              label="Frequency"
              value={form.frequency}
              onChange={(value) => setForm((prev) => ({ ...prev, frequency: value }))}
              options={FREQUENCY_OPTIONS}
            />
            <TextInput label="Times" name="times" value={form.times} onChange={onChange} hint="Comma-separated, e.g. 08:00, 20:00" />
            <TextInput label="Start date" type="date" name="startDate" value={form.startDate} onChange={onChange} />
            <TextInput label="Duration" name="duration" value={form.duration} onChange={onChange} placeholder="7 days" />
            <div className="sm:col-span-2">
              <TextTextarea label="Instructions" name="instructions" value={form.instructions} onChange={onChange} rows={3} />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save reminder'}
          </button>
        </form>
      ) : null}

      <div className="mt-5 space-y-4">
        <h2 className="text-lg font-bold text-brand-600">All medicines</h2>
        {loading ? (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
            Loading reminders…
          </div>
        ) : reminders.length ? (
          reminders.map((item) => (
            <article key={item._id} className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-ink-900">{item.medicineName}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'paused'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {item.dosage} · {formatFrequency(item.frequency)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                      <Clock size={12} />
                      {item.times?.join(', ') || 'Scheduled'}
                    </span>
                    {item.duration ? <span>Duration: {item.duration}</span> : null}
                    <span>Adherence: {item.adherenceRate ?? 100}%</span>
                  </div>
                  <p className="mt-3 text-sm text-ink-600">{item.instructions || 'Take as prescribed.'}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                  {item.status === 'active' ? (
                    <>
                      <button
                        type="button"
                        disabled={loggingId === item._id}
                        onClick={() => logDose(item._id, 'taken')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                      >
                        <Check size={15} />
                        Mark taken
                      </button>
                      <button
                        type="button"
                        disabled={loggingId === item._id}
                        onClick={() => logDose(item._id, 'skipped')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
                      >
                        Skip dose
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => togglePause(item)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    <Pause size={15} />
                    {item.status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeReminder(item._id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
            No active medicine reminders yet. Add your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMedicines;
