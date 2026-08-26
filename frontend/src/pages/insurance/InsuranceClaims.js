import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { TextInput } from '../../components/auth/FormFields';
import DataTable from '../../components/ui/DataTable';
import ListPagination from '../../components/ui/ListPagination';
import { claimStatusOptions, claimTypeOptions } from '../../data/insuranceDashboard';
import { insuranceService } from '../../services/insuranceService';

const PAGE_SIZE = 10;
const money = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const statusStyles = {
  submitted: 'bg-amber-50 text-amber-700',
  under_review: 'bg-sky-50 text-sky-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  paid: 'bg-ink-100 text-ink-600'
};

const InsuranceClaims = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await insuranceService.listClaims({
        page,
        limit: PAGE_SIZE,
        status,
        type
      });
      setRows(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load claims');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, type]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status, type]);

  const openClaim = (row) => {
    setSelected(row);
    setApprovedAmount(String(row.approvedAmount || row.insurerShare || 0));
  };

  const updateClaim = async (nextStatus) => {
    if (!selected) return;
    setActing(true);
    try {
      await insuranceService.updateClaim(selected._id, {
        status: nextStatus,
        approvedAmount: Number(approvedAmount) || 0,
        rejectionReason: nextStatus === 'rejected' ? 'Claim not covered under current plan benefits' : ''
      });
      toast.success(`Claim marked ${nextStatus.replace(/_/g, ' ')}`);
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update claim');
    } finally {
      setActing(false);
    }
  };

  const columns = [
    {
      key: 'claimNumber',
      label: 'Claim #',
      render: (value) => <span className="font-mono text-xs font-semibold">{value}</span>
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
      key: 'amountClaimed',
      label: 'Bill',
      render: (value) => money(value)
    },
    {
      key: 'patientShare',
      label: 'Patient',
      render: (value) => money(value)
    },
    {
      key: 'insurerShare',
      label: 'Your share',
      render: (value) => money(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
            statusStyles[value] || statusStyles.submitted
          }`}
        >
          {String(value || '').replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openClaim(row);
          }}
          className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
        >
          Review
        </button>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Claims</h1>
          <p className="mt-1 text-sm text-ink-500">
            Review submitted claims and set the amount your company will pay.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-44">
            <Dropdown value={status} onChange={setStatus} options={claimStatusOptions} />
          </div>
          <div className="w-44">
            <Dropdown value={type} onChange={setType} options={claimTypeOptions} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyText="No claims yet."
          onRowClick={openClaim}
        />
        <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {selected
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/55"
                aria-label="Close"
                onClick={() => setSelected(null)}
              />
              <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-xl">
                <h2 className="text-lg font-bold text-ink-900">Claim {selected.claimNumber}</h2>
                <p className="mt-1 text-sm text-ink-500">
                  {[selected.patient?.firstName, selected.patient?.lastName].filter(Boolean).join(' ')} ·{' '}
                  {String(selected.type || '').replace(/_/g, ' ')}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-ink-50 px-3 py-2">
                    <p className="text-[11px] text-ink-400">Total bill</p>
                    <p className="font-bold text-ink-900">{money(selected.amountClaimed)}</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-3 py-2">
                    <p className="text-[11px] text-ink-400">Patient paid</p>
                    <p className="font-bold text-ink-900">{money(selected.patientShare)}</p>
                  </div>
                  <div className="rounded-xl bg-brand-50 px-3 py-2 col-span-2">
                    <p className="text-[11px] text-brand-600">Suggested insurer share</p>
                    <p className="font-bold text-brand-700">{money(selected.insurerShare)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <TextInput
                    label="Approved amount (UGX)"
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => updateClaim('under_review')}
                    className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                  >
                    Under review
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => updateClaim('approved')}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => updateClaim('paid')}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Mark paid
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => updateClaim('rejected')}
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default InsuranceClaims;
