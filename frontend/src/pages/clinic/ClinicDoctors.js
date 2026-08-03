import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Search, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import InviteDoctorModal from '../../components/clinic/InviteDoctorModal';
import StatusFilter from '../../components/clinic/StatusFilter';
import { clinicDoctors, doctorStatusOptions } from '../../data/clinicDashboard';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  inactive: 'bg-ink-100 text-ink-500'
};

const emptyInvite = {
  firstName: '',
  lastName: '',
  email: '',
  specialty: ''
};

const ClinicDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState(clinicDoctors);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyInvite);

  const counts = useMemo(
    () => ({
      all: doctors.length,
      active: doctors.filter((d) => d.status === 'active').length,
      pending: doctors.filter((d) => d.status === 'pending').length,
      inactive: doctors.filter((d) => d.status === 'inactive').length
    }),
    [doctors]
  );

  const filtered = doctors.filter((doctor) => {
    const haystack = `${doctor.firstName} ${doctor.lastName} ${doctor.email} ${doctor.specialty}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyInvite);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const invite = {
        id: `d-${Date.now()}`,
        firstName: form.firstName || 'Invited',
        lastName: form.lastName || 'Doctor',
        email: form.email,
        phone: '—',
        specialty: form.specialty || 'General Practice',
        licenseNumber: '',
        experience: null,
        bio: '',
        consultationFee: 25000,
        consultationTypes: ['video', 'chat'],
        availableDays: [],
        availableHours: { start: '09:00', end: '17:00' },
        status: 'pending',
        consultations: 0,
        rating: null,
        reviewCount: 0,
        joined: 'Invited just now'
      };
      setDoctors((prev) => [invite, ...prev]);
      setLoading(false);
      closeModal();
      toast.success(`Invite sent to ${form.email}`);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-[1400px] animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Doctors</h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage your care team and invite new doctors by email.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-600"
        >
          <Plus size={16} />
          Invite doctor
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'All doctors', value: counts.all },
          { label: 'Active', value: counts.active },
          { label: 'Pending invites', value: counts.pending },
          { label: 'Inactive', value: counts.inactive }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-card">
            <p className="text-xs font-medium text-ink-500">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label className="auth-label">Search</label>
            <Search className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, specialty..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={doctorStatusOptions}
              label="Status"
            />
            <p className="pb-3 text-sm text-ink-500 sm:whitespace-nowrap">
              Showing <span className="font-semibold text-ink-900">{filtered.length}</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-100/70 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Specialty</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Consults</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doctor) => (
                <tr
                  key={doctor.id}
                  className="cursor-pointer border-t border-ink-100 hover:bg-ink-100/40"
                  onClick={() => navigate(`/clinic/doctors/${doctor.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                        {doctor.firstName[0]}
                        {doctor.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </p>
                        <p className="text-xs text-ink-500">{doctor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-700">{doctor.specialty}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[doctor.status]}`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-700">{doctor.consultations}</td>
                  <td className="px-4 py-3.5">
                    {doctor.rating ? (
                      <span className="inline-flex items-center gap-1 font-medium text-ink-800">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        {doctor.rating}
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-ink-500">{doctor.joined}</td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clinic/doctors/${doctor.id}`);
                      }}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-500">
                    No doctors match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <InviteDoctorModal
        open={modalOpen}
        onClose={closeModal}
        form={form}
        onChange={onChange}
        onSpecialtyChange={(value) => setForm((prev) => ({ ...prev, specialty: value }))}
        onSubmit={onSubmit}
        loading={loading}
      />
    </div>
  );
};

export default ClinicDoctors;
