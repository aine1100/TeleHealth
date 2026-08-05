import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Stethoscope,
  Video
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clinicService } from '../../services/clinicService';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-ink-100 text-ink-500',
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
  in_waiting_room: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-brand-50 text-brand-700'
};

const DetailCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-ink-100 bg-ink-100/40 px-4 py-3.5">
    <div className="flex items-center gap-2 text-ink-400">
      {Icon ? <Icon size={14} /> : null}
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
    </div>
    <p className="mt-2 text-sm font-semibold text-ink-900">{value || '—'}</p>
  </div>
);

const ClinicDoctorDetail = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await clinicService.getDoctorDetail(doctorId);
        if (!mounted) return;
        setDoctor(res.data?.doctor || null);
        setStats(res.data?.stats || null);
        setAppointments(res.data?.recentAppointments || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Doctor not found');
        navigate('/clinic/doctors');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [doctorId, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
        Loading doctor profile…
      </div>
    );
  }

  if (!doctor) return null;

  const profile = doctor.doctorProfile || {};
  const status = doctor.isActive === false ? 'inactive' : 'active';
  const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <Link
        to="/clinic/doctors"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to doctors
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-brand-600 px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur">
                {(doctor.firstName?.[0] || 'D').toUpperCase()}
                {(doctor.lastName?.[0] || '').toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      status === 'active' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/15 text-white/80'
                    }`}
                  >
                    {status}
                  </span>
                  {profile.isAvailable !== false ? (
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/90">
                      Available
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-blue-100">
                  {profile.specialty || 'General Practice'}
                  {profile.subSpecialty ? ` · ${profile.subSpecialty}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-blue-50/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={14} /> {doctor.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} /> {doctor.phone || '—'}
                  </span>
                </div>
              </div>
            </div>

            {profile.rating ? (
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur">
                <p className="inline-flex items-center gap-1 text-lg font-bold">
                  <Star size={16} className="fill-amber-300 text-amber-300" />
                  {profile.rating}
                </p>
                <p className="text-xs text-blue-100">{profile.reviewCount || 0} reviews</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur">
                <p className="text-lg font-bold">{stats?.consultations ?? 0}</p>
                <p className="text-xs text-blue-100">Consultations</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-b border-ink-100 p-5 sm:grid-cols-3 sm:px-8">
          <div className="rounded-2xl bg-brand-50/70 px-4 py-3">
            <p className="text-xs font-medium text-ink-500">Total consults</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{stats?.consultations ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50/80 px-4 py-3">
            <p className="text-xs font-medium text-ink-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{stats?.completed ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-amber-50/80 px-4 py-3">
            <p className="text-xs font-medium text-ink-500">In progress / upcoming</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{stats?.upcoming ?? 0}</p>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-8 sm:pb-6">
          <DetailCard label="License" value={profile.licenseNumber} icon={ShieldCheck} />
          <DetailCard
            label="Experience"
            value={profile.experience ? `${profile.experience} years` : null}
            icon={Stethoscope}
          />
          <DetailCard
            label="Consultation fee"
            value={
              profile.consultationFee != null
                ? `UGX ${Number(profile.consultationFee).toLocaleString()}`
                : null
            }
            icon={Video}
          />
          <DetailCard
            label="Hours"
            value={
              profile.availableHours
                ? `${profile.availableHours.start || '09:00'} – ${profile.availableHours.end || '17:00'}`
                : null
            }
            icon={Clock3}
          />
          <DetailCard
            label="Available days"
            value={
              profile.availableDays?.length
                ? profile.availableDays.map((d) => d.toUpperCase()).join(', ')
                : null
            }
            icon={CalendarDays}
          />
          <DetailCard
            label="Consult types"
            value={
              profile.consultationTypes?.length
                ? profile.consultationTypes.join(', ')
                : null
            }
          />
          <DetailCard
            label="Joined"
            value={doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : null}
          />
          <DetailCard
            label="Last login"
            value={doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleString() : '—'}
          />
        </div>

        <div className="border-t border-ink-100 px-5 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Bio</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-700">
            {profile.bio || 'No bio provided yet. The doctor can complete this after setup.'}
          </p>
          {profile.qualifications?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.qualifications.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-ink-200/70 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 sm:px-8">
          <div>
            <h2 className="text-base font-bold text-ink-900">Recent appointments</h2>
            <p className="text-xs text-ink-500">Last 10 visits linked to this doctor</p>
          </div>
        </div>
        <div className="divide-y divide-ink-100">
          {appointments.length ? (
            appointments.map((appt) => {
              const patient = appt.patient;
              const patientName = patient
                ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                : 'Patient';
              return (
                <div key={appt._id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{patientName}</p>
                    <p className="text-xs text-ink-500">
                      {appt.scheduledDate
                        ? new Date(appt.scheduledDate).toLocaleDateString()
                        : '—'}
                      {appt.scheduledTime ? ` · ${appt.scheduledTime}` : ''}
                      {appt.type ? ` · ${appt.type}` : ''}
                    </p>
                  </div>
                  <span
                    className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      statusStyles[appt.status] || statusStyles.pending
                    }`}
                  >
                    {(appt.status || 'pending').replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink-500 sm:px-8">
              No appointments recorded for this doctor yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClinicDoctorDetail;
