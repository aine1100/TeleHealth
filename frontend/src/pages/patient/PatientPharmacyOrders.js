import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, RefreshCw, Smartphone, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import Dropdown from '../../components/auth/Dropdown';
import { TextInput } from '../../components/auth/FormFields';
import DataTable from '../../components/ui/DataTable';
import { pharmacyService } from '../../services/pharmacyService';

const PAYMENT_METHODS = [
  { value: 'mtn_momo', label: 'MTN MoMo' },
  { value: 'airtel_money', label: 'Airtel Money' }
];

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-sky-50 text-sky-700',
  preparing: 'bg-violet-50 text-violet-700',
  ready: 'bg-emerald-50 text-emerald-700',
  out_for_delivery: 'bg-brand-50 text-brand-700',
  completed: 'bg-ink-100 text-ink-600',
  rejected: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-ink-100 text-ink-500'
};

const pharmacyName = (row) =>
  row?.displayName ||
  row?.pharmacyProfile?.pharmacyName ||
  [row?.firstName, row?.lastName].filter(Boolean).join(' ') ||
  'Pharmacy';

const PayOrderModal = ({ open, order, onClose, onPaid }) => {
  const [method, setMethod] = useState('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod('mtn_momo');
    setPhoneNumber('');
  }, [open, order?._id]);

  if (!open || !order) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Enter a mobile money number');
      return;
    }
    setSaving(true);
    try {
      await pharmacyService.payOrder(order._id, {
        method,
        phoneNumber: phoneNumber.trim()
      });
      toast.success('Payment successful — order sent to pharmacy');
      onPaid?.();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to complete payment');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-950/55" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl"
      >
        <div className="border-b border-ink-100 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Pay order</p>
          <h2 className="text-base font-bold text-ink-900">{pharmacyName(order.pharmacy)}</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            UGX {Number(order.totalAmount || 0).toLocaleString()} · demo mobile money
          </p>
        </div>
        <div className="space-y-4 px-4 py-4">
          <fieldset>
            <legend className="text-sm font-bold text-ink-900">Pay with</legend>
            <div className="mt-2 space-y-2">
              {PAYMENT_METHODS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-700"
                >
                  <input
                    type="radio"
                    name="payMethod"
                    checked={method === option.value}
                    onChange={() => setMethod(option.value)}
                    className="h-4 w-4 border-ink-300 text-brand-500 focus:ring-brand-500"
                  />
                  <Smartphone size={15} className="text-brand-500" />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          <TextInput
            label="Mobile money number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+256700000000"
            required
          />
        </div>
        <div className="flex gap-2 border-t border-ink-100 px-4 py-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <CreditCard size={15} />
            {saving ? 'Paying…' : `Pay UGX ${Number(order.totalAmount || 0).toLocaleString()}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

const PatientPharmacyOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [payOrder, setPayOrder] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pharmacyService.getMyOrders();
      setOrders(res?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (filter === 'unpaid') return orders.filter((o) => o.payment?.status !== 'paid');
    if (filter === 'paid') return orders.filter((o) => o.payment?.status === 'paid');
    return orders;
  }, [orders, filter]);

  const unpaidCount = orders.filter((o) => o.payment?.status !== 'paid').length;

  const columns = [
    {
      key: 'pharmacy',
      label: 'Pharmacy',
      render: (_v, row) => pharmacyName(row.pharmacy)
    },
    {
      key: 'orderType',
      label: 'Type',
      render: (value) => (value === 'catalog' ? 'Catalog' : 'Prescription')
    },
    {
      key: 'items',
      label: 'Medicines',
      render: (value) =>
        value?.map((item) => `${item.medicineName}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`).join(', ') ||
        '—'
    },
    {
      key: 'fulfillmentMethod',
      label: 'Method',
      render: (value) => (value === 'delivery' ? 'Delivery' : 'Pickup')
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (value) => (value != null ? `UGX ${Number(value).toLocaleString()}` : '—')
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (value) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            value?.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {value?.status === 'paid' ? 'Paid' : 'Awaiting payment'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) =>
        row.payment?.status !== 'paid' ? (
          <span className="text-xs text-ink-400">Not sent yet</span>
        ) : (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
              statusStyles[value] || statusStyles.pending
            }`}
          >
            {String(value || '').replace(/_/g, ' ')}
          </span>
        )
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) =>
        row.payment?.status !== 'paid' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPayOrder(row);
            }}
            className="rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Pay now
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-600">Sent</span>
        )
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Pharmacy orders</h1>
          <p className="mt-1 text-sm text-ink-500">
            Pay to send an order to the pharmacy. Unpaid orders stay with you until payment clears.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Dropdown
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All orders' },
                { value: 'unpaid', label: `Unpaid${unpaidCount ? ` (${unpaidCount})` : ''}` },
                { value: 'paid', label: 'Paid / sent' }
              ]}
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link
            to="/patient/pharmacies"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Store size={16} />
            Browse pharmacies
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No pharmacy orders yet. Browse a pharmacy catalog to place one."
      />

      <PayOrderModal open={Boolean(payOrder)} order={payOrder} onClose={() => setPayOrder(null)} onPaid={load} />
    </div>
  );
};

export default PatientPharmacyOrders;
