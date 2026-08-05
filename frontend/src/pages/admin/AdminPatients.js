import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatusFilter from '../../components/clinic/StatusFilter';
import { adminPatientStatusOptions } from '../../data/adminDashboard';
import { adminService } from '../../services/adminService';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-ink-100 text-ink-500'
};

const AdminPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getPatients({ q: query || undefined });
      setPatients(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = patients.filter((patient) => {
    if (statusFilter === 'all') return true;
    return patient.status === statusFilter;
  });

  const counts = useMemo(
    () => ({
      all: total,
      active: patients.filter((p) => p.status === 'active').length,
      inactive: patients.filter((p) => p.status === 'inactive').length
    }),
    [patients, total]
  );

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Patients</h1>
        <p className="mt-1 text-sm text-ink-500">All patients registered on the Alive Health platform.</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total patients', value: counts.all },
          { label: 'Active (page)', value: counts.active },
          { label: 'Inactive (page)', value: counts.inactive }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-card">
            <p className="text-xs font-medium text-ink-500">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label className="auth-label">Search</label>
            <Search className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') load();
              }}
              placeholder="Search patients..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={adminPatientStatusOptions}
              label="Status"
            />
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-100/70 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Age / Gender</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Visits</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-500">
                    Loading patients…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="cursor-pointer border-t border-ink-100 hover:bg-ink-100/40"
                    onClick={() => navigate(`/admin/patients/${patient.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-700">
                          {patient.firstName?.[0]}
                          {patient.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-ink-500">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{patient.phone}</td>
                    <td className="px-4 py-3.5 capitalize text-ink-700">
                      {patient.age ?? '—'} · {patient.gender || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">
                      {[patient.city, patient.district].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink-900">{patient.visits}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          statusStyles[patient.status] || statusStyles.inactive
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/patients/${patient.id}`);
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-500">
                    No patients found.
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

export default AdminPatients;
