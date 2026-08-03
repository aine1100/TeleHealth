import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Star } from 'lucide-react';
import { clinicDoctors } from '../../data/clinicDashboard';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  inactive: 'bg-ink-100 text-ink-500'
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-ink-900">{value || '—'}</p>
  </div>
);

const ClinicDoctorDetail = () => {
  const { doctorId } = useParams();
  const doctor = clinicDoctors.find((item) => item.id === doctorId);

  if (!doctor) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-card">
        <p className="text-lg font-semibold text-ink-900">Doctor not found</p>
        <Link to="/clinic/doctors" className="mt-4 inline-block text-sm font-semibold text-brand-600">
          Back to doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <Link
        to="/clinic/doctors"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to doctors
      </Link>

      <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">
              {doctor.firstName[0]}
              {doctor.lastName[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-ink-900">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h1>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[doctor.status]}`}>
                  {doctor.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-500">{doctor.specialty}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} /> {doctor.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} /> {doctor.phone}
                </span>
              </div>
            </div>
          </div>

          {doctor.rating ? (
            <div className="rounded-2xl bg-ink-100 px-4 py-3 text-center">
              <p className="inline-flex items-center gap-1 text-lg font-bold text-ink-900">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                {doctor.rating}
              </p>
              <p className="text-xs text-ink-500">{doctor.reviewCount} reviews</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 border-t border-ink-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="License" value={doctor.licenseNumber} />
          <DetailItem label="Experience" value={doctor.experience ? `${doctor.experience} years` : null} />
          <DetailItem label="Consultations" value={doctor.consultations} />
          <DetailItem label="Joined" value={doctor.joined} />
          <DetailItem
            label="Consultation fee"
            value={doctor.consultationFee ? `UGX ${doctor.consultationFee.toLocaleString()}` : null}
          />
          <DetailItem label="Hours" value={`${doctor.availableHours?.start || '—'} – ${doctor.availableHours?.end || '—'}`} />
          <DetailItem
            label="Available days"
            value={doctor.availableDays?.length ? doctor.availableDays.join(', ').toUpperCase() : null}
          />
          <DetailItem
            label="Consult types"
            value={doctor.consultationTypes?.length ? doctor.consultationTypes.join(', ') : null}
          />
        </div>

        <div className="mt-6 border-t border-ink-100 pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Bio</p>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            {doctor.bio || 'No bio provided yet.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClinicDoctorDetail;
