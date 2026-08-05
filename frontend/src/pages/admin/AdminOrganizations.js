import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatusFilter from '../../components/clinic/StatusFilter';
import { organizationTypeOptions, verificationStatusOptions } from '../../data/adminDashboard';
import { adminService } from '../../services/adminService';
import { orgTypeLabel } from '../../utils/orgAccess';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700'
};

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getOrganizations({
        status: statusFilter,
        type: typeFilter,
        q: query || undefined
      });
      setItems(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load organizations');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const next = searchParams.get('status') || 'all';
    setStatusFilter((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const counts = useMemo(
    () => ({
      all: total,
      pending: items.filter((o) => o.verificationStatus === 'pending').length,
      approved: items.filter((o) => o.verificationStatus === 'approved').length,
      rejected: items.filter((o) => o.verificationStatus === 'rejected').length
    }),
    [items, total]
  );

  const onStatusChange = (value) => {
    setStatusFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('status');
    } else {
      next.set('status', value);
    }
    setSearchParams(next);
  };

  const review = async (id, status) => {
    setActingId(id);
    try {
      await adminService.reviewOrganization(id, { status });
      toast.success(status === 'approved' ? 'Organization approved' : 'Organization rejected');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update organization');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Organization approvals</h1>
        <p className="mt-1 text-sm text-ink-500">
          Review every clinic, lab, and insurance registration — including accounts that have not
          verified email yet. Approve before they can invite doctors or run operations.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'In view', value: counts.all },
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
              placeholder="Search organization, email, reg. no..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <StatusFilter
              value={typeFilter}
              onChange={setTypeFilter}
              options={organizationTypeOptions}
              label="Type"
            />
            <StatusFilter
              value={statusFilter}
              onChange={onStatusChange}
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
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Registered</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-500">
                    Loading organizations…
                  </td>
                </tr>
              ) : items.length ? (
                items.map((org) => (
                  <tr key={org.id} className="border-t border-ink-100 hover:bg-ink-100/40">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink-900">{org.organizationName}</p>
                      <p className="text-xs text-ink-500">{org.registrationNumber || 'No reg. number'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{orgTypeLabel(org.type)}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-ink-700">{org.email}</p>
                      <p className="text-xs text-ink-500">{org.phone}</p>
                      <p
                        className={`mt-1 text-[11px] font-semibold ${
                          org.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {org.isEmailVerified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            statusStyles[org.verificationStatus] || statusStyles.pending
                          }`}
                        >
                          {org.verificationStatus}
                        </span>
                        {!org.isEmailVerified ? (
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                            OTP pending
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                          onClick={() => navigate(`/admin/organizations/${org.id}`)}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {org.verificationStatus !== 'approved' ? (
                          <button
                            type="button"
                            disabled={actingId === org.id}
                            onClick={() => review(org.id, 'approved')}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                            {!org.isEmailVerified ? ' & activate' : ''}
                          </button>
                        ) : null}
                        {org.verificationStatus !== 'rejected' ? (
                          <button
                            type="button"
                            disabled={actingId === org.id}
                            onClick={() => review(org.id, 'rejected')}
                            className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-500">
                    No organizations found.{' '}
                    <Link to="/admin/home" className="font-semibold text-brand-600">
                      Back to overview
                    </Link>
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

export default AdminOrganizations;
