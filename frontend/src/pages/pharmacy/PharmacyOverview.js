import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Package, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import { pharmacyService } from '../../services/pharmacyService';

const PharmacyOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    medicineCount: 0,
    lowStock: 0,
    pendingOrders: 0,
    activeOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await pharmacyService.getOverview();
        if (!mounted) return;
        setStats(res?.data?.stats || {});
        setRecentOrders(res?.data?.recentOrders || []);
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

  const cards = [
    {
      title: 'Medicines',
      value: stats.medicineCount || 0,
      detail: 'Active catalog',
      icon: Package,
      to: '/pharmacy/inventory',
      tone: 'bg-brand-50 text-brand-700'
    },
    {
      title: 'Low stock',
      value: stats.lowStock || 0,
      detail: 'Needs reorder',
      icon: ShieldAlert,
      to: '/pharmacy/inventory?status=low',
      tone: 'bg-amber-50 text-amber-700'
    },
    {
      title: 'Pending orders',
      value: stats.pendingOrders || 0,
      detail: 'Awaiting action',
      icon: ClipboardList,
      to: '/pharmacy/orders',
      tone: 'bg-violet-50 text-violet-700'
    },
    {
      title: 'In progress',
      value: stats.activeOrders || 0,
      detail: 'Preparing / delivery',
      icon: ClipboardList,
      to: '/pharmacy/orders',
      tone: 'bg-emerald-50 text-emerald-700'
    }
  ];

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (_v, row) =>
        [row.patient?.firstName, row.patient?.lastName].filter(Boolean).join(' ') || 'Patient'
    },
    {
      key: 'fulfillmentMethod',
      label: 'Method',
      render: (value) => (value === 'delivery' ? 'Delivery' : 'Pickup')
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-ink-700">
          {String(value || '').replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => value?.length || 0
    },
    {
      key: 'createdAt',
      label: 'Received',
      render: (value) => (value ? new Date(value).toLocaleString() : '—')
    }
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Pharmacy overview</h1>
        <p className="mt-1 text-sm text-ink-600">Track inventory health and incoming prescriptions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{card.title}</p>
                  <p className="mt-2 text-2xl font-bold text-ink-900">{loading ? '—' : card.value}</p>
                  <p className="mt-1 text-xs text-ink-500">{card.detail}</p>
                </div>
                <span className={`rounded-xl p-2 ${card.tone}`}>
                  <Icon size={18} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink-900">Recent orders</h2>
          <Link to="/pharmacy/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <DataTable
          columns={columns}
          rows={recentOrders}
          loading={loading}
          emptyText="No prescription orders yet."
        />
      </div>
    </div>
  );
};

export default PharmacyOverview;
