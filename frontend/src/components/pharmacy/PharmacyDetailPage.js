import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  Store,
  Truck,
  UserRound
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Dropdown from '../auth/Dropdown';
import CatalogOrderModal from './CatalogOrderModal';
import MedicineCard from './MedicineCard';
import MedicineDetailModal from './MedicineDetailModal';
import SendPrescriptionModal from './SendPrescriptionModal';
import { pharmacyService } from '../../services/pharmacyService';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import { resolveApiUrl } from '../../utils/apiUrl';

const pharmacyDisplayName = (pharmacy) =>
  pharmacy?.displayName ||
  pharmacy?.pharmacyProfile?.pharmacyName ||
  [pharmacy?.firstName, pharmacy?.lastName].filter(Boolean).join(' ') ||
  'Pharmacy';

const InfoItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        <Icon size={12} className="text-brand-500" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
};

const PharmacyDetailPage = ({ role = 'patient' }) => {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const listPath = role === 'doctor' ? '/doctor/pharmacies' : '/patient/pharmacies';
  const canOrderCatalog = role === 'patient';
  const [loading, setLoading] = useState(true);
  const [pharmacy, setPharmacy] = useState(null);
  const [careRecords, setCareRecords] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [catalogCheckoutOpen, setCatalogCheckoutOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [cart, setCart] = useState([]);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');

  const load = async () => {
    const [pharmRes, careRes, orderRes] = await Promise.all([
      pharmacyService.getPharmacy(pharmacyId),
      role === 'doctor'
        ? doctorService.getMyAppointments().catch(() => ({ data: [] }))
        : patientService.getCareRecords().catch(() => ({ data: [] })),
      role === 'patient'
        ? pharmacyService.getMyOrders().catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] })
    ]);

    setPharmacy(pharmRes?.data || null);

    if (role === 'doctor') {
      setCareRecords(
        (careRes?.data || []).filter(
          (item) =>
            item.prescription?.length &&
            ['completed', 'in_progress', 'confirmed'].includes(item.status)
        )
      );
    } else {
      setCareRecords((careRes?.data || []).filter((item) => item.prescription?.length));
      setMyOrders(
        (orderRes?.data || []).filter(
          (order) => String(order.pharmacy?._id || order.pharmacy) === String(pharmacyId)
        )
      );
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        await load();
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load pharmacy');
        if (mounted) navigate(listPath, { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, role, navigate, listPath]);

  const medicines = pharmacy?.medicines || [];

  const categoryOptions = useMemo(() => {
    const cats = new Set();
    medicines.forEach((med) => {
      if (med.category) cats.add(med.category);
    });
    return [
      { value: 'all', label: 'All categories' },
      ...Array.from(cats)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value }))
    ];
  }, [medicines]);

  const formOptions = useMemo(() => {
    const forms = new Set();
    medicines.forEach((med) => {
      if (med.form) forms.add(med.form);
    });
    return [
      { value: 'all', label: 'All forms' },
      ...Array.from(forms)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1)
        }))
    ];
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const q = medicineQuery.trim().toLowerCase();
    return medicines.filter((med) => {
      if (category !== 'all' && med.category !== category) return false;
      if (formFilter !== 'all' && med.form !== formFilter) return false;
      if (stockFilter === 'in_stock' && !(Number(med.stockQuantity) > 0)) return false;
      if (stockFilter === 'rx' && !med.requiresPrescription) return false;
      if (stockFilter === 'otc' && med.requiresPrescription) return false;
      if (!q) return true;
      return [med.name, med.genericName, med.brandName, med.category, med.manufacturer]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [medicines, medicineQuery, category, stockFilter, formFilter]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartMap = useMemo(
    () => Object.fromEntries(cart.map((item) => [item._id, item.quantity])),
    [cart]
  );

  const addToCart = (medicine) => {
    if (!canOrderCatalog) return;
    if (!(Number(medicine.stockQuantity) > 0)) {
      toast.error('This medicine is out of stock');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item._id === medicine._id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > Number(medicine.stockQuantity)) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map((item) =>
          item._id === medicine._id ? { ...item, quantity: nextQty } : item
        );
      }
      return [
        ...prev,
        {
          _id: medicine._id,
          name: medicine.name,
          price: medicine.price,
          requiresPrescription: medicine.requiresPrescription,
          stockQuantity: medicine.stockQuantity,
          quantity: 1
        }
      ];
    });
    toast.success(`${medicine.name} added to order`);
  };

  const changeQty = (id, quantity) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((item) => item._id !== id);
      return prev.map((item) => {
        if (item._id !== id) return item;
        const max = Number(item.stockQuantity) || quantity;
        return { ...item, quantity: Math.min(quantity, max) };
      });
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
        Loading pharmacy…
      </div>
    );
  }

  if (!pharmacy) return null;

  const profile = pharmacy.pharmacyProfile || {};
  const org = pharmacy.organizationProfile || {};
  const name = pharmacyDisplayName(pharmacy);
  const location = profile.city || pharmacy.city || 'Uganda';
  const district = profile.district || pharmacy.district || org.district;
  const address = profile.address || pharmacy.address || org.address || location;
  const phone = profile.phone || pharmacy.phone;
  const hours =
    profile.openingHours?.start && profile.openingHours?.end
      ? `${profile.openingHours.start} – ${profile.openingHours.end}`
      : 'Hours on request';
  const pharmacistName = [pharmacy.firstName, pharmacy.lastName].filter(Boolean).join(' ');
  const isOpen = profile.isOpen !== false;
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'PH';
  const inStockCount = medicines.filter((med) => Number(med.stockQuantity) > 0).length;
  const rxCount = medicines.filter((med) => med.requiresPrescription).length;

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-up space-y-5 pb-24">
      <div>
        <Link
          to={listPath}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft size={15} />
          Back to pharmacies
        </Link>
      </div>

      <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            {pharmacy.avatar ? (
              <img
                src={resolveApiUrl(pharmacy.avatar)}
                alt={name}
                className="h-28 w-28 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-600">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink-900">{name}</h1>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
                  }`}
                >
                  {isOpen ? 'Accepting orders' : 'Temporarily closed'}
                </span>
                {org.verificationStatus === 'approved' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                    <BadgeCheck size={12} /> Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                {profile.description ||
                  'Order medicines from the catalog or send a doctor prescription for pickup/delivery.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-brand-500" />
                  {address}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-brand-500" />
                  {hours}
                </span>
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-brand-600"
                  >
                    <Phone size={15} className="text-brand-500" />
                    {phone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!careRecords.length) {
                toast.error(
                  role === 'doctor'
                    ? 'Create a prescription on a visit first'
                    : 'No prescriptions available yet — you can still order from the catalog below'
                );
                if (role === 'patient') return;
                return;
              }
              setModalOpen(true);
            }}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Send prescription
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Catalog</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{medicines.length}</p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">In stock</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{inStockCount}</p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Rx items</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{rxCount}</p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Delivery radius</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            {profile.offersDelivery !== false ? `${profile.deliveryRadiusKm ?? 15} km` : '—'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-bold text-ink-900">Pharmacy information</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={UserRound} label="Pharmacist" value={pharmacistName} />
          <InfoItem icon={Mail} label="Email" value={pharmacy.email} />
          <InfoItem icon={Phone} label="Phone" value={phone} />
          <InfoItem icon={Building2} label="License number" value={profile.licenseNumber || org.registrationNumber} />
          <InfoItem icon={MapPin} label="District" value={district} />
          <InfoItem icon={MapPin} label="City" value={location} />
          <InfoItem icon={Clock} label="Opening hours" value={hours} />
          <InfoItem
            icon={Truck}
            label="Delivery fee"
            value={
              profile.offersDelivery !== false && profile.deliveryFee != null
                ? `UGX ${Number(profile.deliveryFee).toLocaleString()}`
                : profile.offersDelivery === false
                  ? 'Not offered'
                  : null
            }
          />
          <InfoItem
            icon={Store}
            label="Pickup"
            value={profile.offersPickup !== false ? 'Available onsite' : 'Not offered'}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-600">Medicine catalog</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              {filteredMedicines.length} medicine{filteredMedicines.length === 1 ? '' : 's'}
              {canOrderCatalog ? ' · add items to order from this pharmacy' : ''}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={medicineQuery}
              onChange={(e) => setMedicineQuery(e.target.value)}
              placeholder="Search medicines…"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <Dropdown value={category} onChange={setCategory} options={categoryOptions} />
          <Dropdown value={formFilter} onChange={setFormFilter} options={formOptions} />
          <Dropdown
            value={stockFilter}
            onChange={setStockFilter}
            options={[
              { value: 'all', label: 'All items' },
              { value: 'in_stock', label: 'In stock' },
              { value: 'rx', label: 'Prescription' },
              { value: 'otc', label: 'Over the counter' }
            ]}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMedicines.length ? (
            filteredMedicines.map((med) => (
              <MedicineCard
                key={med._id}
                medicine={med}
                quantityInCart={cartMap[med._id] || 0}
                canOrder={canOrderCatalog && isOpen}
                onView={setSelectedMedicine}
                onAdd={addToCart}
              />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-10 text-center text-sm text-ink-500">
              {medicines.length
                ? 'No medicines match your filters.'
                : 'This pharmacy has not published medicines yet.'}
            </div>
          )}
        </div>
      </section>

      {canOrderCatalog ? (
        <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Orders with this pharmacy</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Pay from Pharmacy orders before the pharmacy can fulfil.
              </p>
            </div>
            <Link
              to="/patient/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Open orders →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {myOrders.length ? (
              myOrders.slice(0, 4).map((order) => (
                <div
                  key={order._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {order.items?.map((item) => item.medicineName).join(', ')}
                    </p>
                    <p className="text-xs text-ink-500">
                      UGX {Number(order.totalAmount || 0).toLocaleString()} ·{' '}
                      {order.payment?.status === 'paid' ? 'Paid / sent' : 'Awaiting payment'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      order.payment?.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.payment?.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-500">No orders with this pharmacy yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {canOrderCatalog && cartCount > 0 ? (
        <div className="fixed bottom-4 left-1/2 z-30 w-[min(640px,calc(100%-1.5rem))] -translate-x-1/2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
            <div className="min-w-0 pl-1">
              <p className="text-sm font-bold text-ink-900">
                {cartCount} item{cartCount === 1 ? '' : 's'} ready to order
              </p>
              <p className="truncate text-xs text-ink-500">
                {cart.map((item) => item.name).join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCatalogCheckoutOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <ShoppingCart size={15} />
              Checkout
            </button>
          </div>
        </div>
      ) : null}

      <SendPrescriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pharmacy={pharmacy}
        careRecords={careRecords}
        onSent={async () => {
          setModalOpen(false);
          if (role === 'patient') navigate('/patient/orders');
          else await load();
        }}
      />

      <CatalogOrderModal
        open={catalogCheckoutOpen}
        onClose={() => setCatalogCheckoutOpen(false)}
        pharmacy={pharmacy}
        cartItems={cart}
        onChangeQty={changeQty}
        onSent={async () => {
          setCart([]);
          setCatalogCheckoutOpen(false);
          if (role === 'patient') navigate('/patient/orders');
          else await load();
        }}
      />

      <MedicineDetailModal
        open={Boolean(selectedMedicine)}
        medicine={selectedMedicine}
        canOrder={canOrderCatalog && isOpen}
        onAdd={(med) => {
          addToCart(med);
          setSelectedMedicine(null);
        }}
        onClose={() => setSelectedMedicine(null)}
      />
    </div>
  );
};

export default PharmacyDetailPage;
