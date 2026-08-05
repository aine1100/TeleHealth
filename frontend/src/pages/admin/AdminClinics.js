import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatusFilter from '../../components/clinic/StatusFilter';
import { verificationStatusOptions } from '../../data/adminDashboard';
import { adminService } from '../../services/adminService';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700'
};

const AdminClinics = () => {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getClinics({
        status: statusFilter,
        q: query || undefined
      });
      setClinics(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load clinics');
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: total,
      pending: clinics.filter((c) => c.verificationStatus === 'pending').length,
      approved: clinics.filter((c) => c.verificationStatus === 'approved').length,
      rejected: clinics.filter((c) => c.verificationStatus === 'rejected').length
    }),
    [clinics, total]
  );

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Clinics</h1>
        <p className="mt-1 text-sm text-ink-500">
          All clinic and hospital organizations registered on Alive Health.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Total clinics', value: counts.all },
          { label: 'Pending (page)', value: counts.pending },
          { label: 'Approved (page)', value: counts.approved },
          { label: 'Rejected (page)', value: counts.rejected }
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
              placeholder="Search clinics..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={verificationStatusOptions}
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
                <th className="px-4 py-3 font-semibold">Clinic</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-500">
                    Loading clinics…
                  </td>
                </tr>
              ) : clinics.length ? (
                clinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="cursor-pointer border-t border-ink-100 hover:bg-ink-100/40"
                    onClick={() => navigate(`/admin/organizations/${clinic.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink-900">{clinic.organizationName}</p>
                      <p className="text-xs text-ink-500">{clinic.email}</p>
                      <p
                        className={`mt-1 text-[11px] font-semibold ${
                          clinic.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {clinic.isEmailVerified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">
                      {clinic.firstName} {clinic.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">
                      {[clinic.city, clinic.district].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-ink-700">{clinic.plan || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          statusStyles[clinic.verificationStatus] || statusStyles.pending
                        }`}
                      >
                        {clinic.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/organizations/${clinic.id}`);
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
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-500">
                    No clinics found.
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

export default AdminClinics;
