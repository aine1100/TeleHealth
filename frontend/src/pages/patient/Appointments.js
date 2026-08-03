import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Clock, CheckCircle2, XCircle } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/appointments/my-appointments`);
        setAppointments(res.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Appointments</p>
              <h1 className="mt-3 text-3xl font-semibold">Your consultation timeline</h1>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm text-white">Review upcoming visits and status updates.</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            {loading ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-blue-200 bg-white p-10 text-center text-slate-500">No appointments found yet.</div>
            ) : (
              appointments.map((appt) => (
                <div key={appt._id} className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}</p>
                      <p className="mt-1 text-sm text-slate-500">{appt.type === 'video' ? 'Video consultation' : appt.type === 'chat' ? 'Chat consultation' : 'In-person visit'}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(appt.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Time</p>
                      <p className="mt-2 font-semibold text-slate-900">{appt.scheduledTime}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {appt.status === 'confirmed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-orange-500" />}
                        {appt.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
          <aside className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
            <button className="w-full rounded-3xl bg-blue-950 px-5 py-4 text-sm font-semibold text-white hover:bg-blue-800 transition">Book a new consultation</button>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Headlines</p>
              <p className="mt-3 text-sm text-slate-600">Confirmed appointments are updated in real time. Join the waiting room before your scheduled time.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
