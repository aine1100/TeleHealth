import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Pill, Stethoscope, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { patientService } from '../../services/patientService';
import { getDoctorName } from '../../utils/appointmentCalendar';

const labStatusStyles = {
  ordered: 'bg-amber-50 text-amber-700',
  sample_collected: 'bg-sky-50 text-sky-700',
  processing: 'bg-violet-50 text-violet-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700'
};

const PatientCare = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientService.getCareRecords();
      setRecords(res?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load care records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Prescriptions & tests</h1>
        <p className="mt-1 text-sm text-ink-600">
          View medicines and lab tests your doctor ordered after consultations.
        </p>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-ink-500">Loading care records…</p>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
          <Stethoscope className="mx-auto text-ink-300" size={28} />
          <p className="mt-3 text-sm font-medium text-ink-800">No prescriptions yet</p>
          <p className="mt-1 text-sm text-ink-500">
            After a visit, your doctor can issue medicines and lab orders here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const doctorName = getDoctorName(record);
            const dateLabel = record.scheduledDate
              ? new Date(record.scheduledDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : '—';
            const specialty = record.doctor?.doctorProfile?.specialty;

            return (
              <article
                key={record._id}
                className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">{doctorName}</h2>
                    {specialty ? <p className="text-xs text-ink-500">{specialty}</p> : null}
                    <p className="mt-1 text-sm text-ink-600">
                      {dateLabel}
                      {record.scheduledTime ? ` · ${record.scheduledTime}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-ink-700">
                    {(record.status || '').replace(/_/g, ' ')}
                  </span>
                </div>

                {record.diagnosis ? (
                  <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Diagnosis</p>
                    <p className="mt-1 text-sm text-ink-800">{record.diagnosis}</p>
                  </div>
                ) : null}

                {record.notes ? (
                  <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Doctor notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{record.notes}</p>
                  </div>
                ) : null}

                {record.prescription?.length ? (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                        <Pill size={12} /> Prescription
                      </p>
                      <Link
                        to="/patient/pharmacies"
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        <Store size={12} /> Send to pharmacy
                      </Link>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {record.prescription.map((rx, index) => (
                        <li
                          key={`${record._id}-rx-${index}`}
                          className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2.5"
                        >
                          <p className="font-semibold text-ink-900">{rx.medicineName}</p>
                          <p className="mt-0.5 text-sm text-ink-700">
                            {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                          </p>
                          {rx.instructions ? (
                            <p className="mt-1 text-xs text-ink-500">{rx.instructions}</p>
                          ) : null}
                          {rx.isChronic ? (
                            <span className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                              Chronic
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {record.labOrders?.length ? (
                  <div className="mt-4">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                      <FlaskConical size={12} /> Lab tests
                    </p>
                    <ul className="mt-2 space-y-2">
                      {record.labOrders.map((lab, index) => (
                        <li
                          key={`${record._id}-lab-${index}`}
                          className="rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-ink-900">
                              {lab.testName}
                              {lab.testCode ? (
                                <span className="ml-1.5 text-xs font-medium text-ink-400">({lab.testCode})</span>
                              ) : null}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                labStatusStyles[lab.status] || labStatusStyles.ordered
                              }`}
                            >
                              {(lab.status || 'ordered').replace(/_/g, ' ')}
                            </span>
                          </div>
                          {lab.instructions ? (
                            <p className="mt-1 text-xs text-ink-500">{lab.instructions}</p>
                          ) : null}
                          {lab.results?.value ? (
                            <p className="mt-2 text-sm text-ink-700">
                              <span className="font-medium">Results: </span>
                              {lab.results.value}
                              {lab.results.unit ? ` ${lab.results.unit}` : ''}
                              {lab.results.referenceRange ? ` (ref ${lab.results.referenceRange})` : ''}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientCare;
