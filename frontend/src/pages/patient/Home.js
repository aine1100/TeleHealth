import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

const Home = () => {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState(null);
  const [medicineReminder, setMedicineReminder] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [apptRes, medRes, notifRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/appointments/my-appointments?status=confirmed&limit=1`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/medicines/my-reminders`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/my-notifications?unread=true&limit=5`)
      ]);

      if (apptRes.data.data.length > 0) setUpcoming(apptRes.data.data[0]);
      if (medRes.data.data.length > 0) setMedicineReminder(medRes.data.data[0]);
      setNotifications(notifRes.data.data || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-[2rem] bg-gradient-to-r from-blue-950 via-slate-900 to-blue-800 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.28em] text-blue-200">Patient dashboard</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight">Modern care, simplified.</h1>
                <p className="mt-4 text-sm leading-7 text-blue-100/90">Manage appointments, medication reminders, and health notifications in one clean place.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Upcoming</p>
                  <p className="mt-3 text-2xl font-semibold">{upcoming ? '1 confirmed' : 'No appointments'}</p>
                </div>
                <div className="rounded-[1.75rem] bg-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Notifications</p>
                  <p className="mt-3 text-2xl font-semibold">{notifications.filter((n) => !n.isRead).length} unread</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('/patient/doctors')}
                className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-6 text-left text-white transition hover:bg-white/15"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-blue-200">Book</p>
                <h2 className="mt-3 text-xl font-semibold">Doctor appointment</h2>
              </button>
              <button
                type="button"
                onClick={() => navigate('/patient/ai-screening')}
                className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-6 text-left text-white transition hover:bg-white/15"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-blue-200">Assess</p>
                <h2 className="mt-3 text-xl font-semibold">AI health screening</h2>
              </button>
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Next appointment</p>
                  <p className="mt-1 text-sm text-slate-500">Keep your schedule on track.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{upcoming ? 'Confirmed' : 'Open'}</span>
              </div>

              {upcoming ? (
                <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-base font-semibold text-slate-900">Dr. {upcoming.doctor?.firstName} {upcoming.doctor?.lastName}</p>
                  <p className="mt-2 text-sm text-slate-600">{new Date(upcoming.scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} • {upcoming.scheduledTime}</p>
                  <button
                    onClick={() => navigate(`/patient/waiting/${upcoming._id}`)}
                    className="mt-5 inline-flex items-center justify-center rounded-2xl bg-blue-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition"
                  >
                    Join waiting room
                  </button>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No confirmed appointments yet. Book one to start your care journey.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Medicine reminder</p>
                  <p className="mt-1 text-sm text-slate-500">Manage your prescriptions.</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-blue-700" />
              </div>

              {medicineReminder ? (
                <div className="mt-6 space-y-3">
                  <p className="text-lg font-semibold text-slate-900">{medicineReminder.medicineName}</p>
                  <p className="text-sm text-slate-600">{medicineReminder.dosage} • {medicineReminder.frequency.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-slate-600">{medicineReminder.times?.join(', ') || 'No schedule'}</p>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-500">No active reminders. Add your medicine schedule in the medicines section.</p>
              )}
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Insights</p>
                  <p className="mt-1 text-sm text-slate-500">Helpful care highlights.</p>
                </div>
                <Sparkles className="h-5 w-5 text-blue-700" />
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Track progress</p>
                  <p className="mt-2">Stay updated with appointment status and reminders.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Simple access</p>
                  <p className="mt-2">Your care actions are organized for easy use on desktop and mobile.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Home;
