import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DoctorCard from '../../components/DoctorCard';
import DoctorFiltersSidebar from '../../components/patient/DoctorFiltersSidebar';
import { patientService } from '../../services/patientService';

const DEFAULT_FILTERS = {
  gender: 'all',
  minExperience: '',
  minFee: 0,
  maxFee: 300000,
  availability: 'all',
  consultType: 'all'
};

const PatientDoctors = () => {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(
    (overrides = {}) => {
      const nextFilters = { ...filters, ...overrides.filters };
      const nextQuery = overrides.query ?? query;

      const payload = {
        query: nextQuery || undefined,
        gender: nextFilters.gender !== 'all' ? nextFilters.gender : undefined,
        minExperience: nextFilters.minExperience || undefined,
        minFee: nextFilters.minFee > 0 ? nextFilters.minFee : undefined,
        maxFee: nextFilters.maxFee < 500000 ? nextFilters.maxFee : undefined,
        availability: nextFilters.availability !== 'all' ? nextFilters.availability : undefined,
        consultType: nextFilters.consultType !== 'all' ? nextFilters.consultType : undefined
      };

      return payload;
    },
    [filters, query]
  );

  const load = useCallback(
    async (overrides = {}) => {
      try {
        setLoading(true);
        const res = await patientService.searchDoctors(buildParams(overrides));
        setDoctors(res?.data || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load doctors');
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    load({ query: params.get('q') || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, load]);

  const countLabel = useMemo(() => {
    const count = doctors.length;
    return `${count} Doctor${count === 1 ? '' : 's'} Available`;
  }, [doctors.length]);

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Find a doctor</h1>
          <p className="mt-1 text-sm text-ink-500">
            Browse specialists, filter by experience and fees, then book your visit.
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

      <form onSubmit={onSearch} className="mt-5">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty, or location..."
            className="h-[46px] w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <DoctorFiltersSidebar filters={filters} onChange={setFilters} onReset={resetFilters} />

        <section>
          <h2 className="text-lg font-bold text-brand-600">{countLabel}</h2>

          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
                Loading doctors…
              </div>
            ) : doctors.length ? (
              doctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)
            ) : (
              <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center text-sm text-ink-500 shadow-card">
                No doctors match your filters. Try adjusting your search.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PatientDoctors;
