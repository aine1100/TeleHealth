import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pill, Clock, RefreshCcw } from 'lucide-react';

const Medicines = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/medicines/my-reminders`);
        setReminders(res.data.data || []);
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
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Medicine reminders</p>
              <h1 className="mt-3 text-3xl font-semibold">Stay on schedule</h1>
            </div>
            <button className="rounded-3xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/20 transition inline-flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500">Loading reminders...</div>
          ) : reminders.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-blue-200 bg-white p-10 text-center text-slate-500">No active medicine reminders yet.</div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder._id} className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Medication</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{reminder.medicineName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{reminder.dosage} • {reminder.frequency.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="rounded-3xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 inline-flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    {reminder.times?.join(', ') || 'Scheduled'}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Instructions</p>
                    <p className="mt-2 text-sm text-slate-700">{reminder.instructions || 'Take as prescribed.'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
                    <p className="mt-2 text-sm text-slate-700">{reminder.duration || 'Ongoing'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Medicines;
