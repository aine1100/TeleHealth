import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PharmacyCard from '../PharmacyCard';
import PharmacyFiltersSidebar from '../patient/PharmacyFiltersSidebar';
import SendPrescriptionModal from './SendPrescriptionModal';
import { pharmacyService } from '../../services/pharmacyService';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';

const DEFAULT_FILTERS = {
  city: 'all',
  service: 'all',
  openStatus: 'all',
  maxDeliveryFee: 50000,
  minMedicines: '',
  rxSupport: 'all'
};

const PharmaciesDirectory = ({ role = 'patient' }) => {
  const navigate = useNavigate();
  const detailBase = role === 'doctor' ? '/doctor/pharmacies' : '/patient/pharmacies';
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [careRecords, setCareRecords] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const pharmRes = await pharmacyService.listPharmacies({ q: query || undefined });
      setPharmacies(pharmRes?.data || []);

      if (role === 'patient') {
        const careRes = await patientService.getCareRecords().catch(() => ({ data: [] }));
        setCareRecords((careRes?.data || []).filter((item) => item.prescription?.length));
      } else if (role === 'doctor') {
        const apptRes = await doctorService.getMyAppointments().catch(() => ({ data: [] }));
        setCareRecords(
          (apptRes?.data || []).filter(
            (item) =>
              item.prescription?.length &&
              ['completed', 'in_progress', 'confirmed'].includes(item.status)
          )
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load pharmacies');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  }, [query, role]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const cityOptions = useMemo(() => {
    const cities = new Set();
    pharmacies.forEach((row) => {
      const city = row.pharmacyProfile?.city || row.city;
      if (city) cities.add(city);
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [pharmacies]);

  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter((row) => {
      const profile = row.pharmacyProfile || {};
      const city = profile.city || row.city || '';
      const offersPickup = profile.offersPickup !== false;
      const offersDelivery = profile.offersDelivery !== false;
      const isOpen = profile.isOpen !== false;
      const deliveryFee = Number(profile.deliveryFee ?? 0);
      const medicineCount = Number(row.medicineCount || 0);

      if (filters.city !== 'all' && city !== filters.city) return false;
      if (filters.service === 'pickup' && !offersPickup) return false;
      if (filters.service === 'delivery' && !offersDelivery) return false;
      if (filters.service === 'both' && !(offersPickup && offersDelivery)) return false;
      if (filters.openStatus === 'open' && !isOpen) return false;
      if (filters.openStatus === 'closed' && isOpen) return false;
      if (offersDelivery && deliveryFee > filters.maxDeliveryFee) return false;
      if (filters.minMedicines && medicineCount < Number(filters.minMedicines)) return false;
      if (filters.rxSupport === 'rx' && medicineCount < 1) return false;
      return true;
    });
  }, [pharmacies, filters]);

  const openSend = (pharmacy) => {
    if (!careRecords.length) {
      toast.error(
        role === 'doctor'
          ? 'Create a prescription on a visit first'
          : 'No prescriptions available to send yet'
      );
      return;
    }
    setSelectedPharmacy(pharmacy);
    setModalOpen(true);
  };

  const countLabel = useMemo(() => {
    const count = filteredPharmacies.length;
    return `${count} Pharmac${count === 1 ? 'y' : 'ies'} Available`;
  }, [filteredPharmacies.length]);

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Pharmacies</h1>
          <p className="mt-1 text-sm text-ink-500">
            Browse pharmacies and place orders. Pay from{' '}
            {role === 'patient' ? (
              <Link to="/patient/orders" className="font-semibold text-brand-600 hover:text-brand-700">
                Pharmacy orders
              </Link>
            ) : (
              'orders'
            )}{' '}
            to send them to the pharmacy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="relative max-w-xl"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by pharmacy name or location…"
          className="h-[46px] w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
      </form>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <PharmacyFiltersSidebar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          cityOptions={cityOptions}
        />

        <section>
          <h2 className="text-lg font-bold text-brand-600">{countLabel}</h2>
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
                Loading pharmacies…
              </div>
            ) : filteredPharmacies.length ? (
              filteredPharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy._id}
                  pharmacy={pharmacy}
                  actionLabel="View details"
                  onAction={() => navigate(`${detailBase}/${pharmacy._id}`)}
                  secondaryLabel="Send prescription"
                  onSecondaryAction={() => openSend(pharmacy)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
                No pharmacies match your filters. Try adjusting your search.
              </div>
            )}
          </div>
        </section>
      </div>

      <SendPrescriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pharmacy={selectedPharmacy}
        careRecords={careRecords}
        onSent={() => {
          setModalOpen(false);
          if (role === 'patient') navigate('/patient/orders');
        }}
      />
    </div>
  );
};

export default PharmaciesDirectory;
