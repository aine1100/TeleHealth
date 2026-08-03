import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DoctorCard from '../../components/DoctorCard';
import { Search, SlidersHorizontal } from 'lucide-react';

const FindDoctor = () => {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [availableNow, setAvailableNow] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.query = query;
      if (specialty) params.specialty = specialty;
      if (availableNow) params.availableNow = true;

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/doctors/search`, { params });
      setDoctors(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[2rem] bg-blue-950 p-8 text-white shadow-xl">
          <div className="grid gap-6 lg:grid-cols-[1.7fr_auto]">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Doctor search</p>
              <h1 className="mt-3 text-3xl font-semibold">Find the right specialist</h1>
              <p className="mt-4 text-sm leading-7 text-blue-100/90">Search verified doctors by specialty, availability, and experience.</p>
            </div>
            <div className="rounded-[1.75rem] bg-white/10 p-6 text-sm text-blue-100">
              <p className="font-semibold">Need help choosing?</p>
              <p className="mt-2 text-slate-200">Filter by availability and specialty to find the most relevant doctor quickly.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_auto]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors, specialties, clinics..."
                className="w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-[1.75rem] bg-blue-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
          </button>
        </form>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="">All specialties</option>
                <option value="general">General Physician</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="cardiology">Cardiology</option>
                <option value="dental">Dental</option>
                <option value="dermatology">Dermatology</option>
              </select>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              <label className="flex items-center justify-between gap-3">
                <span>Available now</span>
                <input
                  type="checkbox"
                  checked={availableNow}
                  onChange={(e) => setAvailableNow(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-950 focus:ring-blue-950"
                />
              </label>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-4 rounded-[2rem] bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Doctor results</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{doctors.length} available</h2>
              </div>
              <button
                onClick={fetchDoctors}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">Loading doctors...</div>
            ) : doctors.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">No doctors found. Try a different filter.</div>
            ) : (
              <div className="grid gap-4">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default FindDoctor;
