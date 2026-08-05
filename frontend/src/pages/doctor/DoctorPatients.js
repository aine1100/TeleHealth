import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doctorService } from '../../services/doctorService';
import { getAppointmentDate } from '../../utils/appointmentCalendar';

const DoctorPatients = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getMyAppointments();
        if (mounted) setAppointments(res?.data || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load patients');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach((appt) => {
      const patient = appt.patient;
      if (!patient || typeof patient === 'string') return;
      const id = patient._id || patient.id;
      const existing = map.get(String(id)) || {
        id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone || '—',
        visits: 0,
        lastVisit: null
      };
      existing.visits += 1;
      const d = getAppointmentDate(appt);
      if (d && (!existing.lastVisit || d > existing.lastVisit)) existing.lastVisit = d;
      map.set(String(id), existing);
    });
    return Array.from(map.values());
  }, [appointments]);

  const filtered = patients.filter((p) => {
    const hay = `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Patients</h1>
        <p className="mt-1 text-sm text-ink-500">People you have consulted with on Alive Health.</p>
      </div>

      <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white shadow-card">
        <div className="border-b border-ink-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-100/70 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Visits</th>
                <th className="px-4 py-3 font-semibold">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-500">
                    Loading patients…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((patient) => (
                  <tr key={patient.id} className="border-t border-ink-100">
                    <td className="px-4 py-3.5 font-semibold text-ink-900">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{patient.phone}</td>
                    <td className="px-4 py-3.5 text-ink-700">{patient.visits}</td>
                    <td className="px-4 py-3.5 text-ink-500">
                      {patient.lastVisit ? patient.lastVisit.toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-500">
                    No patients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
