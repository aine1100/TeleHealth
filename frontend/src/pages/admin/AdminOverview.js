import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FlaskConical, ShieldAlert, Users } from 'lucide-react';
import StatCard from '../../components/clinic/StatCard';
import { adminService } from '../../services/adminService';
import { orgTypeLabel } from '../../utils/orgAccess';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700'
};

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getOverview();
        if (mounted) setData(res.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Unable to load admin overview');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      id: 'clinics',
      title: 'Clinics',
      value: String(data?.stats?.clinics || 0),
      change: `${data?.stats?.approvedOrganizations || 0} ok`,
      positive: true,
      detail: 'Registered',
      detailSecondary: 'On platform',
      icon: 'Stethoscope',
      tone: 'blue'
    },
    {
      id: 'patients',
      title: 'Patients',
      value: String(data?.stats?.patients || 0),
      change: 'Live',
      positive: true,
      detail: 'Accounts',
      detailSecondary: 'Platform-wide',
      icon: 'CalendarCheck',
      tone: 'orange'
    },
    {
      id: 'pending',
      title: 'Pending approvals',
      value: String(data?.stats?.pendingApprovals || 0),
      change: data?.stats?.pendingApprovals ? 'Review' : 'Clear',
      positive: !data?.stats?.pendingApprovals,
      detail: 'Orgs waiting',
      detailSecondary: `${data?.stats?.unverifiedEmails || 0} email pending`,
      icon: 'Video',
      tone: 'rose'
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Platform overview</h1>
          <p className="mt-1 text-sm text-ink-500">
            Monitor registrations, approve organizations, and oversee care partners on Alive Health.
          </p>
        </div>
        <Link
          to="/admin/organizations?status=pending"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600"
        >
          <ShieldAlert size={16} />
          Review pending
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-brand-500" />
              <h2 className="text-sm font-bold text-ink-900">Recent organizations</h2>
            </div>
            <Link to="/admin/organizations" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {loading ? (
              <p className="px-5 py-8 text-sm text-ink-500">Loading organizations…</p>
            ) : data?.recentOrganizations?.length ? (
              data.recentOrganizations.map((org) => (
                <Link
                  key={org.id}
                  to={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-ink-100/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{org.organizationName}</p>
                    <p className="truncate text-xs text-ink-500">
                      {orgTypeLabel(org.type)} · {org.email}
                      {!org.isEmailVerified ? ' · email not verified' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        statusStyles[org.verificationStatus] || statusStyles.pending
                      }`}
                    >
                      {org.verificationStatus}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-ink-500">No organizations registered yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-brand-500" />
              <h2 className="text-sm font-bold text-ink-900">Recent patients</h2>
            </div>
            <Link to="/admin/patients" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {loading ? (
              <p className="px-5 py-8 text-sm text-ink-500">Loading patients…</p>
            ) : data?.recentPatients?.length ? (
              data.recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/admin/patients/${patient.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-ink-100/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-500">{patient.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-500">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—'}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-ink-500">No patients registered yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Laboratories', value: data?.stats?.labs || 0, icon: FlaskConical },
          { label: 'Insurance partners', value: data?.stats?.insurance || 0, icon: Building2 },
          { label: 'Rejected orgs', value: data?.stats?.rejectedOrganizations || 0, icon: ShieldAlert }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-ink-200/70 bg-white px-4 py-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                <item.icon size={18} />
              </span>
              <div>
                <p className="text-xs font-medium text-ink-500">{item.label}</p>
                <p className="text-xl font-bold text-ink-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
