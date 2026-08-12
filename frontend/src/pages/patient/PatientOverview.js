import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Pill, Sparkles, Stethoscope, Store } from 'lucide-react';
import StatCard from '../../components/clinic/StatCard';
import DoctorCard from '../../components/DoctorCard';
import PharmacyCard from '../../components/PharmacyCard';
import { patientService } from '../../services/patientService';
import { pharmacyService } from '../../services/pharmacyService';
import { useAuth } from '../../context/AuthContext';
import {
  formatTimeLabel,
  getAppointmentDate,
  getDoctorName,
  getTypeStyle,
  isSameDay,
  startOfDay,
  statusStyles
} from '../../utils/appointmentCalendar';

const PatientOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [apptRes, medRes, doctorRes, pharmacyRes] = await Promise.all([
          patientService.getAppointments(),
          patientService.getReminders(),
          patientService.searchDoctors({}).catch(() => ({ data: [] })),
          pharmacyService.listPharmacies({}).catch(() => ({ data: [] }))
        ]);
        if (!mounted) return;
        setAppointments(apptRes?.data || []);
        setReminders(medRes?.data || []);
        setDoctors(doctorRes?.data || []);
        setPharmacies(pharmacyRes?.data || []);
      } catch {
        if (mounted) {
          setAppointments([]);
          setReminders([]);
          setDoctors([]);
          setPharmacies([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const today = startOfDay(new Date());

  const stats = useMemo(() => {
    const upcoming = appointments.filter((a) => {
      const d = getAppointmentDate(a);
      return d && d >= today && !['cancelled', 'completed', 'no_show'].includes(a.status);
    });
    const todayItems = appointments.filter((a) => {
      const d = getAppointmentDate(a);
      return d && isSameDay(d, today);
    });

    return [
      {
        id: 'upcoming',
        title: 'Upcoming visits',
        value: String(upcoming.length),
        change: 'Live',
        positive: true,
        detail: 'Open bookings',
        detailSecondary: `${todayItems.length} today`,
        icon: 'CalendarCheck',
        tone: 'blue'
      },
      {
        id: 'meds',
        title: 'Active medicines',
        value: String(reminders.length),
        change: 'Reminders',
        positive: true,
        detail: 'On schedule',
        detailSecondary: 'Active',
        icon: 'Stethoscope',
        tone: 'orange'
      },
      {
        id: 'history',
        title: 'Total visits',
        value: String(appointments.length),
        change: 'Record',
        positive: true,
        detail: 'All time',
        detailSecondary: 'Consults',
        icon: 'Video',
        tone: 'rose'
      }
    ];
  }, [appointments, reminders, today]);

  const upcomingList = useMemo(() => {
    return appointments
      .filter((a) => {
        const d = getAppointmentDate(a);
        return d && d >= today && !['cancelled', 'no_show'].includes(a.status);
      })
      .sort((a, b) => {
        const da = getAppointmentDate(a)?.getTime() || 0;
        const db = getAppointmentDate(b)?.getTime() || 0;
        if (da !== db) return da - db;
        return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
      })
      .slice(0, 6);
  }, [appointments, today]);

  const featuredDoctors = doctors.slice(0, 3);
  const featuredPharmacies = pharmacies.slice(0, 3);

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome, {user?.firstName || 'there'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Book visits, find pharmacies, and keep your health record in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/patient/doctors"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
          >
            <Stethoscope size={16} />
            Book a visit
          </Link>
          <Link
            to="/patient/pharmacies"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <Store size={16} />
            Find a pharmacy
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-bold text-ink-900">Upcoming appointments</h2>
            <Link to="/patient/appointments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {loading ? (
              <p className="px-5 py-10 text-center text-sm text-ink-500">Loading schedule…</p>
            ) : upcomingList.length ? (
              upcomingList.map((appt) => {
                const style = getTypeStyle(appt.type);
                const date = getAppointmentDate(appt);
                return (
                  <div key={appt._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{getDoctorName(appt)}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {date ? date.toLocaleDateString() : '—'} · {formatTimeLabel(appt.scheduledTime)} ·{' '}
                        {style.label}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        statusStyles[appt.status] || statusStyles.pending
                      }`}
                    >
                      {(appt.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="px-5 py-10 text-center text-sm text-ink-500">No upcoming appointments yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Quick links</p>
            <div className="mt-3 space-y-2">
              {[
                { to: '/patient/doctors', label: 'Find a doctor', icon: Stethoscope },
                { to: '/patient/pharmacies', label: 'Find a pharmacy', icon: Store },
                { to: '/patient/appointments', label: 'My appointments', icon: CalendarDays },
                { to: '/patient/medicines', label: 'Medicine reminders', icon: Pill },
                { to: '/patient/ai-screening', label: 'AI screening', icon: Sparkles }
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700"
                >
                  <item.icon size={16} className="text-brand-500" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-600">Doctors available</h2>
            <p className="mt-0.5 text-sm text-ink-500">Book a consult with a verified clinician.</p>
          </div>
          <Link to="/patient/doctors" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
              Loading doctors…
            </div>
          ) : featuredDoctors.length ? (
            featuredDoctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)
          ) : (
            <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
              No doctors available right now.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-600">Pharmacies near you</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Send a prescription for pickup or delivery.
            </p>
          </div>
          <Link to="/patient/pharmacies" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
              Loading pharmacies…
            </div>
          ) : featuredPharmacies.length ? (
            featuredPharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy._id}
                pharmacy={pharmacy}
                actionLabel="View details"
                onAction={() => navigate(`/patient/pharmacies/${pharmacy._id}`)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
              No pharmacies available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientOverview;
