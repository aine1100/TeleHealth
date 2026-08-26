import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, FileCheck, ShieldCheck, Users, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import { insuranceService } from '../../services/insuranceService';

const money = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const InsuranceOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentClaims, setRecentClaims] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await insuranceService.getOverview();
        if (!mounted) return;
        setStats(res?.data?.stats || {});
        setRecentClaims(res?.data?.recentClaims || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load overview');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    {
      title: 'Pending members',
      value: stats.pendingPolicies || 0,
      detail: 'Awaiting policy verification',
      icon: Clock3,
      to: '/insurance/members?status=pending'
    },
    {
      title: 'Verified members',
      value: stats.verifiedPolicies || 0,
      detail: 'Active coverage',
      icon: Users,
      to: '/insurance/members?status=verified'
    },
    {
      title: 'Open claims',
      value: stats.pendingClaims || 0,
      detail: 'Submitted / under review',
      icon: FileCheck,
      to: '/insurance/claims?status=submitted'
    },
    {
      title: 'Approved amount',
      value: money(stats.totalApprovedAmount),
      detail: `${stats.approvedClaims || 0} approved claim(s)`,
      icon: Wallet,
      to: '/insurance/claims?status=approved'
    }
  ];

  const columns = [
    {
      key: 'claimNumber',
      label: 'Claim',
      render: (value) => <span className="font-semibold text-ink-900">{value}</span>
    },
    {
      key: 'patient',
      label: 'Member',
      render: (_v, row) =>
        [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || '—'
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => String(value || '').replace(/_/g, ' ')
    },
    {
      key: 'insurerShare',
      label: 'Insurer share',
      render: (value) => money(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-ink-700">
          {String(value || '').replace(/_/g, ' ')}
        </span>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Overview</h1>
        <p className="mt-1 text-sm text-ink-500">
          Verify members, review claims, and set how much patients pay vs what you cover.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.title}
            to={kpi.to}
            className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition hover:border-brand-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{kpi.title}</p>
                <p className="mt-1 text-xl font-bold text-ink-900">{loading ? '…' : kpi.value}</p>
                <p className="mt-1 text-xs text-ink-500">{kpi.detail}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <kpi.icon size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card lg:col-span-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-ink-900">How coverage works</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>Patient links your company and uploads a policy card.</li>
            <li>You verify the member on the Members page.</li>
            <li>At payment, the plan splits: patient co-pay + your claim share.</li>
            <li>Approve claims and set the exact amount you will pay.</li>
          </ul>
          <Link
            to="/insurance/plans"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Edit benefit plans →
          </Link>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Recent claims</h2>
            <Link to="/insurance/claims" className="text-xs font-semibold text-brand-600">
              View all
            </Link>
          </div>
          <DataTable
            columns={columns}
            rows={recentClaims}
            loading={loading}
            emptyText="No claims yet. Claims appear when patients pay with insurance."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-800">
        <span className="inline-flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} />
          Tip
        </span>
        {' — '}
        Keep a clear co-pay (e.g. UGX 5,000) plus coverage % so pharmacies and patients know what to
        collect at the counter.
      </div>
    </div>
  );
};

export default InsuranceOverview;
