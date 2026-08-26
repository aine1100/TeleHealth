import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import DataTable from '../../components/ui/DataTable';
import ListPagination from '../../components/ui/ListPagination';
import { policyStatusOptions } from '../../data/insuranceDashboard';
import { insuranceService } from '../../services/insuranceService';

const PAGE_SIZE = 10;

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  expired: 'bg-ink-100 text-ink-500',
  cancelled: 'bg-ink-100 text-ink-500'
};

const InsuranceMembers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await insuranceService.listPolicies({
        page,
        limit: PAGE_SIZE,
        status,
        q: q.trim() || undefined
      });
      setRows(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load members');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    const next = {};
    if (status && status !== 'all') next.status = status;
    if (q.trim()) next.q = q.trim();
    setSearchParams(next, { replace: true });
  }, [status, q, setSearchParams]);

  const updateStatus = async (row, nextStatus) => {
    setActingId(row._id);
    try {
      await insuranceService.updatePolicyStatus(row._id, {
        status: nextStatus,
        rejectionReason: nextStatus === 'rejected' ? 'Documents or policy number could not be verified' : ''
      });
      toast.success(nextStatus === 'verified' ? 'Member verified' : `Marked ${nextStatus}`);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update member');
    } finally {
      setActingId(null);
    }
  };

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) => (
        <div>
          <p className="font-semibold text-ink-900">
            {[row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || row.memberName}
          </p>
          <p className="text-xs text-ink-500">{row.patient?.phone || row.patient?.email || '—'}</p>
        </div>
      )
    },
    {
      key: 'policyNumber',
      label: 'Policy #',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'coverageType',
      label: 'Type',
      render: (value) => String(value || 'individual')
    },
    {
      key: 'documentUrl',
      label: 'Document',
      render: (value, row) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {row.documentName || 'View'}
          </a>
        ) : (
          <span className="text-xs text-ink-400">None</span>
        )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
            statusStyles[value] || statusStyles.pending
          }`}
        >
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.status === 'pending' || row.status === 'rejected' ? (
            <button
              type="button"
              disabled={actingId === row._id}
              onClick={() => updateStatus(row, 'verified')}
              className="rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Verify
            </button>
          ) : null}
          {row.status === 'pending' ? (
            <button
              type="button"
              disabled={actingId === row._id}
              onClick={() => updateStatus(row, 'rejected')}
              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              Reject
            </button>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Members</h1>
          <p className="mt-1 text-sm text-ink-500">
            Patients who linked your company. Verify policy numbers and uploaded cards.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-52">
            <label className="auth-label">Search</label>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  load();
                }
              }}
              placeholder="Policy number…"
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="w-48">
            <Dropdown label="Status" value={status} onChange={setStatus} options={policyStatusOptions} />
          </div>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              load();
            }}
            className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Search
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <DataTable columns={columns} rows={rows} loading={loading} emptyText="No member requests yet." />
        <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default InsuranceMembers;
