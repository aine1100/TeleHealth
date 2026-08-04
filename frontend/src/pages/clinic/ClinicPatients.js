import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import StatusFilter from '../../components/clinic/StatusFilter';
import { patientStatusOptions } from '../../data/clinicDashboard';
import { clinicService } from '../../services/clinicService';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  new: 'bg-brand-50 text-brand-700',
  inactive: 'bg-ink-100 text-ink-500'
};

const ClinicPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await clinicService.getPatients();
        setPatients(response?.data || []);
      } catch (error) {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const counts = useMemo(
    () => ({
      all: patients.length,
      active: patients.filter((p) => p.status === 'active').length,
      new: patients.filter((p) => p.status === 'new').length,
      inactive: patients.filter((p) => p.status === 'inactive').length
    }),
    [patients]
  );

  const filtered = patients.filter((patient) => {
    const haystack = `${patient.firstName} ${patient.lastName} ${patient.email} ${patient.phone} ${patient.doctor}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Patients</h1>
        <p className="mt-1 text-sm text-ink-500">
          Patients who have visited or booked care at your facility.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'All patients', value: counts.all },
          { label: 'Active', value: counts.active },
          { label: 'New', value: counts.new },
          { label: 'Inactive', value: counts.inactive }
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
              placeholder="Search patients..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={patientStatusOptions}
              label="Status"
            />
            <p className="pb-3 text-sm text-ink-500 sm:whitespace-nowrap">
              Showing <span className="font-semibold text-ink-900">{filtered.length}</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-100/70 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Age / Gender</th>
                <th className="px-4 py-3 font-semibold">Last visit</th>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Visits</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-500">
                    Loading patients...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="cursor-pointer border-t border-ink-100 hover:bg-ink-100/40"
                    onClick={() => navigate(`/clinic/patients/${patient.id}`)}
                  >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-700">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
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
                    {patient.age} · {patient.gender}
                  </td>
                  <td className="px-4 py-3.5 text-ink-700">{patient.lastVisit}</td>
                  <td className="px-4 py-3.5 text-ink-700">{patient.doctor}</td>
                  <td className="px-4 py-3.5 font-medium text-ink-900">{patient.visits}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[patient.status]}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clinic/patients/${patient.id}`);
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
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-500">
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

export default ClinicPatients;
