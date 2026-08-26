import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import DataTable from '../../components/ui/DataTable';
import ListPagination from '../../components/ui/ListPagination';
import { labOrderStatusOptions } from '../../data/labDashboard';
import { labService } from '../../services/labService';

const PAGE_SIZE = 10;

const statusStyles = {
  ordered: 'bg-amber-50 text-amber-700',
  accepted: 'bg-sky-50 text-sky-700',
  sample_collected: 'bg-violet-50 text-violet-700',
  processing: 'bg-brand-50 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-ink-100 text-ink-500'
};

const LabOrders = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);
  const [results, setResults] = useState({ value: '', unit: '', referenceRange: '', interpretation: 'normal', notes: '' });
  const [reportFile, setReportFile] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await labService.listOrders({ page, limit: PAGE_SIZE, status });
      setRows(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load orders');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const openOrder = (row) => {
    setSelected(row);
    setResults({
      value: row.results?.value || '',
      unit: row.results?.unit || '',
      referenceRange: row.results?.referenceRange || '',
      interpretation: row.results?.interpretation || 'normal',
      notes: row.results?.notes || ''
    });
    setReportFile(null);
  };

  const accept = async (row) => {
    setActing(true);
    try {
      await labService.acceptOrder(row._id);
      toast.success('Order accepted');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to accept');
    } finally {
      setActing(false);
    }
  };

  const update = async (nextStatus) => {
    if (!selected) return;
    setActing(true);
    try {
      await labService.updateOrder(
        selected._id,
        { status: nextStatus, results },
        reportFile
      );
      toast.success(`Marked ${nextStatus.replace(/_/g, ' ')}`);
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update order');
    } finally {
      setActing(false);
    }
  };

  const columns = [
    {
      key: 'testName',
      label: 'Test',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-ink-900">{value}</p>
          <p className="text-xs text-ink-500">{row.priority === 'urgent' ? 'Urgent' : 'Routine'}</p>
        </div>
      )
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) => [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || '—'
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (_v, row) =>
        row.doctor ? `Dr. ${[row.doctor.firstName, row.doctor.lastName].filter(Boolean).join(' ')}` : '—'
    },
    {
      key: 'lab',
      label: 'Assignment',
      render: (_v, row) => (row.lab ? 'Assigned' : 'Open pool')
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyles[value] || statusStyles.ordered}`}>
          {String(value || '').replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <div className="flex gap-1.5">
          {!row.lab ? (
            <button
              type="button"
              disabled={acting}
              onClick={(e) => {
                e.stopPropagation();
                accept(row);
              }}
              className="rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Accept
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openOrder(row);
              }}
              className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              Update
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Lab orders</h1>
          <p className="mt-1 text-sm text-ink-500">
            Accept unassigned tests, move them through processing, and upload results.
          </p>
        </div>
        <div className="w-52">
          <Dropdown value={status} onChange={setStatus} options={labOrderStatusOptions} />
        </div>
      </div>

      <div className="space-y-3">
        <DataTable columns={columns} rows={rows} loading={loading} emptyText="No orders." onRowClick={openOrder} />
        <ListPagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {selected
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center">
              <button type="button" className="absolute inset-0 bg-slate-950/55" aria-label="Close" onClick={() => setSelected(null)} />
              <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-xl">
                <h2 className="text-lg font-bold text-ink-900">{selected.testName}</h2>
                <p className="mt-1 text-sm text-ink-500">
                  {[selected.patient?.firstName, selected.patient?.lastName].filter(Boolean).join(' ')} ·{' '}
                  {String(selected.status || '').replace(/_/g, ' ')}
                </p>
                {selected.instructions ? (
                  <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600">{selected.instructions}</p>
                ) : null}

                {!selected.lab ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => accept(selected).then(() => setSelected(null))}
                    className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Accept order
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <TextInput label="Result value" value={results.value} onChange={(e) => setResults((p) => ({ ...p, value: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput label="Unit" value={results.unit} onChange={(e) => setResults((p) => ({ ...p, unit: e.target.value }))} />
                      <TextInput
                        label="Reference range"
                        value={results.referenceRange}
                        onChange={(e) => setResults((p) => ({ ...p, referenceRange: e.target.value }))}
                      />
                    </div>
                    <Dropdown
                      label="Interpretation"
                      value={results.interpretation}
                      onChange={(value) => setResults((p) => ({ ...p, interpretation: value }))}
                      options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'abnormal', label: 'Abnormal' },
                        { value: 'critical', label: 'Critical' }
                      ]}
                    />
                    <TextTextarea
                      label="Notes"
                      value={results.notes}
                      onChange={(e) => setResults((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                    />
                    <div>
                      <label className="auth-label">Report PDF / image</label>
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png"
                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={acting} onClick={() => update('sample_collected')} className="rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold">
                        Sample collected
                      </button>
                      <button type="button" disabled={acting} onClick={() => update('processing')} className="rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold">
                        Processing
                      </button>
                      <button type="button" disabled={acting} onClick={() => update('completed')} className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
                        Complete & notify
                      </button>
                      <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold">
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default LabOrders;
