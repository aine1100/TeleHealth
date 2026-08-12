import React from 'react';
import { Clock, MapPin, Phone, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();
  const profile = doctor.doctorProfile || {};
  const specialty = profile.specialty || 'General Practice';
  const qualifications = (profile.qualifications || []).join(', ') || specialty;
  const experience = profile.experience || 0;
  const fee = profile.consultationFee;
  const rating = Number(profile.rating || 0).toFixed(1);
  const location = profile.hospital || doctor.city || 'Uganda';
  const initials = `${doctor.firstName?.[0] || 'D'}${doctor.lastName?.[0] || 'R'}`;

  return (
    <article className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex shrink-0 justify-center lg:justify-start">
          {doctor.avatar ? (
            <img
              src={doctor.avatar}
              alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
              className="h-28 w-28 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-600">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-brand-600">
                Dr. {doctor.firstName} {doctor.lastName}
              </h3>
              <p className="mt-1 text-sm text-ink-500">{qualifications}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-ink-800">{rating}/5</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-brand-500" />
                  {experience}+ Years
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-brand-500" />
                  {location}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-ink-700">
                {fee != null ? (
                  <>
                    <span className="font-bold text-ink-900">UGX {Number(fee).toLocaleString()}</span>
                    <span className="text-ink-500"> Consultation fee at clinic</span>
                  </>
                ) : (
                  'Consultation fee on request'
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                {specialty}
              </span>

              {doctor.phone ? (
                <a
                  href={`tel:${doctor.phone}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-brand-600"
                >
                  <Phone size={15} className="text-brand-500" />
                  {doctor.phone}
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => navigate(`/patient/doctors/${doctor._id}`)}
                className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600"
              >
                Book appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default DoctorCard;
