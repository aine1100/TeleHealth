import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { clinicPatients } from '../../data/clinicDashboard';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  new: 'bg-brand-50 text-brand-700',
  inactive: 'bg-ink-100 text-ink-500'
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-ink-900">{value || '—'}</p>
  </div>
);

const ClinicPatientDetail = () => {
  const { patientId } = useParams();
  const patient = clinicPatients.find((item) => item.id === patientId);

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-card">
        <p className="text-lg font-semibold text-ink-900">Patient not found</p>
        <Link to="/clinic/patients" className="mt-4 inline-block text-sm font-semibold text-brand-600">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <Link
        to="/clinic/patients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to patients
      </Link>

      <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 text-xl font-bold text-ink-700">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-ink-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[patient.status]}`}>
                  {patient.status}
                </span>
              </div>
              <p className="mt-1 text-sm capitalize text-ink-500">
                {patient.age} years · {patient.gender}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} /> {patient.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} /> {patient.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {patient.address}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-ink-100 px-4 py-3 text-center">
            <p className="text-lg font-bold text-ink-900">{patient.visits}</p>
            <p className="text-xs text-ink-500">Total visits</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-ink-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Blood type" value={patient.bloodType} />
          <DetailItem label="Last visit" value={patient.lastVisit} />
          <DetailItem label="Assigned doctor" value={patient.doctor} />
          <DetailItem label="Status" value={patient.status} />
          <DetailItem
            label="Allergies"
            value={patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}
          />
          <DetailItem
            label="Conditions"
            value={patient.conditions?.length ? patient.conditions.join(', ') : 'None recorded'}
          />
          <DetailItem
            label="Emergency contact"
            value={
              patient.emergencyContact
                ? `${patient.emergencyContact.name} (${patient.emergencyContact.relationship})`
                : null
            }
          />
          <DetailItem label="Emergency phone" value={patient.emergencyContact?.phone} />
        </div>
      </div>
    </div>
  );
};

export default ClinicPatientDetail;
