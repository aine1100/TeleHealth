import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ClipboardList,
  Package,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import DataTable from '../../components/ui/DataTable';
import { pharmacyService } from '../../services/pharmacyService';

const money = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const PharmacyOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [salesByDay, setSalesByDay] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await pharmacyService.getOverview();
        if (!mounted) return;
        setStats(res?.data?.stats || {});
        setSalesByDay(res?.data?.salesByDay || []);
        setTopMedicines(res?.data?.topMedicines || []);
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

  const weekGrowth = useMemo(() => {
    if (salesByDay.length < 8) return null;
    const prev = salesByDay.slice(0, 7).reduce((sum, d) => sum + (d.revenue || 0), 0);
    const curr = salesByDay.slice(7).reduce((sum, d) => sum + (d.revenue || 0), 0);
    if (!prev && !curr) return 0;
    if (!prev) return 100;
    return Math.round(((curr - prev) / prev) * 100);
  }, [salesByDay]);

  const kpis = [
    {
      title: 'Revenue today',
      value: money(stats.revenueToday),
      detail: `${stats.ordersToday || 0} paid order(s)`,
      icon: Wallet,
      tone: 'from-brand-500 to-sky-500'
    },
    {
      title: 'This week',
      value: money(stats.revenueWeek),
      detail:
        weekGrowth == null
          ? `${stats.ordersWeek || 0} orders`
          : `${weekGrowth >= 0 ? '+' : ''}${weekGrowth}% vs prior week`,
      icon: TrendingUp,
      tone: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'This month',
      value: money(stats.revenueMonth),
      detail: `${stats.ordersMonth || 0} orders · avg ${money(stats.averageOrderValue)}`,
      icon: ShoppingBag,
      tone: 'from-violet-500 to-indigo-500'
    },
    {
      title: 'All-time income',
      value: money(stats.revenueTotal),
      detail: `${stats.paidOrders || 0} paid orders`,
      icon: Package,
      tone: 'from-amber-500 to-orange-500'
    }
  ];

  const opsCards = [
    {
      title: 'Awaiting action',
      value: stats.pendingOrders || 0,
      detail: 'New paid orders',
      icon: ClipboardList,
      to: '/pharmacy/orders',
      tone: 'bg-amber-50 text-amber-700'
    },
    {
      title: 'In fulfilment',
      value: stats.activeOrders || 0,
      detail: 'Preparing / delivery',
      icon: ShoppingBag,
      to: '/pharmacy/orders',
      tone: 'bg-sky-50 text-sky-700'
    },
    {
      title: 'Completed',
      value: stats.completedOrders || 0,
      detail: 'Fulfilled successfully',
      icon: TrendingUp,
      to: '/pharmacy/orders',
      tone: 'bg-emerald-50 text-emerald-700'
    },
    {
      title: 'Low stock',
      value: stats.lowStock || 0,
      detail: `${stats.medicineCount || 0} medicines in catalog`,
      icon: ShieldAlert,
      to: '/pharmacy/inventory?status=low',
      tone: 'bg-rose-50 text-rose-700'
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
      key: 'orderType',
      label: 'Type',
      render: (value) => (value === 'catalog' ? 'Catalog' : 'Rx')
    },
    {
      key: 'totalAmount',
      label: 'Amount',
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
    },
    {
      key: 'createdAt',
      label: 'Received',
      render: (value) => (value ? new Date(value).toLocaleString() : '—')
    }
  ];

  const maxTopRevenue = Math.max(...topMedicines.map((item) => item.revenue || 0), 1);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Pharmacy overview</h1>
          <p className="mt-1 text-sm text-ink-600">
            Income, sales trends, and order health — only paid orders count as revenue.
          </p>
        </div>
        <Link
          to="/pharmacy/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Manage orders <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-4 shadow-sm"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.tone}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{card.title}</p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-ink-900">
                    {loading ? '—' : card.value}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">{card.detail}</p>
                </div>
                <span className="rounded-xl bg-ink-50 p-2 text-ink-600">
                  <Icon size={18} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink-900">Sales (14 days)</h2>
              <p className="text-xs text-ink-500">Paid revenue by day</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {loading ? (
              <p className="flex h-full items-center justify-center text-sm text-ink-400">Loading chart…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByDay}>
                  <defs>
                    <linearGradient id="pharmacyRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B74FF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0B74FF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'revenue' ? money(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      fontSize: 12
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0B74FF"
                    strokeWidth={2.5}
                    fill="url(#pharmacyRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-ink-900">Orders mix</h2>
          <p className="text-xs text-ink-500">Catalog vs prescriptions · pickup vs delivery</p>
          <div className="mt-4 h-44">
            {loading ? (
              <p className="flex h-full items-center justify-center text-sm text-ink-400">Loading…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Catalog', value: stats.catalogOrders || 0 },
                    { name: 'Rx', value: stats.prescriptionOrders || 0 },
                    { name: 'Pickup', value: stats.pickupOrders || 0 },
                    { name: 'Delivery', value: stats.deliveryOrders || 0 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      fontSize: 12
                    }}
                  />
                  <Bar dataKey="value" fill="#0B74FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {opsCards.map((card) => {
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-ink-900">Top medicines</h2>
          <p className="text-xs text-ink-500">By paid sales revenue</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ink-400">Loading…</p>
            ) : topMedicines.length ? (
              topMedicines.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <p className="truncate font-semibold text-ink-900">{item.name}</p>
                    <p className="shrink-0 text-xs font-semibold text-ink-600">{money(item.revenue)}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.max(8, (item.revenue / maxTopRevenue) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">{item.qty} unit(s) sold</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-500">No paid sales yet.</p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink-900">Recent paid orders</h2>
            <Link to="/pharmacy/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <DataTable
            columns={columns}
            rows={recentOrders}
            loading={loading}
            emptyText="No paid orders yet."
          />
        </section>
      </div>
    </div>
  );
};

export default PharmacyOverview;
