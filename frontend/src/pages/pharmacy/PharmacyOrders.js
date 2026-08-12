import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/auth/Dropdown';
import DataTable from '../../components/ui/DataTable';
import { orderStatusOptions } from '../../data/pharmacyDashboard';
import { pharmacyService } from '../../services/pharmacyService';

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

const PharmacyOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [actingId, setActingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

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

  const updateStatus = async (order, status) => {
    setActingId(order._id);
    try {
      await pharmacyService.updateOrderStatus(order._id, { status });
      toast.success(`Order marked ${status.replace(/_/g, ' ')}`);
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update order');
    } finally {
      setActingId(null);
    }
  };

  const nextActions = (order) => {
    if (order.status === 'pending') {
      return [
        { status: 'accepted', label: 'Accept' },
        { status: 'rejected', label: 'Reject', danger: true }
      ];
    }
    if (order.status === 'accepted') return [{ status: 'preparing', label: 'Start preparing' }];
    if (order.status === 'preparing') {
      return order.fulfillmentMethod === 'delivery'
        ? [{ status: 'out_for_delivery', label: 'Send for delivery' }]
        : [{ status: 'ready', label: 'Mark ready for pickup' }];
    }
    if (order.status === 'ready' || order.status === 'out_for_delivery') {
      return [{ status: 'completed', label: 'Complete order' }];
    }
    return [];
  };

  const rows =
    typeFilter === 'all'
      ? orders
      : orders.filter((order) => (order.orderType || 'prescription') === typeFilter);

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) =>
        [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || 'Patient'
    },
    {
      key: 'orderType',
      label: 'Type',
      render: (value) => (
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
          {value === 'catalog' ? 'Catalog' : 'Prescription'}
        </span>
      )
    },
    {
      key: 'items',
      label: 'Medicines',
      render: (value) =>
        value?.map((item) => `${item.medicineName}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`).join(', ') ||
        '—'
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (value) => (value != null ? `UGX ${Number(value).toLocaleString()}` : '—')
    },
    {
      key: 'fulfillmentMethod',
      label: 'Fulfilment',
      render: (value) => (value === 'delivery' ? 'Delivery' : 'Pickup')
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
          {String(value || '').replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Received',
      render: (value) => (value ? new Date(value).toLocaleString() : '—')
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(row);
          }}
          className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
        >
          View
        </button>
      )
    }
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
          <p className="mt-1 text-sm text-ink-600">
            Manage catalog purchases and prescription fulfilment for delivery or pickup.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Dropdown
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: 'All orders' },
              { value: 'catalog', label: 'Catalog orders' },
              { value: 'prescription', label: 'Prescriptions' }
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No orders yet."
        onRowClick={setSelected}
      />

      {selected ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center">
          <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setSelected(null)} />
          <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Order details</h2>
                <p className="mt-1 text-sm text-ink-600">
                  {[selected.patient?.firstName, selected.patient?.lastName].filter(Boolean).join(' ')} ·{' '}
                  {selected.orderType === 'catalog' ? 'Catalog order' : 'Prescription'} ·{' '}
                  {selected.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Pickup'}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                  statusStyles[selected.status] || statusStyles.pending
                }`}
              >
                {String(selected.status || '').replace(/_/g, ' ')}
              </span>
            </div>

            {selected.patient?.phone ? (
              <p className="mt-3 text-sm text-ink-600">Phone: {selected.patient.phone}</p>
            ) : null}

            {selected.deliveryAddress ? (
              <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">
                Deliver to: {selected.deliveryAddress}
                {selected.deliveryNotes ? ` · ${selected.deliveryNotes}` : ''}
              </p>
            ) : null}

            <ul className="mt-4 space-y-2">
              {selected.items?.map((item, index) => (
                <li key={`${selected._id}-${index}`} className="rounded-xl border border-ink-100 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{item.medicineName}</p>
                      <p className="text-sm text-ink-600">
                        Qty {item.quantity || 1}
                        {[item.dosage, item.frequency, item.duration].filter(Boolean).length
                          ? ` · ${[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}`
                          : ''}
                      </p>
                      {item.instructions ? (
                        <p className="mt-1 text-xs text-ink-500">{item.instructions}</p>
                      ) : null}
                    </div>
                    {item.unitPrice != null ? (
                      <p className="shrink-0 text-sm font-semibold text-ink-800">
                        UGX {(Number(item.unitPrice) * Number(item.quantity || 1)).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            {selected.totalAmount != null ? (
              <p className="mt-3 text-right text-sm font-bold text-ink-900">
                Total: UGX {Number(selected.totalAmount).toLocaleString()}
              </p>
            ) : null}

            <div className="mt-4">
              <Dropdown
                label="Update status"
                value={selected.status}
                onChange={(value) => updateStatus(selected, value)}
                options={orderStatusOptions.filter((opt) => {
                  if (opt.value === 'out_for_delivery' && selected.fulfillmentMethod !== 'delivery') {
                    return false;
                  }
                  if (opt.value === 'ready' && selected.fulfillmentMethod !== 'pickup') {
                    return false;
                  }
                  return true;
                })}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {nextActions(selected).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={actingId === selected._id}
                  onClick={() => updateStatus(selected, action.status)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                    action.danger
                      ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {action.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PharmacyOrders;
