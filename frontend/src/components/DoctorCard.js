import React from 'react';
import { Star, Phone, MapPin, Briefcase, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();
  const specialty = doctor.doctorProfile?.specialty || 'General Practice';
  const experience = doctor.doctorProfile?.experience || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center overflow-hidden">
          {doctor.avatar ? (
            <img src={doctor.avatar} alt={`${doctor.firstName} ${doctor.lastName}`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-500 text-xl font-semibold">{doctor.firstName?.[0]}{doctor.lastName?.[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</h3>
              <p className="text-sm text-slate-500">{specialty}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {doctor.doctorProfile?.isAvailable ? 'Available' : 'Offline'}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {doctor.doctorProfile?.rating?.toFixed(1) || '0.0'} ({doctor.doctorProfile?.reviewCount || 0})
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {experience}+ yrs
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {doctor.doctorProfile?.hospital || 'Remote'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>{doctor.phone || 'No phone'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          <span>{doctor.doctorProfile?.consultationFee ? `UGX ${doctor.doctorProfile.consultationFee.toLocaleString()}` : 'No fee'}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/patient/book')}
        className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
      >
        Book Appointment
      </button>
    </div>
  );
};

export default DoctorCard;
