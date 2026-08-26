import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FlaskConical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import { doctorService } from '../../services/doctorService';
import { labService } from '../../services/labService';
import { getPatientName } from '../../utils/appointmentCalendar';

const emptyRx = () => ({
  medicineName: '',
  dosage: '',
  frequency: 'Once daily',
  duration: '',
  instructions: '',
  isChronic: false
});

const emptyLab = () => ({
  testName: '',
  testCode: '',
  instructions: '',
  labId: '',
  priority: 'routine'
});

const FREQUENCY_OPTIONS = [
  { value: 'Once daily', label: 'Once daily' },
  { value: 'Twice daily', label: 'Twice daily' },
  { value: 'Three times daily', label: 'Three times daily' },
  { value: 'Four times daily', label: 'Four times daily' },
  { value: 'As needed', label: 'As needed' },
  { value: 'Weekly', label: 'Weekly' }
];

const DoctorCarePlan = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState([emptyRx()]);
  const [labOrders, setLabOrders] = useState([emptyLab()]);
  const [labOptions, setLabOptions] = useState([{ value: '', label: 'Any lab (open pool)' }]);
  const [createReminders, setCreateReminders] = useState(true);
  const [markCompleted, setMarkCompleted] = useState(true);

  useEffect(() => {
    labService
      .listLabs({ limit: 50 })
      .then((res) => {
        const options = (res?.data || []).map((lab) => ({
          value: lab._id,
          label: lab.displayName || lab.organizationProfile?.organizationName || 'Lab'
        }));
        setLabOptions([{ value: '', label: 'Any lab (open pool)' }, ...options]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getAppointment(appointmentId);
        const appt = res?.data;
        if (!mounted) return;
        if (!appt) {
          toast.error('Appointment not found');
          navigate('/doctor/appointments');
          return;
        }
        setAppointment(appt);
        setDiagnosis(appt.diagnosis || '');
        setNotes(appt.notes || '');
        setPrescription(appt.prescription?.length ? appt.prescription.map((rx) => ({ ...emptyRx(), ...rx })) : [emptyRx()]);
        setLabOrders(appt.labOrders?.length ? appt.labOrders.map((lab) => ({ ...emptyLab(), ...lab })) : [emptyLab()]);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load visit');
        navigate('/doctor/appointments');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [appointmentId, navigate]);

  const updateRx = (index, field, value) => {
    setPrescription((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const updateLab = (index, field, value) => {
    setLabOrders((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const meds = prescription.filter((rx) => rx.medicineName?.trim());
    const labs = labOrders.filter((lab) => lab.testName?.trim());

    if (!diagnosis.trim() && !meds.length && !labs.length) {
      toast.error('Add a diagnosis, medicine, or lab test');
      return;
    }

    setSaving(true);
    try {
      await doctorService.saveCarePlan(appointmentId, {
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        prescription: meds,
        labOrders: labs,
        createReminders,
        markCompleted
      });
      toast.success('Care plan saved — patient notified');
      navigate('/doctor/appointments');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save care plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-ink-500">Loading visit…</p>;
  }

  const patientName = getPatientName(appointment || {});
  const dateLabel = appointment?.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Link to="/doctor/appointments" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Back to appointments
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-ink-900">Prescription & tests</h1>
        <p className="mt-1 text-sm text-ink-600">
          For {patientName}
          {dateLabel ? ` · ${dateLabel}` : ''}
          {appointment?.scheduledTime ? ` · ${appointment.scheduledTime}` : ''}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Clinical notes</h2>
          <div className="mt-3 space-y-3">
            <TextInput
              label="Diagnosis"
              name="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute upper respiratory infection"
            />
            <TextTextarea
              label="Doctor notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Follow-up advice, red flags, lifestyle notes…"
              rows={3}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Prescription</h2>
            <button
              type="button"
              onClick={() => setPrescription((prev) => [...prev, emptyRx()])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Plus size={14} /> Add medicine
            </button>
          </div>

          <div className="mt-3 space-y-4">
            {prescription.map((rx, index) => (
              <div key={`rx-${index}`} className="rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-500">Medicine {index + 1}</p>
                  {prescription.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setPrescription((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-rose-600"
                      aria-label="Remove medicine"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Medicine name"
                    value={rx.medicineName}
                    onChange={(e) => updateRx(index, 'medicineName', e.target.value)}
                    placeholder="e.g. Amoxicillin"
                  />
                  <TextInput
                    label="Dosage"
                    value={rx.dosage}
                    onChange={(e) => updateRx(index, 'dosage', e.target.value)}
                    placeholder="e.g. 500mg"
                  />
                  <Dropdown
                    label="Frequency"
                    value={rx.frequency}
                    onChange={(value) => updateRx(index, 'frequency', value)}
                    options={FREQUENCY_OPTIONS}
                  />
                  <TextInput
                    label="Duration"
                    value={rx.duration}
                    onChange={(e) => updateRx(index, 'duration', e.target.value)}
                    placeholder="e.g. 7 days"
                  />
                  <div className="sm:col-span-2">
                    <TextInput
                      label="Instructions"
                      value={rx.instructions}
                      onChange={(e) => updateRx(index, 'instructions', e.target.value)}
                      placeholder="Take after meals"
                    />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={Boolean(rx.isChronic)}
                    onChange={(e) => updateRx(index, 'isChronic', e.target.checked)}
                    className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                  />
                  Chronic / ongoing medication
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
              <FlaskConical size={14} /> Lab tests
            </h2>
            <button
              type="button"
              onClick={() => setLabOrders((prev) => [...prev, emptyLab()])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Plus size={14} /> Add test
            </button>
          </div>

          <div className="mt-3 space-y-4">
            {labOrders.map((lab, index) => (
              <div key={`lab-${index}`} className="rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-500">Test {index + 1}</p>
                  {labOrders.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setLabOrders((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-rose-600"
                      aria-label="Remove test"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Test name"
                    value={lab.testName}
                    onChange={(e) => updateLab(index, 'testName', e.target.value)}
                    placeholder="e.g. Complete blood count"
                  />
                  <TextInput
                    label="Code (optional)"
                    value={lab.testCode}
                    onChange={(e) => updateLab(index, 'testCode', e.target.value)}
                    placeholder="e.g. CBC"
                  />
                  <Dropdown
                    label="Laboratory"
                    value={lab.labId || ''}
                    onChange={(value) => updateLab(index, 'labId', value)}
                    options={labOptions}
                  />
                  <Dropdown
                    label="Priority"
                    value={lab.priority || 'routine'}
                    onChange={(value) => updateLab(index, 'priority', value)}
                    options={[
                      { value: 'routine', label: 'Routine' },
                      { value: 'urgent', label: 'Urgent' }
                    ]}
                  />
                  <div className="sm:col-span-2">
                    <TextInput
                      label="Instructions"
                      value={lab.instructions}
                      onChange={(e) => updateLab(index, 'instructions', e.target.value)}
                      placeholder="Fasting required, morning sample…"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={createReminders}
              onChange={(e) => setCreateReminders(e.target.checked)}
              className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
            Create medicine reminders for the patient
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={markCompleted}
              onChange={(e) => setMarkCompleted(e.target.checked)}
              className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
            Mark appointment as completed
          </label>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & notify patient'}
          </button>
          <Link
            to="/doctor/pharmacies"
            className="rounded-xl border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Send to pharmacy
          </Link>
          <Link
            to="/doctor/appointments"
            className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default DoctorCarePlan;
